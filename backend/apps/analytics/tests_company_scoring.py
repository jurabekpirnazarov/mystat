"""KORXONA_SCORING.md KR-29..KR-38 qabul testlari."""
import copy
import time
from datetime import date
from pathlib import Path

import pandas as pd
from django.core.cache import cache
from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.additional_services.models import IndustrialProduct, IndustrialProductCategory, Ktut, KtutReportList, ReportList, Skp
from apps.common.models import Region, SyntheticRecord
from apps.organizations.models import Organization

from .company_scoring import config, engine, generator
from .models import EnterpriseIndicator, EnterpriseScore

FIXTURES = Path(__file__).resolve().parent / "fixtures" / "company_scoring"
CFG = config.load()
REGIONS = ["1703", "1706", "1708", "1710", "1712", "1714", "1718", "1722", "1724", "1726", "1727", "1730", "1733", "1735"]


def sample_frame():
    return pd.read_csv(FIXTURES / "namuna_korxonalar.csv", dtype={"stir": str, "oked_division": str, "region_code": str})


class ConfigTests(SimpleTestCase):
    """KR-29: YAML validatsiyasi; yangi ko'rsatkich kod o'zgartirmasdan bahoga kiradi."""

    def test_valid(self):
        self.assertEqual(CFG["default_preset"], "muvozanatli")
        self.assertEqual(set(CFG["pillars"]), set("MOTXIS"))

    def test_bad_pillar_and_weight(self):
        bad = copy.deepcopy(CFG)
        bad["indicators"]["m_rpe"]["pillar"] = "Z"
        with self.assertRaises(config.ConfigError):
            config.validate(bad)
        bad = copy.deepcopy(CFG)
        bad["presets"]["bank"]["weights"]["M"] = -5
        with self.assertRaises(config.ConfigError):
            config.validate(bad)

    def test_new_indicator_without_code_change(self):
        cfg = copy.deepcopy(CFG)
        cfg["indicators"]["x_youth_copy"] = {"pillar": "X", "kind": "peer", "direction": "-", "field": "youth_share",
                                             "name": {"uz": "Sinov"}}
        config.validate(cfg)
        df = sample_frame().head(600)
        before = engine.compute(df, CFG)
        after = engine.compute(df, cfg)
        self.assertIn("s_x_youth_copy", after.columns)
        self.assertFalse(before["P_X"].fillna(-1).equals(after["P_X"].fillna(-1)))


class GeneratorTests(SimpleTestCase):
    """KR-30: takrorlanuvchanlik va 3.2 taqsimotlari (±5 p.p.)."""

    def test_deterministic_per_stir(self):
        a, b = generator.generate("200000001"), generator.generate("200000001")
        self.assertEqual(a["rows"], b["rows"])
        self.assertNotEqual(generator.generate("200000002")["rows"], a["rows"])

    def test_distributions(self):
        df = sample_frame()
        self.assertAlmostEqual((df.export_value > 0).mean() * 100, 7, delta=5)
        self.assertAlmostEqual(df.tax_debt.mean() * 100, 9, delta=5)
        df["women"] = df.women_count / df.employees
        for section, base in generator.WOMEN_BASE.items():
            sub = df[(df.oked_section == section) & df.women.notna() & ~df.oked_division.isin(list(generator.WOMEN_DIVISION))]
            if len(sub) >= 100:
                self.assertAlmostEqual(sub.women.mean(), base, delta=0.05, msg=section)


class EngineTests(SimpleTestCase):
    """KR-31: namuna bilan solishtirish va 4-bo'lim qoidalari."""

    def test_matches_reference_sample(self):
        res = engine.compute(sample_frame(), CFG)
        ref = pd.read_csv(FIXTURES / "namuna_scoring.csv", dtype={"stir": str})
        res["stir"] = sample_frame()["stir"]
        m = res.merge(ref, on="stir", suffixes=("", "_ref"))
        self.assertEqual(len(m), 3000)
        for preset in CFG["presets"]:
            a, b = m[f"overall_{preset}"], m[f"overall_{preset}_ref"]
            self.assertTrue(((a - b).abs() <= 0.5).where(a.notna() & b.notna(), True).all(), preset)
            self.assertTrue((a.isna() == b.isna()).all(), preset)
            self.assertTrue((m[f"klass_{preset}"].fillna("") == m[f"klass_{preset}_ref"].fillna("")).all(), preset)

    def _frame(self, n=40, **over):
        rows = []
        for i in range(n):
            rows.append({"stir": f"9{i:08d}", "year": 2025, "oked_section": "C", "oked_division": "10", "region_code": "1726",
                         "employees": 25, "employees_prev2": 20, "revenue": 1e6 + i * 1e4, "revenue_prev2": 8e5,
                         "net_profit": 5e4, "investment": 1e5, "products_count": 2, "export_value": 0.0, "export_prev2": 0.0,
                         "import_value": 0.0, "export_countries": 0, "export_hs_count": 0, "avg_wage": 5000 + i,
                         "avg_tenure_years": 4.0, "turnover_rate": 0.2, "higher_edu_share": 0.3, "women_count": 10,
                         "mgmt_count": 2, "women_mgmt_count": 1, "head_female": 0.0, "gender_pay_ratio": 0.9,
                         "youth_share": 0.3, "disabled_count": 1, "reports_due": 6, "reports_on_time": 6, "tax_debt": 0.0,
                         "founded_year": 2010, "output_value": 1e5})
        rows[0].update(over)
        return pd.DataFrame(rows)

    def test_tax_cap_and_flags(self):
        res = engine.compute(self._frame(tax_debt=1.0, net_profit=-10.0, reports_on_time=1), CFG)
        self.assertLessEqual(res.loc[0, "overall_muvozanatli"], CFG["params"]["cap_tax_debt"])
        self.assertEqual(set(res.loc[0, "flags"]), {"soliq_qarzi", "hisobot_intizomi_past", "zarar_bilan_ishlagan"})

    def test_trade_pillar_rules(self):
        res = engine.compute(self._frame(), CFG)
        self.assertEqual(res.loc[1, "P_T"], CFG["params"]["no_export_score"])        # savdoga yaroqli, eksport yo'q
        services = self._frame(oked_section="J", oked_division="62")
        self.assertFalse(engine.compute(services, CFG).loc[0, "appl_T"])            # xizmat — tegishli emas

    def test_low_coverage_has_no_score(self):
        df = self._frame()
        for col in ("revenue", "net_profit", "investment", "avg_wage", "avg_tenure_years", "turnover_rate",
                    "higher_edu_share", "women_count", "youth_share", "gender_pay_ratio", "disabled_count"):
            df.loc[0, col] = None
        res = engine.compute(df, CFG)
        self.assertLess(res.loc[0, "coverage_muvozanatli"], 0.6)
        self.assertTrue(pd.isna(res.loc[0, "overall_muvozanatli"]))
        self.assertEqual(res.loc[0, "klass_muvozanatli"], "")

    def test_ties_get_equal_percentile(self):
        res = engine.compute(self._frame(), CFG)
        self.assertEqual(res["s_x_staj"].nunique(), 1)     # hammada staj bir xil
        self.assertEqual(res.loc[0, "s_x_staj"], 50.0)

    def test_recommendations(self):
        res = engine.compute(self._frame(turnover_rate=0.9, reports_on_time=1, revenue=3e6, net_profit=3e5, avg_wage=9000), CFG)
        recs = engine.recommendations(CFG, res.loc[0].to_dict())
        self.assertIn("x_turnover", recs)
        self.assertIn("s_reports", recs)
        self.assertLessEqual(len(recs), CFG["params"]["rec_max"])
        self.assertNotIn("s_age", recs)


def make_ktut(n=60):
    for code in REGIONS:
        Region.objects.get_or_create(code=code, defaults={"name": code})
    common = {f: "x" for f in ("type", "type_ru", "type_cry", "srok", "srok_uz", "srok_ru", "srok_cry", "formsname",
                               "formsname_uz", "formsname_ru", "formsname_cry")}
    monthly = ReportList.objects.create(id="M1", type_uz="Oylik", deadline=date(2025, 1, 31), report_type="monthly", **common)
    for i in range(n):
        Ktut.objects.create(inn=f"5{i:08d}", okpo=str(i), name=f"Korxona {i}")
    KtutReportList.objects.create(ktut_id="500000000", reportlist=monthly)
    cat = IndustrialProductCategory.objects.create(name_uz="Sanoat")
    IndustrialProduct.objects.create(inn="500000001", name="Korxona 1", category=cat, skp=Skp.objects.create(code="1"))


def run_seeder():
    from apps.common.seeders.enterprise_scoring import EnterpriseScoringSeeder

    EnterpriseScoringSeeder().seed()


class SeederTests(TestCase):
    """KR-30, KR-32: real KTUT'ga yozish, takrorlanuvchanlik, real maydonlar, --flush."""

    def setUp(self):
        cache.clear()
        make_ktut()

    def _snapshot(self):
        return list(EnterpriseIndicator.objects.filter(is_synthetic=True).order_by("stir", "year")
                    .values_list("stir", "year", "oked_section", "employees", "revenue", "avg_wage", "reports_due"))

    def test_seed_twice_same_and_flush(self):
        from apps.common.seeders.enterprise_scoring import EnterpriseScoringSeeder

        run_seeder()
        first = self._snapshot()
        self.assertTrue(first)
        self.assertTrue(SyntheticRecord.objects.filter(seed_key="enterprise_scoring:batch").exists())
        self.assertTrue(EnterpriseScore.objects.exists())
        EnterpriseScoringSeeder.flush_batch()
        self.assertEqual(EnterpriseIndicator.objects.filter(is_synthetic=True).count(), 0)
        self.assertEqual(EnterpriseScore.objects.count(), 0)
        self.assertEqual(Ktut.objects.count(), 60)          # real KTUT jadvaliga tegilmagan
        run_seeder()
        self.assertEqual(self._snapshot(), first)

    def test_real_fields_not_generated(self):
        run_seeder()
        row = EnterpriseIndicator.objects.get(stir="500000000", year=2025)
        self.assertEqual(row.reports_due, 12)               # oylik hisobot — yiliga 12 muddat (real)
        self.assertEqual(row.sources["reports_due"], "real")
        self.assertLessEqual(row.reports_on_time, 12)
        producer = EnterpriseIndicator.objects.filter(stir="500000001").first()
        self.assertEqual(producer.products_count, 1)
        self.assertEqual(producer.sources["products_count"], "real")
        self.assertIn(producer.oked_section, ("A", "B", "C"))
        score = EnterpriseScore.objects.get(stir="500000000", year=2025, preset="muvozanatli")
        self.assertEqual(score.data_source, "mixed")


@override_settings(DEBUG=True)       # demo muhit: ball hamma joyda "Namuna" bilan ochiq
class ApiTests(APITestCase):
    """KR-33: xom qiymat yo'q, preset/STIR validatsiyasi, me/, OS-18, tezlik."""

    @classmethod
    def setUpTestData(cls):
        make_ktut()
        run_seeder()
        cls.stir = EnterpriseScore.objects.filter(preset="muvozanatli", year=2025).exclude(klass="").first().stir
        cls.user = User.objects.create_user(username="cs_user", password="x")
        Organization.objects.create(user=cls.user, name="Korxona", tin=cls.stir)

    def setUp(self):
        cache.clear()

    def test_list_and_detail_have_no_raw_values(self):
        res = self.client.get("/api/analytics/company-scores/", {"stir": self.stir})
        self.assertEqual(res.status_code, 200, res.content)
        item = res.json()["items"][self.stir]
        self.assertTrue(item["is_synthetic"])
        self.assertNotIn("pillars", item)                    # KR-39: ro'yxatda faqat 0-daraja
        self.assertNotIn("flags", item)
        detail = self.client.get(f"/api/analytics/company-scores/{self.stir}/").json()
        self.assertTrue(detail["locked"])                     # ochilmagan: faqat umumiy ball
        for key in ("pillars", "pillars_detail", "flags", "flags_detail", "indicators", "peer_label"):
            self.assertNotIn(key, detail)
        staff = User.objects.create_user(username="cs_staff", password="x", is_staff=True)
        self.client.force_authenticate(staff)
        detail = self.client.get(f"/api/analytics/company-scores/{self.stir}/").json()
        text = str(detail)
        for raw in ("'value'", "'median'", "revenue", "net_profit", "avg_wage", "tax_debt_amount", "'v':", "'m':"):
            self.assertNotIn(raw, text)
        self.assertIn("peer_label", detail)
        self.assertNotIn("recommendations", detail)

    def test_validation(self):
        self.assertEqual(self.client.get("/api/analytics/company-scores/", {"stir": self.stir, "preset": "x"}).status_code, 400)
        many = ",".join(f"{i:09d}" for i in range(101))
        self.assertEqual(self.client.get("/api/analytics/company-scores/", {"stir": many}).status_code, 400)

    def test_me_has_values_and_recommendations(self):
        self.client.force_authenticate(self.user)
        data = self.client.get("/api/analytics/company-scores/me/").json()
        self.assertEqual(data["stir"], self.stir)
        self.assertIn("recommendations", data)
        self.assertTrue(any("value" in i for i in data["indicators"]))

    @override_settings(DEBUG=False)
    def test_os18_closed_by_default(self):
        self.assertEqual(self.client.get(f"/api/analytics/company-scores/{self.stir}/").status_code, 404)
        self.assertEqual(self.client.get("/api/analytics/company-scores/", {"stir": self.stir}).json()["items"], {})
        self.assertEqual(self.client.get("/api/analytics/company-scores/distribution/").status_code, 200)
        self.client.force_authenticate(self.user)       # o'z korxonasi — ko'rinadi
        self.assertEqual(self.client.get(f"/api/analytics/company-scores/{self.stir}/").status_code, 200)

    def test_batch_100_is_fast(self):
        stirs = list(EnterpriseScore.objects.filter(preset="muvozanatli", year=2025).values_list("stir", flat=True)[:100])
        self.client.get("/api/analytics/company-scores/", {"stir": ",".join(stirs)})
        cache.clear()
        t = time.perf_counter()
        res = self.client.get("/api/analytics/company-scores/", {"stir": ",".join(stirs)})
        self.assertEqual(res.status_code, 200)
        self.assertLess((time.perf_counter() - t) * 1000, 200)

    def test_distribution_and_methodology(self):
        d = self.client.get("/api/analytics/company-scores/distribution/").json()
        self.assertEqual(len(d["histogram"]), 10)
        self.assertEqual(sum(c["count"] for c in d["classes"]), d["scored"])
        m = self.client.get("/api/analytics/company-scores/methodology/").json()
        self.assertEqual(len(m["presets"]), 5)

    def test_partners_klass_filter_and_ordering(self):
        cat = IndustrialProductCategory.objects.first()
        skp = Skp.objects.first()
        scored = list(EnterpriseScore.objects.filter(preset="muvozanatli", year=2025).exclude(klass="")
                      .order_by("-overall").values_list("stir", "klass")[:5])
        for stir, _k in scored:
            IndustrialProduct.objects.get_or_create(inn=stir, defaults={"name": f"K {stir}", "category": cat, "skp": skp})
        res = self.client.get("/api/additional-services/partners/search/", {"ordering": "-score"}).json()
        values = [r["score"]["overall"] for r in res["results"] if r["score"] and r["score"]["overall"] is not None]
        self.assertEqual(values, sorted(values, reverse=True))
        klass = scored[0][1]
        res = self.client.get("/api/additional-services/partners/search/", {"klass": klass}).json()
        self.assertTrue(res["results"])
        self.assertTrue(all(r["score"]["klass"] == klass for r in res["results"]))


class ValidateCommandTests(TestCase):
    """KR-38: hisobot yoziladi."""

    def test_report(self):
        from .management.commands.validate_company_scoring import build_report
        from .models import CompanyScoringReport

        make_ktut()
        run_seeder()
        report = build_report()
        self.assertIn("preset_class_change_pct", report)
        self.assertIn("fairness", report)
        self.assertEqual(CompanyScoringReport.objects.count(), 1)
