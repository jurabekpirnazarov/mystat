from rest_framework.test import APITestCase


class ServiceRequestCreateTests(APITestCase):
    url = "/api/services/service-request/"

    def setUp(self):
        from apps.accounts.models import User
        from apps.contracts.models import Contract
        from apps.services.models import PackageService, ServicePackage
        self.user = User.objects.create_user(username="sr_user", password="x")
        other = User.objects.create_user(username="sr_other", password="x")
        package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")
        self.ps = PackageService.objects.create(name_uz="X", name_ru="X", name_cry="X")
        self.contract = Contract.objects.create(contract_number="SR-1", user=self.user, package=package)
        self.foreign = Contract.objects.create(contract_number="SR-2", user=other, package=package)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user.tokens['access']}")

    def test_create_without_file(self):
        response = self.client.post(self.url, {"contract": self.contract.id, "package_item": self.ps.id,
                                               "client_input_text": "salom"}, format="multipart")
        self.assertEqual(response.status_code, 201, response.data)
        self.assertEqual(response.data["contract_number"], "SR-1")

    def test_cannot_create_on_foreign_contract(self):
        response = self.client.post(self.url, {"contract": self.foreign.id, "package_item": self.ps.id,
                                               "client_input_text": "x"}, format="multipart")
        self.assertEqual(response.status_code, 400)


class SetupServiceLimitsTests(APITestCase):
    """OS-14: `setup_service_limits` yo'q limitlarni yaratadi, admin o'zgartirganini qayta yozmaydi."""

    def test_creates_limits_by_tier_and_is_idempotent(self):
        from io import StringIO
        from django.core.management import call_command
        from apps.services.models import PackageService, PackageServiceItem, ServicePackage
        small = ServicePackage.objects.create(name_uz="1 - Tarif", name_ru="1", name_cry="1")
        big = ServicePackage.objects.create(name_uz="4 - Tarif", name_ru="4", name_cry="4")
        call_command("setup_service_limits", stdout=StringIO())
        ps = PackageService.objects.get(slug="benchmark")
        self.assertEqual(PackageServiceItem.objects.get(package=small, package_service=ps).limit, 1)
        item = PackageServiceItem.objects.get(package=big, package_service=ps)
        self.assertEqual(item.limit, 30)

        item.limit = 99
        item.save()
        call_command("setup_service_limits", stdout=StringIO())
        self.assertEqual(PackageService.objects.filter(slug="benchmark").count(), 1)
        self.assertEqual(PackageServiceItem.objects.get(pk=item.pk).limit, 99)
