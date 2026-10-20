"""ISH_REJASI 2.1 🔴: xizmat so'rovlari, javoblari, Information va email yangilash — begona foydalanuvchiga yopiq."""
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.contracts.models import Contract
from apps.services.models import PackageService, ServicePackage, ServiceRequestResponse


def _auth(client, user):
    client.credentials(HTTP_AUTHORIZATION=f"Bearer {user.tokens['access']}")


class ServiceRequestIsolationTests(APITestCase):
    LIST = "/api/services/service-request/"

    @classmethod
    def setUpTestData(cls):
        cls.client_user = User.objects.create_user(username="sec_client", password="x-Strong-1")
        cls.other = User.objects.create_user(username="sec_other", password="x-Strong-1")
        cls.employee = User.objects.create_user(username="sec_employee", password="x-Strong-1", role="employee")
        package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")
        cls.ps = PackageService.objects.create(name_uz="X", name_ru="X", name_cry="X")
        own = Contract.objects.create(contract_number="SEC-1", user=cls.client_user, package=package)
        foreign = Contract.objects.create(contract_number="SEC-2", user=cls.other, package=package)
        cls.own_req = ServiceRequestResponse.objects.create(contract=own, package_item=cls.ps, client_input_text="o'zim")
        cls.foreign_req = ServiceRequestResponse.objects.create(contract=foreign, package_item=cls.ps,
                                                                client_input_text="begona")
        cls.foreign_contract = foreign

    def test_filters_do_not_leak_foreign_requests(self):
        _auth(self.client, self.client_user)
        for params in ({}, {"package_item": self.ps.id}, {"contract": self.foreign_contract.id}):
            ids = {r["id"] for r in self.client.get(self.LIST, params).json()}
            self.assertNotIn(self.foreign_req.id, ids, params)
        self.assertEqual({r["id"] for r in self.client.get(self.LIST, {"package_item": self.ps.id}).json()},
                         {self.own_req.id})

    def test_foreign_detail_is_denied(self):
        _auth(self.client, self.client_user)
        self.assertIn(self.client.get(f"{self.LIST}{self.foreign_req.id}/").status_code, (403, 404))
        self.assertEqual(self.client.get(f"{self.LIST}{self.own_req.id}/").status_code, 200)

    def test_client_cannot_write_admin_answer(self):
        _auth(self.client, self.client_user)
        res = self.client.patch(f"/api/services/service-response/{self.own_req.id}/",
                                {"admin_input_text": "soxta javob", "status": "completed"}, format="multipart")
        self.assertEqual(res.status_code, 403)
        self.own_req.refresh_from_db()
        self.assertNotEqual(self.own_req.admin_input_text, "soxta javob")

    def test_employee_can_answer(self):
        _auth(self.client, self.employee)
        res = self.client.patch(f"/api/services/service-response/{self.own_req.id}/",
                                {"admin_input_text": "javob", "status": "completed"}, format="multipart")
        self.assertEqual(res.status_code, 200, res.content)


class InformationWriteTests(APITestCase):
    URL = "/api/common/information/"

    def test_guest_and_user_cannot_write_but_can_read(self):
        self.assertEqual(self.client.get(self.URL).status_code, 200)
        self.assertIn(self.client.post(self.URL, {"title": "x"}, format="multipart").status_code, (401, 403))
        user = User.objects.create_user(username="info_user", password="x-Strong-1")
        _auth(self.client, user)
        self.assertEqual(self.client.post(self.URL, {"title": "x"}, format="multipart").status_code, 403)


class EmailUpdateOwnershipTests(APITestCase):
    def test_only_own_account(self):
        me = User.objects.create_user(username="me@example.uz", password="x-Strong-1", email="me@example.uz")
        other = User.objects.create_user(username="other@example.uz", password="x-Strong-1", email="other@example.uz")
        _auth(self.client, me)
        self.assertEqual(self.client.get(f"/api/accounts/update/email/{other.username}/").status_code, 403)
        self.assertEqual(self.client.patch(f"/api/accounts/update/email/{other.username}/",
                                           {"email": "hack@example.uz"}).status_code, 403)
        # O'chirish endi umuman yo'q
        self.assertEqual(self.client.delete(f"/api/accounts/update/email/{me.username}/").status_code, 405)
        self.assertTrue(User.objects.filter(pk=other.pk, email="other@example.uz").exists())
        res = self.client.patch(f"/api/accounts/update/email/{me.username}/", {"email": "new@example.uz"})
        self.assertEqual(res.status_code, 200, res.content)
        me.refresh_from_db()
        self.assertEqual(me.email, "new@example.uz")
