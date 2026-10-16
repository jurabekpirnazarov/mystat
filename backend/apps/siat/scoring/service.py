"""Scoring natijasi: bir daraja va yil uchun barcha hududlar (KR-16..KR-21).

`compute()` tilsiz, raqamli natija beradi (TerritoryScore'ga yoziladi va keshlanadi); `render_*` funksiyalar API
javobini tanlangan tilda tayyorlaydi.
"""
import threading
from collections import defaultdict

from . import analysis, engine, methodology
from .config import PILLARS, load, pillar_of, scored, weights_for
from .panel import get_panel
from .texts import SECTOR_LABELS, STATUS, fmt_number, t, tr

REPUBLIC = "1700"
_RESULTS = {}
_LOCK = threading.Lock()


def _indicators_for(cfg, level):
    """Shu darajada qiymati olinadigan ko'rsatkichlar (tumanda faqat tuman kesimidagilar)."""
    return [k for k, ind in cfg["indicators"].items() if level == "region" or ind["level"] == "district"]


def compute(level, year, weights, cfg=None, panel=None):
    """-> {"items": {kod: {...}}, "year", "weights", ...}. Tengdoshlar — shu darajadagi barcha hududlar."""
    cfg = cfg or load()
    panel = panel or get_panel(cfg)
    params = cfg["params"]
    codes = panel.codes(level)
    not_created = {c for c in codes if panel.not_created(c, year)}
    active = [c for c in codes if c not in not_created]

    values = {}
    for key in _indicators_for(cfg, level):
        ind = cfg["indicators"][key]
        values[key] = panel.values(ind["source"], active, year, int(params["max_lag"]))
    national = {}
    for key in _indicators_for(cfg, level):
        nat = panel.values(cfg["indicators"][key]["source"], [REPUBLIC], year, int(params["max_lag"])).get(REPUBLIC)
        national[key] = nat["value"] if nat else None

    score_keys = scored(cfg, level)
    norm = {}
    for key in score_keys:
        ind = cfg["indicators"][key]
        norm[key] = engine.normalize({c: v["value"] for c, v in values[key].items()}, ind["direction"],
                                     ind["transform"], float(params["z_clip"]), float(params["score_scale"]))
    pct_raw = {key: engine.percentiles({c: v["value"] for c, v in vals.items()}) for key, vals in values.items()}
    raw_rank = {key: engine.ranks({c: v["value"] for c, v in vals.items()}) for key, vals in values.items()}

    pillars = {p: [k for k in cfg["pillars"][p]["indicators"] if k in score_keys] for p in PILLARS}
    pillars = {p: members for p, members in pillars.items() if members}
    s_scores = {key: {c: d["s"] for c, d in norm[key].items()} for key in score_keys}
    pillar_by_code, present = engine.pillar_scores(s_scores, pillars)
    for c in active:
        pillar_by_code.setdefault(c, {p: None for p in pillars})
        present.setdefault(c, {p: 0.0 for p in pillars})
    w = {p: weights.get(p, 0.0) for p in PILLARS if p in pillars}
    composite = engine.composite(pillar_by_code, w)
    cov = engine.coverage(present, w)

    eligible = {c for c in active if cov.get(c, 0) >= params["coverage_min"] and composite.get(c) is not None}
    final = {c: composite[c] for c in eligible}
    rank = engine.ranks(final)
    rank_rng = engine.rank_range(pillar_by_code, w, eligible, int(params["rank_iterations"]),
                                 float(params["rank_jitter"]), int(params["rank_seed"]))
    in_parent = {}
    if level == "district":
        groups = defaultdict(dict)
        for c in eligible:
            groups[panel.territories[c]["parent"]][c] = final[c]
        for group in groups.values():
            for c, r in engine.ranks(group).items():
                in_parent[c] = (r, len(group))

    # Kuchli/zaif, o'xshashlar
    z_by_code = defaultdict(dict)
    s_by_code = defaultdict(dict)
    for key in score_keys:
        for c, d in norm[key].items():
            z_by_code[c][key] = d["z"]
            s_by_code[c][key] = d["s"]
    peer_map = analysis.peers(z_by_code, s_by_code, eligible, params)

    sectors = {}
    region_ctx = None
    if level == "region":
        sectors = analysis.sector_table(panel, set(codes), year, params, _sector_names(cfg))
    else:
        region_ctx = cached(cfg, "region", year, weights_for(cfg, "region"), panel)

    items = {}
    for c in codes:
        if c in not_created:
            items[c] = {"soato": c, "status": "not_created", "score": None, "missing": True}
            continue
        ind_details = {}
        for key in _indicators_for(cfg, level):
            v = values[key].get(c)
            if v is None:
                continue
            row = {"value": round(v["value"], 3), "year": v["year"], "lagged": v["lagged"],
                   "preliminary": v["preliminary"], "short": v["short"], "forecast": v["forecast"],
                   "rank_raw": raw_rank[key].get(c), "pct_raw": pct_raw[key].get(c), "of": len(values[key])}
            if key in norm and c in norm[key]:
                row.update({"s": norm[key][c]["s"], "pct": norm[key][c]["pct"], "rank": norm[key][c]["rank"],
                            "z": norm[key][c]["z"]})
            ind_details[key] = row
        scored_details = {k: d for k, d in ind_details.items() if "s" in d}
        strong, weak = analysis.strengths(scored_details, params)
        coverage_ok = cov.get(c, 0) >= params["coverage_full"]
        history = {}
        if "real-wage-growth" in cfg["indicators"]:
            series, _ = panel.source_series(cfg["indicators"]["real-wage-growth"]["source"])
            history["real-wage-growth"] = {y: v for (code, y), v in series.items() if code == c and y <= year}
        parent_pct = {}
        if level == "district" and region_ctx:
            parent = panel.territories[c]["parent"]
            p_item = region_ctx["items"].get(parent, {})
            for key, d in p_item.get("indicators", {}).items():
                parent_pct[key] = d.get("pct_raw")
                parent_pct[f"{key}__value"] = {"value": d["value"], "year": d["year"]}
        own_sectors = sectors.get(c, [])
        recs = []
        if c in eligible:
            recs = analysis.evaluate_rules(cfg, level, c, pct_raw, values, parent_pct, history, coverage_ok, own_sectors)
        status = "insufficient" if c not in eligible else ("ok" if coverage_ok else "partial")
        missing_scored = [k for k in score_keys if k not in scored_details]
        items[c] = {
            "soato": c, "status": status, "missing": c not in eligible,
            "score": final.get(c), "raw_score": composite.get(c), "rank": rank.get(c),
            "rank_range": list(rank_rng[c]) if c in rank_rng else None,
            "rank_in_parent": list(in_parent[c]) if c in in_parent else None,
            "pillars": pillar_by_code.get(c, {}), "coverage": cov.get(c, 0.0), "partial": status == "partial",
            "indicators": ind_details, "strengths": strong, "weaknesses": weak,
            "recommendations": recs, "sectors": own_sectors,
            "peers": peer_map.get(c, []) if c in eligible else [],
            "gaps": [{"indicator": k, "reason": _gap_reason(panel, cfg, k, c, year)} for k in missing_scored],
        }
    return {"level": level, "year": year, "weights": w, "of": len(eligible), "items": items,
            "national": national, "version": cfg["version"], "forecast": year in panel.forecast_years}


def _gap_reason(panel, cfg, key, code, year):
    series, _ = panel.source_series(cfg["indicators"][key]["source"])
    years = [y for (c, y) in series if c == code and y <= year]
    if not years:
        return "no_data"
    return "lag_too_old"


def _sector_names(cfg):
    from ..models import SiatBreakdown

    names = {}
    for b in SiatBreakdown.objects.filter(indicator__key__in=(analysis.INDUSTRY, analysis.INVESTMENT)).select_related("indicator"):
        code = b.code.strip().rstrip(".")
        names.setdefault((b.indicator.key, code), {"uz": b.name_uz, "ru": b.name_ru or b.name_uz,
                                                   "en": b.name_en or b.name_uz, "uzc": b.name_uzc or b.name_uz})
    return names


def cached(cfg, level, year, weights, panel=None, forecast_panel=None):
    """Jarayon xotirasida kesh: (panel, daraja, yil, vaznlar) — maxsus vaznli so'rov ham tez qaytadi."""
    panel = forecast_panel or panel or get_panel(cfg)
    key = (panel.token, level, year, tuple(sorted(weights.items())))
    with _LOCK:
        hit = _RESULTS.get(key)
    if hit is not None:
        return hit
    result = compute(level, year, weights, cfg, panel)
    with _LOCK:
        if len(_RESULTS) > 200:
            _RESULTS.clear()
        _RESULTS[key] = result
    return result


def available_years(cfg=None, panel=None, level="region"):
    """Indeks hisoblanadigan yillar: tengdoshlarning kamida yarmida to'liqlik ≥ coverage_min."""
    cfg = cfg or load()
    panel = panel or get_panel(cfg)
    years = []
    weights = weights_for(cfg, level)
    for year in panel.years():
        if year > max_actual_year(panel):
            continue
        result = cached(cfg, level, year, weights, panel)
        total = len([i for i in result["items"].values() if i["status"] != "not_created"])
        if total and result["of"] >= total / 2:
            years.append(year)
    return years


def max_actual_year(panel):
    pop = panel.raw("246")
    return max((y for (_, y) in pop if y not in panel.forecast_years), default=0)


def default_year(cfg=None, panel=None, level="region"):
    """Eng so'nggi yil, unda tengdoshlarning ko'pchiligi to'liq ma'lumotli; bo'lmasa — qisman."""
    cfg = cfg or load()
    panel = panel or get_panel(cfg)
    years = available_years(cfg, panel, level)
    weights = weights_for(cfg, level)
    for year in reversed(years):
        items = cached(cfg, level, year, weights, panel)["items"].values()
        full = [i for i in items if i["status"] == "ok"]
        if len(full) >= len([i for i in items if i["status"] != "not_created"]) / 2:
            return year
    return years[-1] if years else None


# --- API javoblari -----------------------------------------------------------------------------------------------

def _name(panel, code, lang):
    names = panel.territories.get(code, {}).get("names", {})
    return names.get(lang) or names.get("uz") or code


def render_list(result, panel, lang, parent=None):
    items = []
    for code, item in result["items"].items():
        if parent and panel.territories[code]["parent"] != parent:
            continue
        items.append({
            "soato": code, "name": _name(panel, code, lang), "kind": panel.territories[code]["kind"],
            "score": item["score"], "rank": item.get("rank"), "rank_range": item.get("rank_range"),
            "rank_in_parent": item.get("rank_in_parent"), "pillars": item.get("pillars") or {},
            "coverage": item.get("coverage"), "partial": item.get("partial", False), "missing": item["missing"],
            "status": item["status"],
        })
    items.sort(key=lambda i: (i["score"] is None, -(i["score"] or 0)))
    return items


def _vs_national(cfg, key, value, national):
    nat = national.get(key)
    ind = cfg["indicators"][key]
    if value is None or not nat or ind["unit"]["uz"] == "%" or ind.get("compare_national") is False:
        return None
    return round((value / nat - 1) * 100, 1)


def indicator_text(cfg, key, d, of, national, lang):
    """"Ish haqi: 14 dan 3-o'rin, respublikadan 12% yuqori"."""
    ind = cfg["indicators"][key]
    parts = []
    rank = d.get("rank") or d.get("rank_raw")
    if rank:
        parts.append(t("rank", lang, rank=rank, of=d.get("of") or of))
    diff = _vs_national(cfg, key, d.get("value"), national)
    if diff is not None and abs(diff) >= 1:
        parts.append(t("vs_national", lang, pct=fmt_number(abs(diff), 0),
                       dir=t("higher" if diff > 0 else "lower", lang)))
    return f"{tr(ind['name'], lang)}: {', '.join(parts)}" if parts else tr(ind["name"], lang)


def render_detail(cfg, result, panel, code, lang, region_result=None):
    item = result["items"][code]
    level = result["level"]
    territory = panel.territories[code]
    base = {"soato": code, "name": _name(panel, code, lang), "level": level, "kind": territory["kind"],
            "period": str(result["year"]), "forecast": result["forecast"], "status": item["status"],
            "status_label": tr(STATUS[item["status"]], lang),
            "index_name": t("index_region" if level == "region" else "index_district", lang),
            "methodology_version": result["version"]}
    if item["status"] == "not_created":
        return {**base, "score": None, "missing": True}
    national = result["national"]

    def ind_row(key, d):
        ind = cfg["indicators"][key]
        return {"id": key, "name": tr(ind["name"], lang), "unit": tr(ind["unit"], lang), "value": d["value"],
                "year": d["year"], "lagged": d["lagged"], "preliminary": d["preliminary"], "short": d["short"],
                "forecast": d["forecast"], "s": d.get("s"), "percentile": d.get("pct"), "rank": d.get("rank") or d.get("rank_raw"),
                "of": d.get("of"), "national": national.get(key), "vs_national_pct": _vs_national(cfg, key, d["value"], national)}

    pillars = []
    for p in PILLARS:
        members = [k for k in cfg["pillars"][p]["indicators"] if k in scored(cfg, level)]
        if not members:
            continue
        pillars.append({"key": p, "name": tr(cfg["pillars"][p]["name"], lang), "score": item["pillars"].get(p),
                        "weight": result["weights"].get(p, 0),
                        "indicators": [ind_row(k, item["indicators"][k]) for k in members if k in item["indicators"]]})
    context = [ind_row(k, d) for k, d in item["indicators"].items() if cfg["indicators"][k]["role"] == "context"]

    def side(keys):
        return [{"indicator": k, "name": tr(cfg["indicators"][k]["name"], lang),
                 "text": indicator_text(cfg, k, item["indicators"][k], result["of"], national, lang),
                 "percentile": item["indicators"][k].get("pct")} for k in keys]

    recs = [render_recommendation(cfg, r, item, national, lang, result["of"]) for r in item["recommendations"]]
    if not recs and not item["missing"]:
        recs = [_fallback(cfg, item, lang)]
    peers = [{"soato": p["soato"], "name": _name(panel, p["soato"], lang), "distance": p["distance"],
              "score": result["items"][p["soato"]]["score"],
              "ahead_in": [{"indicator": k, "name": tr(cfg["indicators"][k]["name"], lang)} for k in p["ahead_in"]]}
             for p in item["peers"]]
    detail = {
        **base, "score": item["score"], "rank": item.get("rank"), "of": result["of"], "rank_range": item.get("rank_range"),
        "rank_unstable": bool(item.get("rank_range") and item["rank_range"][1] - item["rank_range"][0] >= cfg["params"]["rank_unstable"]),
        "rank_in_parent": item.get("rank_in_parent"), "coverage": item["coverage"], "partial": item["partial"],
        "missing": item["missing"], "pillars": pillars, "context": context,
        "strengths": side(item["strengths"]), "weaknesses": side(item["weaknesses"]),
        "sectors": [render_sector(s, lang) for s in item["sectors"]],
        "recommendations": recs, "peers": peers,
        "gaps": [{"indicator": g["indicator"], "name": tr(cfg["indicators"][g["indicator"]]["name"], lang),
                  "reason": t("no_data", lang) if g["reason"] == "no_data" else t("lag_too_old", lang, max_lag=cfg["params"]["max_lag"])}
                 for g in item["gaps"]],
        "weights": result["weights"],
    }
    if level == "district" and region_result:
        parent = territory["parent"]
        p_item = region_result["items"].get(parent)
        if p_item:
            detail["parent_context"] = {
                "soato": parent, "name": _name(panel, parent, lang), "score": p_item["score"], "rank": p_item.get("rank"),
                "of": region_result["of"],
                "pillars": [{"key": p, "name": tr(cfg["pillars"][p]["name"], lang), "score": p_item["pillars"].get(p)}
                            for p in PILLARS if p_item.get("pillars", {}).get(p) is not None],
                "sectors": [render_sector(s, lang) for s in p_item.get("sectors", [])],
            }
    return detail


def render_sector(s, lang):
    name = s["name"].get(lang) or s["name"].get("uz") if lang != "uzc" else s["name"].get("uzc") or s["name"]["uz"]
    key = {"leading": "sector_leading", "slowing": "sector_slowing", "growing": "sector_growing",
           "invest": "sector_invest"}[s["label"]]
    text = t(key, lang, name=name, lq=fmt_number(s["lq"], 1), growth=fmt_number(s["growth"]),
             national=fmt_number(s["national_growth"]))
    return {"code": s["code"], "source": "industry" if s["source"] == analysis.INDUSTRY else "investment",
            "name": name, "lq": s["lq"], "share": s["share"], "growth": s["growth"],
            "national_growth": s["national_growth"], "year": s["year"], "label": s["label"],
            "label_name": tr(SECTOR_LABELS[s["label"]], lang), "text": text}


def render_recommendation(cfg, rec, item, national, lang, of):
    rule = cfg["rules"][rec["rule"]]
    if rec.get("sector"):
        sector = render_sector(rec["sector"], lang)
        title = tr(rule["title"], lang).replace("{sector}", sector["name"])
        return {"title": title, "text": sector["text"], "strength": rec["strength"], "tentative": rec["tentative"],
                "evidence": [{"name": sector["label_name"], "value": sector["lq"], "unit": "LQ", "text": sector["text"]}]}
    evidence = []
    for e in rec["evidence"]:
        ind = cfg["indicators"][e["indicator"]]
        name, unit = tr(ind["name"], lang), tr(ind["unit"], lang)
        if e.get("values"):
            value_text = " → ".join(f"{fmt_number(v)}%" for v in e["values"])
        else:
            value_text = fmt_number(e["value"]) + ("%" if unit == "%" else f" {unit}")
        note = []
        d = item["indicators"].get(e["indicator"])
        if d and not e.get("from_parent") and (d.get("rank") or d.get("rank_raw")):
            note.append(t("rank", lang, rank=d.get("rank") or d["rank_raw"], of=d["of"]))
        if e.get("from_parent"):
            note.append(t("parent_data", lang))
        if e.get("year") and d and d.get("lagged"):
            note.append(t("lagged", lang, year=e["year"]))
        evidence.append({"indicator": e["indicator"], "name": name, "value": e["value"], "unit": unit,
                         "percentile": e.get("pct"), "year": e.get("year"), "from_parent": bool(e.get("from_parent")),
                         "text": f"{name}: {value_text}" + (f" ({', '.join(note)})" if note else "")})
    return {"title": tr(rule["title"], lang), "text": tr(rule["why"], lang), "strength": rec["strength"],
            "tentative": rec["tentative"], "evidence": evidence}


def _fallback(cfg, item, lang):
    present = {p: s for p, s in (item.get("pillars") or {}).items() if s is not None}
    weakest = min(present, key=present.get) if present else None
    text = t("no_rule", lang)
    if weakest:
        pillar = tr(cfg["pillars"][weakest]["name"], lang)
        return {"title": t("weakest_title", lang, pillar=pillar),
                "text": f"{text} {t('weakest_why', lang, score=fmt_number(present[weakest], 0))}",
                "strength": 0, "tentative": True, "evidence": [], "fallback": True}
    return {"title": text, "text": "", "strength": 0, "tentative": True, "evidence": [], "fallback": True}


def config_payload(cfg, lang):
    """GET score/config/ — ustunlar, ko'rsatkichlar, presetlar, qoidalar va metodologiya parametrlari."""
    return {
        "version": cfg["version"],
        "pillars": [{"key": p, "name": tr(cfg["pillars"][p]["name"], lang),
                     "indicators": [{"id": k, "name": tr(cfg["indicators"][k]["name"], lang),
                                     "unit": tr(cfg["indicators"][k]["unit"], lang),
                                     "direction": cfg["indicators"][k]["direction"],
                                     "transform": cfg["indicators"][k]["transform"],
                                     "level": cfg["indicators"][k]["level"],
                                     "source": str(cfg["indicators"][k]["source"]["key"])}
                                    for k in cfg["pillars"][p]["indicators"]]}
                    for p in PILLARS],
        "context": [{"id": k, "name": tr(i["name"], lang), "source": str(i["source"]["key"])}
                    for k, i in cfg["indicators"].items() if i["role"] != "score"],
        "presets": {k: {"name": tr(v["name"], lang), "region": v["region"], "district": v["district"]}
                    for k, v in cfg["presets"].items()},
        "rules": [{"code": code, "name": tr(r["title"], lang).replace("{sector}", "…"), "levels": r["levels"]}
                  for code, r in cfg["rules"].items()],
        "params": cfg["params"],
        "pillar_of": pillar_of(cfg),
        "methodology": methodology.build(cfg, lang),
    }


# --- Prognoz yillari (10.6) ---------------------------------------------------------------------------------------
_FORECAST_PANELS = {}


def forecast_panel(cfg=None):
    """Haqiqiy panel + joriy prognoz versiyasi (asosiy ssenariy). Prognoz yo'q bo'lsa None."""
    from ..forecast.service import current_version, score_extra

    cfg = cfg or load()
    version = current_version()
    if not version:
        return None
    base = get_panel(cfg)
    key = (base.token, version)
    with _LOCK:
        panel = _FORECAST_PANELS.get(key)
    if panel is None:
        panel = base.with_forecast(score_extra(version))
        with _LOCK:
            _FORECAST_PANELS.clear()
            _FORECAST_PANELS[key] = panel
    return panel


def periods(cfg=None, level="region"):
    """-> (haqiqiy yillar, prognoz yillari). Prognoz yili — oxirgi haqiqiy yildan keyin, tengdoshlarning yarmida
    to'liqlik yetarli bo'lgan yillar."""
    cfg = cfg or load()
    actual = available_years(cfg, get_panel(cfg), level)
    fpanel = forecast_panel(cfg)
    future = []
    if fpanel and actual:
        weights = weights_for(cfg, level)
        for year in sorted(fpanel.forecast_years):
            if year <= actual[-1]:
                continue
            result = cached(cfg, level, year, weights, forecast_panel=fpanel)
            total = len([i for i in result["items"].values() if i["status"] != "not_created"])
            if total and result["of"] >= total / 2:
                future.append(year)
    return actual, future


def panel_for(cfg, year, level):
    actual, future = periods(cfg, level)
    if year in future:
        return forecast_panel(cfg)
    return get_panel(cfg)


def composite_only(level, year, weights, cfg, panel):
    """Monte Carlo uchun yengil hisob: faqat indeks (o'rin oralig'i, tavsiyalarsiz). -> {kod: indeks}."""
    params = cfg["params"]
    codes = [c for c in panel.codes(level) if not panel.not_created(c, year)]
    score_keys = scored(cfg, level)
    s_scores = {}
    for key in score_keys:
        ind = cfg["indicators"][key]
        vals = panel.values(ind["source"], codes, year, int(params["max_lag"]))
        norm = engine.normalize({c: v["value"] for c, v in vals.items()}, ind["direction"], ind["transform"],
                                float(params["z_clip"]), float(params["score_scale"]))
        s_scores[key] = {c: d["s"] for c, d in norm.items()}
    pillars = {p: [k for k in cfg["pillars"][p]["indicators"] if k in score_keys] for p in PILLARS}
    pillars = {p: m for p, m in pillars.items() if m}
    by_code, present = engine.pillar_scores(s_scores, pillars)
    w = {p: weights.get(p, 0.0) for p in pillars}
    comp = engine.composite(by_code, w)
    cov = engine.coverage(present, w)
    return {c: s for c, s in comp.items() if s is not None and cov.get(c, 0) >= params["coverage_min"]}, by_code, w


def forecast_rank_range(level, year, weights, cfg=None, samples=100, seed=None):
    """10.6: prognoz yili o'rin oralig'i — har ko'rsatkich qiymati 80% oraliqdan tasodifiy (f-fazoda normal) va
    vaznlar ×U(0.8, 1.2). -> {kod: (past, yuqori)}"""
    import math

    import numpy as np

    from ..forecast.service import score_intervals

    cfg = cfg or load()
    base = get_panel(cfg)
    intervals = score_intervals()
    if not intervals:
        return {}
    rng = np.random.default_rng(seed if seed is not None else int(cfg["params"]["rank_seed"]))
    z90 = 1.2816
    places = defaultdict(list)
    for _ in range(samples):
        extra = {}
        for source, values in intervals.items():
            out = {}
            for cy, (v, lo, hi, kind) in values.items():
                if lo is None or hi is None:
                    out[cy] = v
                    continue
                if kind == "level" and v > 0 and lo > 0 and hi > 0:
                    sd = (math.log(hi) - math.log(lo)) / (2 * z90)
                    out[cy] = math.exp(math.log(v) + rng.normal(0, sd))
                else:
                    out[cy] = v + rng.normal(0, (hi - lo) / (2 * z90))
            extra[source] = out
        panel = base.with_forecast(extra)
        jitter = float(cfg["params"]["rank_jitter"])
        w = {p: wt * rng.uniform(1 - jitter, 1 + jitter) for p, wt in weights.items()}
        scores, _, _ = composite_only(level, year, w, cfg, panel)
        for c, r in engine.ranks(scores).items():
            places[c].append(r)
    return {c: (int(np.percentile(r, 10, method="lower")), int(np.percentile(r, 90, method="higher")))
            for c, r in places.items() if r}
