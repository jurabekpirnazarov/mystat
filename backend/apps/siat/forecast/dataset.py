"""KR-23: prognoz ma'lumot to'plami — hudud × yil paneli va panel modeli featurelari (SCORING_MODEL.md 10.3).

Oqishni oldini olish: origin `t` qatoridagi featurelar faqat `t` yilgacha ma'lum bo'lgan qiymatlardan; boshqa
ko'rsatkichlar, viloyat konteksti, respublika va inflyatsiya — 1 yil lag bilan. Hudud kodi feature emas.
"""
import math
from collections import defaultdict

from ..scoring.panel import build_panel
from . import spec
from .methods import to_f

REPUBLIC = "1700"

FEATURES = {
    "own_d1": {"uz": "So'nggi yildagi o'sish", "ru": "Рост за последний год", "en": "Growth in the latest year"},
    "own_d2": {"uz": "Bir yil oldingi o'sish", "ru": "Рост годом ранее", "en": "Growth a year earlier"},
    "own_d3": {"uz": "Ikki yil oldingi o'sish", "ru": "Рост двумя годами ранее", "en": "Growth two years earlier"},
    "own_avg3": {"uz": "3 yillik o'rtacha o'sish", "ru": "Средний рост за 3 года", "en": "3-year average growth"},
    "own_vol3": {"uz": "O'sishning tebranishi", "ru": "Колебания роста", "en": "Growth volatility"},
    "own_level": {"uz": "Ko'rsatkichning hozirgi darajasi", "ru": "Текущий уровень показателя", "en": "Current level"},
    "pop_growth": {"uz": "Aholi o'sishi", "ru": "Прирост населения", "en": "Population growth"},
    "unemployment": {"uz": "Ishsizlik darajasi", "ru": "Уровень безработицы", "en": "Unemployment rate"},
    "unemployment_chg": {"uz": "Ishsizlikning o'zgarishi", "ru": "Изменение безработицы", "en": "Change in unemployment"},
    "log_wage": {"uz": "Ish haqi darajasi", "ru": "Уровень зарплаты", "en": "Wage level"},
    "real_wage": {"uz": "Real ish haqi o'sishi", "ru": "Рост реальной зарплаты", "en": "Real wage growth"},
    "rural_share": {"uz": "Qishloq aholisi ulushi", "ru": "Доля сельского населения", "en": "Rural share"},
    "log_density": {"uz": "Aholi zichligi", "ru": "Плотность населения", "en": "Population density"},
    "gender_ratio": {"uz": "Gender nisbati", "ru": "Гендерное соотношение", "en": "Gender ratio"},
    "rel_national": {"uz": "Respublika darajasiga nisbati", "ru": "Отношение к уровню республики", "en": "Ratio to national level"},
    "pct_region": {"uz": "Viloyat ichidagi o'rni", "ru": "Позиция внутри области", "en": "Position within the region"},
    "reg_gdp_growth": {"uz": "Viloyat YaHM o'sishi", "ru": "Рост ВРП области", "en": "Regional GRP growth"},
    "reg_inv_growth": {"uz": "Viloyatda investitsiya o'sishi", "ru": "Рост инвестиций в области", "en": "Regional investment growth"},
    "reg_ind_pc": {"uz": "Viloyatda jon boshiga sanoat", "ru": "Промышленность на душу в области", "en": "Regional industry per capita"},
    "pillar_B": {"uz": "Mehnat bozori bahosi", "ru": "Оценка рынка труда", "en": "Labour market score"},
    "pillar_C": {"uz": "Demografik salohiyat bahosi", "ru": "Оценка демографии", "en": "Demographic score"},
    "reg_pillar_A": {"uz": "Viloyat iqtisodiy quvvati", "ru": "Экономика области", "en": "Regional economic strength"},
    "reg_pillar_D": {"uz": "Viloyat sanoat va investitsiyasi", "ru": "Промышленность и инвестиции области", "en": "Regional industry and investment"},
    "reg_pillar_E": {"uz": "Viloyat ijtimoiy infratuzilmasi", "ru": "Социальная инфраструктура области", "en": "Regional social infrastructure"},
    "nat_growth": {"uz": "Respublika bo'yicha o'sish", "ru": "Рост по республике", "en": "National growth"},
    "cpi": {"uz": "Inflyatsiya", "ru": "Инфляция", "en": "Inflation"},
    "covid": {"uz": "2020 yil (pandemiya)", "ru": "2020 год (пандемия)", "en": "2020 (pandemic)"},
    "is_city": {"uz": "Shahar", "ru": "Город", "en": "City"},
    "years_since_created": {"uz": "Tuman tuzilganidan beri yillar", "ru": "Лет с образования района", "en": "Years since established"},
    "post_split": {"uz": "Ma'muriy o'zgarish", "ru": "Административное изменение", "en": "Administrative change"},
    "horizon": {"uz": "Prognoz ufqi", "ru": "Горизонт прогноза", "en": "Forecast horizon"},
}
FEATURE_NAMES = list(FEATURES)

SOURCE_KEYS = sorted({s[0] for s in (i["source"] for i in spec.INDICATORS.values())}
                     | {"246", "247", "245", "500", "1875", "658", "d-real-wage", "d-rural-share", "d-density",
                        "d-gender-ratio", "d-pop-growth", "industry-by-activity", "investment-by-activity"})


class Dataset:
    """Panel ustidagi yordamchi: ko'rsatkich seriyalari (f-fazoda), hududlar, featurelar."""

    def __init__(self, panel, pillars=None, cpi=None):
        self.panel = panel
        self.pillars = pillars or {}   # {(daraja, yil): {kod: {ustun: baho}}}
        self.cpi = cpi or {}           # {yil: inflyatsiya %}
        self._series = {}
        self._features = {}

    @classmethod
    def from_db(cls, with_pillars=True):
        from ..sync import _annual_cpi

        panel = build_panel(SOURCE_KEYS)
        pillars = {}
        if with_pillars:
            from ..scoring import config as score_config
            from ..scoring import service as score_service
            from ..scoring.panel import get_panel

            cfg = score_config.load()
            score_panel = get_panel(cfg)
            for level in ("region", "district"):
                weights = score_config.weights_for(cfg, level)
                for year in score_panel.years():
                    result = score_service.cached(cfg, level, year, weights, score_panel)
                    pillars[(level, year)] = {c: i.get("pillars") or {} for c, i in result["items"].items()}
        cpi = {y: (k - 1) * 100 for y, k in _annual_cpi().items()}
        return cls(panel, pillars, cpi)

    def codes(self, level):
        return self.panel.codes(level)

    def raw(self, key):
        source_key, breakdown = spec.INDICATORS[key]["source"]
        return self.panel.raw(source_key, breakdown)

    def series(self, key):
        """{kod: {yil: f}} — barcha hududlar (respublika ham)."""
        if key not in self._series:
            kind = spec.INDICATORS[key]["kind"]
            out = defaultdict(dict)
            for (code, year), v in self.raw(key).items():
                f = to_f(v, kind)
                if f is not None:
                    out[code][year] = f
            self._series[key] = dict(out)
        return self._series[key]

    def break_year(self, key, code):
        """Metodologik uzilish yili (spec `break_jump`): oxirgi yil, unda f[y] − f[y−1] chegaradan katta. Yo'q — None."""
        jump = spec.INDICATORS[key].get("break_jump")
        if not jump:
            return None
        own = self.series(key).get(code, {})
        found = None
        for y in sorted(own):
            if own.get(y - 1) is not None and abs(own[y] - own[y - 1]) > jump:
                found = y
        return found

    def cut(self, key, code, origin):
        """`code` seriyasi `origin` yilida prognoz qiluvchiga ko'rinadigan qismi: uzilishdan oldingi yillarsiz."""
        own = self.series(key).get(code, {})
        b = self.break_year(key, code)
        if b is not None and b <= origin:
            return {y: f for y, f in own.items() if b <= y <= origin}
        return {y: f for y, f in own.items() if y <= origin}

    def spans_break(self, key, code, origin, h):
        b = self.break_year(key, code)
        return b is not None and origin < b <= origin + h

    def data_until(self, key, level):
        """Hududlarning ko'pchiligida ma'lumot bor oxirgi yil."""
        codes = set(self.codes(level))
        counts = defaultdict(int)
        for code, ys in self.series(key).items():
            if code in codes:
                for y in ys:
                    counts[y] += 1
        if not counts:
            return None
        need = max(1, len(codes) // 2)
        years = [y for y, n in counts.items() if n >= need]
        return max(years) if years else None

    # --- Featurelar -------------------------------------------------------------------------------------------
    def _value(self, key, code, year):
        return self.panel.raw(key).get((code, year))

    def features(self, key, code, origin, h):
        """Bitta qator: {feature: qiymat|nan} (memo: backtest bir qatorni ko'p marta so'raydi)."""
        memo = (key, code, origin, h)
        if memo not in self._features:
            self._features[memo] = self._build_features(key, code, origin, h)
        return self._features[memo]

    def _build_features(self, key, code, origin, h):
        nan = float("nan")
        own = self.series(key).get(code, {})
        f_t = own.get(origin)
        diffs = []
        for lag in range(3):
            a, b = own.get(origin - lag), own.get(origin - lag - 1)
            diffs.append(a - b if a is not None and b is not None else nan)
        valid = [d for d in diffs if not math.isnan(d)]
        row = {
            "own_d1": diffs[0], "own_d2": diffs[1], "own_d3": diffs[2],
            "own_avg3": sum(valid) / len(valid) if valid else nan,
            "own_vol3": float(_std(valid)) if len(valid) >= 2 else nan,
            "own_level": f_t if f_t is not None else nan,
        }
        prev = origin - 1
        pop, pop_prev = self._value("246", code, prev), self._value("246", code, prev - 1)
        row["pop_growth"] = (pop / pop_prev - 1) * 100 if pop and pop_prev else nan
        unemp, unemp_prev = self._value("1875", code, prev), self._value("1875", code, prev - 1)
        row["unemployment"] = unemp if unemp is not None else nan
        row["unemployment_chg"] = unemp - unemp_prev if unemp is not None and unemp_prev is not None else nan
        wage = self._value("500", code, prev)
        row["log_wage"] = math.log(wage) if wage else nan
        rw = self._value("d-real-wage", code, prev)
        row["real_wage"] = rw if rw is not None else nan
        rural = self._value("d-rural-share", code, prev)
        row["rural_share"] = rural if rural is not None else nan
        dens = self._value("d-density", code, prev)
        row["log_density"] = math.log(dens) if dens else nan
        gender = self._value("d-gender-ratio", code, prev)
        row["gender_ratio"] = gender if gender is not None else nan

        nat = self.series(key).get(REPUBLIC, {})
        row["rel_national"] = f_t - nat[origin] if f_t is not None and nat.get(origin) is not None else nan
        territory = self.panel.territories.get(code, {})
        parent = territory.get("parent")
        siblings = [c for c, t in self.panel.territories.items() if t.get("parent") == parent and t["level"] == territory.get("level")]
        values = [self.series(key).get(c, {}).get(origin) for c in siblings]
        values = [v for v in values if v is not None]
        row["pct_region"] = (sum(1 for v in values if v < f_t) / (len(values) - 1) * 100
                             if f_t is not None and len(values) > 1 else nan)

        region = parent if territory.get("level") == "district" else code
        gdp = self._value("658", region, prev)
        row["reg_gdp_growth"] = gdp - 100 if gdp is not None else nan
        inv = self.panel.raw("investment-by-activity", "*")
        inv_t, inv_p = inv.get((region, prev)), inv.get((region, prev - 1))
        row["reg_inv_growth"] = (inv_t / inv_p - 1) * 100 if inv_t and inv_p else nan
        ind = self.panel.raw("industry-by-activity", "B, C, D, E").get((region, prev))
        rpop = self._value("246", region, prev)
        row["reg_ind_pc"] = math.log(ind / rpop) if ind and rpop else nan
        own_p = self.pillars.get((territory.get("level"), prev), {}).get(code, {})
        reg_p = self.pillars.get(("region", prev), {}).get(region, {})
        for p in ("B", "C"):
            v = own_p.get(p)
            row[f"pillar_{p}"] = v if v is not None else nan
        for p in ("A", "D", "E"):
            v = reg_p.get(p)
            row[f"reg_pillar_{p}"] = v if v is not None else nan
        a, b = nat.get(prev), nat.get(prev - 1)
        row["nat_growth"] = a - b if a is not None and b is not None else nan
        row["cpi"] = self.cpi.get(prev, nan)
        row["covid"] = 1.0 if origin < spec.COVID_YEAR <= origin + h else 0.0
        row["is_city"] = 1.0 if territory.get("kind") == "city" else 0.0
        created = self.panel.created.get(code)
        row["years_since_created"] = float(min(10, origin - created)) if created else 10.0
        pop_t, pop_tp = self._value("246", code, origin), self._value("246", code, origin - 1)
        jump = abs(pop_t / pop_tp - 1) * 100 if pop_t and pop_tp else 0
        row["post_split"] = 1.0 if jump > 15 or (created and origin - created <= 1) else 0.0
        row["horizon"] = float(h)
        return row

    def target(self, key, code, origin, h):
        own = self.series(key).get(code, {})
        a, b = own.get(origin + h), own.get(origin)
        return a - b if a is not None and b is not None else None

    def rows(self, key, level, origins, h, with_target=True):
        """-> (X ro'yxati, y ro'yxati, [(kod, origin)])."""
        X, y, index = [], [], []
        for code in self.codes(level):
            if code not in self.series(key):
                continue
            for origin in origins:
                if self.panel.not_created(code, origin):
                    continue
                if self.series(key)[code].get(origin) is None:
                    continue
                target = self.target(key, code, origin, h) if with_target else None
                if with_target and target is None:
                    continue
                feats = self.features(key, code, origin, h)
                X.append([feats[f] for f in FEATURE_NAMES])
                y.append(target)
                index.append((code, origin))
        return X, y, index


def _std(values):
    n = len(values)
    mean = sum(values) / n
    return math.sqrt(sum((v - mean) ** 2 for v in values) / (n - 1))
