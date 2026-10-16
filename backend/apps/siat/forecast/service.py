"""Prognozni o'qish (API va karta uchun): qiymat, 80% oraliq, ssenariylar, asosiy omillar va usul (oddiy tildagi nom,
o'tgan yillardagi o'rtacha xato — `quality.py`). Ichki usul kodlari (M0..M4) javobga kirmaydi.
"""
from collections import defaultdict

from ..models import ForecastValue, ForecastVersion
from . import spec
from .dataset import FEATURES
from .quality import card_model

# Karta ko'rsatkichi kaliti -> prognoz ko'rsatkichi (hosilalar aholidan hisoblanadi)
MAP_KEYS = {"246": "246", "247": "247", "500": "500", "1875": "1875", "660": "660", "1299": "1299", "658": "658",
            "1409": "1409", "d-density": "246", "d-pop-growth": "246", "d-rural-share": "247"}


def current_version():
    return ForecastVersion.objects.filter(is_current=True).values_list("version", flat=True).first()


def forecast_periods(version=None):
    """{karta kaliti: [davrlar]} — asosiy ssenariy bo'yicha."""
    version = version or current_version()
    if not version:
        return {}
    by_ind = defaultdict(set)
    for ind, period in (ForecastValue.objects.filter(version=version, scenario="base")
                        .values_list("indicator", "period").distinct()):
        by_ind[ind].add(period)
    out = {}
    for map_key, ind in MAP_KEYS.items():
        periods = set(by_ind.get(ind, ()))
        if map_key == "d-rural-share":
            periods &= by_ind.get("246", set())
        if periods:
            out[map_key] = sorted(periods)
    return out


def _rows(indicator, codes=None, period=None, scenario="base", version=None):
    qs = ForecastValue.objects.filter(version=version or current_version(), indicator=indicator, scenario=scenario)
    if codes is not None:
        qs = qs.filter(soato__in=list(codes))
    if period:
        qs = qs.filter(period=period)
    return qs


def values_for(map_key, codes, period, actual, scenario="base"):
    """Karta uchun: {kod: {"value", "lo80", "hi80"}}. actual: {(kod, yil): qiymat} — hosilalar uchun asos (246/247/maydon).
    Ijobiy/salbiy ssenariyda oraliq yo'q (lo80/hi80 — None)."""
    ind = MAP_KEYS.get(map_key)
    if not ind:
        return {}
    rows = {r.soato: r for r in _rows(ind, codes, period, scenario)}
    if map_key in ("246", "247", "500", "1875", "660", "1299", "658", "1409"):
        return {c: {"value": r.value, "lo80": r.lo80, "hi80": r.hi80} for c, r in rows.items()}
    year = int(period)
    if map_key == "d-density":
        areas = actual.get("areas", {})
        return {c: {"value": r.value * 1000 / areas[c], "lo80": r.lo80 * 1000 / areas[c] if r.lo80 else None,
                    "hi80": r.hi80 * 1000 / areas[c] if r.hi80 else None}
                for c, r in rows.items() if areas.get(c)}
    if map_key == "d-pop-growth":
        prev_rows = {r.soato: r.value for r in _rows("246", codes, str(year - 1), scenario)}
        out = {}
        for c, r in rows.items():
            prev = prev_rows.get(c) or actual.get("246", {}).get((c, year - 1))
            if prev:
                out[c] = {"value": (r.value / prev - 1) * 100,
                          "lo80": (r.lo80 / prev - 1) * 100 if r.lo80 else None,
                          "hi80": (r.hi80 / prev - 1) * 100 if r.hi80 else None}
        return out
    if map_key == "d-rural-share":
        pop = {r.soato: r.value for r in _rows("246", codes, period, scenario)}
        return {c: {"value": r.value / pop[c] * 100, "lo80": None, "hi80": None} for c, r in rows.items() if pop.get(c)}
    return {}


def growth(value, last, years, kind):
    """Yillik kutilayotgan o'sish: hajmda CAGR %, foizda yiliga p.p."""
    if value is None or last is None or years <= 0:
        return None
    if kind == "rate":
        return (value - last) / years
    if last <= 0 or value <= 0:
        return None
    return ((value / last) ** (1 / years) - 1) * 100


def territory_forecast(map_key, code, last_period, last_value, lang="uz"):
    """Kartochka: prognoz qatori, ssenariy lentalari, kutilayotgan o'sish va asosiy omillar."""
    ind = MAP_KEYS.get(map_key)
    version = current_version()
    if not ind or not version or map_key in ("d-density", "d-pop-growth", "d-rural-share"):
        return None
    rows = list(ForecastValue.objects.filter(version=version, indicator=ind, soato=code).order_by("period"))
    base = [r for r in rows if r.scenario == "base"]
    if not base:
        return None
    kind = spec.INDICATORS[ind]["kind"]
    last_year = int(last_period)
    end = base[-1]
    years = int(end.period) - last_year
    g = growth(end.value, last_value, years, kind)
    lo = growth(end.lo80, last_value, years, kind)
    hi = growth(end.hi80, last_value, years, kind)
    national = None
    nat_rows = list(ForecastValue.objects.filter(version=version, indicator=ind, soato="1700", scenario="base",
                                                 period=end.period))
    if nat_rows:
        from ..models import SiatValue

        source_key, breakdown = spec.INDICATORS[ind]["source"]
        nat_last = SiatValue.objects.filter(indicator__key=source_key, breakdown=breakdown, territory_code="1700",
                                            period=str(last_year)).values_list("value", flat=True).first()
        national = growth(nat_rows[0].value, nat_last, years, kind)
    drivers = []
    first = base[0]
    for d in first.drivers or []:
        label = FEATURES.get(d["feature"])
        if label:
            name = label.get(lang) or label["uz"] if lang != "uzc" else label["uz"]
            drivers.append({"feature": d["feature"], "name": name, "effect": "up" if d["contribution"] > 0 else "down"})
    return {
        "forecast": [{"period": r.period, "value": r.value, "lo80": r.lo80, "hi80": r.hi80} for r in base],
        "scenarios": {s: [{"period": r.period, "value": r.value} for r in rows if r.scenario == s]
                      for s in ("optimistic", "pessimistic")},
        "growth": {"from": str(last_year), "to": end.period, "per_year": _r(g), "lo": _r(min(lo, hi) if lo is not None and hi is not None else lo),
                   "hi": _r(max(lo, hi) if lo is not None and hi is not None else hi), "national": _r(national),
                   "unit": "p.p." if kind == "rate" else "%",
                   "direction_uncertain": bool(end.lo80 is not None and end.hi80 is not None and last_value is not None
                                               and end.lo80 < last_value < end.hi80)},
        "drivers": drivers, "basis": "factors" if drivers else "trend",
        "model": card_model(base, lang),
    }


def _r(v):
    return None if v is None else round(v, 2)


def score_extra(version=None):
    """Scoring paneliga qo'shiladigan prognoz qiymatlari: {(manba, kesim): {(kod, yil): qiymat}}."""
    version = version or current_version()
    if not version:
        return {}
    extra = defaultdict(dict)
    for ind, code, period, value in (ForecastValue.objects.filter(version=version, scenario="base")
                                     .values_list("indicator", "soato", "period", "value")):
        source = spec.INDICATORS.get(ind, {}).get("source")
        if source:
            extra[source][(code, int(period))] = value
    return dict(extra)


def score_intervals(version=None):
    """Monte Carlo uchun: {(manba, kesim): {(kod, yil): (qiymat, lo80, hi80, tur)}}."""
    version = version or current_version()
    out = defaultdict(dict)
    for ind, code, period, value, lo, hi in (ForecastValue.objects.filter(version=version, scenario="base")
                                             .values_list("indicator", "soato", "period", "value", "lo80", "hi80")):
        info = spec.INDICATORS.get(ind)
        if info:
            out[info["source"]][(code, int(period))] = (value, lo, hi, info["kind"])
    return dict(out)
