"""SCORING_MODEL.md KR-15..KR-28 qabul testlari. Ma'lumot — sun'iy (test bazasi), haqiqiy qatorlarga tegilmaydi."""
import copy
import json
import math
from unittest import mock

from django.core.cache import cache
from django.test import SimpleTestCase, TestCase
from rest_framework.test import APITestCase

from ..forecast import methods, spec, train
from ..forecast.dataset import FEATURE_NAMES, Dataset
from ..models import ForecastModelRun, ForecastValue, ForecastVersion, SiatIndicator, SiatValue, Territory
from ..scoring import analysis, config, engine, service
from ..scoring.panel import Panel

CFG = config.load()
REGIONS = ["1703", "1706", "1708", "1726"]   # 1726 — Toshkent shahri (chetdagi qiymatlar)


def region_panel(overrides=None, years=(2023, 2024, 2025), extra_territories=None):
    """4 viloyatli sun'iy panel (barcha ustunlar bor)."""
    base = {
        "1703": {"660": 30000, "658": 106, "500": 4.0e6, "d-real-wage": 6, "1875": 5.0, "246": 3300, "d-pop-growth": 2.0,
                 "d-density": 780, "247": 1600, "d-rural-share": 48, "1409": 1300, "1460": 104, "ind": 20000, "inv": 8000},
        "1706": {"660": 45000, "658": 107, "500": 4.5e6, "d-real-wage": 7, "1875": 4.5, "246": 2000, "d-pop-growth": 1.5,
                 "d-density": 50, "247": 1300, "d-rural-share": 65, "1409": 600, "1460": 105, "ind": 30000, "inv": 9000},
        "1708": {"660": 32000, "658": 105, "500": 3.8e6, "d-real-wage": 5, "1875": 6.0, "246": 1500, "d-pop-growth": 2.3,
                 "d-density": 70, "247": 800, "d-rural-share": 54, "1409": 500, "1460": 106, "ind": 9000, "inv": 6000},
        "1726": {"660": 120000, "658": 108, "500": 9.0e6, "d-real-wage": 8, "1875": 3.5, "246": 3100, "d-pop-growth": 2.5,
                 "d-density": 9000, "247": 0, "d-rural-share": None, "1409": 900, "1460": None, "ind": 60000, "inv": 40000},
        "1700": {"660": 40000, "658": 106, "500": 5.0e6, "d-real-wage": 7, "1875": 5.0, "246": 37000, "d-pop-growth": 2.0,
                 "d-density": 80, "247": 18000, "d-rural-share": 49, "1409": 9000, "1460": 105, "ind": 500000, "inv": 300000},
    }
    for code, patch in (overrides or {}).items():
        base[code] = {**base[code], **patch}
    series = {}
    for code, vals in base.items():
        for key, v in vals.items():
            for i, year in enumerate(years):
                if v is None:
                    continue
                growth = 1 + 0.03 * (i - len(years) + 1) if key in ("246", "247", "500", "660", "ind", "inv") else 1
                value = v * growth
                if key == "ind":
                    series.setdefault(("industry-by-activity", "B, C, D, E"), {})[(code, year)] = value
                    series.setdefault(("industry-by-activity", "C"), {})[(code, year)] = value * 0.7
                    series.setdefault(("industry-by-activity", "13"), {})[(code, year)] = value * (0.5 if code == "1708" else 0.1)
                    series.setdefault(("industry-by-activity", "24"), {})[(code, year)] = value * (0.05 if code == "1708" else 0.3)
                elif key == "inv":
                    series.setdefault(("investment-by-activity", "C"), {})[(code, year)] = value * 0.4
                    series.setdefault(("investment-by-activity", "F"), {})[(code, year)] = value * 0.6
                else:
                    series.setdefault((key, ""), {})[(code, year)] = value
    territories = {c: {"level": "region", "kind": "region", "parent": "1700", "names": {l: c for l in ("uz", "ru", "en", "uzc")}}
                   for c in base if c != "1700"}
    territories["1700"] = {"level": "country", "kind": "country", "parent": None, "names": {l: "UZ" for l in ("uz", "ru", "en", "uzc")}}
    territories.update(extra_territories or {})
    return Panel(series, {}, territories)


def run(panel, year=2025, weights=None, level="region"):
    with mock.patch.object(service, "_sector_names", return_value={}):
        return service.compute(level, year, weights or config.weights_for(CFG, level), CFG, panel)


class ConfigTests(SimpleTestCase):
    """KR-15."""

    def test_valid_config_loads(self):
        self.assertEqual(tuple(CFG["pillars"]), config.PILLARS)
        self.assertIn("balanced", CFG["presets"])

    def test_unknown_source_fails(self):
        bad = copy.deepcopy(CFG)
        bad["indicators"]["wage"]["source"]["key"] = "999999"
        with self.assertRaisesRegex(config.ConfigError, "noma'lum manba"):
            config.validate(bad)

    def test_bad_direction_fails(self):
        bad = copy.deepcopy(CFG)
        bad["indicators"]["wage"]["direction"] = "up"
        with self.assertRaisesRegex(config.ConfigError, "direction"):
            config.validate(bad)

    def test_new_indicator_enters_score_without_code_change(self):
        """2818 (erkaklar ishsizligi) yaml'ga qo'shilsa B ustuniga kiradi."""
        cfg = copy.deepcopy(CFG)
        cfg["indicators"]["male-unemployment"] = {
            "name": {"uz": "Erkaklar ishsizligi", "ru": "Безработица мужчин", "en": "Male unemployment"},
            "unit": {"uz": "%", "ru": "%", "en": "%"}, "source": {"key": "2818"}, "level": "region",
            "direction": "-", "transform": "none", "role": "score"}
        cfg["pillars"]["B"]["indicators"].append("male-unemployment")
        config.validate(cfg)
        panel = region_panel()
        panel.series[("2818", "")] = {("1703", 2025): 4.0, ("1706", 2025): 9.0, ("1708", 2025): 5.0, ("1726", 2025): 3.0}
        with mock.patch.object(service, "_sector_names", return_value={}):
            result = service.compute("region", 2025, config.weights_for(cfg, "region"), cfg, panel)
        self.assertIn("male-unemployment", result["items"]["1706"]["indicators"])
        before = run(region_panel())["items"]["1706"]["pillars"]["B"]
        self.assertLess(result["items"]["1706"]["pillars"]["B"], before)

    def test_weights_parse(self):
        self.assertEqual(config.parse_weights("25,25,15,25,10"), [25, 25, 15, 25, 10])
        for bad in ("1,2", "a,1,1,1,1", "-1,1,1,1,1", "0,0,0,0,0"):
            with self.assertRaises(ValueError):
                config.parse_weights(bad)


class MethodologyTests(SimpleTestCase):
    """KR-22: metodologiya 4 tilda; raqamlar scoring.yaml dan (qo'lda yozilmagan)."""

    def test_four_languages_filled_from_config(self):
        from ..scoring import methodology

        cfg = copy.deepcopy(CFG)
        cfg["params"]["z_clip"] = 3.25
        cfg["params"]["coverage_min"] = 0.55
        for lang in ("uz", "uzc", "ru", "en"):
            m = methodology.build(cfg, lang)
            text = " ".join(i for s in m["sections"] for i in s["items"])
            self.assertNotIn("{", text)
            self.assertNotIn("⟦", text)
            self.assertIn("3.25", text)
            self.assertIn("55%", text)
            self.assertIn("z", text)                       # formula belgisi kirillga o'girilmaydi
            self.assertEqual(len(m["sections"]), 6)
        self.assertRegex(methodology.build(cfg, "uzc")["labels"]["title"], "[А-Яа-яЎўҚқҒғҲҳ]")
        self.assertNotEqual(methodology.build(cfg, "ru")["labels"]["title"], methodology.build(cfg, "uz")["labels"]["title"])


class EngineTests(SimpleTestCase):
    """KR-16: formula 3.2 qo'lda hisoblangan qiymatlar bilan."""

    def test_normalize_by_hand(self):
        values = {"a": 1.0, "b": 2.0, "c": 3.0, "d": 4.0}
        out = engine.normalize(values, "+", "none", clip=2.5, scale=20)
        sd = math.sqrt(1.25)   # populyatsiya sd: (2.25 + 0.25 + 0.25 + 2.25) / 4
        self.assertAlmostEqual(out["a"]["z"], round(-1.5 / sd, 4), places=4)
        self.assertAlmostEqual(out["d"]["s"], round(50 + 20 * 1.5 / sd, 2), places=2)
        self.assertEqual(out["d"]["rank"], 1)
        self.assertEqual(out["a"]["pct"], 0.0)
        self.assertEqual(out["d"]["pct"], 100.0)

    def test_negative_direction_and_clip(self):
        out = engine.normalize({"a": 1, "b": 1, "c": 1, "d": 1, "e": 100}, "-", "none", clip=2.5, scale=20)
        self.assertEqual(out["e"]["rank"], 5)
        self.assertGreaterEqual(out["e"]["s"], 0)
        self.assertGreaterEqual(out["e"]["z"], -2.5)

    def test_composite_reweights_missing_pillar(self):
        comp = engine.composite({"a": {"A": 60, "B": None}}, {"A": 25, "B": 75})
        self.assertEqual(comp["a"], 60)

    def test_unemployment_up_lowers_score(self):
        base = run(region_panel())["items"]["1708"]["score"]
        worse = run(region_panel({"1708": {"1875": 9.0}}))["items"]["1708"]["score"]
        self.assertLess(worse, base)

    def test_capital_does_not_flatten_others(self):
        """Toshkent shahri log + clip tufayli qolganlar 0 ga tushmaydi."""
        items = run(region_panel())["items"]
        mid = [i["score"] for c, i in items.items() if c != "1726" and 30 <= i["score"] <= 70]
        self.assertGreaterEqual(len(mid), 3)

    def test_deterministic(self):
        a = run(region_panel())
        b = run(region_panel())
        self.assertEqual(json.dumps(a, sort_keys=True, default=str), json.dumps(b, sort_keys=True, default=str))

    def test_rank_range_seeded(self):
        pillars = {"a": {"A": 60, "B": 40}, "b": {"A": 40, "B": 61}, "c": {"A": 10, "B": 10}}
        r1 = engine.rank_range(pillars, {"A": 50, "B": 50}, {"a", "b", "c"}, iterations=200, seed=1)
        r2 = engine.rank_range(pillars, {"A": 50, "B": 50}, {"a", "b", "c"}, iterations=200, seed=1)
        self.assertEqual(r1, r2)
        self.assertEqual(r1["c"], (3, 3))
        self.assertEqual(r1["a"][0], 1)


class GapsTests(SimpleTestCase):
    """KR-17: ma'lumot bo'shliqlari, yangi tumanlar, to'liqlik."""

    def district_panel(self):
        series = {("246", ""): {}, ("500", ""): {}, ("1875", ""): {}, ("d-pop-growth", ""): {}, ("d-density", ""): {}}
        territories = {"1708": {"level": "region", "kind": "region", "parent": "1700", "names": {}}}
        for i in range(1, 7):
            code = f"170820{i}"
            territories[code] = {"level": "district", "kind": "district", "parent": "1708", "names": {}}
        new = "1708299"
        territories[new] = {"level": "district", "kind": "district", "parent": "1708", "names": {}}
        for year in range(2015, 2026):
            for i in range(1, 7):
                code = f"170820{i}"
                pop = 100 + i * 10
                if i == 1 and year >= 2020:
                    pop *= 0.6   # ota tuman: 2020 da yangi tuman ajralib chiqdi
                series[("246", "")][(code, year)] = pop * (1 + 0.02 * (year - 2015))
                if year >= 2017:
                    series[("500", "")][(code, year)] = 3e6 + i * 1e5
                series[("1875", "")][(code, year)] = 4 + i * 0.3
                series[("d-density", "")][(code, year)] = 50 + i * 20
            if year >= 2020:
                series[("246", "")][(new, year)] = 50
                series[("1875", "")][(new, year)] = 5
        pop = series[("246", "")]
        for (code, year), v in pop.items():
            prev = pop.get((code, year - 1))
            if prev:
                series[("d-pop-growth", "")][(code, year)] = (v / prev - 1) * 100
        return Panel(series, {}, territories)

    def test_new_district_before_creation(self):
        panel = self.district_panel()
        result = run(panel, 2018, level="district")
        self.assertEqual(result["items"]["1708299"]["status"], "not_created")
        self.assertIsNone(result["items"]["1708299"]["score"])

    def test_parent_split_growth_missing(self):
        panel = self.district_panel()
        series, _ = panel.source_series({"key": "d-pop-growth"})
        self.assertNotIn(("1708201", 2020), series)
        self.assertIn(("1708201", 2021), series)

    def test_year_without_wages(self):
        """500 yo'q yil (2016): B faqat ishsizlik va real ish haqidan, to'liqlik < 1."""
        result = run(self.district_panel(), 2016, level="district")
        item = result["items"]["1708203"]
        self.assertNotIn("wage", item["indicators"])
        self.assertLess(item["coverage"], 1)

    def test_low_coverage_is_missing(self):
        panel = region_panel()
        for key in list(panel.series):
            if key[0] not in ("246",):
                panel.series[key] = {cy: v for cy, v in panel.series[key].items() if cy[0] != "1706"}
        item = run(panel)["items"]["1706"]
        self.assertTrue(item["missing"])
        self.assertIsNone(item["score"])

    def test_lag_one_year(self):
        panel = region_panel(years=(2023, 2024))
        panel.series[("246", "")].update({(c, 2025): 1000 for c in REGIONS})
        item = run(panel)["items"]["1703"]["indicators"]["gdp-pc"]
        self.assertTrue(item["lagged"])
        self.assertEqual(item["year"], 2024)


class RulesTests(SimpleTestCase):
    """KR-18: har qoida — kamida bitta musbat va bitta manfiy holat."""

    def setUp(self):
        self.values = {}

    def evaluate(self, pct, level="region", history=None, sectors=None, parent_pct=None):
        values = {k: {"X": {"value": 1.0, "year": 2025}} for k in pct}
        pct_raw = {k: {"X": v} for k, v in pct.items()}
        return [r["rule"] for r in analysis.evaluate_rules(CFG, level, "X", pct_raw, values, parent_pct or {},
                                                           history or {}, True, sectors or [])]

    def test_r1(self):
        self.assertIn("R1", self.evaluate({"rural-share": 80, "density": 30, "dehqon-growth": 70}))
        self.assertNotIn("R1", self.evaluate({"rural-share": 40, "density": 30, "dehqon-growth": 70}))

    def test_r1_district_uses_parent(self):
        parent = {"dehqon-growth": 70, "dehqon-growth__value": {"value": 5, "year": 2024}}
        self.assertIn("R1", self.evaluate({"rural-share": 80, "density": 30}, "district", parent_pct=parent))

    def test_r2(self):
        self.assertIn("R2", self.evaluate({"unemployment": 80, "pop-growth-3y": 60, "wage": 20}))
        self.assertNotIn("R2", self.evaluate({"unemployment": 80, "pop-growth-3y": 60, "wage": 70}))

    def test_r3(self):
        self.assertIn("R3", self.evaluate({"density": 90, "population": 70, "wage": 60}))
        self.assertNotIn("R3", self.evaluate({"density": 50, "population": 70, "wage": 60}))

    def test_r4_r5_r6_region_only(self):
        self.assertIn("R4", self.evaluate({"gdp-pc": 80, "industry-pc": 70}))
        self.assertNotIn("R4", self.evaluate({"gdp-pc": 80, "industry-pc": 70}, "district"))
        self.assertIn("R5", self.evaluate({"investment-pc": 10, "unemployment": 60}))
        self.assertNotIn("R5", self.evaluate({"investment-pc": 60, "unemployment": 60}))
        self.assertIn("R6", self.evaluate({"preschool-per10k": 10, "pop-growth-3y": 80}))
        self.assertNotIn("R6", self.evaluate({"preschool-per10k": 50, "pop-growth-3y": 80}))

    def test_r7(self):
        self.assertIn("R7", self.evaluate({}, history={"real-wage-growth": {2023: 3, 2024: -1, 2025: -2}}))
        self.assertNotIn("R7", self.evaluate({}, history={"real-wage-growth": {2023: -3, 2024: -1, 2025: 2}}))

    def test_r8(self):
        self.assertIn("R8", self.evaluate({"pop-growth-3y": 10, "rural-share": 60}))
        self.assertNotIn("R8", self.evaluate({"pop-growth-3y": 50, "rural-share": 60}))

    def test_r9(self):
        sector = {"label": "leading", "lq": 2.0, "growth": 10, "national_growth": 5}
        self.assertIn("R9", self.evaluate({}, sectors=[sector]))
        self.assertNotIn("R9", self.evaluate({}, sectors=[{**sector, "label": "slowing"}]))

    def test_at_most_three(self):
        pct = {"unemployment": 90, "pop-growth-3y": 90, "wage": 10, "investment-pc": 5, "preschool-per10k": 5,
               "rural-share": 90, "density": 10, "dehqon-growth": 90}
        self.assertLessEqual(len(self.evaluate(pct)), 3)

    def test_r1_never_for_tashkent_city(self):
        item = run(region_panel())["items"]["1726"]
        self.assertNotIn("R1", [r["rule"] for r in item["recommendations"]])

    def test_text_numbers_match_api(self):
        panel = region_panel({"1708": {"1875": 9.0, "d-pop-growth": 3.0, "500": 3.0e6}})
        result = run(panel)
        with mock.patch.object(service, "_sector_names", return_value={}):
            detail = service.render_detail(CFG, result, panel, "1708", "uz")
        rec = next(r for r in detail["recommendations"] if r["title"].startswith("Mehnat"))
        unemployment = next(e for e in rec["evidence"] if e["indicator"] == "unemployment")
        self.assertEqual(unemployment["value"], result["items"]["1708"]["indicators"]["unemployment"]["value"])
        self.assertIn("9", unemployment["text"])

    def test_sector_lq_labels(self):
        panel = region_panel()
        table = analysis.sector_table(panel, set(REGIONS), 2025, CFG["params"], {})
        codes = {(s["code"], s["label"]) for s in table.get("1708", [])}
        self.assertIn(("13", "leading"), codes)
        self.assertNotIn("C", {c for c, _ in codes if _ != "invest"})   # C — bo'limlar yig'indisi, tarmoq emas


class PeersTests(SimpleTestCase):
    """KR-21."""

    def test_not_self_and_min_common(self):
        z = {"a": {f"k{i}": i * 0.1 for i in range(6)}, "b": {f"k{i}": i * 0.1 + 0.05 for i in range(6)},
             "c": {"k0": 1, "k1": 1}}
        near = engine.distances(z, min_common=5)
        self.assertNotIn("a", [o for o, _ in near["a"]])
        self.assertEqual(near["c"], [])

    def test_compute_peers(self):
        items = run(region_panel())["items"]
        for code, item in items.items():
            self.assertNotIn(code, [p["soato"] for p in item["peers"]])


class ForecastMethodsTests(SimpleTestCase):
    """KR-23..KR-25."""

    def test_methods(self):
        series = {y: math.log(100 * 1.05 ** (y - 2010)) for y in range(2010, 2026)}
        self.assertEqual(methods.naive(series, 2025, 2), 0.0)
        self.assertAlmostEqual(methods.drift(series, 2025, 2), 2 * math.log(1.05), places=6)
        self.assertAlmostEqual(methods.damped(series, 2025, 1), math.log(1.05), places=2)
        self.assertIsNone(methods.damped({2024: 1.0, 2025: 1.1}, 2025, 1))

    def test_select_rule(self):
        table = {"M0": {"mase": 1.0}, "M1": {"mase": 0.5}, "M2": {"mase": 0.6}, "M3": {"mase": 0.48}}
        self.assertEqual(train.select(table), "M1")          # 10% dan kam yaxshi — oddiy usul
        table["M3"] = {"mase": 0.40}
        self.assertEqual(train.select(table), "M3")
        self.assertEqual(train.select({"M0": {"mase": 1.0}, "M1": {"mase": 1.3}}), "M0")

    def test_interval_contains_point_and_widens(self):
        recs = [{"origin": 2018 + i % 4, "actual": 0.1 + 0.01 * i, "preds": {"M1": 0.0}, "covid": False} for i in range(20)]
        q = train.interval(recs, "M1")
        self.assertLessEqual(q["q10"], 0)
        self.assertGreaterEqual(q["q90"], 0)
        widened = train._widen({1: {"q10": -0.1, "q90": 0.1}, 2: {"q10": -0.05, "q90": 0.05}, 3: None})
        self.assertLessEqual(widened[2]["q10"], -0.1)
        self.assertIsNotNone(widened[3])
        # 1-horizont yetishmasa — 2-dan to'ldiriladi (nol kenglikdagi oraliq qolmaydi), qamrov o'z qoldiqlarida
        back = train._widen({1: None, 2: {"q10": -0.2, "q90": 0.2}, 3: None}, {1: [0.0, 0.1, 0.5]})
        self.assertLess(back[1]["q10"], 0)
        self.assertEqual(back[1]["basis"], "scaled")
        self.assertAlmostEqual(back[1]["coverage"], 66.7)

    def test_interval_calibrated(self):
        """KR-25: qamrov ("bitta origin'ni chiqarib") 70–90%, hatto qoldiqlar og'ir dumli bo'lsa ham."""
        import random

        rnd = random.Random(1)
        for dist in (lambda: rnd.gauss(0, 0.05), lambda: rnd.gauss(0, 0.05) * (4 if rnd.random() < 0.15 else 1)):
            recs = [{"origin": 2018 + o, "code": f"c{c}", "actual": dist(), "preds": {"M1": 0.0}, "covid": False}
                    for o in range(5) for c in range(15)]
            q = train.interval(recs, "M1")
            self.assertEqual(q["basis"], "origins")
            self.assertGreaterEqual(q["coverage"], 70)
            self.assertLessEqual(q["coverage"], 90)
        # Bitta origin — hududlar bo'yicha tekshiriladi, kichik namuna belgilanadi
        one = [{"origin": 2024, "code": f"c{c}", "actual": rnd.gauss(0, 0.05), "preds": {"M1": 0.0}, "covid": False}
               for c in range(15)]
        q = train.interval(one, "M1")
        self.assertEqual(q["basis"], "codes")
        self.assertTrue(q["small_sample"])

    def test_covid_window_includes_rebound(self):
        self.assertTrue(train._covid(2019, 1))
        self.assertTrue(train._covid(2020, 1))     # 2020 → 2021 tiklanishi
        self.assertFalse(train._covid(2021, 1))

    def test_scenarios_ordered(self):
        own = {y: math.log(100 + y - 2010) for y in range(2010, 2026)}
        series = {f"p{i}": {y: math.log(100 * (1 + 0.01 * i) ** (y - 2010)) for y in range(2010, 2026)} for i in range(8)}
        deltas = {1: 0.02, 2: 0.04, 3: 0.06}
        for key in ("500", "1875"):
            rows = train._scenarios(key, "district", "X", own, 2025, deltas, {"X": list(series)}, series, "level")
            for h in range(1, 6):
                opt = next(r["value"] for r in rows if r["horizon"] == h and r["scenario"] == "optimistic")
                pes = next(r["value"] for r in rows if r["horizon"] == h and r["scenario"] == "pessimistic")
                base = math.exp(own[2025] + deltas.get(h, deltas[3] * h / 3))
                if key == "1875":   # ishsizlik: ijobiy — pastroq
                    self.assertLessEqual(opt, base + 1e-9)
                    self.assertGreaterEqual(pes, base - 1e-9)
                else:
                    self.assertGreaterEqual(opt, base - 1e-9)
                    self.assertLessEqual(pes, base + 1e-9)


class ForecastDatasetTests(SimpleTestCase):
    """KR-23: oqish yo'q — origin t qatoriga t+1 ma'lumoti kirmaydi; tuzilmagan yillar jadvalda yo'q."""

    def panel(self):
        series = {("246", ""): {}, ("500", ""): {}, ("1875", ""): {}}
        territories = {"1708": {"level": "region", "kind": "region", "parent": "1700", "names": {}},
                       "1708201": {"level": "district", "kind": "district", "parent": "1708", "names": {}},
                       "1708202": {"level": "district", "kind": "district", "parent": "1708", "names": {}},
                       "1708299": {"level": "district", "kind": "district", "parent": "1708", "names": {}}}
        for y in range(2012, 2026):
            for code, base in (("1708201", 100), ("1708202", 200)):
                series[("246", "")][(code, y)] = base * 1.02 ** (y - 2012)
                series[("500", "")][(code, y)] = 1e6 * 1.1 ** (y - 2012)
                series[("1875", "")][(code, y)] = 5.0
            if y >= 2021:
                series[("246", "")][("1708299", y)] = 50 * 1.02 ** (y - 2021)
        return Panel(series, {}, territories)

    def test_no_future_leakage(self):
        panel = self.panel()
        ds = Dataset(panel)
        row = ds.features("246", "1708201", 2020, 1)
        changed = self.panel()
        for key in changed.series:
            for (code, y) in list(changed.series[key]):
                if y > 2020:
                    changed.series[key][(code, y)] *= 3   # "kelajak" o'zgaradi
        row2 = Dataset(changed).features("246", "1708201", 2020, 1)
        self.assertEqual([row[f] for f in FEATURE_NAMES if not math.isnan(row[f])],
                         [row2[f] for f in FEATURE_NAMES if not math.isnan(row2[f])])

    def test_not_created_rows_absent(self):
        ds = Dataset(self.panel())
        _, _, idx = ds.rows("246", "district", range(2013, 2025), 1)
        self.assertNotIn(("1708299", 2018), idx)
        self.assertIn(("1708299", 2022), idx)
        self.assertNotIn("1708299", {c for c, _ in idx if _ < 2021})

    def test_methodology_break(self):
        """1409: bir yilda 2.5 baravardan katta sakrash — uzilish; uni kesib o'tgan oyna orqaga sinovga kirmaydi,
        prognoz uzilishdan keyingi qatordan (eski o'sish sur'ati emas)."""
        series = {("1409", ""): {}}
        territories = {c: {"level": "region", "kind": "region", "parent": "1700", "names": {}} for c in ("1703", "1708")}
        for y in range(2010, 2026):
            series[("1409", "")][("1703", y)] = 100 * 1.02 ** (y - 2010) * (5 if y >= 2023 else 1)
            series[("1409", "")][("1708", y)] = 200 * 1.02 ** (y - 2010)
        ds = Dataset(Panel(series, {}, territories))
        self.assertEqual(ds.break_year("1409", "1703"), 2023)
        self.assertIsNone(ds.break_year("1409", "1708"))
        self.assertTrue(ds.spans_break("1409", "1703", 2022, 1))
        self.assertFalse(ds.spans_break("1409", "1703", 2023, 1))
        self.assertEqual(min(ds.cut("1409", "1703", 2025)), 2023)
        self.assertEqual(max(ds.cut("1409", "1703", 2021)), 2021)   # uzilishdan oldingi origin — kelajak ko'rinmaydi
        bt = train.backtest(ds, "1409", "region")
        for h, recs in bt["records"].items():
            self.assertFalse([r for r in recs if r["code"] == "1703" and r["origin"] < 2023 <= r["origin"] + h])
        _, vals = train.forecast(ds, "1409", "region", bt)
        v = next(v for v in vals if v["soato"] == "1703" and v["horizon"] == 1 and v["scenario"] == "base")
        self.assertLess(v["value"], series[("1409", "")][("1703", 2025)] * 1.5)

    def test_what_if(self):
        """10.5 maqsadli ssenariy: omil siljiganda panel modeli farqi; ishsizlik 0 dan pastga tushmaydi."""
        idx = FEATURE_NAMES.index("unemployment")

        class Fake:
            model = object()

            def predict(self, X):
                return [-0.01 * row[idx] for row in X]

        ds = Dataset(self.panel())
        bt = {"panel_params": {"max_depth": 3}}
        out = train._what_if(ds, "246", "district", bt, 2024, 2012, {h: Fake() for h in spec.HORIZONS})
        diff = out["1708201"]["unemployment"][1]
        self.assertAlmostEqual(diff[-1], 0.01, places=6)     # ishsizlik 1 p.p. kamaysa — aholi prognozi biroz yuqori
        self.assertAlmostEqual(diff[2], -0.02, places=6)
        self.assertEqual(train._what_if(ds, "1875", "district", bt, 2024, 2012, {}), {})   # o'zi omil — maqsad emas
        self.assertEqual(train._what_if(ds, "246", "region", bt, 2024, 2012, {}), {})

    def test_backtest_and_forecast_deterministic(self):
        ds = Dataset(self.panel())
        with mock.patch.object(methods.PanelModel, "available", return_value=False):
            bt1 = train.backtest(ds, "246", "district")
            res1, vals1 = train.forecast(ds, "246", "district", bt1)
            bt2 = train.backtest(ds, "246", "district")
            res2, vals2 = train.forecast(ds, "246", "district", bt2)
        self.assertEqual(vals1, vals2)
        for h, run_ in res1["runs"].items():
            chosen = run_["table"].get(run_["method"])
            self.assertTrue(run_["method"] == "M0" or (chosen and chosen["mase"] <= 1))
        base = [v for v in vals1 if v["scenario"] == "base"]
        self.assertTrue(all(v["lo80"] <= v["value"] <= v["hi80"] for v in base))


def seed_db():
    """Test bazasi: 3 viloyat + respublika, aholi va ish haqi qatorlari."""
    Territory.objects.create(soato="1700", level="country", kind="country", name_uz="O'zbekiston")
    for code, name in (("1703", "Andijon"), ("1706", "Buxoro"), ("1708", "Jizzax"), ("1726", "Toshkent shahri")):
        Territory.objects.create(soato=code, parent_id="1700", level="region", kind="region", name_uz=name)
    panel = region_panel(years=tuple(range(2016, 2026)))
    keys = {k for k, _ in panel.series}
    for key in keys:
        ind = SiatIndicator.objects.create(key=key, kind="source", geo_level="region", show_on_map=True,
                                           name_uz=key, periodicity="Y")
        rows = []
        for (k, b), values in panel.series.items():
            if k != key:
                continue
            for (code, year), v in values.items():
                rows.append(SiatValue(indicator=ind, territory_code=code, breakdown=b, period=str(year), value=v))
        SiatValue.objects.bulk_create(rows)


class ScoreApiTests(APITestCase):
    """KR-19, KR-26: API, validatsiya, model nomlari javobda yo'q."""

    @classmethod
    def setUpTestData(cls):
        seed_db()

    def setUp(self):
        cache.clear()
        from ..scoring import panel as panel_module

        panel_module._CACHE.clear()
        service._RESULTS.clear()

    def test_list_and_detail(self):
        res = self.client.get("/api/common/map/score/?level=region")
        self.assertEqual(res.status_code, 200, res.content)
        data = res.json()
        self.assertEqual(len(data["items"]), 4)
        self.assertTrue(all(i["score"] is None or 0 <= i["score"] <= 100 for i in data["items"]))
        detail = self.client.get("/api/common/map/score/1708/").json()
        self.assertEqual(detail["soato"], "1708")
        self.assertIn("pillars", detail)
        self.assertIn("disclaimer", detail)

    def test_weights_and_preset_validation(self):
        self.assertEqual(self.client.get("/api/common/map/score/?preset=nope").status_code, 400)
        self.assertEqual(self.client.get("/api/common/map/score/?weights=1,2,3").status_code, 400)
        self.assertEqual(self.client.get("/api/common/map/score/?weights=0,0,0,0,0").status_code, 400)
        ok = self.client.get("/api/common/map/score/?weights=10,10,10,10,60")
        self.assertEqual(ok.status_code, 200)
        self.assertEqual(ok.json()["weights"]["E"], 60.0)

    def test_missing_score_is_null(self):
        SiatValue.objects.filter(territory_code="1706").exclude(indicator__key="246").delete()
        items = self.client.get("/api/common/map/score/?level=region").json()["items"]
        bux = next(i for i in items if i["soato"] == "1706")
        self.assertTrue(bux["missing"])
        self.assertIsNone(bux["score"])

    def test_map_values_score(self):
        res = self.client.get("/api/common/map/values/?indicator=score&level=region")
        self.assertEqual(res.status_code, 200, res.content)
        data = res.json()
        self.assertEqual(data["scale"]["min"], 0)
        self.assertEqual(data["scale"]["diverging_center"], 50)
        catalog = self.client.get("/api/common/map/indicators/").json()
        self.assertIn("score", [i["key"] for i in catalog["indicators"]])

    def test_export_has_methodology(self):
        res = self.client.get("/api/common/map/score/?level=region&export=csv")
        text = res.content.decode("utf-8")
        self.assertIn("Metodologiya v", text)
        self.assertIn("SIAT", text)
        self.assertIn("is_forecast", text)

    def test_outlook_and_movers(self):
        """10.6, 10.8.6: o'rin o'zgarishi (musbat — ko'tariladi) va eng ko'p ko'tariluvchi/tushuvchilar."""
        from .. import views_score

        now = {"items": {"A": {"score": 60, "rank": 1}, "B": {"score": 50, "rank": 2}, "C": {"score": 40, "rank": 3}}}
        later = {"items": {"A": {"score": 45, "rank": 3}, "B": {"score": 52, "rank": 2}, "C": {"score": 58, "rank": 1}}}
        items = [{"soato": c, "name": c} for c in "ABC"]
        with mock.patch.object(views_score, "_result", side_effect=lambda cfg, lvl, year, w, f: (now if year == 2025 else later, None)):
            out = views_score.attach_outlook(CFG, "region", 2025, {}, [2024, 2025], [2026, 2027, 2028], items)
        self.assertEqual((out["from"], out["to"]), ("2025", "2027"))
        self.assertEqual(items[2]["outlook"]["rank_change"], 2)
        self.assertEqual(items[0]["outlook"]["score_change"], -15)
        self.assertEqual([m["soato"] for m in out["up"]], ["C"])
        self.assertEqual([m["soato"] for m in out["down"]], ["A"])
        self.assertIsNone(views_score.attach_outlook(CFG, "region", 2025, {}, [2025], [], items))

    def test_openapi_schema(self):
        """KR-19: uchala scoring va ikkala prognoz endpoint OpenAPI sxemasida, javob shakli bilan."""
        from drf_spectacular.generators import SchemaGenerator

        schema = SchemaGenerator().get_schema(request=None, public=True)
        for path in ("/api/common/map/score/", "/api/common/map/score/{soato}/", "/api/common/map/score/config/",
                     "/api/common/map/forecast/", "/api/common/map/forecast/{soato}/"):
            self.assertIn(path, schema["paths"])
        params = {p["name"] for p in schema["paths"]["/api/common/map/score/"]["get"]["parameters"]}
        self.assertTrue({"level", "period", "preset", "weights", "export"} <= params)
        self.assertIn("ScoreList", schema["components"]["schemas"])


class ForecastApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        seed_db()
        metrics = {"n": 40, "mae": 0.05, "mase": 0.43, "mape": 6.12, "direction": 98.4}
        ForecastVersion.objects.create(version="v1", is_current=True, report={"500": {"region": {
            str(h): {"method": "M1", "metrics": metrics, "all": {"M0": metrics, "M1": metrics},
                     "interval": {"coverage": 80.0, "n": 40}} for h in (1, 2, 3)}}})
        runs = {h: ForecastModelRun.objects.create(indicator="500", level="region", horizon=h, model_kind="M1",
                                                   backtest={"M0": metrics, "M1": metrics}, interval={"coverage": 80.0},
                                                   data_until="2025", version="v1") for h in (1, 2, 3)}
        for code in ("1703", "1706", "1708", "1726", "1700"):
            for h in (1, 2, 3):
                ForecastValue.objects.create(indicator="500", soato=code, period=str(2025 + h), horizon=h,
                                             scenario="base", value=5e6 * (1 + 0.1 * h), lo80=4.5e6, hi80=6e6 * (1 + 0.1 * h),
                                             version="v1", drivers=[{"feature": "own_d1", "contribution": 0.01}],
                                             model_run=runs[h])

    def setUp(self):
        cache.clear()

    def test_historical_period_empty(self):
        res = self.client.get("/api/common/map/forecast/?indicator=500&period=2020")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["items"], [])

    def test_detail_model_in_plain_words(self):
        """10.8.3: usul nomi va o'rtacha xato oddiy tilda; ichki kodlar va MASE chiqmaydi."""
        res = self.client.get("/api/common/map/forecast/1708/?indicator=500")
        self.assertEqual(res.status_code, 200, res.content)
        text = res.content.decode("utf-8")
        for word in ("M0", "M1", "M2", "M3", "M4", "mase", "MASE", "mape", "model_kind"):
            self.assertNotIn(word, text)
        data = res.json()
        self.assertEqual(len(data["forecast"]), 3)
        self.assertEqual(data["drivers"][0]["effect"], "up")
        self.assertEqual(data["model"]["method"], "So'nggi yillar o'rtacha o'sishi")
        self.assertEqual(data["model"]["error_pct"], 6.1)

    def test_quality_page(self):
        """10.4, KR-28: metodologiya uchun aniqlik jadvali va monitoring."""
        res = self.client.get("/api/common/map/forecast/quality/?lang=ru")
        self.assertEqual(res.status_code, 200, res.content)
        data = res.json()
        self.assertEqual(len(data["rows"]), 3)
        row = data["rows"][0]
        self.assertEqual((row["level"], row["error_pct"], row["direction_pct"], row["coverage_pct"]), ("область", 6.1, 98.4, 80.0))
        self.assertEqual(row["method"], "Средний рост последних лет")
        self.assertNotIn("M1", res.content.decode("utf-8"))
        self.assertEqual(data["monitoring"], [])

    def test_scenario_and_export(self):
        """10.8.1 va 10.8.7: `sc=opt|pes`, shkala ssenariylarda bir xil; eksportda is_forecast va prognoz versiyasi."""
        for code in ("1703", "1706", "1708", "1726", "1700"):
            for h in (1, 2, 3):
                for scen, k in (("optimistic", 1.2), ("pessimistic", 0.9)):
                    ForecastValue.objects.create(indicator="500", soato=code, period=str(2025 + h), horizon=h,
                                                 scenario=scen, value=5e6 * (1 + 0.1 * h) * k, version="v1")
        base = self.client.get("/api/common/map/values/?indicator=500&level=region&period=2027").json()
        opt = self.client.get("/api/common/map/values/?indicator=500&level=region&period=2027&sc=opt").json()
        self.assertEqual(opt["scenario"], "optimistic")
        self.assertGreater(opt["items"][0]["value"], base["items"][0]["value"])
        self.assertIsNone(opt["items"][0]["lo80"])
        self.assertEqual(base["scale"]["max"], opt["scale"]["max"])
        self.assertEqual(self.client.get("/api/common/map/values/?indicator=500&level=region&period=2027&sc=x").status_code, 400)
        text = self.client.get("/api/common/map/values/?indicator=500&level=region&period=2027&export=csv").content.decode()
        self.assertIn("is_forecast", text)
        self.assertIn("Prognoz versiyasi", text)
        self.assertIn(",v1", text)

    def test_what_if_api(self):
        ForecastVersion.objects.filter(version="v1").update(what_if={"500": {"1708": {"unemployment": {
            "1": {"period": "2026", "base": 100.0, "values": {"-1": 101.0, "1": 99.0}, "last": 95.0}}}}})
        res = self.client.get("/api/common/map/forecast/1708/what-if/?feature=unemployment&delta=-1")
        self.assertEqual(res.status_code, 200, res.content)
        data = res.json()
        self.assertEqual(data["indicators"][0]["rows"][0]["change_pct"], 1.0)
        self.assertIn("sabab-oqibat emas", data["note"])
        self.assertEqual(self.client.get("/api/common/map/forecast/1708/what-if/?delta=7").status_code, 400)
        self.assertEqual(self.client.get("/api/common/map/forecast/1703/what-if/?delta=-1").status_code, 404)

    def test_map_forecast_period(self):
        catalog = self.client.get("/api/common/map/indicators/").json()
        wage = next(i for i in catalog["indicators"] if i["key"] == "500")
        self.assertEqual(wage["forecast_periods"], ["2026", "2027", "2028"])
        res = self.client.get("/api/common/map/values/?indicator=500&level=region&period=2027")
        self.assertEqual(res.status_code, 200, res.content)
        data = res.json()
        self.assertTrue(data["forecast"])
        self.assertIsNotNone(data["items"][0]["lo80"])
        growth = self.client.get("/api/common/map/values/?indicator=500&level=region&period=2027&view=growth").json()
        self.assertIn("/yil", growth["unit"])
