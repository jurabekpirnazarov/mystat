"""K-01 (rekvizit tasdig'i, prefill), K-08 (vaqt chizig'i, oldindan ko'rish), K-09 (narx) testlari."""
from decimal import Decimal
from unittest.mock import patch

from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.common.models import District, Region, Sector, SiteSettings
from apps.contracts.models import Contract, ContractStatusLog
from apps.organizations.models import Organization
from apps.services.models import (PackageService, PackageServiceItem, ServicePackage, ServicePackagePrice,
                                  UserServicePackageItemUse)
from apps.services.pricing import package_price


class Base(APITestCase):
    def setUp(self):
        settings_obj = SiteSettings.load()
        settings_obj.bhm_value = Decimal("412000")
        settings_obj.save()
        self.section = Sector.objects.create(code="C", name_uz="Sanoat")
        region = Region.objects.create(name="Test v.", code="9901")
        self.district = District.objects.create(name="Test t.", region=region, code="990101")
        self.user = User.objects.create_user(username="k_user", password="x", first_name="Ali", phone_number="+998901112233")
        self.org = Organization.objects.create(user=self.user, name="K LLC", tin="900000222", sector=self.section,
                                               district=self.district, address="Toshkent, 1-uy")
        self.package = ServicePackage.objects.create(name_uz="1 - Tarif", name_ru="1", name_cry="1", base_bhm_count=2)
        ServicePackagePrice.objects.create(service_package=self.package, sector=self.section, bhm_count=10)
        self.client.force_authenticate(self.user)


class PricingTests(Base):
    def test_price_uses_sector_multiplier(self):
        pricing = package_price(self.package, self.section)
        self.assertEqual(pricing["price"], Decimal("412000") * 2 * 10)
        self.assertEqual(pricing["total"], pricing["price"] * Decimal("1.12"))

    def test_child_sector_resolves_to_section(self):
        child = Sector.objects.create(code="C10", name_uz="Oziq-ovqat", parent=self.section)
        self.assertEqual(package_price(self.package, child)["multiplier"], 10)

    def test_compare_endpoint_matches_backend_formula(self):
        response = self.client.get("/api/services/tariff-compare/", {"sector": self.section.id})
        self.assertEqual(response.status_code, 200)
        row = next(p for p in response.data["packages"] if p["id"] == self.package.id)
        self.assertEqual(Decimal(row["pricing"]["price"]), package_price(self.package, self.section)["price"])

    def test_recommend_smallest_fitting_package(self):
        ps = PackageService.objects.create(name_uz="B", name_ru="B", name_cry="B", slug="cabinet/statistic-byulleten")
        big = ServicePackage.objects.create(name_uz="Katta", name_ru="K", name_cry="K", base_bhm_count=2)
        ServicePackagePrice.objects.create(service_package=big, sector=self.section, bhm_count=10)  # narx teng
        PackageServiceItem.objects.create(package=self.package, package_service=ps, name_uz="3", name_ru="3", name_cry="3", limit=3)
        PackageServiceItem.objects.create(package=big, package_service=ps, name_uz="7", name_ru="7", name_cry="7", limit=7)
        self.assertEqual(self.client.get("/api/services/tariff-recommend/", {"bulletins": 2}).data["package"]["id"],
                         self.package.id)
        self.assertEqual(self.client.get("/api/services/tariff-recommend/", {"bulletins": 5}).data["package"]["id"], big.id)
        self.assertIsNone(self.client.get("/api/services/tariff-recommend/", {"bulletins": 50}).data["package"])


class PreviewAndTimelineTests(Base):
    def test_preview_writes_nothing_and_calls_no_external_service(self):
        with patch("apps.contracts.api.ContractCreate.serializers.create_didox_client") as didox, \
                patch("apps.contracts.api.ContractCreate.views.send_message") as telegram:
            response = self.client.post("/api/contracts/preview/", {"service_package_id": self.package.id}, format="json")
        self.assertEqual(response.status_code, 200, response.data)
        self.assertEqual(Contract.objects.count(), 0)
        didox.assert_not_called()
        telegram.assert_not_called()
        self.assertEqual(response.data["requisites"]["tin"], "900000222")
        self.assertTrue(response.data["parts"])
        self.assertEqual(Decimal(response.data["pricing"]["price"]), Decimal("8240000"))

    def test_create_requires_requisites_confirmation(self):
        self.client.force_authenticate(None)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user.tokens['access']}")
        response = self.client.post("/api/contracts/create/", {"service_package_id": self.package.id}, format="json")
        self.assertEqual(response.status_code, 400)
        self.assertIn("requisites_confirmed", response.data)
        response = self.client.post("/api/contracts/create/", {"service_package_id": self.package.id,
                                                               "requisites_confirmed": False}, format="json")
        self.assertIn("requisites_confirmed", response.data)

    def test_status_changes_are_logged_and_timeline_follows(self):
        contract = Contract.objects.create(contract_number="K-1", user=self.user, package=self.package,
                                           total_amount=Decimal("100"))
        contract.status = "pending"
        contract.didx_contract_id = "doc-1"
        contract.save()
        contract.notes = "faqat izoh"  # holat o'zgarmadi — log yozilmaydi
        contract.save()
        contract.signed_by_client = True
        contract.save()
        self.assertEqual(list(ContractStatusLog.objects.filter(contract=contract).values_list("status", flat=True)),
                         ["created", "pending", "pending"])
        data = self.client.get(f"/api/contracts/{contract.id}/timeline/").data
        self.assertEqual(data["current"], "admin_signed")
        self.assertEqual([s["done"] for s in data["steps"]][:4], [True, True, True, False])

    def test_timeline_of_foreign_contract_is_404(self):
        other = User.objects.create_user(username="k_other", password="x")
        contract = Contract.objects.create(contract_number="K-2", user=other, package=self.package)
        self.assertEqual(self.client.get(f"/api/contracts/{contract.id}/timeline/").status_code, 404)


class PrefillTests(Base):
    url = "/api/organizations/me/prefill/"

    def test_prefill_own_organization_with_sources(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 200)
        fields = {f["field"]: f for f in response.data["fields"]}
        self.assertEqual(fields["tin"]["value"], "900000222")
        self.assertEqual(fields["org_name"]["source"], "organization")
        self.assertEqual(fields["full_name"]["source"], "profile")

    def test_prefill_does_not_consume_package_limit(self):
        self.client.get(self.url)
        self.assertEqual(UserServicePackageItemUse.objects.count(), 0)

    def test_registry_failure_does_not_break(self):
        with patch("apps.services.api.services.RegisterService.get_organization_detail", side_effect=TimeoutError):
            response = self.client.get("/api/organizations/me/registry-diff/")
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["available"])

    def test_registry_diff_and_apply_selected_fields(self):
        payload = {"name": "K LLC (yangi nom)", "address": "Toshkent, 1-uy", "director_pinfl": "12345678901234"}
        with patch("apps.services.api.services.RegisterService.__init__", return_value=None), \
                patch("apps.services.api.services.RegisterService.get_organization_detail", return_value=payload):
            diff = self.client.get("/api/organizations/me/registry-diff/").data
        self.assertEqual([d["field"] for d in diff["diff"]], ["org_name"])  # manzil bir xil, PINFL olinmaydi
        self.assertNotIn("12345678901234", str(diff))
        response = self.client.post("/api/organizations/me/registry-diff/", {"fields": ["org_name"]}, format="json")
        self.assertEqual(response.data["updated"], ["name"])
        self.org.refresh_from_db()
        self.assertEqual(self.org.name, "K LLC (yangi nom)")
