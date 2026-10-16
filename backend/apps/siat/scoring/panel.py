"""Scoring uchun ma'lumot paneli: bazadagi SIAT qiymatlari -> `scoring.yaml` ko'rsatkichlari (KR-15, KR-17).

Panel bir marta yuklanadi va kesh versiyasi (sinxronlash) o'zgarguncha jarayon xotirasida turadi: maxsus vaznli
so'rov bazaga qayta murojaat qilmaydi. Qoidalar (SCORING_MODEL.md 3.4, 4-bo'lim):
- tanlangan yil `p` yoki ko'pi bilan 1 yil oldingi qiymat ("2024 ma'lumoti" — `lagged`);
- tuman tuzilgan yildan oldin hisoblanmaydi ("Hali tuzilmagan"), ota tuman qiymati bilan to'ldirilmaydi;
- aholi yiliga ±15% dan ko'p o'zgarsa (ma'muriy bo'linish) o'sish `missing`;
- yangi tuman tuzilgan yili shu viloyatda aholisi keskin kamaygan tuman (ota tuman) o'sishi ham `missing`;
- imputatsiya yo'q.
"""
import itertools
import re
import threading
from collections import defaultdict

from ..models import SiatValue, Territory
from ..normalize import REPUBLIC

SECTION = re.compile(r"^[A-Z]$")
_LOCK = threading.Lock()
_CACHE = {}
_TOKENS = itertools.count(1)


def _year(period):
    return int(period) if len(period) == 4 and period.isdigit() else None


class Panel:
    """series: {(manba kaliti, kesim): {(kod, yil): qiymat}}; prelim: {(manba, kesim): {(kod, yil)}}."""

    def __init__(self, series, prelim, territories, areas=None, forecast_years=None):
        self.series = series
        self.prelim = prelim
        self.territories = territories
        self.areas = areas or {}
        self.forecast_years = set(forecast_years or ())
        self._memo = {}
        self.token = next(_TOKENS)
        pop = self.series.get(("246", ""), {})
        first_year = min((y for _, y in pop), default=None)
        self.created = {}
        firsts = defaultdict(lambda: 9999)
        for (code, year), v in pop.items():
            if v is not None:
                firsts[code] = min(firsts[code], year)
        for code, year in firsts.items():
            if first_year is not None and year > first_year:
                self.created[code] = year

    # --- Ma'lumot ---------------------------------------------------------------------------------------------
    def codes(self, level, parent=None):
        return [c for c, t in self.territories.items() if t["level"] == level and (not parent or t["parent"] == parent)]

    def years(self):
        return sorted({y for s in self.series.values() for (_, y) in s})

    def raw(self, key, breakdown=""):
        if breakdown == "*":
            memo_key = ("sum", key)
            if memo_key not in self._memo:
                total = defaultdict(float)
                seen = set()
                for (k, b), values in self.series.items():
                    if k == key and SECTION.match(b or ""):
                        for cy, v in values.items():
                            if v is not None:
                                total[cy] += v
                                seen.add(cy)
                summed = {cy: total[cy] for cy in seen}
                summed.update(self.series.get((key, "*"), {}))   # prognoz yillari jami sifatida qo'shiladi
                self._memo[memo_key] = summed
            return self._memo[memo_key]
        return self.series.get((key, breakdown), {})

    def is_prelim(self, key, breakdown, code, year):
        if breakdown == "*":
            return any((code, year) in p for (k, _), p in self.prelim.items() if k == key)
        return (code, year) in self.prelim.get((key, breakdown), set())

    def source_series(self, spec):
        """Yaml `source` -> {(kod, yil): qiymat} (offset, per_capita, growth, avg_years qo'llangan)."""
        memo_key = ("src", tuple(sorted((k, str(v)) for k, v in spec.items())))
        if memo_key in self._memo:
            return self._memo[memo_key]
        key, breakdown = str(spec["key"]), spec.get("breakdown", "")
        base = dict(self.raw(key, breakdown))
        if key == "d-pop-growth":
            base = self._clean_pop_growth(base)
        if spec.get("offset"):
            base = {cy: v + spec["offset"] for cy, v in base.items()}
        if spec.get("per_capita"):
            pop = self.raw("246")
            scale = spec.get("scale", 1)
            base = {cy: v / pop[cy] * scale for cy, v in base.items() if pop.get(cy)}
        if spec.get("growth"):
            base = {(c, y): (v / base[(c, y - 1)] - 1) * 100 for (c, y), v in base.items()
                    if base.get((c, y - 1)) and base[(c, y - 1)] > 0}
        n = spec.get("avg_years", 1)
        short = set()
        if n > 1:
            by_code = defaultdict(dict)
            for (c, y), v in base.items():
                by_code[c][y] = v
            averaged = {}
            for c, ys in by_code.items():
                for y in ys:
                    window = [ys[t] for t in range(y - n + 1, y + 1) if t in ys]
                    averaged[(c, y)] = sum(window) / len(window)
                    if len(window) < n:
                        short.add((c, y))
            base = averaged
        self._memo[memo_key] = (base, short)
        return base, short

    def _clean_pop_growth(self, growth):
        limit = self.structural_break
        cleaned = {cy: v for cy, v in growth.items() if abs(v) <= limit}
        # Ota tuman: yangi tuman tuzilgan yili shu viloyatda aholisi 5% dan ko'p kamaygan tuman
        for code, year in self.created.items():
            parent = self.territories.get(code, {}).get("parent")
            for other, t in self.territories.items():
                if t.get("parent") == parent and other != code and cleaned.get((other, year), 0) < -5:
                    cleaned.pop((other, year), None)
        return cleaned

    structural_break = 15.0

    def values(self, spec, codes, year, max_lag=1):
        """-> {kod: {"value", "year", "lagged", "preliminary", "short", "forecast"}} (faqat qiymati borlar)."""
        series, short = self.source_series(spec)
        key, breakdown = str(spec["key"]), spec.get("breakdown", "")
        result = {}
        for code in codes:
            for lag in range(0, max_lag + 1):
                v = series.get((code, year - lag))
                if v is None:
                    continue
                y = year - lag
                result[code] = {"value": v, "year": y, "lagged": lag > 0,
                                "preliminary": self.is_prelim(key, breakdown, code, y),
                                "short": (code, y) in short, "forecast": y in self.forecast_years}
                break
        return result

    def not_created(self, code, year):
        created = self.created.get(code)
        return created is not None and year < created

    def with_forecast(self, extra, prelim_years=()):
        """Prognoz qiymatlari qo'shilgan yangi panel (10.6). extra: {(manba, kesim): {(kod, yil): qiymat}}.

        Aholidan hisoblanadigan hosilalar (o'sish, zichlik, qishloq ulushi) prognoz yillari uchun qayta quriladi.
        """
        series = {k: dict(v) for k, v in self.series.items()}
        for k, values in extra.items():
            series.setdefault(k, {}).update(values)
        years = {y for values in extra.values() for (_, y) in values}
        pop, rural = series.get(("246", ""), {}), series.get(("247", ""), {})
        growth = series.setdefault(("d-pop-growth", ""), {})
        density = series.setdefault(("d-density", ""), {})
        share = series.setdefault(("d-rural-share", ""), {})
        for (code, year), v in list(pop.items()):
            if year not in years or v is None:
                continue
            prev = pop.get((code, year - 1))
            if prev:
                growth[(code, year)] = (v / prev - 1) * 100
            if self.areas.get(code):
                density[(code, year)] = v * 1000 / self.areas[code]
            if rural.get((code, year)) is not None and v:
                share[(code, year)] = rural[(code, year)] / v * 100
        panel = Panel(series, self.prelim, self.territories, self.areas, self.forecast_years | years)
        panel.structural_break = self.structural_break
        return panel


def build_panel(keys):
    """Bazadan panel. keys — kerakli SiatIndicator kalitlari (yaml manbalari + aholi)."""
    series, prelim = defaultdict(dict), defaultdict(set)
    rows = (SiatValue.objects.filter(indicator__key__in=keys, value__isnull=False)
            .values_list("indicator__key", "breakdown", "territory_code", "period", "value", "is_preliminary"))
    for key, breakdown, code, period, value, is_prelim in rows.iterator(chunk_size=5000):
        year = _year(period)
        if year is None:
            continue
        series[(key, breakdown)][(code, year)] = value
        if is_prelim:
            prelim[(key, breakdown)].add((code, year))
    territories = {}
    for t in Territory.objects.all():
        territories[t.soato] = {"level": t.level, "kind": t.kind, "parent": t.parent_id,
                                "names": {"uz": t.name_uz, "ru": t.name_ru or t.name_uz, "en": t.name_en or t.name_uz,
                                          "uzc": t.name_uzc or t.name_uz}}
    areas = dict(Territory.objects.filter(area_km2__isnull=False).exclude(kind="city")
                 .values_list("soato", "area_km2"))
    return Panel(dict(series), dict(prelim), territories, areas)


def source_keys(cfg):
    keys = {str(ind["source"]["key"]) for ind in cfg["indicators"].values()}
    return sorted(keys | {"246", "247"})


def get_panel(cfg):
    """Jarayon xotirasidagi panel; sinxronlashdan keyin (kesh versiyasi o'zgarsa) qayta yuklanadi."""
    from ..sync import cache_version

    version = cache_version()
    key = (version, tuple(source_keys(cfg)))
    with _LOCK:
        panel = _CACHE.get(key)
        if panel is None:
            _CACHE.clear()
            panel = build_panel(source_keys(cfg))
            panel.structural_break = float(cfg["params"].get("structural_break_pct", 15))
            _CACHE[key] = panel
    return panel


def republic_code():
    return REPUBLIC
