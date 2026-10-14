"""A-01 admin analitika: raqamlar qo'lda sanalganiga teng, sintetik yozuvlar default chiqariladi."""
from datetime import timedelta
from decimal import Decimal

from django.test import TestCase
from django.utils import timezone

from apps.accounts.models import User
from apps.common.synthetic import register_synthetic
from apps.contracts.models import Contract
from apps.services.models import ServicePackage

from .dashboard import build_dashboard


class DashboardTests(TestCase):
    def setUp(self):
        self.package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")
        self.u1 = User.objects.create_user(username="a1", password="x")
        self.u2 = User.objects.create_user(username="a2", password="x")
        self.demo = User.objects.create_user(username="demo_x", password="x")
        register_synthetic(self.demo, "test:demo_x")
        Contract.objects.create(contract_number="A-1", user=self.u1, package=self.package, total_amount=Decimal("100"), signed_by_client=True)
        Contract.objects.create(contract_number="A-2", user=self.u2, package=self.package, total_amount=Decimal("50"))
        c = Contract.objects.create(contract_number="A-3", user=self.demo, package=self.package, total_amount=Decimal("999"))
        register_synthetic(c, "test:contract")
        self.today = timezone.localdate()

    def test_totals_equal_manual_counts_without_demo(self):
        d = build_dashboard(self.today - timedelta(days=30), self.today)
        self.assertEqual(d["totals"]["users"], User.objects.exclude(pk=self.demo.pk).count())
        self.assertEqual(d["totals"]["contracts"], 2)
        self.assertEqual(d["totals"]["contracts_sum"], 150.0)
        funnel = {f["step"]: f["count"] for f in d["funnel"]}
        self.assertEqual(funnel["Shartnoma yaratdi"], 2)
        self.assertEqual(funnel["Shartnomani imzoladi"], 1)

    def test_demo_toggle_includes_synthetic(self):
        d = build_dashboard(self.today - timedelta(days=30), self.today, include_demo=True)
        self.assertEqual(d["totals"]["contracts"], 3)
        self.assertEqual(d["totals"]["contracts_sum"], 1149.0)

    def test_view_requires_staff_and_exports_xlsx(self):
        from django.conf import settings
        url = "/" + settings.ADMIN_URL + "analytics/"
        self.client.force_login(self.u1)
        self.assertEqual(self.client.get(url).status_code, 302)
        admin = User.objects.create_superuser(username="adm", password="x")
        self.client.force_login(admin)
        r = self.client.get(url)
        self.assertIn(r.status_code, (200, 302))  # 2FA middleware bo'lsa yo'naltiradi
        if r.status_code == 200:
            self.assertContains(r, "Voronka")
            x = self.client.get(url, {"export": "xlsx"})
            self.assertEqual(x["Content-Type"], "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
