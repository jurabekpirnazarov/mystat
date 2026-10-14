from rest_framework.test import APITestCase


class StatisticClassificationApiTests(APITestCase):
    def setUp(self):
        from apps.accounts.models import User
        from apps.additional_services.models.staticclassification_model import (
            StatisticClassification, StatisticClassificationCategory,
        )
        self.cat_a = StatisticClassificationCategory.objects.create(name="A")
        cat_b = StatisticClassificationCategory.objects.create(name="B")
        common = dict(name_ru="r", name_cry="c", analog_ru="", analog_cry="", confirm_document="doc")
        StatisticClassification.objects.create(category=self.cat_a, name_uz="Kasblar", analog_uz="ISCO-08", **common)
        StatisticClassification.objects.create(category=cat_b, name_uz="Valyutalar", analog_uz="ISO 4217", **common)
        user = User.objects.create_user(username="cls_user", password="x")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user.tokens['access']}")

    def test_filter_by_category_and_search(self):
        url = "/api/additional-services/statistic-classification"
        by_cat = self.client.get(url, {"category": self.cat_a.id}).data["results"]
        self.assertEqual([r["name_uz"] for r in by_cat], ["Kasblar"])
        by_search = self.client.get(url, {"search": "4217"}).data["results"]
        self.assertEqual([r["name_uz"] for r in by_search], ["Valyutalar"])

    def test_categories_with_counts(self):
        data = self.client.get("/api/additional-services/statistic-classification/categories/").data
        self.assertEqual([(c["name"], c["items_count"]) for c in data], [("A", 1), ("B", 1)])


class TradeFlowsApiTests(APITestCase):
    url = "/api/additional-services/external-trade/trade-flows/"

    @classmethod
    def setUpTestData(cls):
        from apps.additional_services.models.ex_trade import Country, Product, Region, SITC, TradeData, Unit, Year
        y24, y25 = Year.objects.create(year=2024), Year.objects.create(year=2025)
        unit = Unit.objects.create(code="1", name="t", short_name="t")
        region = Region.objects.create(name_uz="R", name_ru="R", name_en="R", name_cry="R", soato="1726")
        product = Product.objects.create(code="520100", name_uz="Paxta", name_ru="", name_cry="", name_cry2="")
        sitc = SITC.objects.create(code="263", name_uz="Paxta", name_ru="")
        ru = Country.objects.create(ctrana="643", name_uz="Rossiya", name_en="Russia", zar0="1", zar1="1", zar="1", name="1", name_cry="", name_ru="", kod_kont="1")
        cn = Country.objects.create(ctrana="156", name_uz="Xitoy", name_en="China", zar0="1", zar1="1", zar="1", name="1", name_cry="", name_ru="", kod_kont="1")
        other = Country.objects.create(ctrana="999", name_uz="Boshqa davlatlar", name_en="Other", zar0="1", zar1="1", zar="1", name="1", name_cry="", name_ru="", kod_kont="1")
        common = dict(unit=unit, region=region, product=product, sitc=sitc, trade_type=1)
        rows = [
            (y24, "M12", ru, 100), (y24, "M12", cn, 50), (y24, "M6", ru, 40),
            (y25, "M6", ru, 60), (y25, "M6", cn, 90), (y25, "M6", other, 50), (y25, "M3", ru, 10),
        ]
        for year, month, country, value in rows:
            TradeData.objects.create(year=year, month=month, country=country, value=value, quantity=1, **common)

    def setUp(self):
        from django.core.cache import cache
        cache.clear()

    def test_uses_latest_cumulative_month_and_previous_year_same_period(self):
        data = self.client.get(self.url, {"year": 2025, "flow": "export"}).data
        self.assertEqual(data["period"], "M6")
        self.assertEqual(data["total_value"], 200.0)
        self.assertEqual(data["other_countries_value"], 50.0)
        self.assertEqual([c["country_name"] for c in data["countries"]], ["Xitoy", "Rossiya"])
        ru = data["countries"][1]
        self.assertEqual(ru["prev_value"], 40.0)  # 2024 M6, M12 emas
        self.assertAlmostEqual(ru["change_pct"], 50.0)
        self.assertAlmostEqual(data["countries"][0]["share"], 45.0)

    def test_unknown_year_and_bad_flow(self):
        self.assertEqual(self.client.get(self.url, {"year": 2019}).status_code, 404)
        self.assertEqual(self.client.get(self.url, {"flow": "x"}).status_code, 400)

    def test_dynamics(self):
        data = self.client.get(self.url + "dynamics/", {"flow": "export"}).data
        self.assertEqual([(d["year"], d["value"]) for d in data], [(2024, 150.0), (2025, 200.0)])


class DemographicsDataSourceTests(APITestCase):
    def setUp(self):
        import tempfile
        from pathlib import Path
        from unittest.mock import patch
        from apps.additional_services.api_endpoints.DemographicsAPI import writer
        self.dir = Path(tempfile.mkdtemp())
        self.real, self.synthetic = self.dir / "data.parquet", self.dir / "data.synthetic.parquet"
        for name, value in (("PARQUET_PATH", self.real), ("SYNTHETIC_PATH", self.synthetic)):
            p = patch.object(writer, name, value)
            p.start()
            self.addCleanup(p.stop)
        self.writer = writer

    def tearDown(self):
        import shutil
        shutil.rmtree(self.dir, ignore_errors=True)

    def _touch(self, path):
        import pandas as pd
        pd.DataFrame({"section": ["s"], "v": [1]}).to_parquet(path)

    def test_synthetic_is_never_used_in_production(self):
        from django.test import override_settings
        self._touch(self.synthetic)
        with override_settings(DEBUG=False):
            self.assertIsNone(self.writer.data_source())
            self.assertTrue(self.writer.read_section_df("s").empty)
        with override_settings(DEBUG=True):
            self.assertEqual(self.writer.data_source(), "synthetic")
            self.assertEqual(len(self.writer.read_section_df("s")), 1)

    def test_real_file_wins(self):
        from django.test import override_settings
        self._touch(self.synthetic)
        self._touch(self.real)
        with override_settings(DEBUG=True):
            self.assertEqual(self.writer.data_source(), "real")


class ReportCalendarTests(APITestCase):
    def setUp(self):
        from datetime import date
        from apps.additional_services.models import ReportList
        common = dict(type="t", type_ru="", type_cry="", srok="", srok_uz="", srok_ru="", srok_cry="",
                      formsname="f", formsname_uz="f", formsname_ru="", formsname_cry="")
        self.monthly = ReportList.objects.create(id="M1", type_uz="Oylik", deadline=date(2025, 1, 31), report_type="monthly", **common)
        self.quarterly = ReportList.objects.create(id="Q1", type_uz="Choraklik", deadline=date(2025, 1, 25), report_type="quarterly", **common)
        self.yearly = ReportList.objects.create(id="Y1", type_uz="Yillik", deadline=date(2025, 4, 1), report_type="yearly", **common)

    def ids(self, year, month):
        data = self.client.get("/api/additional-services/reportlist/calendar/", {"year": year, "month": month}).data
        return [(i["report_id"], i["date"]) for i in data["items"]]

    def test_recurrence(self):
        self.assertEqual(self.ids(2026, 2), [("M1", "2026-02-28")])  # oy oxiriga qisqartiriladi
        self.assertEqual(sorted(self.ids(2026, 4)), [("M1", "2026-04-30"), ("Q1", "2026-04-25"), ("Y1", "2026-04-01")])

    def test_reminder_creates_notification_once(self):
        from apps.accounts.models import User
        from apps.additional_services.tasks import report_reminder_notifications_task
        from apps.notifications.models import Notification
        user = User.objects.create_user(username="rem_user", password="x")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user.tokens['access']}")
        response = self.client.post("/api/additional-services/reportlist/Y1/remind/")
        self.assertEqual(response.status_code, 201)
        self.assertTrue(self.ids(2026, 4))

        self.assertEqual(report_reminder_notifications_task("2026-03-20"), 0)  # hali erta
        self.assertEqual(report_reminder_notifications_task("2026-03-29"), 1)  # 3 kun qoldi
        self.assertEqual(report_reminder_notifications_task("2026-03-29"), 0)  # takror yo'q
        self.assertEqual(Notification.objects.filter(recipient=user).count(), 1)

        self.client.delete("/api/additional-services/reportlist/Y1/remind/")
        self.assertEqual(report_reminder_notifications_task("2027-03-29"), 0)
