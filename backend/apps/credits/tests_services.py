"""KR-41/OS-21: benchmark, bozor tahlili, hamkor eksporti va konsultatsiya StatCoin bilan to'lanadi; paket limiti
qolgan eski paket egalarining huquqi saqlanadi."""
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.services import limits
from apps.services.models import PackageService, PackageServiceItem, UserServicePackage, UserServicePackageItemUse

from . import service
from .models import CreditLedger, CreditPrice
from .tests import make_wallet
from .tests_packages import activate, make_package


class StatCoinChargeTests(TestCase):
    def setUp(self):
        self.user, self.wallet = make_wallet(plan="", amount=10)

    def test_default_prices_exist(self):
        codes = set(CreditPrice.objects.filter(is_active=True).values_list("action_code", flat=True))
        self.assertTrue({"benchmark", "market_report", "partners_export", "consultation"} <= codes)

    def test_consume_charges_statcoin(self):
        usage = limits.consume(self.user, "benchmark", {"year": 2025})
        self.assertEqual(usage["statcoin"]["charged"], 1.0)
        self.assertEqual(service.balance(self.wallet), Decimal("9"))

    def test_once_per_day_does_not_charge_twice(self):
        limits.consume(self.user, "benchmark", {"year": 2025}, once_per_day=True)
        again = limits.consume(self.user, "benchmark", {"year": 2025}, once_per_day=True)
        self.assertEqual(again["statcoin"]["charged"], 0.0)
        limits.consume(self.user, "benchmark", {"year": 2024}, once_per_day=True)     # boshqa so'rov — to'lanadi
        self.assertEqual(service.balance(self.wallet), Decimal("8"))

    def test_insufficient_statcoin_returns_402_and_keeps_balance(self):
        with self.assertRaises(limits.StatCoinRequired) as ctx:
            limits.consume(self.user, "consultation", {"slot": 1})     # 5 StatCoin, balans 10 -> 2 marta
            limits.consume(self.user, "consultation", {"slot": 2})
            limits.consume(self.user, "consultation", {"slot": 3})
        self.assertEqual(ctx.exception.status_code, 402)
        self.assertEqual(ctx.exception.detail["upgrade_url"], "/tariffs")
        self.assertEqual(service.balance(self.wallet), Decimal("0"))

    def test_inactive_price_falls_back_to_package_limit(self):
        CreditPrice.objects.filter(action_code="benchmark").update(is_active=False)
        usage = limits.consume(self.user, "benchmark", {"year": 2025})     # PackageService sozlanmagan -> limitsiz
        self.assertFalse(usage["configured"])
        self.assertEqual(service.balance(self.wallet), Decimal("10"))

    def test_limit_status_reports_price_and_balance(self):
        st = limits.limit_status(self.user, "partners-export")
        self.assertEqual(st["statcoin"], {"price": 2.0, "balance": 10.0})

    def test_refund_is_idempotent(self):
        limits.consume(self.user, "consultation", {"slot": 7})
        self.assertEqual(service.balance(self.wallet), Decimal("5"))
        self.assertTrue(limits.refund_statcoin(self.user, "consultation", {"slot": 7}))
        self.assertFalse(limits.refund_statcoin(self.user, "consultation", {"slot": 7}))   # ikkinchi marta qaytmaydi
        self.assertEqual(service.balance(self.wallet), Decimal("10"))
        limits.consume(self.user, "consultation", {"slot": 7})                              # qayta band qilish
        limits.refund_statcoin(self.user, "consultation", {"slot": 7})
        self.assertEqual(service.balance(self.wallet), Decimal("10"))                       # ortiqcha qaytmaydi
        self.assertEqual(CreditLedger.objects.filter(kind="refund").count(), 2)


class LegacyPackageEntitlementTests(TestCase):
    def setUp(self):
        self.user, self.wallet = make_wallet(plan="", amount=10)
        self.ps = PackageService.objects.create(name_uz="Benchmark", name_ru="B", name_cry="B", slug="benchmark")
        self.package = make_package("Eski", kind="", amount=0, plan="")
        PackageServiceItem.objects.create(package=self.package, package_service=self.ps, name_uz="b", name_ru="b",
                                          name_cry="b", limit=1)
        self.usp = activate(self.user, self.package)

    def test_package_limit_used_first_then_statcoin(self):
        first = limits.consume(self.user, "benchmark", {"year": 1})
        self.assertEqual((first["limit"], first["used"]), (1, 1))
        self.assertEqual(service.balance(self.wallet), Decimal("10"))        # StatCoin tegilmadi
        second = limits.consume(self.user, "benchmark", {"year": 2})         # limit tugadi -> StatCoin
        self.assertEqual(second["statcoin"]["charged"], 1.0)
        self.assertEqual(service.balance(self.wallet), Decimal("9"))
        self.assertEqual(UserServicePackageItemUse.objects.filter(usp=self.usp).count(), 1)

    def test_tariff_compare_exposes_statcoin_services(self):
        from rest_framework.test import APIClient
        data = APIClient().get("/api/services/tariff-compare/").json()
        slugs = {s["slug"] for s in data["statcoin_services"]}
        self.assertEqual(slugs, {"benchmark", "market-report", "partners-export", "consultation"})
        self.assertIn("slug", data["rows"][0])
