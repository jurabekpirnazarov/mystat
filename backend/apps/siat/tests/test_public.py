"""JAHON_TAJRIBASI JT-10 (e'lonlar kalendari), JT-17 (panellar), JT-02 (aholi soati), JT-15 (embed kartochka)."""
import datetime as dt

from django.core.cache import cache
from django.utils import timezone
from rest_framework.test import APITestCase

from ..models import PopulationAnchor, ReleaseEvent, SiatIndicator, SiatValue
from ..public import _add_months, _next_period, build_release_calendar

TODAY = dt.date(2026, 10, 20)


def _aware(day):
    return timezone.make_aware(dt.datetime.combine(day, dt.time(12)))


class PublicApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        cls.pop = SiatIndicator.objects.create(
            key="246", siat_id=246, kind="source", geo_level="district", theme="population", show_on_map=True,
            name_uz="Doimiy aholi soni (jami)", unit_uz="ming kishi", source_updated_at=_aware(dt.date(2026, 4, 22)))
        cls.growth = SiatIndicator.objects.create(
            key="d-pop-growth", kind="derived", geo_level="district", theme="population", show_on_map=True,
            name_uz="Aholi o'sishi", unit_uz="%", higher_is_better=True)
        cls.unemp = SiatIndicator.objects.create(
            key="1875", siat_id=1875, kind="source", geo_level="district", theme="labour", show_on_map=True,
            name_uz="Ishsizlik darajasi", unit_uz="foizda", higher_is_better=False,
            source_updated_at=_aware(dt.date(2025, 10, 1)))
        # Har viloyat jadvali (geo_level=none) kalendarga chiqmasligi kerak
        SiatIndicator.objects.create(key="4610", siat_id=4610, kind="source", geo_level="none", theme="economy",
                                     name_uz="Namangan sanoati", source_updated_at=_aware(dt.date(2026, 3, 30)))
        for period, value in (("2024", 36799.8), ("2025", 37543.2), ("2026", 38236.7)):
            SiatValue.objects.create(indicator=cls.pop, territory_code="1700", period=period, value=value)
        SiatValue.objects.create(indicator=cls.growth, territory_code="1700", period="2026", value=1.847)
        for period, value in (("2024", 5.5), ("2025", 4.8)):
            SiatValue.objects.create(indicator=cls.unemp, territory_code="1700", period=period, value=value)

    def setUp(self):
        cache.clear()

    def test_period_helpers(self):
        self.assertEqual(_next_period("2025", "Y"), "2026")
        self.assertEqual(_next_period("2025-Q4", "Q"), "2026-Q1")
        self.assertEqual(_next_period("2025-12", "M"), "2026-01")
        self.assertEqual(_add_months(dt.date(2024, 1, 31), 1), dt.date(2024, 2, 29))

    def test_calendar_estimates_from_siat_update(self):
        data = build_release_calendar("uz", TODAY)
        by_key = {i["key"]: i for i in data["upcoming"]}
        self.assertNotIn("4610", by_key)
        self.assertEqual(by_key["246"]["date"], "2027-04-22")
        self.assertEqual(by_key["246"]["kind"], "estimated")
        self.assertEqual(by_key["246"]["period"], "2027")
        # SIAT 2025-10-01 da yangilangan, kutilgan sana 2026-10-01 o'tdi — "Kutilmoqda"
        self.assertEqual(by_key["1875"]["status"], "overdue")
        # "Yaqinda yangilandi" — oxirgi 120 kun: 2026-04-22 bu oynadan tashqarida, 1-iyunda esa ichida
        self.assertNotIn("246", {i["key"] for i in data["recent"]})
        recent = build_release_calendar("uz", dt.date(2026, 6, 1))["recent"]
        self.assertIn("246", {i["key"] for i in recent})

    def test_official_date_replaces_estimate(self):
        ReleaseEvent.objects.create(indicator=self.pop, release_date=dt.date(2027, 2, 15), reference_period="2027-yil")
        data = build_release_calendar("uz", TODAY)
        rows = [i for i in data["upcoming"] if i["key"] == "246"]
        self.assertEqual(len(rows), 1)
        self.assertEqual((rows[0]["kind"], rows[0]["date"]), ("official", "2027-02-15"))

    def test_general_event_without_indicator(self):
        ReleaseEvent.objects.create(title_uz="Ro'yxat-2026 yakuniy natijalari", release_date=dt.date(2026, 12, 1))
        titles = [i["title"] for i in build_release_calendar("uz", TODAY)["upcoming"]]
        self.assertIn("Ro'yxat-2026 yakuniy natijalari", titles)

    def test_release_event_save_invalidates_cache(self):
        self.client.get("/api/common/map/releases/")
        ReleaseEvent.objects.create(title_uz="Yangi e'lon", release_date=timezone.localdate() + dt.timedelta(days=5))
        titles = [i["title"] for i in self.client.get("/api/common/map/releases/").json()["upcoming"]]
        self.assertIn("Yangi e'lon", titles)

    def test_ics_feed(self):
        res = self.client.get("/api/common/map/releases.ics")
        self.assertEqual(res.status_code, 200)
        self.assertIn("text/calendar", res["Content-Type"])
        body = res.content.decode()
        self.assertTrue(body.startswith("BEGIN:VCALENDAR"))
        self.assertIn("SUMMARY:Doimiy aholi soni (jami) (2027) — taxminiy", body)

    def test_dashboards_and_population_clock(self):
        data = self.client.get("/api/common/map/dashboards/").json()
        panels = {p["slug"]: p for p in data["panels"]}
        labour = {i["key"]: i for i in panels["labour"]["items"]}
        # Foizdagi ko'rsatkich — o'zgarish foiz punktida
        self.assertEqual((labour["1875"]["change"], labour["1875"]["change_kind"]), (-0.7, "pp"))
        pop = {i["key"]: i for i in panels["population"]["items"]}["246"]
        self.assertEqual(pop["change_kind"], "pct")
        self.assertAlmostEqual(pop["change"], 1.8, places=1)
        # Migratsiyadagi rasmiy qiymat test bazasida ham bor — SIAT varianti uchun olib tashlanadi
        PopulationAnchor.objects.all().delete()
        clock = self.client.get("/api/common/map/dashboards/").json()["population_clock"]
        self.assertEqual((clock["kind"], clock["base_at"][:10]), ("siat", "2026-01-01"))
        self.assertEqual(clock["base_population"], 38236700)
        self.assertAlmostEqual(clock["annual_growth_pct"], 1.847)

    def test_population_clock_uses_official_anchor(self):
        PopulationAnchor.objects.all().delete()
        as_of = timezone.make_aware(dt.datetime(2026, 10, 19, 9, 0))
        PopulationAnchor.objects.create(population=39_535_225, as_of=as_of, source="Qo'mita hisoblagichi")
        PopulationAnchor.objects.create(population=39_000_000, as_of=as_of - dt.timedelta(days=30))
        clock = self.client.get("/api/common/map/dashboards/").json()["population_clock"]
        self.assertEqual((clock["kind"], clock["base_population"]), ("official", 39_535_225))
        self.assertEqual(clock["base_at"], "2026-10-19T09:00:00+05:00")
        self.assertAlmostEqual(clock["annual_growth_pct"], 1.847)   # anchor'da sur'at yo'q — SIAT'dan

    def test_indicator_card(self):
        res = self.client.get("/api/common/map/card/1875/")
        self.assertEqual(res.status_code, 200)
        self.assertEqual(res.json()["value"], 4.8)
        self.assertEqual(self.client.get("/api/common/map/card/nope/").status_code, 404)


STAT_UZ_SNIPPET = """<div id="population-title"> DOIMIY AHOLI SONI </div>
<script nonce="x">
let start_date = "01.10.2026";
let population = "39535225";
let month = "39535225";
let women = 49.38;
let men = 50.62;
let sec = 1696679;
let birth_p = 30;
let death_p = 220;
let arrive_p = 85;
let depart_p = 84;
</script>"""


class PopulationSyncTests(APITestCase):
    """JT-02: stat.uz hisoblagichi bilan sinxronlash (population_sync.py)."""

    def setUp(self):
        from ..models import PopulationAnchor

        cache.clear()
        PopulationAnchor.objects.all().delete()

    def test_parse_matches_stat_uz_formula(self):
        from .. import population_sync

        d = population_sync.parse(STAT_UZ_SNIPPET)
        self.assertEqual((d["population"], d["birth"], d["death"], d["arrive"], d["depart"]), (39535225, 30, 220, 85, 84))
        self.assertEqual(d["as_of"].isoformat(), "2026-10-01T00:00:00+05:00")
        # stat.uz sahifasi ko'rsatgan raqam: 39 535 225 + 56 556 − 7 713 + 19 961 − 20 199
        self.assertEqual(d["current"], 39_583_830)

    def test_sync_creates_then_unchanged_then_new_month(self):
        from .. import population_sync
        from ..models import PopulationAnchor

        self.assertEqual(population_sync.sync(STAT_UZ_SNIPPET)["action"], "created")
        r = population_sync.sync(STAT_UZ_SNIPPET)
        self.assertEqual(r["action"], "unchanged")
        self.assertLessEqual(abs(r["diff_before"]), 3)       # soat stat.uz bilan bir xil (faqat ceil yaxlitlashi)
        nov = STAT_UZ_SNIPPET.replace("01.10.2026", "01.11.2026").replace('population = "39535225"', 'population = "39610000"')
        self.assertEqual(population_sync.sync(nov, dry_run=True)["action"], "would_create")
        self.assertEqual(PopulationAnchor.objects.count(), 1)
        self.assertEqual(population_sync.sync(nov)["action"], "created")
        self.assertEqual(PopulationAnchor.objects.first().population, 39_610_000)

    def test_clock_payload_is_linear_with_official_rates(self):
        from .. import population_sync

        population_sync.sync(STAT_UZ_SNIPPET)
        clock = self.client.get("/api/common/map/dashboards/").json()["population_clock"]
        self.assertAlmostEqual(clock["net_per_second"], 1 / 30 - 1 / 220 + 1 / 85 - 1 / 84)
        self.assertEqual(clock["base_at"], "2026-10-01T00:00:00+05:00")

    def test_broken_page_keeps_old_anchor(self):
        from .. import population_sync

        with self.assertRaises(population_sync.ParseError):
            population_sync.parse("<html>sahifa o'zgargan</html>")
