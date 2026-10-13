from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.book_market.models import OrderBook
from apps.common.models import District, Region
from apps.contracts.models import Contract
from apps.organizations.models import Organization
from apps.payment.models import Transaction
from apps.services.models import (
    ActivityPlans,
    PackageService,
    PackageServiceItem,
    Service,
    ServicePackage,
    UserServicePackage,
    UserServicePackageItemUse,
)


class CabinetBase(APITestCase):
    def setUp(self):
        self.region = Region.objects.create(name="R", code="1")
        self.district = District.objects.create(name="D", region=self.region, code="11")
        self.user = User.objects.create_user(username="cab_user", password="x", location=self.district)
        self.other = User.objects.create_user(username="cab_other", password="x")
        self.package = ServicePackage.objects.create(name_uz="Start", name_ru="S", name_cry="S")
        ps = PackageService.objects.create(name_uz="<p>E-kitob</p>", name_ru="E", name_cry="E")
        self.psi = PackageServiceItem.objects.create(package=self.package, package_service=ps, name_uz="E-kitob",
                                                     name_ru="E", name_cry="E", limit=10)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user.tokens['access']}")


class CabinetSummaryTests(CabinetBase):
    url = "/api/accounts/me/summary/"

    def test_without_package(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIsNone(response.data["package"])
        self.assertEqual(response.data["limits"], [])
        self.assertEqual(len(response.data["usage_by_month"]), 6)

    def test_with_package_counts_only_own_usage(self):
        usp = UserServicePackage.objects.create(region=self.region, district=self.district, year=2026, month=1,
                                                service=self.package, created_by_user=self.user)
        for _ in range(3):
            UserServicePackageItemUse.objects.create(usp=usp, psi=self.psi, is_success=True)
        other_usp = UserServicePackage.objects.create(region=self.region, district=self.district, year=2026, month=1,
                                                      service=self.package, created_by_user=self.other)
        UserServicePackageItemUse.objects.create(usp=other_usp, psi=self.psi, is_success=True)
        Contract.objects.create(contract_number="C-1", user=self.user, package=self.package, status="processing")

        data = self.client.get(self.url).data
        self.assertEqual(data["package"]["name_uz"], "Start")
        self.assertEqual(data["limits"], [{"id": self.psi.id, "name_uz": "E-kitob",
                                           "package_service_id": self.psi.package_service_id, "limit": 10, "used": 3}])
        self.assertEqual(data["contracts"], {"total": 1, "by_status": {"processing": 1}})
        self.assertEqual(sum(m["count"] for m in data["usage_by_month"]), 3)
        self.assertTrue(data["recent_activity"])


class MyPaymentsTests(CabinetBase):
    url = "/api/accounts/me/payments/"

    def test_lists_only_own_transactions(self):
        own_order = OrderBook.objects.create(user=self.user, total_amount=Decimal("5000"), provider="click")
        other_order = OrderBook.objects.create(user=self.other, total_amount=Decimal("7000"))
        ct = ContentType.objects.get_for_model(OrderBook)
        Transaction.objects.create(transaction_id="1", amount=Decimal("5000"), status="paid", content_type=ct, object_id=own_order.id)
        Transaction.objects.create(transaction_id="2", amount=Decimal("7000"), status="paid", content_type=ct, object_id=other_order.id)

        data = self.client.get(self.url).data
        self.assertEqual(len(data), 1)
        self.assertEqual(data[0]["purpose"], "book")
        self.assertEqual(data[0]["amount"], "5000.00")

    def test_empty(self):
        self.assertEqual(self.client.get(self.url).data, [])


class ActivityPlanTests(CabinetBase):
    def test_own_district_plans(self):
        owner = User.objects.create_user(username="svc_owner", password="x")
        org = Organization.objects.create(user=owner, name="O", tin="300000001")
        service = Service.objects.create(name_uz="S", name_ru="S", name_cry="S", contact="1", organization=org)
        ActivityPlans.objects.create(region=self.region, district=self.district, year=2026, month=3,
                                     service=service, plan_count=5, created_by_user=self.other)
        other_district = District.objects.create(name="D2", region=self.region, code="12")
        ActivityPlans.objects.create(region=self.region, district=other_district, year=2026, month=3,
                                     service=service, plan_count=7, created_by_user=self.other)

        data = self.client.get("/api/services/activity-plans/", {"year": 2026}).data
        self.assertEqual([p["plan_count"] for p in data], [5])
        self.assertEqual(data[0]["service_name"], "S")
