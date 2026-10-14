"""K-06: individual ma'lumot buyurtmasi — narx formulasi, mijoz → xodim → natija oqimi, ruxsatlar."""
from decimal import Decimal

from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.common.models import Region, SiteSettings
from apps.notifications.models import Notification
from apps.services.api.CustomRequestView import quote
from apps.services.models import CustomDataRequest, CustomRequestTariff

URL = "/api/services/custom-requests/"


class CustomRequestTests(APITestCase):
    def setUp(self):
        s = SiteSettings.load()
        s.bhm_value = Decimal("412000")
        s.save()
        self.tariff = CustomRequestTariff.objects.create(data_type="trade", base_bhm=Decimal("2"), per_indicator_bhm=Decimal("0.5"),
                                                         per_year_bhm=Decimal("0.3"), per_region_bhm=Decimal("0.2"),
                                                         urgency_multiplier=Decimal("1.5"))
        self.r1 = Region.objects.create(name="A", code="9901")
        self.r2 = Region.objects.create(name="B", code="9902")
        self.client_user = User.objects.create_user(username="cr_client", password="x")
        self.staff = User.objects.create_user(username="cr_staff", password="x", role="employee")
        self.spec = {"data_type": "trade", "indicators": ["Eksport hajmi", "Import hajmi"], "year_from": 2020,
                     "year_to": 2025, "regions": [self.r1.id, self.r2.id], "urgent": True}

    def test_formula(self):
        # (2 + 2×0.5 + 6×0.3 + 2×0.2) × 1.5 = 5.2 × 1.5 = 7.8 BHM
        q = quote(self.tariff, ["a", "b"], 2020, 2025, [1, 2], True)
        self.assertEqual(q["price_bhm"], Decimal("7.80"))
        self.assertEqual(q["price_sum"], Decimal("7.80") * 412000)

    def test_quote_endpoint_equals_saved_price(self):
        self.client.force_authenticate(self.client_user)
        quoted = self.client.post(URL + "quote/", self.spec, format="json").data
        created = self.client.post(URL, self.spec, format="json")
        self.assertEqual(created.status_code, 201, created.data)
        self.assertEqual(Decimal(quoted["price_sum"]), Decimal(created.data["price_sum"]))
        self.assertEqual(Decimal(quoted["price_bhm"]), Decimal("7.80"))

    def test_validation(self):
        self.client.force_authenticate(self.client_user)
        bad = dict(self.spec, year_from=2025, year_to=2020)
        self.assertEqual(self.client.post(URL + "quote/", bad, format="json").status_code, 400)
        self.assertEqual(self.client.post(URL + "quote/", dict(self.spec, data_type="prices"), format="json").status_code, 400)

    def test_client_to_staff_to_result_flow(self):
        self.client.force_authenticate(self.client_user)
        req_id = self.client.post(URL, self.spec, format="json").data["id"]
        # mijoz narx/holatni o'zgartira olmaydi
        self.assertEqual(self.client.patch(f"{URL}{req_id}/", {"status": "completed"}, format="json").status_code, 403)
        self.client.force_authenticate(self.staff)
        self.assertIn(req_id, [r["id"] for r in self.client.get(URL, {"scope": "staff"}).data])
        priced = self.client.patch(f"{URL}{req_id}/", {"approved_price_sum": "3000000"}, format="json").data
        self.assertEqual(priced["status"], "priced")
        done = self.client.patch(f"{URL}{req_id}/", {"result_file": SimpleUploadedFile("r.xlsx", b"x")}, format="multipart").data
        self.assertEqual(done["status"], "completed")
        self.client.force_authenticate(self.client_user)
        mine = self.client.get(f"{URL}{req_id}/").data
        self.assertTrue(mine["result_file"])
        self.assertEqual(Notification.objects.filter(recipient=self.client_user).count(), 2)

    def test_foreign_request_is_hidden(self):
        other = User.objects.create_user(username="cr_other", password="x")
        obj = CustomDataRequest.objects.create(user=other, data_type="trade", indicators=["x"], year_from=2020,
                                               year_to=2021, price_bhm=1, price_sum=1)
        self.client.force_authenticate(self.client_user)
        self.assertEqual(self.client.get(f"{URL}{obj.id}/").status_code, 404)
        self.assertEqual(self.client.get(URL).data, [])
