"""KORXONA_SCORING.md KR-40 qabul testlari: FIFO, muddat, manfiy balans yo'q (parallel), qayta ochish bepul."""
import threading
from datetime import timedelta
from unittest import mock

from django.db import connection
from django.test import TestCase, TransactionTestCase, override_settings
from django.utils import timezone

from apps.accounts.models import User
from apps.organizations.models import Organization

from . import service
from .models import CreditLedger, CreditPrice, CreditUnlock, CreditWallet


def make_wallet(username="w_user", tin="300000001", plan="s50", amount=None, expires_days=30):
    user = User.objects.create_user(username=username, password="x")
    org = Organization.objects.create(user=user, name=f"Org {username}", tin=tin)
    wallet = CreditWallet.objects.create(organization=org, plan=plan)
    if amount:
        service.grant(wallet, amount, expires_at=timezone.now() + timedelta(days=expires_days))
    return user, wallet


class LedgerTests(TestCase):
    def test_fifo_by_expiry_and_balance(self):
        _user, wallet = make_wallet()
        late = service.grant(wallet, 5, expires_at=timezone.now() + timedelta(days=60))
        soon = service.grant(wallet, 2, expires_at=timezone.now() + timedelta(days=5))
        forever = service.grant(wallet, 1, kind="adjust", reason="test")
        self.assertEqual(service.balance(wallet), 8)
        service.spend(wallet, 3, action_code="profile_basis", object_ref="1")
        uses = {r.grant_id: r.amount for r in CreditLedger.objects.filter(kind="spend")}
        self.assertEqual(uses, {soon.id: -2, late.id: -1})          # avval muddati yaqini
        self.assertNotIn(forever.id, uses)
        self.assertEqual(service.balance(wallet), 5)

    def test_insufficient_never_negative(self):
        _user, wallet = make_wallet(amount=1)
        with self.assertRaises(service.CreditError) as ctx:
            service.spend(wallet, 2, action_code="profile_deep", object_ref="1")
        self.assertEqual(ctx.exception.code, "insufficient")
        self.assertEqual(service.balance(wallet), 1)
        self.assertFalse(CreditLedger.objects.filter(kind="spend").exists())

    def test_expire_due_closes_grant(self):
        _user, wallet = make_wallet()
        g = service.grant(wallet, 4, expires_at=timezone.now() + timedelta(days=1))
        service.spend(wallet, 1, action_code="x", object_ref="1")
        CreditLedger.objects.filter(pk=g.pk).update(expires_at=timezone.now() - timedelta(minutes=1))
        self.assertEqual(service.balance(wallet), 0)
        self.assertEqual(service.expire_due(), 1)
        exp = CreditLedger.objects.get(kind="expire")
        self.assertEqual((exp.amount, exp.grant_id), (-3, g.id))
        self.assertEqual(service.expire_due(), 0)                   # qayta yopilmaydi
        self.assertEqual(sum(CreditLedger.objects.values_list("amount", flat=True)), 0)

    def test_refund_returns_to_grant(self):
        _user, wallet = make_wallet(amount=3)
        service.spend(wallet, 2, action_code="profile_basis", object_ref="7")
        self.assertEqual(service.refund(wallet, action_code="profile_basis", object_ref="7"), 3)

    def test_default_prices(self):
        self.assertEqual(service.price_of("profile_basis"), 1)
        self.assertEqual(service.price_of("profile_deep"), 3)
        CreditPrice.objects.filter(action_code="profile_basis").update(is_active=False)
        self.assertIsNone(service.price_of("profile_basis"))


class UnlockTests(TestCase):
    def test_unlock_charges_once_within_30_days(self):
        user, wallet = make_wallet(amount=3)
        r = service.unlock(user, "200000001", "basis", scored=True)
        self.assertEqual((r["charged"], r["balance"]), (1.0, 2.0))
        n = CreditLedger.objects.count()
        r = service.unlock(user, "200000001", "basis", scored=True)
        self.assertEqual((r["charged"], r["free"]), (0.0, "active"))
        self.assertEqual(CreditLedger.objects.count(), n)            # qayta ochish ledger'ga yozmaydi
        self.assertTrue(service.can_view(user, "200000001", "basis"))
        self.assertFalse(service.can_view(user, "200000001", "deep"))

    def test_deep_needs_plan_60_and_costs_difference(self):
        user, wallet = make_wallet(amount=10)
        with self.assertRaises(service.CreditError) as ctx:
            service.unlock(user, "200000001", "deep", scored=True)
        self.assertEqual(ctx.exception.code, "plan_required")
        wallet.plan = "s60"
        wallet.save()
        service.unlock(user, "200000001", "basis", scored=True)
        r = service.unlock(user, "200000001", "deep", scored=True)
        self.assertEqual(r["charged"], 2.0)                           # 3 − 1 (kengaytirilgan ochilgan)
        self.assertTrue(service.can_view(user, "200000001", "basis"))
        self.assertTrue(service.can_view(user, "200000001", "deep"))

    def test_insufficient_data_not_charged(self):
        user, wallet = make_wallet(amount=3)
        with self.assertRaises(service.CreditError) as ctx:
            service.unlock(user, "200000001", "basis", scored=False)
        self.assertEqual(ctx.exception.code, "insufficient_data")
        self.assertEqual(service.balance(wallet), 3)

    def test_owner_and_expired_unlock(self):
        user, wallet = make_wallet(amount=3, tin="200000009")
        self.assertTrue(service.can_view(user, "200000009", "deep"))    # o'z korxonasi bepul
        service.unlock(user, "200000001", "basis", scored=True)
        CreditUnlock.objects.update(expires_at=timezone.now() - timedelta(seconds=1))
        self.assertFalse(service.can_view(user, "200000001", "basis"))
        r = service.unlock(user, "200000001", "basis", scored=True)   # muddati o'tgan — qayta pullik
        self.assertEqual(r["charged"], 1.0)

    @override_settings(DEBUG=True)
    def test_api_me_and_unlock(self):
        from rest_framework.test import APIClient

        user, wallet = make_wallet(amount=3)
        c = APIClient()
        c.force_authenticate(user)
        with mock.patch("apps.analytics.company_scoring.profile.is_scored", return_value=True):
            res = c.post("/api/credits/unlock/", {"stir": "200000001", "level": "profile_basis"}, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()["balance"], 2.0)
        me = c.get("/api/credits/me/").json()
        self.assertEqual(me["balance"], 2.0)
        self.assertEqual(me["unlocks"][0]["stir"], "200000001")
        self.assertEqual(me["unlocks"][0]["days_left"], 29)
        self.assertEqual(me["ledger"]["count"], 2)
        self.assertEqual(c.post("/api/credits/unlock/", {"stir": "abc", "level": "basis"}, format="json").status_code, 400)


class ParallelUnlockTests(TransactionTestCase):
    """KR-40 qabul: parallel 20 ta `unlock` so'rovida balans manfiy bo'lmaydi."""

    def test_parallel_unlocks(self):
        if connection.vendor != "postgresql":
            self.skipTest("select_for_update faqat PostgreSQL'da")
        # TransactionTestCase bazani tozalaydi — data migratsiyadagi narx qayta qo'yiladi
        CreditPrice.objects.get_or_create(action_code="profile_basis", defaults={"credits": 1})
        user, wallet = make_wallet(amount=5)
        errors, ok = [], []

        def worker(i):
            try:
                ok.append(service.unlock(user, f"2000001{i:02d}", "basis", scored=True))
            except service.CreditError as exc:
                errors.append(exc.code)
            finally:
                connection.close()

        threads = [threading.Thread(target=worker, args=(i,)) for i in range(20)]
        for t in threads:
            t.start()
        for t in threads:
            t.join()
        self.assertEqual(len(ok), 5)
        self.assertEqual(set(errors), {"insufficient"})
        self.assertEqual(service.balance(wallet), 0)
        self.assertEqual(CreditUnlock.objects.count(), 5)
