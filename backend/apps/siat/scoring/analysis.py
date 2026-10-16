"""KR-18, KR-21: kuchli/zaif tomonlar, tarmoq ixtisosi (LQ), tavsiya qoidalari, o'xshash hududlar.

Barcha funksiyalar tayyor raqamlar bilan ishlaydi (tilsiz); matn API javobida `texts.py` orqali yoziladi.
"""
import re
from collections import defaultdict

from . import engine

INDUSTRY = "industry-by-activity"
INVESTMENT = "investment-by-activity"
SECTION = re.compile(r"^[A-Z]$")


def strengths(indicators, params):
    """indicators: {ko'rsatkich: {"pct", ...}} (yo'nalish hisobga olingan) -> (kuchli, zaif) kalitlar ro'yxati."""
    strong = sorted((k for k, d in indicators.items() if d["pct"] >= params["strong_pct"]),
                    key=lambda k: -indicators[k]["pct"])
    weak = sorted((k for k, d in indicators.items() if d["pct"] <= params["weak_pct"]),
                  key=lambda k: indicators[k]["pct"])
    n = int(params.get("max_strengths", 3))
    return strong[:n], weak[:n]


def _sector_code(code):
    code = (code or "").strip().rstrip(".")
    return code


def _window_sum(series, code, years):
    values = [series.get((code, y)) for y in years]
    values = [v for v in values if v is not None]
    return sum(values) if values else None


def sector_table(panel, regions, year, params, names):
    """5.2: tarmoqlar bo'yicha LQ va o'sish. -> {viloyat: [{"source", "code", "lq", "share", "growth",
    "national_growth", "label", "name", "year"}]} — faqat belgisi bor tarmoqlar.

    Har guruh uchun `year` yoki undan bir yil oldingi eng so'nggi yil olinadi (sanoat 2024 gacha), oxirgi 3 yil
    yig'indisi. Ulush bo'limlar (A–S) yig'indisiga nisbatan; sanoatda C bo'limi bo'limlarga (10–33) bo'lib ko'rsatiladi.
    names: {(manba, kod): {"uz", "ru", "en"}}.
    """
    n_years = int(params.get("sector_years", 3))
    rows, lqs = defaultdict(list), {}
    for source in (INDUSTRY, INVESTMENT):
        sectors = defaultdict(dict)   # kod -> {(viloyat, yil): qiymat}
        for (key, breakdown), values in panel.series.items():
            code = _sector_code(breakdown)
            if key != source or code == "B, C, D, E":
                continue
            for (region, y), v in values.items():
                if v is not None and region in regions:
                    sectors[code][(region, y)] = v
        available = sorted({y for vals in sectors.values() for (_, y) in vals if y <= year})
        if not available or year - available[-1] > 1:
            continue
        last = available[-1]
        window = list(range(last - n_years + 1, last + 1))
        sections = [c for c in sectors if SECTION.match(c)]
        totals = {r: sum(_window_sum(sectors[c], r, window) or 0 for c in sections) for r in regions}
        national_total = sum(totals.values())
        if not national_total:
            continue
        for code, vals in sectors.items():
            national = sum(_window_sum(vals, r, window) or 0 for r in regions)
            nat_share = national / national_total
            if not nat_share:
                continue
            years = [window[0] - 1] + window
            nat_growth = _avg_growth({y: sum(vals.get((r, y), 0) for r in regions) for y in years}, window)
            for r in regions:
                x = _window_sum(vals, r, window)
                if not x or not totals.get(r):
                    continue
                share = x / totals[r]
                lq = share / nat_share
                lqs[(source, code, r)] = lq
                if (source == INDUSTRY and code == "C") or share * 100 < params["sector_min_share"]:
                    continue
                growth = _avg_growth({y: vals.get((r, y)) for y in years}, window)
                rows[r].append({"source": source, "code": code, "lq": round(lq, 2), "share": round(share * 100, 1),
                                "growth": None if growth is None else round(growth, 1),
                                "national_growth": None if nat_growth is None else round(nat_growth, 1),
                                "year": last, "name": names.get((source, code)) or {"uz": code, "ru": code, "en": code}})
    order = {"leading": 0, "growing": 1, "invest": 2, "slowing": 3}
    result = {}
    for r, items in rows.items():
        labeled = []
        for row in items:
            label = _label(row, params, lqs.get((INDUSTRY, row["code"], r)))
            if label:
                labeled.append({**row, "label": label})
        labeled.sort(key=lambda row: (order[row["label"]], -row["lq"]))
        result[r] = labeled
    return result


def _avg_growth(by_year, window):
    rates = []
    for y in window:
        cur, prev = by_year.get(y), by_year.get(y - 1)
        if cur and prev and prev > 0 and cur > 0:
            rates.append((cur / prev - 1) * 100)
    return sum(rates) / len(rates) if rates else None


def _label(row, params, industry_lq):
    """5.2 jadvali. Investitsiyada faqat "investitsiya kelmoqda, natija hali yo'q" (sanoat bo'limlari B–E)."""
    lq, g, ng = row["lq"], row["growth"], row["national_growth"]
    if row["source"] == INVESTMENT:
        if row["code"] in ("B", "C", "D", "E") and lq >= params["lq_high"] and industry_lq is not None and industry_lq < 1:
            return "invest"
        return None
    if lq >= params["lq_high"]:
        return "leading" if g is not None and ng is not None and g >= ng else "slowing"
    if params["lq_low"] <= lq and g is not None and ng is not None and g >= ng + params["sector_growth_margin"]:
        return "growing"
    return None


def evaluate_rules(cfg, level, code, pct_raw, values, parent_pct, history, coverage_ok, sectors):
    """5.3: mos kelgan qoidalar kuchi bilan. -> [{"rule", "strength", "evidence": [...], "tentative", "sector"}]

    pct_raw: {ko'rsatkich: {kod: percentil}} (xom qiymat bo'yicha); values: {ko'rsatkich: {kod: {...}}};
    parent_pct/parent_values — tuman uchun viloyat qiymatlari (`parent: true` shartlar).
    history: {ko'rsatkich: {yil: qiymat}} — shu hudud qatori (negative_streak uchun).
    """
    params = cfg["params"]
    found = []
    for rule_code, rule in (cfg.get("rules") or {}).items():
        if level not in rule["levels"]:
            continue
        if rule.get("sector"):
            pick = next((s for s in sectors if s["label"] in ("leading", "growing")), None)
            if pick:
                if pick["label"] == "leading":
                    strength = min(1.0, (pick["lq"] - 1) / 1.5)
                else:
                    strength = min(1.0, ((pick["growth"] or 0) - (pick["national_growth"] or 0)) / 30)
                found.append({"rule": rule_code, "strength": round(max(strength, 0.05), 3), "evidence": [],
                              "tentative": not coverage_ok, "sector": pick})
            continue
        evidence, strengths_, ok = [], [], True
        for cond in rule["when"]:
            ind = cond["indicator"]
            if cond["op"] == "negative_streak":
                series = history.get(ind, {})
                years = sorted(series)
                need = int(cond.get("years", 2))
                tail = years[-need:]
                if len(tail) < need or tail[-1] - tail[0] != need - 1 or any(series[y] >= 0 for y in tail):
                    ok = False
                    break
                strengths_.append(min(1.0, sum(-series[y] for y in tail) / need / 5))
                evidence.append({"indicator": ind, "value": round(series[tail[-1]], 2), "year": tail[-1],
                                 "values": [round(series[y], 2) for y in tail], "pct": None})
                continue
            use_parent = cond.get("parent") and level == "district"
            if use_parent:
                pct = parent_pct.get(ind)
                value = parent_pct.get(f"{ind}__value")
            else:
                indicator_level = cfg["indicators"][ind]["level"]
                if level == "district" and indicator_level == "region":
                    ok = False
                    break
                pct = pct_raw.get(ind, {}).get(code)
                value = values.get(ind, {}).get(code)
            if pct is None or value is None:
                ok = False
                break
            threshold = cond["pct"]
            if cond["op"] == ">=":
                if pct < threshold:
                    ok = False
                    break
                strengths_.append((pct - threshold) / (100 - threshold) if threshold < 100 else 1.0)
            else:
                if pct > threshold:
                    ok = False
                    break
                strengths_.append((threshold - pct) / threshold if threshold > 0 else 1.0)
            evidence.append({"indicator": ind, "value": value["value"] if isinstance(value, dict) else value,
                             "year": value.get("year") if isinstance(value, dict) else None,
                             "pct": pct, "from_parent": bool(use_parent)})
        if ok and strengths_:
            strength = sum(strengths_) / len(strengths_)
            found.append({"rule": rule_code, "strength": round(max(strength, 0.05), 3), "evidence": evidence,
                          "tentative": not coverage_ok})
    found.sort(key=lambda r: -r["strength"])
    result, sector_used = [], False
    for item in found:
        if item.get("sector"):
            if sector_used:
                continue
            sector_used = True
        result.append(item)
        if len(result) >= int(params.get("max_recommendations", 3)):
            break
    return result


def peers(z_by_code, s_by_code, eligible, params):
    """5.4: eng yaqin hududlar va ular nimada oldinda (baho ≥ 10 ball yuqori bo'lgan ko'rsatkichlar)."""
    pool = {c: z for c, z in z_by_code.items() if c in eligible}
    near = engine.distances(pool, min_common=int(params["peers_min_common"]))
    k, ahead_points = int(params["peers"]), float(params["peer_ahead_points"])
    result = {}
    for code, row in near.items():
        items = []
        for other, distance in row[:k]:
            ahead = [ind for ind, s in s_by_code.get(other, {}).items()
                     if s_by_code.get(code, {}).get(ind) is not None and s >= s_by_code[code][ind] + ahead_points]
            items.append({"soato": other, "distance": distance, "ahead_in": ahead})
        result[code] = items
    return result
