"""KR-16, KR-22: standart presetlar bo'yicha indeksni TerritoryScore'ga yozish va tekshiruv hisoboti."""
import math
from collections import defaultdict

from django.db import transaction

from . import engine
from .config import PILLARS, load, weights_for
from .service import cached, forecast_panel, forecast_rank_range, get_panel, periods


def _compact(item):
    """TerritoryScore.details — tilsiz, ixcham (nomlarsiz) tafsilotlar."""
    return {
        "indicators": {k: {f: d.get(f) for f in ("value", "year", "lagged", "preliminary", "s", "pct", "rank")}
                       for k, d in item.get("indicators", {}).items()},
        "strengths": item.get("strengths", []), "weaknesses": item.get("weaknesses", []),
        "recommendations": [{"rule": r["rule"], "strength": r["strength"], "tentative": r["tentative"]}
                            for r in item.get("recommendations", [])],
        "peers": [p["soato"] for p in item.get("peers", [])],
        "sectors": [{"code": s["code"], "label": s["label"], "lq": s["lq"]} for s in item.get("sectors", [])],
        "gaps": item.get("gaps", []),
    }


def compute_all(levels=("region", "district"), with_forecast=True, mc_samples=100):
    """Barcha yillar × standart presetlar × darajalar. -> yozilgan qatorlar soni."""
    from ..models import TerritoryScore

    cfg = load()
    version = cfg["version"]
    rows = []
    for level in levels:
        actual, future = periods(cfg, level)
        years = [(y, False) for y in actual] + ([(y, True) for y in future] if with_forecast else [])
        for year, is_forecast in years:
            panel = forecast_panel(cfg) if is_forecast else get_panel(cfg)
            for preset in cfg["presets"]:
                weights = weights_for(cfg, level, preset)
                result = cached(cfg, level, year, weights, panel)
                mc = forecast_rank_range(level, year, weights, cfg, samples=mc_samples) if is_forecast and preset == "balanced" else {}
                for code, item in result["items"].items():
                    rr = mc.get(code) or item.get("rank_range") or [None, None]
                    rip = item.get("rank_in_parent") or [None]
                    rows.append(TerritoryScore(
                        soato=code, level=level, period=str(year), preset=preset, is_forecast=is_forecast,
                        score=item.get("score"), rank=item.get("rank"), rank_low=rr[0], rank_high=rr[1],
                        rank_in_parent=rip[0], pillars=item.get("pillars") or {},
                        details=_compact(item) if item["status"] != "not_created" else {},
                        coverage=item.get("coverage") or 0, status=item["status"], methodology_version=version))
    with transaction.atomic():
        TerritoryScore.objects.filter(methodology_version=version, level__in=levels).delete()
        TerritoryScore.objects.bulk_create(rows, batch_size=1000)
    return len(rows)


def stored_rank_range(level, year, preset, codes=None):
    """Prognoz yili uchun oldindan hisoblangan (Monte Carlo) o'rin oralig'i."""
    from ..models import TerritoryScore

    qs = TerritoryScore.objects.filter(level=level, period=str(year), preset=preset, methodology_version=load()["version"],
                                       rank_low__isnull=False)
    if codes:
        qs = qs.filter(soato__in=codes)
    return {s: (lo, hi) for s, lo, hi in qs.values_list("soato", "rank_low", "rank_high")}


def _pearson(xs, ys):
    n = len(xs)
    if n < 3:
        return None
    mx, my = sum(xs) / n, sum(ys) / n
    sxy = sum((x - mx) * (y - my) for x, y in zip(xs, ys))
    sxx = sum((x - mx) ** 2 for x in xs)
    syy = sum((y - my) ** 2 for y in ys)
    return sxy / math.sqrt(sxx * syy) if sxx and syy else None


def _spearman(xs, ys):
    rx = engine.percentiles(dict(enumerate(xs)))
    ry = engine.percentiles(dict(enumerate(ys)))
    keys = sorted(rx)
    return _pearson([rx[k] for k in keys], [ry[k] for k in keys])


def report():
    """KR-22: ustunlar korrelyatsiyasi, reyting barqarorligi, orqaga sinov (2019 indeksi vs 2020–2024 YaHM o'sishi)."""
    from ..models import ScoringReport

    cfg = load()
    panel = get_panel(cfg)
    out = {"version": cfg["version"], "levels": {}}
    for level in ("region", "district"):
        actual, _ = periods(cfg, level)
        if not actual:
            continue
        year = actual[-1]
        result = cached(cfg, level, year, weights_for(cfg, level), panel)
        items = [i for i in result["items"].values() if not i["missing"]]
        corr, warnings = {}, []
        keys = [p for p in PILLARS if any((i.get("pillars") or {}).get(p) is not None for i in items)]
        for a_i, a in enumerate(keys):
            for b in keys[a_i + 1:]:
                pairs = [(i["pillars"][a], i["pillars"][b]) for i in items
                         if i["pillars"].get(a) is not None and i["pillars"].get(b) is not None]
                r = _pearson([p[0] for p in pairs], [p[1] for p in pairs])
                if r is not None:
                    corr[f"{a}-{b}"] = round(r, 3)
                    if abs(r) > 0.9:
                        warnings.append(f"{a} va {b} ustunlari deyarli bir narsani o'lchayapti (r = {r:.2f})")
        unstable = sorted([{"soato": i["soato"], "rank": i["rank"], "range": i["rank_range"]} for i in items
                           if i.get("rank_range") and i["rank_range"][1] - i["rank_range"][0] >= cfg["params"]["rank_unstable"]],
                          key=lambda x: x["rank"])
        out["levels"][level] = {"year": year, "pillar_correlation": corr, "warnings": warnings,
                                "unstable_ranks": unstable, "eligible": result["of"]}
    # Orqaga sinov: 2019 indeksi va 2020–2024 o'rtacha YaHM o'sishi (Spearman) — faqat ma'lumot uchun
    growth_series, _ = panel.source_series({"key": "658", "offset": -100})
    by_code = defaultdict(list)
    for (code, y), v in growth_series.items():
        if 2020 <= y <= 2024:
            by_code[code].append(v)
    res2019 = cached(cfg, "region", 2019, weights_for(cfg, "region"), panel)
    pairs = [(i["score"], sum(by_code[c]) / len(by_code[c])) for c, i in res2019["items"].items()
             if i.get("score") is not None and by_code.get(c)]
    rho = _spearman([p[0] for p in pairs], [p[1] for p in pairs]) if len(pairs) >= 5 else None
    out["backtest"] = {"index_year": 2019, "target": "YaHM o'sishi 2020–2024 (o'rtacha)", "n": len(pairs),
                       "spearman": None if rho is None else round(rho, 3)}
    ScoringReport.objects.create(methodology_version=cfg["version"], report=out)
    return out
