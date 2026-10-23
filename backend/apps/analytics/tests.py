import json
from decimal import Decimal

from django.test import TestCase
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.common.models import District, Region, Sector
from apps.organizations.models import Organization
from apps.services.models import (PackageService, PackageServiceItem, ServicePackage, UserServicePackage,
                                  UserServicePackageItemUse)

from .models import EnterpriseIndicator
from .stats import percentile_rank, quantile
from apps.credits.testing import use_package_limits


class StatsTests(TestCase):
    def test_quantile_linear(self):
        self.assertEqual(quantile([1, 2, 3, 4], 0.5), 2.5)
        self.assertEqual(quantile([10], 0.25), 10)
        self.assertIsNone(quantile([], 0.5))

    def test_percentile_rank(self):
        self.assertEqual(percentile_rank([1, 2, 3, 4], 5), 100.0)
        self.assertEqual(percentile_rank([1, 2, 3, 4], 0), 0.0)
        self.assertEqual(percentile_rank([1, 2, 3, 4], 2), 37.5)


class BenchmarkTests(APITestCase):
    url = "/api/analytics/benchmark/"

    def setUp(self):
        use_package_limits()   # eski paket limiti tartibi (StatCoin yo'li: apps/credits/tests_services.py)
        self.section = Sector.objects.create(code="C", name_uz="Sanoat")
        self.region = Region.objects.create(name="Test v.", code="9901")
        district = District.objects.create(name="Test t.", region=self.region, code="990101")
        self.user = User.objects.create_user(username="bm_user", password="x")
        Organization.objects.create(user=self.user, name="Bm LLC", tin="900000111", sector=self.section,
                                    district=district)
        for n in range(12):
            EnterpriseIndicator.objects.create(
                stir=f"PEER{n:05d}", year=2025, oked_section="C", region=self.region, is_peer=True,
                revenue=Decimal(1000 * (n + 1)), employees=n + 1, output_value=Decimal(500))
        EnterpriseIndicator.objects.create(stir="900000111", year=2025, oked_section="C", region=self.region,
                                           revenue=Decimal(11500), employees=10, output_value=Decimal(400))
        self.client.force_authenticate(self.user)

    def test_returns_only_aggregates(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(response.data["group"]["size"], 12)
        self.assertEqual(response.data["level"], "region")
        revenue = next(m for m in response.data["metrics"] if m["key"] == "revenue")
        self.assertEqual(revenue["median"], 6500)
        self.assertEqual(revenue["own"], 11500)
        body = json.dumps(response.data, default=str)
        self.assertNotIn("PEER", body)  # begona STIR javobga tushmaydi

    def test_small_group_falls_back_to_country(self):
        EnterpriseIndicator.objects.filter(stir__in=[f"PEER{n:05d}" for n in range(5)]).update(
            region=Region.objects.create(name="Boshqa v.", code="9902"))
        response = self.client.get(self.url)
        self.assertEqual(response.data["level"], "country")
        self.assertEqual(response.data["group"]["size"], 12)

    def test_no_organization(self):
        self.client.force_authenticate(User.objects.create_user(username="bm_none", password="x"))
        self.assertEqual(self.client.get(self.url).status_code, 404)

    def test_limit_exhausted_returns_403_with_upgrade_link(self):
        package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")
        ps = PackageService.objects.create(name_uz="Benchmark", name_ru="B", name_cry="B", slug="benchmark")
        psi = PackageServiceItem.objects.create(package=package, package_service=ps, name_uz="B", name_ru="B",
                                                name_cry="B", limit=1)
        usp = UserServicePackage.objects.create(district=District.objects.first(), year=2026, month=1,
                                                service=package, created_by_user=self.user)
        first = self.client.get(self.url)
        self.assertEqual(first.status_code, 200)
        self.assertEqual(first.data["usage"], {"configured": True, "limit": 1, "used": 1})
        # bir kunda xuddi shu hisobot qayta sanalmaydi
        self.assertEqual(self.client.get(self.url).status_code, 200)
        self.assertEqual(UserServicePackageItemUse.objects.filter(usp=usp, psi=psi).count(), 1)
        response = self.client.get(self.url, {"geo": "country"})
        self.assertEqual(response.status_code, 403)
        self.assertEqual(response.data["upgrade_url"], "/services")
