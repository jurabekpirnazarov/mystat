"""FQ-02 hududiy profilini SIAT bilan to'ldirish (SIAT_KARTA_TAHLIL.md, 6-bo'lim va KR-09).

SIAT'da real ma'lumot bor ko'rsatkichlar uchun S-11 namunasi ishlatilmaydi: kartochka, dinamika va
tumanlar jadvali SIAT qiymatlari bilan almashtiriladi (birlik RegionIndicator'dagidek).
"""
from .models import SiatIndicator, SiatValue, Territory
from .normalize import REPUBLIC

# RegionIndicator kaliti -> (SIAT ID, ko'paytuvchi, birlik, respublika bilan solishtirish turi)
SIAT_MAP = {
    "population": (246, 1, "ming kishi", "regions_average"),
    "avg_salary": (500, 0.001, "ming so'm", "republic"),
    "unemployment_rate": (1875, 1, "%", "republic"),
    "grp_per_capita": (660, 0.001, "mln so'm", "republic"),
}
LABELS = {
    "population": "Doimiy aholi soni", "avg_salary": "O'rtacha oylik ish haqi",
    "unemployment_rate": "Ishsizlik darajasi", "grp_per_capita": "Aholi jon boshiga YaHM",
}
HIGHER_IS_BETTER = {"avg_salary": True, "unemployment_rate": False, "grp_per_capita": True, "population": None}


def _series(siat_id, code, factor):
    rows = SiatValue.objects.filter(indicator__siat_id=siat_id, territory_code=code, breakdown="", value__isnull=False,
                                    period__regex=r"^\d{4}$").order_by("period")
    return [(int(r.period), r.value * factor, r.is_preliminary) for r in rows]


def apply_siat(data, region_code, order):
    """build_region_profile natijasini joyida o'zgartiradi. `order` — kartochkalar tartibi (CARD_ORDER)."""
    indicators = {i.siat_id: i for i in SiatIndicator.objects.filter(siat_id__in=[v[0] for v in SIAT_MAP.values()])}
    if not indicators:
        return data
    cards = {c["key"]: c for c in data["cards"]}
    years = []
    for key, (siat_id, factor, unit, compare) in SIAT_MAP.items():
        series = _series(siat_id, region_code, factor)
        if not series:
            continue
        year, value, preliminary = series[-1]
        years.append(year)
        prev = next((v for y, v, _ in series if y == year - 1), None)
        if compare == "republic":
            base = next((v for y, v, _ in _series(siat_id, REPUBLIC, factor) if y == year), None)
        else:
            peers = SiatValue.objects.filter(indicator__siat_id=siat_id, breakdown="", period=str(year),
                                             territory_code__regex=r"^17\d{2}$", value__isnull=False) \
                .exclude(territory_code=REPUBLIC).values_list("value", flat=True)
            peers = [v * factor for v in peers]
            base = sum(peers) / len(peers) if peers else None
        diff = (value - base) / base * 100 if base else None
        better = HIGHER_IS_BETTER[key]
        indicator = indicators.get(siat_id)
        cards[key] = {
            "key": key, "label": LABELS[key], "unit": unit, "value": round(value, 1), "year": year,
            "change_pct": round((value - prev) / prev * 100, 1) if prev else None,
            "republic": round(base, 1) if base is not None else None,
            "vs_average_pct": round(diff, 1) if diff is not None else None,
            "assessment": None if better is None or diff is None else ("good" if (diff > 0) == better else "bad"),
            "source": "siat", "preliminary": preliminary,
            "source_url": indicator.siat_url if indicator else "",
        }
        data["dynamics"][key] = [{"year": y, "value": round(v, 1)} for y, v, _ in series]
    data["cards"] = sorted(cards.values(), key=lambda c: order.index(c["key"]) if c["key"] in order else 99)
    if years:
        data["siat_year"] = max(years)
    _districts(data, region_code)
    sources = {c.get("source") for c in data["cards"]}
    data["data_source"] = "real" if sources <= {"real", "siat"} else ("synthetic" if sources == {"synthetic"} else "mixed")
    return data


def _districts(data, region_code):
    from apps.common.models import District

    names = dict(Territory.objects.filter(parent_id=region_code).values_list("soato", "name_uz"))
    if not names:
        return
    ids = {f"{region_code}{d.code}": d.id for d in District.objects.filter(region__code=region_code)}
    table = {}
    for key in ("population", "avg_salary", "unemployment_rate"):
        siat_id, factor, _, _ = SIAT_MAP[key]
        last = SiatValue.objects.filter(indicator__siat_id=siat_id, territory_code__in=names, breakdown="",
                                        value__isnull=False, period__regex=r"^\d{4}$").order_by("-period") \
            .values_list("period", flat=True).first()
        if not last:
            continue
        for code, value in SiatValue.objects.filter(indicator__siat_id=siat_id, territory_code__in=names, breakdown="",
                                                    period=last, value__isnull=False).values_list("territory_code", "value"):
            row = table.setdefault(code, {"id": ids.get(code) or code, "soato": code, "name": names[code]})
            row[key] = round(value * factor, 1)
    if table:
        data["districts"] = sorted(table.values(), key=lambda d: -(d.get("population") or 0))
        data["districts_source"] = "siat"
