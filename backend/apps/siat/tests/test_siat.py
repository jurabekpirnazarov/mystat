"""SIAT_KARTA_TAHLIL.md KR-01..KR-05, KR-10, KR-14 testlari.

Fixture'lar — haqiqiy SIAT fayllari (CC BY 4.0), hajmi uchun davr ustunlari qisqartirilgan va xodimlar
kontaktlari olib tashlangan.
"""
import copy
import json
import os
from datetime import timedelta
from unittest import mock

from django.core.cache import cache
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.notifications.models import Notification

from .. import client
from ..classify import classify, region_in_title, strip_region
from ..management.commands.build_map_boundaries import area_km2, name_key
from ..models import SiatIndicator, SiatValue, Territory
from ..normalize import clean_name, extract_rows, normalize_period, parse_columns, preliminary_years
from ..quality import check_all
from ..sync import load_payload, rebuild_derived, rebuild_groups, run_sync, sync_indicator, _indicator_for

FIXTURES = os.path.join(os.path.dirname(__file__), "fixtures")


def fixture(siat_id):
    with open(os.path.join(FIXTURES, f"sdmx_data_{siat_id}.json"), encoding="utf-8") as fh:
        return json.load(fh)


def load(siat_id, **extra):
    indicator = load_payload(_indicator_for(siat_id), fixture(siat_id))
    if extra:
        SiatIndicator.objects.filter(pk=indicator.pk).update(**extra)
        indicator.refresh_from_db()
    return indicator


def values(siat_id, code, breakdown=""):
    return dict(SiatValue.objects.filter(indicator__siat_id=siat_id, territory_code=code, breakdown=breakdown)
                .values_list("period", "value"))


class NormalizeTests(TestCase):
    def test_period_keys(self):
        """N3: kirill "М" va lotin "M" bitta davr; N4: `2023.1` davr emas."""
        self.assertEqual(normalize_period("2010-М01"), "2010-01")  # kirill М
        self.assertEqual(normalize_period("2010-M01"), "2010-01")
        self.assertEqual(normalize_period("2025"), "2025")
        self.assertEqual(normalize_period("2025-Q3"), "2025-Q3")
        self.assertIsNone(normalize_period("2023.1"))
        self.assertIsNone(normalize_period("2010-M13"))

    def test_mixed_cyrillic_and_latin_month_keys_are_one_period(self):
        rows = [{"Code": "1700", "2010-М01": 101.1, "2010-M01": None, "2010-M02": 100.5}]
        result, periods, _ = extract_rows(rows, rate=True)
        self.assertEqual(periods, ["2010-01", "2010-02"])
        self.assertEqual(result[0]["values"]["2010-01"], 101.1)

    def test_1285_cyrillic_months(self):
        x = fixture(1285)[0]
        self.assertTrue(any("М" in k for k in x["data"][0]))  # haqiqiy faylda kirill М bor
        _, periods, _ = extract_rows(x["data"], rate=True)
        self.assertEqual(periods[:2], ["2010-01", "2010-02"])
        self.assertEqual(len(periods), len(set(periods)))

    def test_2599_duplicate_column_dropped(self):
        rows = fixture(2599)[0]["data"]
        self.assertIn("2023.1", rows[0])
        mapping, issues = parse_columns(rows)
        self.assertNotIn("2023.1", mapping)
        self.assertTrue(any("2023.1" in i and "2024" in i for i in issues))
        _, periods, _ = extract_rows(rows)
        self.assertEqual(periods, sorted(periods))

    def test_zero_before_positive_is_missing(self):
        """N2: 1875 — Ko'kdala (2023-yilda tuzilgan) 2010–2022 `missing`, Bo'zatov 2010–2019."""
        result, _, _ = extract_rows(fixture(1875)[0]["data"], rate=True)
        rows = {r["code"]: r["values"] for r in result}
        kokdala = rows["1710240"]
        self.assertTrue(all(kokdala[str(y)] is None for y in range(2010, 2023)))
        self.assertIsNotNone(kokdala["2023"])
        self.assertIsNone(rows["1735209"]["2019"])
        self.assertIsNotNone(rows["1735209"]["2020"])

    def test_zero_is_value_flag(self):
        rows = [{"Code": "1703", "2020": 0.0, "2021": 5.0}]
        self.assertIsNone(extract_rows(rows)[0][0]["values"]["2020"])
        self.assertEqual(extract_rows(rows, zero_is_value=True)[0][0]["values"]["2020"], 0.0)

    def test_clean_name(self):
        """N1: aralash harflar, apostroflar, qo'sh bo'shliq, yopishgan "city"."""
        self.assertEqual(clean_name("Aмударё"), "Амударё")  # lotin A kirill so'z ichida
        self.assertEqual(clean_name("Улугноpский"), "Улугнорский")
        self.assertEqual(clean_name("Qarshi  shahri"), "Qarshi shahri")
        self.assertEqual(clean_name("Khanabadcity"), "Khanabad city")
        self.assertEqual(clean_name("Bo`zatov tumani"), "Boʻzatov tumani")
        self.assertEqual(clean_name("Tuproqqal'a"), "Tuproqqal’a")

    def test_preliminary_years(self):
        years, conflict = preliminary_years({"uz": "2023 yillik yakuniy ko'rsatkichlar, 2024 yillar dastlabki ma'lumotlar"})
        self.assertEqual(years, {2024})
        self.assertFalse(conflict)
        # N9: tillar bo'yicha zid — hammasi belgilanadi
        years, conflict = preliminary_years({"uz": "2024-yil uchun dastlabki", "ru": "2025 год — предварительные данные"})
        self.assertEqual(years, {2024, 2025})
        self.assertTrue(conflict)


class ClassifyTests(TestCase):
    def test_acceptance(self):
        """KR-02 qabul mezonlari: 246, 500, 1875 -> district; 660 -> region; 582 -> country; 2599, 712 -> kartaga emas."""
        for siat_id in (246, 500, 1875):
            self.assertEqual(classify(fixture(siat_id)[0]["data"]), ("district", "territory"), siat_id)
        self.assertEqual(classify(fixture(660)[0]["data"])[0], "region")
        self.assertEqual(classify(fixture(582)[0]["data"])[0], "country")
        self.assertEqual(classify(fixture(2599)[0]["data"]), ("none", "activity"))
        self.assertEqual(classify(fixture(712)[0]["data"]), ("none", "activity"))
        self.assertEqual(classify(fixture(1285)[0]["data"])[0], "none")

    def test_region_tables(self):
        self.assertEqual(region_in_title("Andijon viloyatida iqtisodiy faoliyat turlari bo‘yicha sanoat")[0], "1703")
        self.assertEqual(region_in_title("Toshkent shahrida sanoat")[0], "1726")
        self.assertEqual(region_in_title("Toshkent viloyatida sanoat")[0], "1727")
        self.assertEqual(strip_region("Iqtisodiy faoliyat turlari bo'yicha investitsiyalar (Qoraqalpog`iston Respublikasi, yillik)"),
                         "Iqtisodiy faoliyat turlari boʻyicha investitsiyalar (yillik)")


class LoadTests(TestCase):
    def test_load_district_indicator(self):
        indicator = load(1875)
        self.assertEqual(indicator.geo_level, "district")
        self.assertEqual(indicator.preliminary_periods, [2024, 2025])
        self.assertTrue(indicator.show_on_map)  # boshlang'ich ro'yxatda
        self.assertEqual(Territory.objects.filter(level="region").count(), 14)
        self.assertEqual(Territory.objects.get(soato="1710240").parent_id, "1710")
        self.assertEqual(Territory.objects.get(soato="1703408").kind, "city")
        self.assertIsNone(values(1875, "1710240")["2015"])
        self.assertTrue(SiatValue.objects.get(indicator=indicator, territory_code="1703", period="2025").is_preliminary)

    def test_country_and_activity_never_on_map(self):
        """N6, N7: hudud kesimi yo'q ko'rsatkich kartaga chiqmaydi (admin belgilagan bo'lsa ham)."""
        self.assertFalse(load(582).show_on_map)
        indicator = _indicator_for(712)
        indicator.show_on_map = True
        indicator = load_payload(indicator, fixture(712))
        self.assertFalse(indicator.show_on_map)
        self.assertEqual(indicator.breakdowns.count(), len(fixture(712)[0]["data"]))

    def test_bad_payload(self):
        with self.assertRaises(client.SiatError):
            load_payload(_indicator_for(1), {"foo": 1})


class SyncTests(TestCase):
    def info(self, updated="2026-04-20T10:00:00+05:00"):
        return {"updated_at": updated, "file": "https://api.siat.stat.uz/media/uploads/sdmx/sdmx_data_1875.json"}

    def test_unchanged_is_not_downloaded_again(self):
        """KR-01: ikkinchi yugurishda o'zgarmagan ko'rsatkich qayta yuklanmaydi."""
        with mock.patch.object(client, "file_info", return_value=self.info()), \
                mock.patch.object(client, "download", return_value=fixture(1875)) as download:
            self.assertEqual(sync_indicator(1875), "updated")
            self.assertEqual(sync_indicator(1875), "unchanged")
            self.assertEqual(download.call_count, 1)
        with mock.patch.object(client, "file_info", return_value=self.info("2026-05-01T10:00:00+05:00")), \
                mock.patch.object(client, "download", return_value=fixture(1875)) as download:
            self.assertEqual(sync_indicator(1875), "updated")
            self.assertEqual(download.call_count, 1)

    def test_network_error_keeps_old_data(self):
        """SIAT ishlamay qolsa bazadagi ma'lumot o'zgarmaydi, xato admin'da ko'rinadi."""
        load(1875)
        before = SiatValue.objects.count()
        with mock.patch.object(client, "file_info", side_effect=client.SiatError("timeout")):
            log = run_sync(ids=[1875], trigger="test")
        self.assertEqual(log.failed, 1)
        self.assertEqual(SiatValue.objects.count(), before)
        self.assertIn("timeout", SiatIndicator.objects.get(siat_id=1875).last_error)

    def test_http_links_are_forced_to_https(self):
        """N10"""
        self.assertEqual(client.https("http://api.siat.stat.uz/media/x.json"), "https://api.siat.stat.uz/media/x.json")
        with self.assertRaises(client.SiatError):
            client.download("https://evil.example.com/x.json")


class GroupAndDerivedTests(TestCase):
    def test_region_tables_become_one_indicator(self):
        load(4604)
        load(4605)
        group = rebuild_groups()[0]
        self.assertEqual(group.key, "industry-by-activity")
        self.assertEqual(set(group.values.values_list("territory_code", flat=True)), {"1735", "1703"})
        self.assertTrue(group.breakdowns.exists())
        self.assertNotIn("Qoraqalpog", group.name_uz)
        self.assertTrue(all(len(p) == 4 for p in group.values.values_list("period", flat=True)))

    def test_duplicate_region_tables_are_skipped(self):
        """SIAT'da 2601 va 2603 ikkalasi "Qashqadaryo" deb nomlangan: qaysi biri to'g'ri — noma'lum."""
        load(2599)
        payload = copy.deepcopy(fixture(2599))
        for item in payload[0]["metadata"]:
            if str(item.get("name_en", "")).lower().startswith("indicator name"):
                item["value_uz"] = item["value_uz"].replace("Qoraqalpog`iston Respublikasi", "Andijon viloyati")
        load_payload(_indicator_for(2600), payload)
        load_payload(_indicator_for(2601), payload)
        group = next(g for g in rebuild_groups() if g.key == "investment-by-activity")
        self.assertEqual(set(group.values.values_list("territory_code", flat=True)), {"1735"})
        self.assertTrue(any("2600, 2601" in i for i in group.quality_issues))

    def test_derived(self):
        """KR-10: qishloq aholisi ulushi, gender nisbati, zichlik (maydon chegaralar faylidan)."""
        for siat_id in (246, 245, 247):
            load(siat_id)
        Territory.objects.filter(soato="1735").update(area_km2=1000.0)
        rebuild_derived()
        share = SiatValue.objects.get(indicator__key="d-rural-share", territory_code="1735", period="2026").value
        total, rural = values(246, "1735")["2026"], values(247, "1735")["2026"]
        self.assertAlmostEqual(share, rural / total * 100, places=2)
        density = SiatValue.objects.get(indicator__key="d-density", territory_code="1735", period="2026").value
        self.assertAlmostEqual(density, total * 1000 / 1000.0, places=1)
        self.assertTrue(SiatValue.objects.filter(indicator__key="d-gender-ratio").exists())
        self.assertIn("SIAT 247 / 246", SiatIndicator.objects.get(key="d-rural-share").derived_from)


class QualityTests(TestCase):
    def test_stale_and_missing(self):
        """KR-14: 12 oydan beri yangilanmagan, yetishmayotgan hudud; staff'ga xabar."""
        staff = User.objects.create_user(username="siat_admin", password="x", is_staff=True)
        load(246)
        indicator = load(1875, source_updated_at=timezone.now() - timedelta(days=400))
        SiatValue.objects.filter(indicator=indicator, territory_code="1703401", period="2025").update(value=None)
        check_all()
        indicator.refresh_from_db()
        text = "\n".join(indicator.quality_issues)
        self.assertIn("12 oydan beri", text)
        self.assertIn("Andijon shahri", text)
        self.assertTrue(Notification.objects.filter(recipient=staff, title__startswith="SIAT").exists())
        # Takroriy tekshiruvda yangi xabar yuborilmaydi
        check_all()
        self.assertEqual(Notification.objects.filter(recipient=staff).count(), 1)


class MapApiTests(APITestCase):
    def setUp(self):
        cache.clear()
        for siat_id in (246, 1875, 660, 582):
            load(siat_id)

    def test_indicators_catalog(self):
        data = self.client.get("/api/common/map/indicators/").json()
        keys = {i["key"]: i for i in data["indicators"]}
        self.assertIn("1875", keys)
        self.assertNotIn("582", keys)  # N7: faqat respublika
        self.assertEqual(keys["660"]["geo_level"], "region")
        self.assertEqual(keys["1875"]["siat_url"], "https://siat.stat.uz/data/1875/")
        self.assertEqual(data["source"]["license"], "CC BY 4.0")

    def test_missing_is_null_not_zero(self):
        """KR-05/KR-06: 1875, 2015-yil — Ko'kdala `null`, legendada "Ma'lumot yo'q"."""
        r = self.client.get("/api/common/map/values/", {"indicator": "1875", "period": "2015", "level": "district",
                                                        "parent": "1710"})
        self.assertEqual(r.status_code, 200)
        item = next(i for i in r.data["items"] if i["code"] == "1710240")
        self.assertIsNone(item["value"])
        self.assertTrue(item["missing"])
        self.assertTrue(all(i["code"].startswith("1710") for i in r.data["items"]))
        self.assertEqual(r.data["parent"]["code"], "1710")

    def test_republic_not_in_items(self):
        """N5: respublika qiymati alohida, shkalaga kirmaydi."""
        r = self.client.get("/api/common/map/values/", {"indicator": "660"})
        self.assertNotIn("1700", [i["code"] for i in r.data["items"]])
        self.assertEqual(len(r.data["items"]), 14)
        self.assertIsNotNone(r.data["republic"])
        self.assertLess(r.data["scale"]["max"], 10 ** 9)
        self.assertEqual(len(r.data["scale"]["quantiles"]), 4)
        self.assertEqual(r.data["period"], r.data["periods"][-1])
        # 660 izohida "2024-yil uchun dastlabki ma'lumotlar"
        self.assertTrue(self.client.get("/api/common/map/values/", {"indicator": "660", "period": "2024"}).data["preliminary"])

    def test_level_validation(self):
        self.assertEqual(self.client.get("/api/common/map/values/", {"indicator": "660", "level": "district"}).status_code, 400)
        self.assertEqual(self.client.get("/api/common/map/values/", {"indicator": "582"}).status_code, 404)
        self.assertEqual(self.client.get("/api/common/map/values/", {"indicator": "1875", "period": "1999"}).status_code, 404)

    def test_territory_card(self):
        r = self.client.get("/api/common/map/territory/1710/")
        self.assertEqual(r.status_code, 200)
        card = {i["key"]: i for i in r.data["indicators"]}
        self.assertEqual(card["1875"]["of"], 14)
        self.assertIsNotNone(card["1875"]["rank"])
        self.assertTrue(card["1875"]["series"])
        district = self.client.get("/api/common/map/territory/1710240/").data
        self.assertEqual(district["parent"]["soato"], "1710")
        self.assertNotIn("660", {i["key"] for i in district["indicators"]})  # viloyat ko'rsatkichi tumanda yo'q
        self.assertEqual(self.client.get("/api/common/map/territory/1700/").status_code, 404)

    def test_lang_and_cache_invalidation(self):
        ru = self.client.get("/api/common/map/values/", {"indicator": "660", "lang": "ru"}).data
        self.assertTrue(any("область" in i["name"] for i in ru["items"]))
        self.client.get("/api/common/map/values/", {"indicator": "660"})
        SiatValue.objects.filter(indicator__siat_id=660, territory_code="1703").update(value=1.0)
        cached = self.client.get("/api/common/map/values/", {"indicator": "660"}).data
        self.assertNotEqual(next(i for i in cached["items"] if i["code"] == "1703")["value"], 1.0)
        from ..sync import bump_cache
        bump_cache()
        fresh = self.client.get("/api/common/map/values/", {"indicator": "660"}).data
        self.assertEqual(next(i for i in fresh["items"] if i["code"] == "1703")["value"], 1.0)

    def test_export(self):
        """KR-12: CSV (BOM) va XLSX, manba qatori bilan."""
        r = self.client.get("/api/common/map/values/", {"indicator": "660", "export": "csv"})
        self.assertEqual(r.status_code, 200)
        text = r.content.decode("utf-8")
        self.assertTrue(text.startswith("﻿"))
        self.assertIn("CC BY 4.0", text)
        self.assertIn("1703,", text)
        r = self.client.get("/api/common/map/values/", {"indicator": "660", "export": "xlsx"})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.content.startswith(b"PK"))

    def test_territories_search_list(self):
        items = self.client.get("/api/common/map/territories/").data["items"]
        kokdala = next(i for i in items if i["code"] == "1710240")
        self.assertEqual(set(kokdala["names"]), {"uz", "ru", "en", "uzc"})


class BoundaryTests(TestCase):
    def test_name_key_transliterations(self):
        self.assertEqual(name_key("Khanabad city"), name_key("Xonobod shahri"))
        self.assertEqual(name_key("Dzharkurgan"), name_key("Jarqoʻrgʻon tumani"))
        self.assertEqual(name_key("Kattakurgan"), name_key("Kattaqoʻrgʻon tumani"))

    def test_area(self):
        # 1° x 1° kvadrat ekvator yaqinida ~ 12 364 km²
        square = {"type": "Polygon", "coordinates": [[[0, 0], [1, 0], [1, 1], [0, 1], [0, 0]]]}
        self.assertAlmostEqual(area_km2(square), 12364, delta=60)

    def test_geojson_files_have_soato(self):
        """KR-04: frontend/public/geo fayllarida har feature'da SOATO, viloyatlar to'liq."""
        base = os.path.join(os.path.dirname(__file__), "..", "..", "..", "..", "frontend", "public", "geo")
        if not os.path.exists(base):
            self.skipTest("frontend papkasi yo'q (faqat backend konteyneri)")
        with open(os.path.join(base, "regions.geojson"), encoding="utf-8") as fh:
            regions = json.load(fh)["features"]
        with open(os.path.join(base, "districts.geojson"), encoding="utf-8") as fh:
            districts = json.load(fh)["features"]
        self.assertEqual(len({f["properties"]["soato"] for f in regions}), 14)
        codes = [f["properties"]["soato"] for f in districts]
        self.assertEqual(len(codes), len(set(codes)))
        self.assertTrue(all(len(c) == 7 and c.startswith("17") for c in codes))
