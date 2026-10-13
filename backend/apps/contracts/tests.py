from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.common.models import Branch
from apps.contracts.api.ContractCreate.serializers import ContractCreateSerializer
from apps.contracts.models import Contract
from apps.services.models import ServicePackage

VIEWS = "apps.contracts.api.ContractCreate.views"


class ContractCreateNotificationTests(APITestCase):
    """DIDOX qismi serializer'da; bu yerda faqat view'dagi Telegram xabar mantiqi tekshiriladi."""

    url = reverse("contracts:contract-create")

    def setUp(self):
        self.user = User.objects.create_user(username="client", password="x", telegram_chat_id="111")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user.tokens['access']}")
        self.package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")

    def _contract(self, number, branch=None):
        return Contract.objects.create(
            contract_number=number, user=self.user, package=self.package,
            branch=branch, didox_contract_data={"_id": "doc"},
        )

    def _post(self, contract):
        with patch.object(ContractCreateSerializer, "is_valid", return_value=True), \
                patch.object(ContractCreateSerializer, "save", return_value=contract), \
                patch(f"{VIEWS}.send_message") as send, \
                self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.url, {}, format="json")
        return response, send

    def test_without_branch_returns_201_and_notifies_client_only(self):
        response, send = self._post(self._contract("T-1"))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual([c.kwargs["chat_id"] for c in send.call_args_list], ["111"])

    def test_branch_without_accountant_returns_201(self):
        branch = Branch.objects.create(name="B", inn="123456789")
        response, send = self._post(self._contract("T-2", branch))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(send.call_count, 1)

    def test_with_accountant_notifies_both(self):
        accountant = User.objects.create_user(username="buh", password="x", telegram_chat_id="222")
        branch = Branch.objects.create(name="B", inn="123456789", bugalter=accountant)
        response, send = self._post(self._contract("T-3", branch))
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual([c.kwargs["chat_id"] for c in send.call_args_list], ["111", "222"])

    def test_telegram_failure_does_not_break_response(self):
        with patch.object(ContractCreateSerializer, "is_valid", return_value=True), \
                patch.object(ContractCreateSerializer, "save", return_value=self._contract("T-4")), \
                patch(f"{VIEWS}.send_message", side_effect=ConnectionError("telegram down")), \
                self.captureOnCommitCallbacks(execute=True):
            response = self.client.post(self.url, {}, format="json")
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(Contract.objects.filter(contract_number="T-4").exists())


class ContractListScopeTests(APITestCase):
    url = reverse("contracts:contracts-list")

    def setUp(self):
        self.package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")
        self.client_user = User.objects.create_user(username="mijoz", password="x")  # role="user"
        self.other = User.objects.create_user(username="boshqa", password="x")
        self.own = Contract.objects.create(contract_number="L-1", user=self.client_user, package=self.package)
        Contract.objects.create(contract_number="L-2", user=self.other, package=self.package)

    def _get(self, user):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user.tokens['access']}")
        return self.client.get(self.url)

    def test_regular_user_sees_only_own_contracts(self):
        response = self._get(self.client_user)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual([c["contract_number"] for c in response.data["results"]], ["L-1"])
        self.assertIn("is_synthetic", response.data["results"][0])

    def test_accountant_without_profile_gets_empty_list(self):
        accountant = User.objects.create_user(username="buh_np", password="x", role="bugalter")
        response = self._get(accountant)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["results"], [])
