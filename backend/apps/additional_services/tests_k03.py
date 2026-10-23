"""K-03 bozor tahlili: raqamlar qo'lda hisoblangan qiymatlarga teng, qisqa/to'liq versiya, kesh."""
from decimal import Decimal

from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.additional_services.models.ex_trade import SITC, Country, Product, Region, TradeData, Unit, Year
from apps.credits.testing import use_package_limits


class MarketReportTests(APITestCase):
    url = "/api/additional-services/market-report/"

    def setUp(self):
        use_package_limits()   # eski paket limiti tartibi (StatCoin yo'li: apps/credits/tests_services.py)
        cache.clear()
        self.tonne = Unit.objects.create(code="168", name="Тонна", short_name="т")
        self.piece = Unit.objects.create(code="796", name="Штуки", short_name="шт.")
        for y in (2024, 2025):
            Year.objects.create(year=y)
        region = Region.objects.create(name_uz="R", name_ru="R", name_en="R", name_cry="R", soato="1726")
        sitc = SITC.objects.create(code="0", name_uz="S", name_ru="S")
        self.ru = Country.objects.create(ctrana="643", name="RU", name_uz="Rossiya", name_ru="Р", name_en="Russia", name_cry="Р", zar="", zar0="", zar1="", kod_kont="")
        self.kz = Country.objects.create(ctrana="398", name="KZ", name_uz="Qozog'iston", name_ru="К", name_en="Kazakhstan", name_cry="К", zar="", zar0="", zar1="", kod_kont="")
        self.other = Country.objects.create(ctrana="999", name="X", name_uz="Boshqa", name_ru="Х", name_en="Other", name_cry="Х", zar="", zar0="", zar1="", kod_kont="")
        p2 = Product.objects.create(code="52", name_uz="Paxta", name_ru="Хлопок", name_cry="П", name_cry2="П", level=1)
        self.p = Product.objects.create(code="520100", name_uz="Paxta tolasi", name_ru="В", name_cry="П", name_cry2="П", parent=p2, level=3)
        self.rest = dict(product=self.p, region=region, sitc=sitc)

        def row(year, month, flow, country, value, qty, unit=None):
            TradeData.objects.create(year_id=year, month=month, trade_type=flow, country=country, value=Decimal(value),
                                     quantity=Decimal(qty), unit=unit or self.tonne, **self.rest)

        # 2024: yanvar–sentabr va to'liq yil; 2025: yanvar–sentabr
        row(2024, "M9", 1, self.ru, 100, 50)
        row(2024, "M9", 1, self.kz, 50, 25)
        row(2024, "M12", 1, self.ru, 150, 75)
        row(2025, "M9", 1, self.ru, 300, 100)
        row(2025, "M9", 1, self.kz, 100, 40)
        row(2025, "M9", 1, self.other, 100, 0, unit=self.piece)  # tonna emas — narxga kirmaydi
        row(2025, "M9", 2, self.kz, 80, 20)

    def test_numbers_match_manual_sums(self):
        data = self.client.get(self.url, {"hs": "5201"}).data
        latest = data["latest"]
        self.assertEqual((latest["year"], latest["period"]), (2025, "M9"))
        self.assertEqual(latest["export_value"], 500.0)  # 300+100+100
        self.assertEqual(latest["import_value"], 80.0)
        self.assertEqual(latest["balance"], 420.0)
        self.assertEqual(latest["compared_with"], 2024)  # 2024 ning ham yanvar–sentabri bilan
        self.assertEqual(latest["export_change_pct"], round((500 - 150) / 150 * 100, 1))
        # narx: (300+100) ming $ / 140 t = 2857.1 $/t; "dona" qatori chiqarilgan
        self.assertEqual(latest["export_price"], round(400 * 1000 / 140, 1))
        self.assertEqual(latest["export_price_coverage"], 80.0)
        self.assertEqual([c["country"] for c in data["top_export"]], ["Rossiya", "Qozog'iston"])  # 999 reytingda yo'q
        self.assertEqual(data["top_export"][0]["share"], 60.0)  # 300/500

    def test_short_version_hides_full_blocks(self):
        data = self.client.get(self.url, {"hs": "52"}).data
        self.assertFalse(data["full"])
        self.assertNotIn("growing_markets", data)
        self.assertIsNone(data["concentration"])

    def test_full_version_requires_login_and_has_hhi(self):
        self.assertEqual(self.client.get(self.url, {"hs": "52", "full": 1}).status_code, 401)
        self.client.force_authenticate(User.objects.create_user(username="mr", password="x"))
        data = self.client.get(self.url, {"hs": "52", "full": 1}).data
        # HHI faqat 999 siz hamkorlar bo'yicha: 300/400=75%, 100/400=25% -> 5625+625
        self.assertEqual(data["concentration"]["hhi"], 6250)
        self.assertTrue(data["full"])

    def test_unknown_hs_and_validation(self):
        self.assertEqual(self.client.get(self.url, {"hs": "99"}).status_code, 404)
        self.assertEqual(self.client.get(self.url, {"hs": "x"}).status_code, 400)

    def test_hs_search(self):
        self.assertEqual(self.client.get("/api/additional-services/hs-search/", {"q": "5201"}).data[0]["code"], "520100")
        self.assertEqual(self.client.get("/api/additional-services/hs-search/", {"q": "хлоп"}).data[0]["code"], "52")


class TradeExportTests(MarketReportTests):
    """U-16: eksport — CSV BOM, server chegarasi."""

    def test_export_csv_and_limit(self):
        from unittest.mock import patch
        url = "/api/additional-services/external-trade/trade-flows/export/"
        r = self.client.get(url, {"flow": "export", "year": 2025})
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.content.startswith("﻿".encode()))
        self.assertEqual(r["X-Rows"], "3")
        with patch("apps.additional_services.api_endpoints.ExternalTradeAPI.flows.EXPORT_MAX_ROWS", 2):
            r = self.client.get(url, {"flow": "export", "year": 2025, "file": "xlsx"})
        self.assertEqual((r["X-Rows"], r["X-Truncated"]), ("2", "1"))
