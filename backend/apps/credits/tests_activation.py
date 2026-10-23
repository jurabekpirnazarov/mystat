"""KR-41/OS-20: to'liq to'langan StatCoin shartnomasi paketni avtomatik faollashtiradi (idempotent, bayroq bilan)."""
from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.test import TestCase
from rest_framework.test import APIClient

from apps.common.models import District, Region, SiteSettings
from apps.contracts.models import Contract
from apps.payment.models import Transaction, TransactionStatus
from apps.services.models import UserServicePackage

from . import packages, service
from .tests import make_wallet
from .tests_packages import make_package


def pay(contract, amount, status=TransactionStatus.PAID, n=[0]):
    n[0] += 1
    return Transaction.objects.create(transaction_id=f"t{n[0]}", amount=amount, status=status,
                                      content_type=ContentType.objects.get_for_model(Contract), object_id=contract.pk)


class AutoActivationTests(TestCase):
    def setUp(self):
        region = Region.objects.create(name="R", code="01")
        District.objects.create(name="D", code="001", region=region)
        self.user, self.wallet = make_wallet(plan="")
        self.package = make_package()
        self.contract = Contract.objects.create(contract_number="A-1", user=self.user, package=self.package,
                                                total_amount=Decimal("1000"))

    def test_unpaid_or_partial_does_not_activate(self):
        self.assertEqual(packages.activate_paid_contracts(), [])
        pay(self.contract, 400)
        pay(self.contract, 600, TransactionStatus.WAITING)
        self.assertEqual(packages.activate_paid_contracts(), [])
        self.assertFalse(UserServicePackage.objects.exists())

    def test_full_payment_activates_once_and_grants(self):
        pay(self.contract, 400)
        pay(self.contract, 600)
        self.assertEqual(len(packages.activate_paid_contracts()), 1)
        self.assertEqual(packages.activate_paid_contracts(), [])           # ikkinchi marta bermaydi
        self.assertEqual(UserServicePackage.objects.get().contract_id, self.contract.id)
        self.assertEqual(service.balance(self.wallet), Decimal("60"))
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.plan, "s60")

    def test_flag_off_leaves_it_to_admin(self):
        pay(self.contract, 1000)
        site = SiteSettings.load()
        site.statcoin_auto_activate = False
        site.save()
        self.assertEqual(packages.activate_paid_contracts(), [])

    def test_legacy_package_contract_is_ignored(self):
        legacy = make_package("Eski", kind="", amount=0, plan="")
        c = Contract.objects.create(contract_number="A-2", user=self.user, package=legacy, total_amount=Decimal("500"))
        pay(c, 500)
        self.assertEqual([u.contract_id for u in packages.activate_paid_contracts()], [])

    def test_api_state_and_activate_now(self):
        pay(self.contract, 1000)
        client = APIClient()
        client.force_authenticate(self.user)
        state = client.get("/api/credits/activation/", {"package": self.package.id}).json()
        self.assertFalse(state["active"])
        self.assertEqual(state["contracts"][0]["paid"], 1000.0)
        done = client.post("/api/credits/activation/", {"package": self.package.id}, format="json").json()
        self.assertTrue(done["active"])
        self.assertEqual(done["balance"], 60.0)
        self.assertEqual(len(done["activated_now"]), 1)


class OpensTests(TestCase):
    def test_compare_lists_what_each_package_opens(self):
        make_package("Scoring 50", amount=50, plan="s50")
        make_package("Scoring 90", amount=90, plan="s90")
        make_package("StatCoin +20", kind="topup", amount=20, plan="")
        data = APIClient().get("/api/services/tariff-compare/").json()
        by = {p["name"]: p["statcoin"] for p in data["packages"]}
        self.assertEqual([x["level"] for x in by["Scoring 50"]["opens"]["profile"]], ["basis"])
        self.assertEqual([x["level"] for x in by["Scoring 90"]["opens"]["profile"]], ["basis", "deep"])
        self.assertEqual(by["StatCoin +20"]["opens"]["profile"], [])
        self.assertTrue(by["StatCoin +20"]["opens"]["needs_plan_for_profile"])
        self.assertEqual(len(by["Scoring 50"]["opens"]["services"]), 4)
