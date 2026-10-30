"""KORXONA_SCORING.md KR-41: tarif paketi faollashganda StatCoin berish (idempotent), oylik grant, tarif darajasi."""
from datetime import date, timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.common.models import District, Region
from apps.notifications.models import Notification
from apps.services.models import ServicePackage, UserServicePackage

from . import packages, service
from .models import CreditLedger, CreditWallet
from .tests import make_wallet


def make_package(name="Scoring 60", kind="monthly", amount=60, plan="s60", days=365):
    return ServicePackage.objects.create(name_uz=name, name_ru=name, name_cry=name, duration_days=days,
                                         statcoin_kind=kind, statcoin_amount=amount, statcoin_plan=plan)


def activate(user, package, starts_at=None):
    region = Region.objects.first() or Region.objects.create(name="R", code="01")
    district = District.objects.first() or District.objects.create(name="D", code="001", region=region)
    return UserServicePackage.objects.create(created_by_user=user, service=package, district=district, region=region,
                                             year=2026, month=1, starts_at=starts_at)


class PackageGrantTests(TestCase):
    def setUp(self):
        self.user, self.wallet = make_wallet(plan="")

    def test_activation_grants_statcoin_and_sets_plan(self):
        usp = activate(self.user, make_package())
        self.assertEqual(service.balance(self.wallet), Decimal("60"))
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.plan, "s60")
        row = CreditLedger.objects.get(kind="grant")
        self.assertEqual(row.source_package_id, usp.pk * packages.KEY_STEP)
        self.assertTrue(Notification.objects.filter(recipient=self.user, title__icontains="Hamyoningiz").exists())

    def test_resave_and_repeat_do_not_grant_twice(self):
        usp = activate(self.user, make_package())
        usp.save()
        packages.grant_for_package(usp, 0)
        self.assertEqual(CreditLedger.objects.filter(kind="grant").count(), 1)
        self.assertEqual(service.balance(self.wallet), Decimal("60"))

    def test_legacy_package_changes_nothing(self):
        activate(self.user, make_package("Eski", kind="", amount=0, plan=""))
        self.assertFalse(CreditLedger.objects.exists())
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.plan, "")

    def test_topup_keeps_plan_and_lasts_package_term(self):
        self.wallet.plan = "s50"
        self.wallet.save()
        activate(self.user, make_package("StatCoin +20", kind="topup", amount=20, plan=""))
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.plan, "s50")
        row = CreditLedger.objects.get(kind="grant")
        self.assertGreater(row.expires_at, timezone.now() + timedelta(days=360))

    def test_user_without_organization_gets_personal_wallet(self):
        from apps.accounts.models import User
        solo = User.objects.create_user(username="solo", password="x")
        activate(solo, make_package())
        self.assertEqual(service.balance(CreditWallet.objects.get(user=solo)), Decimal("60"))


class MonthlyGrantTests(TestCase):
    def setUp(self):
        self.user, self.wallet = make_wallet(plan="")
        today = timezone.localdate()
        self.start = packages._add_months(today.replace(day=1), -3)
        self.usp = activate(self.user, make_package(), starts_at=self.start)   # signal 0-oy grant'ini beradi

    def test_months_elapsed(self):
        self.assertEqual(packages.months_elapsed(date(2026, 1, 31), date(2026, 2, 28)), 0)
        self.assertEqual(packages.months_elapsed(date(2026, 1, 15), date(2026, 3, 15)), 2)

    def test_due_task_grants_current_month_once(self):
        self.assertEqual(packages.grant_due_monthly(), 1)
        self.assertEqual(packages.grant_due_monthly(), 0)          # ikkinchi marta bermaydi
        k = packages.months_elapsed(self.start, timezone.localdate())
        self.assertTrue(CreditLedger.objects.filter(source_package_id=self.usp.pk * packages.KEY_STEP + k).exists())

    def test_monthly_grant_does_not_carry_over(self):
        row = CreditLedger.objects.get(kind="grant", source_package_id=self.usp.pk * packages.KEY_STEP)
        self.assertLess(row.expires_at, timezone.now() + timedelta(days=32))

    def test_expired_package_drops_plan(self):
        UserServicePackage.objects.filter(pk=self.usp.pk).update(expires_at=timezone.localdate() - timedelta(days=1))
        self.wallet.plan = "s60"
        self.wallet.save()
        packages.grant_due_monthly()
        self.wallet.refresh_from_db()
        self.assertEqual(self.wallet.plan, "")
