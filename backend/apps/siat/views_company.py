"""KORXONA_SCORING.md KR-37: `/regions` xaritasida korxonalar sifati qatlami.

`ind=company-score` — baholangan korxonalarning o'rtacha bali (0–100, 50 markazli); `ind=company-score-ab` — A va B
sinfidagi korxonalar ulushi (%). Viloyat yoki tuman bo'yicha agregat (alohida korxona emas); hududda
`min_group_region` dan kam baholangan korxona bo'lsa — "Ma'lumot yetarli emas". Rang shkalasi yillar bo'yicha bir xil
(KR-08): o'rtacha ball uchun 0–100, A–B ulushi uchun barcha yillar minimum/maksimumi.
"""
from collections import defaultdict

from django.conf import settings
from django.db.models import Avg, Count, Q

KEYS = ("company-score", "company-score-ab")
NAMES = {
    "company-score": {"uz": "Korxonalar o'rtacha bali", "ru": "Средний балл предприятий", "en": "Average company score"},
    "company-score-ab": {"uz": "A–B sinfidagi korxonalar ulushi", "ru": "Доля предприятий классов A–B",
                         "en": "Share of A–B class companies"},
}
NOTE = {"uz": "Korxonalar bali — taxminiy baho, rasmiy emas. Namuna muhitida sintetik ko'rsatkichlardan.",
        "ru": "Балл предприятий — оценочный, не официальный. В демо-среде — по синтетическим показателям.",
        "en": "Company scores are estimates, not official. Synthetic indicators in the demo environment."}


def is_company_key(key):
    return key in KEYS


def _lang(lang):
    return "uz" if lang in ("uz", "uzc") else lang if lang in ("ru", "en") else "uz"


def _base():
    from apps.analytics.company_scoring import config
    from apps.analytics.models import EnterpriseScore

    cfg = config.get()
    return cfg, EnterpriseScore.objects.filter(model_version=cfg["version"], preset=cfg["default_preset"])


def catalog(lang):
    """IndicatorsView uchun ikkita psevdo-ko'rsatkich ("Salohiyat" guruhida). Ball hisoblanmagan bo'lsa — bo'sh."""
    try:
        cfg, qs = _base()
        years = sorted(set(qs.values_list("year", flat=True)))
    except Exception:  # noqa: BLE001 — jadval hali yo'q bo'lsa katalog buzilmasin
        return []
    if not years:
        return []
    lg = _lang(lang)
    return [{
        "key": key, "siat_id": None, "kind": "company", "code": "", "name": NAMES[key][lg],
        "unit": "ball (0–100)" if key == "company-score" else "%", "theme": "potential", "geo_level": "district",
        "periodicity": "Y", "periods": [str(y) for y in years], "forecast_periods": [], "last_period": str(years[-1]),
        "preliminary_years": [], "higher_is_better": True, "diverging_center": 50.0 if key == "company-score" else None,
        "source_updated_at": None, "last_synced_at": None, "siat_url": "",
        "derived_from": f"Hisoblangan: korxonalar bali (KORXONA_SCORING.md, model v{cfg['version']}) — hudud agregati",
        "notes": NOTE[lg], "methodology": "", "breakdowns": [], "pillar": None,
    } for key in KEYS]


def _aggregate(qs, field):
    rows = qs.exclude(klass="").values(field).annotate(n=Count("id"), mean=Avg("overall"),
                                                       ab=Count("id", filter=Q(klass__in=["A", "B"])))
    return {r[field]: r for r in rows}


def values_payload(key, level, parent, period, lang):
    from .models import Territory

    cfg, qs = _base()
    years = sorted(set(qs.values_list("year", flat=True)))
    if not years:
        return None
    year = int(period) if period and period.isdigit() and int(period) in years else years[-1]
    field = "region_code" if level == "region" else "district_soato"
    minimum = cfg["params"]["min_group_region"]

    def value(row):
        if not row or row["n"] < minimum:
            return None
        return round(row["mean"], 1) if key == "company-score" else round(row["ab"] / row["n"] * 100, 1)

    agg = _aggregate(qs.filter(year=year), field)
    territories = Territory.objects.filter(level=level)
    if parent:
        territories = territories.filter(parent_id=parent) if level == "district" else territories.filter(soato=parent)
    lg = _lang(lang)
    items = []
    for t in territories:
        row = agg.get(t.soato)
        v = value(row)
        items.append({"code": t.soato, "name": t.name(lang), "kind": t.kind, "value": v, "missing": v is None,
                      "preliminary": False, "status": "ok" if v is not None else "insufficient",
                      "count": row["n"] if row else 0,
                      "note": None if v is not None else "Ma'lumot yetarli emas"})
    # Shkala yillar bo'yicha bir xil: o'rtacha ball — 0..100; A–B ulushi — barcha yillardagi qiymatlar oralig'i
    if key == "company-score":
        scale = {"min": 0, "max": 100, "quantiles": [20, 40, 60, 80], "current_quantiles": [20, 40, 60, 80],
                 "diverging_center": 50}
    else:
        all_values = []
        for y in years:
            all_values += [value(r) for r in _aggregate(qs.filter(year=y), field).values()]
        all_values = sorted(v for v in all_values if v is not None)
        lo, hi = (all_values[0], all_values[-1]) if all_values else (0, 100)
        qs4 = [round(lo + (hi - lo) * k / 5, 1) for k in range(1, 5)]
        scale = {"min": lo, "max": hi, "quantiles": qs4, "current_quantiles": qs4, "diverging_center": None}
    republic_row = qs.filter(year=year).exclude(klass="").aggregate(n=Count("id"), mean=Avg("overall"),
                                                                     ab=Count("id", filter=Q(klass__in=["A", "B"])))
    parent_obj = Territory.objects.filter(soato=parent).first() if parent else None
    parent_value = value(_aggregate(qs.filter(year=year, region_code=parent), "region_code").get(parent)) \
        if parent and level == "district" else None
    sources = set(qs.filter(year=year).values_list("data_source", flat=True).distinct())
    return {
        "indicator": key, "name": NAMES[key][lg], "unit": "ball (0–100)" if key == "company-score" else "%",
        "level": level, "breakdown": None, "period": str(year), "periods": [str(y) for y in years],
        "forecast_periods": [], "forecast": False, "preliminary": False,
        "parent": {"code": parent, "name": parent_obj.name(lang) if parent_obj else "", "value": parent_value} if parent else None,
        "republic": value(republic_row), "items": items, "scale": scale, "higher_is_better": True, "siat_url": "",
        "source": {"name": "my.stat.uz — korxonalar bali (KORXONA_SCORING.md)", "license": "", "url": ""},
        "disclaimer": NOTE[lg], "note": NOTE[lg],
        "is_synthetic": settings.DEBUG and "real" not in sources, "min_count": minimum,
    }
