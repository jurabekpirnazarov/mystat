"""KR-23..KR-26: orqaga sinov, usul tanlash, ishonch oralig'i, ssenariylar va saqlash.

Oqim (`train_forecasts`):
1. Har ko'rsatkich × daraja uchun rolling-origin orqaga sinov (barcha usullar bir xil bo'laklarda).
2. Har horizont uchun usul: eng past MASE (M0 ga nisbatan); murakkab usul oddiy trenddan kamida 10% yaxshi
   bo'lishi shart; MASE > 1 bo'lsa — oxirgi qiymat.
3. 80% oraliq — tanlangan usulning orqaga sinov qoldiqlaridan (10- va 90-percentil), horizont bilan kengayadi.
4. Yakuniy prognoz (1–3 yil), ijobiy/salbiy ssenariylar (o'xshash hududlarning o'sish choraklari, 5 yilgacha),
   panel modeli tanlangan bo'lsa asosiy omillar (SHAP).
5. Yangi versiya saqlanadi; xato bo'lsa eski prognoz qoladi va admin xabar oladi.
"""
import logging
import math
from collections import defaultdict

import numpy as np
from django.db import transaction
from django.utils import timezone

from . import spec
from .dataset import FEATURE_NAMES, REPUBLIC, Dataset
from .methods import DAMPED, DRIFT, ENSEMBLE, NAIVE, PANEL, SIMPLE, PanelModel, from_f, simple, winsorize

logger = logging.getLogger(__name__)
GRID = ({"max_depth": 3}, {"max_depth": 4})
BETTER = {"1875": -1}   # ishsizlik: past bo'lgani yaxshi (ijobiy ssenariy — pastroq)


def _covid(origin, h):
    """Oyna 2020 shokini (yoki 2020 dan boshlanib, 2021 tiklanishini) o'z ichiga oladi."""
    return origin <= spec.COVID_YEAR <= origin + h


def _codes(ds, key, level):
    codes = [c for c in ds.codes(level) if c in ds.series(key)]
    if level == "region" and REPUBLIC in ds.series(key):
        codes.append(REPUBLIC)
    return codes


def _fit_panel(ds, key, level, origins, h, params):
    X, y, _ = ds.rows(key, level, origins, h)
    if len(y) < 200:
        return None
    model = PanelModel(spec.SEED, **params)
    return model.fit(X, winsorize(y, *spec.WINSOR), FEATURE_NAMES)


def backtest(ds, key, level):
    """-> {"until", "origins", "records": {h: [...]}, "panel_params"}.

    record: {"code", "origin", "actual", "preds": {usul: delta}, "covid"} — delta f-fazoda.
    """
    info = spec.INDICATORS[key]
    series = ds.series(key)
    until = ds.data_until(key, level)
    codes = _codes(ds, key, level)
    years = sorted({y for c in codes for y in series.get(c, {})})
    if not until or not years:
        return None
    first = years[0]
    origins = list(range(max(spec.FIRST_ORIGIN, first + spec.MIN_TRAIN_YEARS), until))
    use_panel = info["panel"] and level == "district" and PanelModel.available()
    records = {}
    panel_scores = defaultdict(float)
    for h in spec.HORIZONS:
        recs = []
        for origin in origins:
            if origin + h > until:
                continue
            panel_preds = {}
            if use_panel:
                train_origins = range(first + 1, origin - h + 1)
                X_te, _, idx = ds.rows(key, level, [origin], h)
                for gi, params in enumerate(GRID):
                    model = _fit_panel(ds, key, level, train_origins, h, params)
                    if model is None or not X_te:
                        continue
                    for (code, _), p in zip(idx, model.predict(X_te)):
                        panel_preds.setdefault(code, {})[gi] = float(p)
            for code in codes:
                own = series.get(code, {})
                actual = None
                if own.get(origin) is not None and own.get(origin + h) is not None:
                    actual = own[origin + h] - own[origin]
                if actual is None or ds.spans_break(key, code, origin, h):
                    continue
                trunc = ds.cut(key, code, origin)
                preds = {m: simple(m, trunc, origin, h) for m in SIMPLE}
                for gi, p in panel_preds.get(code, {}).items():
                    preds[f"{PANEL}:{gi}"] = p
                recs.append({"code": code, "origin": origin, "actual": actual,
                             "preds": {m: v for m, v in preds.items() if v is not None},
                             "covid": _covid(origin, h), "f0": own[origin]})
        # Panel modeli varianti: orqaga sinovda eng kichik MAE (COVID bo'laklarisiz)
        for r in recs:
            if r["covid"]:
                continue
            for m, v in r["preds"].items():
                if m.startswith(PANEL):
                    panel_scores[m] += abs(v - r["actual"])
        records[h] = recs
    best_variant = min(panel_scores, key=panel_scores.get) if panel_scores else None
    for h, recs in records.items():
        for r in recs:
            if best_variant and best_variant in r["preds"]:
                r["preds"][PANEL] = r["preds"][best_variant]
            r["preds"] = {m: v for m, v in r["preds"].items() if ":" not in m}
        _add_ensemble(recs)
    params = GRID[int(best_variant.split(":")[1])] if best_variant else None
    return {"until": until, "origins": origins, "records": records, "panel_params": params}


def _add_ensemble(recs):
    """M4: M2 va M3 o'rtachasi, vazn — oldingi origin'lardagi MAE ga teskari (birinchisida teng)."""
    by_origin = defaultdict(list)
    for r in recs:
        by_origin[r["origin"]].append(r)
    err = {DAMPED: 0.0, PANEL: 0.0}
    n = 0
    for origin in sorted(by_origin):
        if n:
            inv = {m: 1 / (err[m] / n + 1e-9) for m in err}
            total = sum(inv.values())
            w = {m: inv[m] / total for m in inv}
        else:
            w = {DAMPED: 0.5, PANEL: 0.5}
        for r in by_origin[origin]:
            p = r["preds"]
            if DAMPED in p and PANEL in p:
                p[ENSEMBLE] = w[DAMPED] * p[DAMPED] + w[PANEL] * p[PANEL]
        both = [r for r in by_origin[origin] if DAMPED in r["preds"] and PANEL in r["preds"] and not r["covid"]]
        for r in both:
            for m in err:
                err[m] += abs(r["preds"][m] - r["actual"])
            n += 1
    return recs


def metrics(recs, kind, method):
    """MASE (M0 ga nisbatan, bir xil nuqtalarda), MAPE (asl shkalada), o'sish yo'nalishi to'g'riligi (%)."""
    pts = [r for r in recs if not r["covid"] and method in r["preds"] and NAIVE in r["preds"]]
    if not pts:
        return None
    mae = sum(abs(r["preds"][method] - r["actual"]) for r in pts) / len(pts)
    mae0 = sum(abs(r["preds"][NAIVE] - r["actual"]) for r in pts) / len(pts)
    ape = []
    for r in pts:
        actual = from_f(r["f0"] + r["actual"], kind)
        pred = from_f(r["f0"] + r["preds"][method], kind)
        if actual:
            ape.append(abs(pred - actual) / abs(actual) * 100)
    direction = [r for r in pts if r["actual"] != 0 and r["preds"][method] != 0]
    hits = sum(1 for r in direction if (r["actual"] > 0) == (r["preds"][method] > 0))
    covid = [r for r in recs if r["covid"] and method in r["preds"]]
    return {"n": len(pts), "mae": round(mae, 5), "mase": round(mae / mae0, 4) if mae0 else None,
            "mape": round(sum(ape) / len(ape), 2) if ape else None,
            "direction": round(hits / len(direction) * 100, 1) if direction else None,
            "covid_mae": round(sum(abs(r["preds"][method] - r["actual"]) for r in covid) / len(covid), 5) if covid else None}


def select(table):
    """table: {usul: metrika}. -> usul kodi (10.4 tanlash qoidasi)."""
    scored = {m: v["mase"] for m, v in table.items() if v and v.get("mase") is not None}
    if not scored:
        return NAIVE
    best = min(scored, key=scored.get)
    if best in (PANEL, ENSEMBLE):
        drift_mase = scored.get(DRIFT)
        if drift_mase is not None and scored[best] > (1 - spec.SELECT_MARGIN) * drift_mase:
            simple_scores = {m: s for m, s in scored.items() if m in SIMPLE}
            best = min(simple_scores, key=simple_scores.get)
    if scored[best] > 1:
        best = NAIVE
    return best


def _bounds(resid, tail, scale):
    """Qoldiqlardan oraliq (f-fazoda): [tail, 100 − tail] percentillari × scale; nuqtali prognoz doim ichida."""
    lo, hi = np.percentile(resid, [tail, 100 - tail])
    return min(lo, 0.0) * scale, max(hi, 0.0) * scale


def _loo_coverage(pts, method, tail, scale):
    """Bitta origin'ni chiqarib: qolganlari qoldig'idan oraliq, chiqarilgani bilan tekshiriladi. -> (qamrov %, asos).

    Kamida 5 nuqtali origin ikkitadan kam bo'lsa — hududlar bo'yicha 5 bo'lakli kesishma (vaqt bo'yicha tekshiruv
    emas, `basis="codes"`).
    """
    origins = sorted({r["origin"] for r in pts})
    if sum(1 for o in origins if sum(1 for r in pts if r["origin"] == o) >= 5) >= 2:
        groups, basis = [[r for r in pts if r["origin"] == o] for o in origins], "origins"
    else:
        codes = sorted({r["code"] for r in pts})
        groups = [[r for r in pts if codes.index(r["code"]) % 5 == k] for k in range(5)]
        groups, basis = [g for g in groups if g], "codes"
    inside = total = 0
    for g in groups:
        held = {id(r) for r in g}
        other = np.array([r["actual"] - r["preds"][method] for r in pts if id(r) not in held])
        if len(other) < 3:
            continue
        lo, hi = _bounds(other, tail, scale)
        for r in g:
            inside += lo <= r["actual"] - r["preds"][method] <= hi
            total += 1
    return (round(float(inside) / total * 100, 1) if total else None), basis


def interval(recs, method):
    """80% oraliq: dum va kengaytirish koeffitsienti "bitta origin'ni chiqarib" qamrov 80% ga eng yaqin bo'ladigan
    qilib tanlanadi (spec INTERVAL_*); teng bo'lsa — torrog'i. COVID va uzilish oynalari kirmaydi."""
    pts = [r for r in recs if not r["covid"] and method in r["preds"]]
    if len(pts) < spec.INTERVAL_MIN_POINTS:
        return None
    resid = np.array([r["actual"] - r["preds"][method] for r in pts])
    best = None
    for scale in spec.INTERVAL_SCALES:
        for tail in spec.INTERVAL_TAILS:
            cov, basis = _loo_coverage(pts, method, tail, scale)
            if cov is None:
                continue
            lo, hi = _bounds(resid, tail, scale)
            key = (abs(cov - spec.INTERVAL_TARGET), hi - lo)
            if best is None or key < best[0]:
                best = (key, tail, scale, cov, basis)
        if best and spec.INTERVAL_OK[0] <= best[3] <= spec.INTERVAL_OK[1]:
            break   # kengaytirmasdan ham chegarada — kattaroq koeffitsient kerak emas
    if best is None:
        q10, q90 = _bounds(resid, 10, 1.0)
        return {"q10": float(q10), "q90": float(q90), "coverage": None, "basis": None, "tail": 10, "scale": 1.0}
    _, tail, scale, cov, basis = best
    q10, q90 = _bounds(resid, tail, scale)
    return {"q10": float(q10), "q90": float(q90), "coverage": cov, "basis": basis, "tail": tail, "scale": scale,
            "n": len(pts), "small_sample": len(pts) < spec.INTERVAL_SMALL}


def _widen(intervals, residuals=None):
    """Oraliq horizont bilan kengayadi (oldingi horizontdan tor bo'lmaydi). Yetishmagan horizont eng yaqin bor
    horizontdan √(h/h') bilan to'ldiriladi; qamrovi shu horizontning o'z orqaga sinov qoldiqlarida tekshiriladi
    (`residuals`: {h: [qoldiq]}; oraliq ular bo'yicha tuzilmagan, shuning uchun tekshiruv halol)."""
    known = [h for h in spec.HORIZONS if intervals.get(h)]
    if not known:
        return intervals
    for h in spec.HORIZONS:
        if intervals.get(h) is None:
            src = min(known, key=lambda k: (abs(k - h), k))
            f = math.sqrt(h / src)
            q10, q90 = intervals[src]["q10"] * f, intervals[src]["q90"] * f
            res = (residuals or {}).get(h) or []
            cov = round(sum(1 for e in res if q10 <= e <= q90) / len(res) * 100, 1) if res else None
            intervals[h] = {"q10": q10, "q90": q90, "coverage": cov, "basis": "scaled", "from_horizon": src,
                            "n": len(res), "small_sample": len(res) < spec.INTERVAL_SMALL}
    prev = None
    for h in spec.HORIZONS:
        cur = intervals[h]
        if prev is not None:
            cur["q10"] = min(cur["q10"], prev["q10"])
            cur["q90"] = max(cur["q90"], prev["q90"])
        prev = cur
    return intervals


def _fallback(method):
    chain = [ENSEMBLE, PANEL, DAMPED, DRIFT, NAIVE]
    return chain[chain.index(method):] if method in chain else [NAIVE]


def forecast(ds, key, level, bt, peer_map=None):
    """Yakuniy prognoz. -> (runs: {h: {...}}, values: [ForecastValue maydonlari])."""
    info = spec.INDICATORS[key]
    kind = info["kind"]
    until = bt["until"]
    codes = _codes(ds, key, level)
    # Prognoz uzilishdan keyingi qatordan (spec `break_jump`); uzilishsiz ko'rsatkichlarda — to'liq qator
    series = {c: ds.cut(key, c, until) for c in ds.series(key)}
    runs, intervals, mix, residuals = {}, {}, {}, {}
    for h in spec.HORIZONS:
        recs = bt["records"].get(h, [])
        methods = sorted({m for r in recs for m in r["preds"]})
        table = {m: metrics(recs, kind, m) for m in methods}
        chosen = select(table)
        intervals[h] = interval(recs, chosen)
        residuals[h] = [r["actual"] - r["preds"][chosen] for r in recs if not r["covid"] and chosen in r["preds"]]
        runs[h] = {"method": chosen, "table": table}
        # Ansambl vazni: butun orqaga sinovdagi MAE ga teskari
        m2, m3 = (table.get(DAMPED) or {}).get("mae"), (table.get(PANEL) or {}).get("mae")
        mix[h] = (1 / m2) / (1 / m2 + 1 / m3) if m2 and m3 else 0.5
    intervals = _widen(intervals, residuals)

    # Panel modeli kerak bo'lgan horizontlar uchun yakuniy o'qitish (barcha ma'lum maqsadlar bilan)
    first = min((y for c in codes for y in series.get(c, {})), default=until)
    panel_models, panel_rows = {}, {}
    for h in spec.HORIZONS:
        if runs[h]["method"] in (PANEL, ENSEMBLE) and bt.get("panel_params"):
            model = _fit_panel(ds, key, level, range(first + 1, until - h + 1), h, bt["panel_params"])
            if model is not None:
                panel_models[h] = model
                X, _, idx = ds.rows(key, level, [until], h, with_target=False)
                if X:
                    preds = model.predict(X)
                    contrib = model.contributions(X)
                    panel_rows[h] = {code: (float(p), contrib[i]) for i, ((code, _), p) in enumerate(zip(idx, preds))}

    what_if = _what_if(ds, key, level, bt, until, first, panel_models) if spec.WHAT_IF_ENABLED else {}

    values = []
    clip_zero = kind == "rate"
    for code in codes:
        own = series.get(code, {})
        if own.get(until) is None:
            continue
        f0 = own[until]
        deltas = {}
        for h in spec.HORIZONS:
            delta, drivers = None, []
            for method in _fallback(runs[h]["method"]):
                if method == PANEL:
                    hit = panel_rows.get(h, {}).get(code)
                    delta = hit[0] if hit else None
                elif method == ENSEMBLE:
                    hit = panel_rows.get(h, {}).get(code)
                    d2 = simple(DAMPED, own, until, h)
                    delta = mix[h] * d2 + (1 - mix[h]) * hit[0] if hit and d2 is not None else None
                else:
                    delta = simple(method, own, until, h)
                if delta is not None:
                    if method in (PANEL, ENSEMBLE):
                        drivers = _drivers(panel_rows[h][code][1])
                    break
            if delta is None:
                continue
            deltas[h] = delta
            q = intervals.get(h) or {"q10": 0.0, "q90": 0.0}
            value, lo, hi = from_f(f0 + delta, kind), from_f(f0 + delta + q["q10"], kind), from_f(f0 + delta + q["q90"], kind)
            if clip_zero:
                value, lo, hi = max(value, 0.0), max(lo, 0.0), max(hi, 0.0)
            values.append({"indicator": key, "soato": code, "period": str(until + h), "horizon": h, "scenario": "base",
                           "value": round(value, 4), "lo80": round(lo, 4), "hi80": round(hi, 4), "drivers": drivers,
                           "_level": level})
        values.extend(_scenarios(key, level, code, own, until, deltas, peer_map, series, kind))
    for code, by_feature in what_if.items():
        base = {v["horizon"]: v["value"] for v in values if v["soato"] == code and v["scenario"] == "base"}
        own = series.get(code, {})
        for feature, by_h in by_feature.items():
            for h, by_delta in list(by_h.items()):
                if h not in base or own.get(until) is None:
                    del by_h[h]
                    continue
                # Model farqi bazaviy prognozga qo'shiladi (qaysi usul tanlangan bo'lsa ham)
                cur = from_f(own[until], kind)
                by_h[h] = {"period": str(until + h), "base": round(base[h], 4),
                           "values": {str(d): round(base[h] * math.exp(diff) if kind == "level" else base[h] + diff, 4)
                                      for d, diff in by_delta.items()}, "last": round(cur, 4)}
    return {"until": until, "runs": runs, "intervals": intervals, "models": panel_models, "what_if": what_if}, values


def _what_if(ds, key, level, bt, until, first, panel_models):
    """{kod: {omil: {h: {delta: f-fazodagi farq}}}} — panel modeli bilan, omil `delta` ga o'zgarganda prognoz farqi."""
    targets = {f: w for f, w in spec.WHAT_IF.items() if key in w["targets"]}
    if level != "district" or not targets or not bt.get("panel_params"):
        return {}
    out = defaultdict(dict)
    for h in spec.HORIZONS:
        model = panel_models.get(h)
        if model is None:
            model = _fit_panel(ds, key, level, range(first + 1, until - h + 1), h, bt["panel_params"])
            if model is None:
                continue
            panel_models[h] = model
        X, _, idx = ds.rows(key, level, [until], h, with_target=False)
        if not X:
            continue
        base = model.predict(X)
        for feature, w in targets.items():
            cols = [(FEATURE_NAMES.index(f), w.get("floor", {}).get(f)) for f in w["features"]]
            for d in w["deltas"]:
                shifted = [list(row) for row in X]
                for row in shifted:
                    for c, floor in cols:
                        if not math.isnan(row[c]):
                            row[c] = row[c] + d if floor is None else max(row[c] + d, floor)
                pred = model.predict(shifted)
                for i, (code, _) in enumerate(idx):
                    out[code].setdefault(feature, {}).setdefault(h, {})[d] = float(pred[i] - base[i])
    return dict(out)


def save_models(version, key, level, models):
    """Panel modellari fayllari (10.7): media/forecast/<versiya>/<ko'rsatkich>-<daraja>-h<h>.json. -> {h: yo'l}."""
    from django.conf import settings

    folder = settings.MEDIA_ROOT / "forecast" / version
    out = {}
    for h, model in models.items():
        if model is None or model.model is None:
            continue
        folder.mkdir(parents=True, exist_ok=True)
        path = folder / f"{key}-{level}-h{h}.json"
        model.model.save_model(str(path))
        out[h] = str(path.relative_to(settings.MEDIA_ROOT)).replace("\\", "/")
    return out


def _drivers(contrib, top=5):
    """SHAP hissalari -> eng katta 5 ta omil (f-fazodagi ta'siri, ishora bilan). Bazaviy qiymat kirmaydi."""
    pairs = [(FEATURE_NAMES[i], float(v)) for i, v in enumerate(contrib[:-1]) if FEATURE_NAMES[i] != "horizon"]
    pairs = [p for p in pairs if abs(p[1]) > 1e-6]
    pairs.sort(key=lambda p: -abs(p[1]))
    return [{"feature": name, "contribution": round(v, 5)} for name, v in pairs[:top]]


def _scenarios(key, level, code, own, until, deltas, peer_map, series, kind):
    """Ijobiy/salbiy: o'xshash hududlarning so'nggi 3 yillik o'rtacha yillik o'sishi choraklari (10.5), 5 yilgacha."""
    if not deltas or 3 not in deltas:
        return []
    peers = (peer_map or {}).get(code) or []
    rates = []
    for other in peers:
        s = series.get(other, {})
        if s.get(until) is not None and s.get(until - 3) is not None:
            rates.append((s[until] - s[until - 3]) / 3)
    if len(rates) < 4:
        s = own
        if s.get(until - 3) is None:
            return []
        own_rate = (s[until] - s[until - 3]) / 3
        spread = abs(deltas[3] / 3 - own_rate) + (0.01 if kind == "level" else 0.3)
        q25, q75 = own_rate - spread, own_rate + spread
    else:
        q25, q75 = float(np.percentile(rates, 25)), float(np.percentile(rates, 75))
    better = BETTER.get(key, 1)
    good, bad = (q75, q25) if better > 0 else (q25, q75)
    out = []
    f0 = own[until]
    for h in range(1, spec.SCENARIO_YEARS + 1):
        base = deltas.get(h, deltas[3] * h / 3)
        if better > 0:
            opt, pes = max(base, h * good), min(base, h * bad)
        else:
            opt, pes = min(base, h * good), max(base, h * bad)
        for scenario, d in (("optimistic", opt), ("pessimistic", pes)):
            value = from_f(f0 + d, kind)
            if kind == "rate":
                value = max(value, 0.0)
            out.append({"indicator": key, "soato": code, "period": str(until + h), "horizon": h, "scenario": scenario,
                        "value": round(value, 4), "lo80": None, "hi80": None, "drivers": [], "_level": level})
    return out


def peer_map_for(level):
    """Ssenariylar uchun o'xshash hududlar: scoring z-vektorlari bo'yicha eng yaqin 10 ta."""
    from ..scoring import config as score_config
    from ..scoring import engine
    from ..scoring import service as score_service
    from ..scoring.panel import get_panel

    cfg = score_config.load()
    panel = get_panel(cfg)
    year = score_service.default_year(cfg, panel, level)
    if not year:
        return {}
    result = score_service.cached(cfg, level, year, score_config.weights_for(cfg, level), panel)
    z = {c: {k: d["z"] for k, d in item.get("indicators", {}).items() if "z" in d}
         for c, item in result["items"].items()}
    near = engine.distances(z, min_common=int(cfg["params"]["peers_min_common"]))
    return {c: [o for o, _ in row[:10]] for c, row in near.items()}


def data_signature(ds):
    return {f"{key}:{level}": ds.data_until(key, level) for key, info in spec.INDICATORS.items()
            for level in info["levels"]}


def train_all(force=False, keys=None, report=False):
    """Barcha ko'rsatkichlar. -> ForecastVersion (yoki None — ma'lumot o'zgarmagan)."""
    from ..models import ForecastModelRun, ForecastValue, ForecastVersion

    ds = Dataset.from_db()
    signature = data_signature(ds)
    current = ForecastVersion.objects.filter(is_current=True).first()
    if current and not force and current.data_until == signature and not keys:
        return None
    version = timezone.now().strftime("%Y%m%d-%H%M%S")
    record = ForecastVersion.objects.create(version=version, data_until=signature)
    try:
        peers = {level: peer_map_for(level) for level in ("region", "district")}
        runs, values, summary, what_if = [], [], {}, {}
        for key, info in spec.INDICATORS.items():
            if keys and key not in keys:
                continue
            for level in info["levels"]:
                bt = backtest(ds, key, level)
                if not bt:
                    continue
                result, vals = forecast(ds, key, level, bt, peers.get(level))
                values.extend(vals)
                artifacts = save_models(version, key, level, result.get("models") or {})
                if result.get("what_if"):
                    what_if[key] = result["what_if"]
                for h, run in result["runs"].items():
                    q = result["intervals"].get(h) or {}
                    runs.append(ForecastModelRun(
                        indicator=key, level=level, horizon=h, model_kind=run["method"],
                        params=bt.get("panel_params") or {}, backtest={m: v for m, v in run["table"].items() if v},
                        interval=q, data_until=str(result["until"]), version=version,
                        artifact_path=artifacts.get(h, "")))
                    summary.setdefault(key, {}).setdefault(level, {})[h] = {
                        "method": run["method"], "metrics": run["table"].get(run["method"]),
                        "all": run["table"], "interval": q}
        with transaction.atomic():
            ForecastModelRun.objects.bulk_create(runs)
            run_ids = {(r.indicator, r.level, r.horizon): r for r in
                       ForecastModelRun.objects.filter(version=version)}
            ForecastValue.objects.bulk_create([
                ForecastValue(indicator=v["indicator"], soato=v["soato"], period=v["period"], horizon=v["horizon"],
                              scenario=v["scenario"], value=v["value"], lo80=v["lo80"], hi80=v["hi80"],
                              drivers=v["drivers"], version=version,
                              model_run=run_ids.get((v["indicator"], v["_level"], min(v["horizon"], 3))))
                for v in values], batch_size=2000, ignore_conflicts=True)
            record.report = summary
            record.what_if = what_if
            record.monitoring = monitoring(version)
            ForecastVersion.objects.filter(is_current=True).update(is_current=False)
            record.is_current = True
            record.save()
            _prune()
    except Exception as exc:  # noqa: BLE001 — xato bo'lsa eski prognoz qoladi
        logger.exception("Prognozni o'qitish xatosi")
        record.error = str(exc)[:4000]
        record.save(update_fields=["error"])
        _notify_admins(f"Prognoz modellarini qayta o'qitishda xato (eski prognoz saqlandi): {exc}"[:1000], record)
        raise
    from ..sync import bump_cache

    bump_cache()
    return record


def _prune():
    from ..models import ForecastModelRun, ForecastValue, ForecastVersion

    keep = list(ForecastVersion.objects.filter(error="").order_by("-created_at").values_list("version", flat=True)
                [:spec.KEEP_VERSIONS])
    old = ForecastVersion.objects.exclude(version__in=keep)
    old_versions = list(old.values_list("version", flat=True))
    ForecastValue.objects.filter(version__in=old_versions).delete()
    ForecastModelRun.objects.filter(version__in=old_versions).delete()
    old.delete()
    import shutil

    from django.conf import settings

    root = settings.MEDIA_ROOT / "forecast"
    if root.exists():
        for folder in root.iterdir():
            if folder.is_dir() and folder.name not in keep:
                shutil.rmtree(folder, ignore_errors=True)


def monitoring(version):
    """KR-28: o'tgan versiyalar prognozi yangi haqiqiy qiymat bilan (asosiy ssenariy). -> {ko'rsatkich: {...}}"""
    from ..models import ForecastValue, ForecastVersion, SiatValue

    previous = ForecastVersion.objects.exclude(version=version).filter(error="").order_by("-created_at").first()
    if not previous:
        return {}
    out = {}
    rows = ForecastValue.objects.filter(version=previous.version, scenario="base")
    by_key = defaultdict(list)
    for r in rows:
        by_key[r.indicator].append(r)
    for key, items in by_key.items():
        source_key, breakdown = spec.INDICATORS[key]["source"]
        if breakdown == "*":
            continue
        actual = dict(((v.territory_code, v.period), v.value) for v in SiatValue.objects.filter(
            indicator__key=source_key, breakdown=breakdown, value__isnull=False,
            period__in={i.period for i in items}))
        errors, inside, outside = [], 0, []
        for i in items:
            a = actual.get((i.soato, i.period))
            if a is None:
                continue
            if a:
                errors.append(abs(i.value - a) / abs(a) * 100)
            if i.lo80 is not None and i.lo80 <= a <= i.hi80:
                inside += 1
            else:
                outside.append({"soato": i.soato, "period": i.period, "forecast": i.value, "actual": a})
        if errors:
            out[key] = {"count": len(errors), "mape": round(sum(errors) / len(errors), 2),
                        "inside_pct": round(inside / len(errors) * 100, 1), "outside": outside[:20],
                        "previous_version": previous.version}
    return out


def _notify_admins(message, record):
    from django.contrib.contenttypes.models import ContentType

    from apps.accounts.models import User
    from apps.notifications.models import Notification

    ct = ContentType.objects.get_for_model(record)
    for admin in User.objects.filter(is_active=True, is_staff=True):
        try:
            Notification.objects.create(recipient=admin, title="SIAT: prognoz", message=message,
                                        notification_type="warning", content_type=ct, object_id=record.pk)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Prognoz xabari yuborilmadi: %s", exc)
