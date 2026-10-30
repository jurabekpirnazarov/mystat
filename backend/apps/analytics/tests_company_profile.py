"""KORXONA_SCORING.md KR-39, KR-45 qabul testlari: darvoza, ball tarkibi (13.3), sezgirlik (13.4), profil API."""
from datetime import timedelta

from django.core.cache import cache
from django.test import SimpleTestCase, override_settings
from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.credits import service as credits
from apps.credits.models import CreditLedger, CreditWallet
from apps.credits.testing import use_unit_prices
from apps.organizations.models import Organization

from .company_scoring import config, explain
from .models import EnterpriseScore
from .tests_company_scoring import make_ktut, run_seeder

CFG = config.load()
RAW_KEYS = ("'value'", "'median'", "revenue", "net_profit", "avg_wage", "tax_debt_amount", "'v':", "'m':")


class ExplainTests(SimpleTestCase):
    def test_contributions_sum_to_overall(self):
        pillars = {"M": 72.5, "O": 40.0, "T": "na", "X": 61.0, "I": None, "S": 88.0}
        c = explain.contribution(CFG, pillars, [], "muvozanatli")
        w = CFG["presets"]["muvozanatli"]["weights"]
        avail = {"M": 72.5, "O": 40.0, "X": 61.0, "S": 88.0}
        overall = sum(w[p] * v for p, v in avail.items()) / sum(w[p] for p in avail)
        self.assertAlmostEqual(c["base"] + sum(r["contribution"] for r in c["pillars"]), overall, delta=0.1)
        self.assertAlmostEqual(c["total"], overall, delta=0.01)
        t = next(r for r in c["pillars"] if r["key"] == "T")
        self.assertFalse(t["applicable"])
        self.assertIsNone(c["cap"])

    def test_tax_cap_is_separate_row(self):
        pillars = {"M": 90.0, "O": 80.0, "T": "na", "X": 85.0, "I": 70.0, "S": 75.0}
        c = explain.contribution(CFG, pillars, ["soliq_qarzi"], "muvozanatli")
        self.assertEqual(c["total"], CFG["params"]["cap_tax_debt"])
        self.assertAlmostEqual(c["raw"] + c["cap"], c["total"], delta=0.01)
        self.assertLess(c["cap"], 0)
        s = explain.sensitivity(CFG, c)
        self.assertTrue(all(r["delta"] == 0 for r in s["pillars"]))  # soliq qarzi bilan ball oshmaydi
        self.assertTrue(s["next"]["blocked_by_tax"])

    def test_sensitivity_next_class(self):
        pillars = {"M": 55.0, "O": 50.0, "T": 30.0, "X": 52.0, "I": 50.0, "S": 60.0}
        c = explain.contribution(CFG, pillars, [], "muvozanatli")
        s = explain.sensitivity(CFG, c)
        m = next(r for r in s["pillars"] if r["key"] == "M")
        self.assertAlmostEqual(m["delta"], 10 * 20 / 100, delta=0.01)   # w_M × 10
        self.assertEqual(s["next"]["klass"], "B")
        self.assertEqual(len(s["next"]["fastest"]), 2)
        self.assertIn(s["next"]["fastest"][0]["key"], ("M", "X"))        # eng katta vaznlilar


@override_settings(DEBUG=True)
class ProfileApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        make_ktut()
        run_seeder()
        scored = EnterpriseScore.objects.filter(preset="muvozanatli", year=2025, overall__isnull=False)
        cls.stir = scored.first().stir
        cls.other = scored.exclude(stir=cls.stir).first().stir
        cls.none = "599999999"          # to'liqligi past: ball yo'q (4.7)
        EnterpriseScore.objects.create(stir=cls.none, year=2025, preset="muvozanatli", model_version=CFG["version"],
                                       overall=None, klass="", coverage=0.3, peer_group="all", data_source="synthetic")
        cls.user = User.objects.create_user(username="pr_user", password="x")
        org = Organization.objects.create(user=cls.user, name="Demo", tin="300000777")
        cls.wallet = CreditWallet.objects.create(organization=org, plan="s50")
        use_unit_prices()
        credits.grant(cls.wallet, 3, expires_at=timezone.now() + timedelta(days=30))

    def setUp(self):
        cache.clear()

    def url(self, stir=None, **q):
        return f"/api/analytics/company-profile/{stir or self.stir}/", q

    def get(self, stir=None, **q):
        path, params = self.url(stir, **q)
        return self.client.get(path, params)

    def test_guest_sees_only_general(self):
        res = self.get()
        self.assertEqual(res.status_code, 200, res.content)
        data = res.json()
        self.assertIsNotNone(data["general"]["score"]["overall"])
        self.assertTrue(data["is_synthetic"])
        for lvl in ("basis", "deep"):
            self.assertTrue(data[lvl]["locked"])
            self.assertEqual(data[lvl]["unlock"]["reason"], "login")
            for key in ("pillars", "contribution", "indicators", "flags", "dynamics", "similar"):
                self.assertNotIn(key, data[lvl])
        text = str(data)
        for raw in RAW_KEYS:
            self.assertNotIn(raw, text)

    def test_unlock_flow_demo_user_with_3_credits(self):
        self.client.force_authenticate(self.user)
        data = self.get().json()
        self.assertEqual(data["basis"]["unlock"], {"level": "basis", "credits": 1.0, "available": True,
                                                    "reason": None, "min_plan": "s50"})
        self.assertEqual(data["deep"]["unlock"]["reason"], "plan_required")
        res = self.client.post("/api/credits/unlock/", {"stir": self.stir, "level": "basis"}, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        self.assertEqual(res.json()["balance"], 2.0)
        data = self.get().json()
        self.assertFalse(data["basis"]["locked"])
        self.assertTrue(data["deep"]["locked"])
        c = data["basis"]["contribution"]
        overall = data["general"]["score"]["overall"]
        self.assertAlmostEqual(c["base"] + sum(r["contribution"] for r in c["pillars"]) + (c["cap"] or 0), overall,
                               delta=0.1)
        self.assertIsNotNone(data["basis"]["rank"])
        self.assertLessEqual(data["basis"]["rank"], data["basis"]["ranked"])
        for raw in RAW_KEYS:
            self.assertNotIn(raw, str(data))
        n = CreditLedger.objects.count()
        self.client.post("/api/credits/unlock/", {"stir": self.stir, "level": "basis"}, format="json")
        self.get(preset="bank")                                         # preset almashtirish ham bepul
        self.assertEqual(CreditLedger.objects.count(), n)
        self.assertEqual(credits.balance(self.wallet), 2)
        bank = self.get(preset="bank").json()["basis"]["contribution"]
        self.assertEqual(bank["preset"], "bank")

    def test_deep_section_for_plan_60(self):
        self.wallet.plan = "s60"
        self.wallet.save()
        self.client.force_authenticate(self.user)
        self.assertEqual(self.get().json()["deep"]["unlock"]["credits"], 3.0)
        res = self.client.post("/api/credits/unlock/", {"stir": self.stir, "level": "deep"}, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        data = self.get().json()
        self.assertFalse(data["basis"]["locked"])                       # chuqur tahlil 1-darajani ham ochadi
        deep = data["deep"]
        self.assertFalse(deep["locked"])
        self.assertLessEqual(len(deep["similar"]), 5)
        self.assertNotIn(self.stir, [s["stir"] for s in deep["similar"]])
        self.assertEqual(len(deep["presets"]), 5)
        self.assertTrue(deep["dynamics"])
        self.assertIn("next", deep["sensitivity"])
        for raw in RAW_KEYS:
            self.assertNotIn(raw, str(data))
        # Batafsil kartochka ham endi ochiq
        detail = self.client.get(f"/api/analytics/company-scores/{self.stir}/").json()
        self.assertFalse(detail["locked"])
        self.assertIn("indicators", detail)

    def test_insufficient_data_cannot_be_unlocked(self):
        self.client.force_authenticate(self.user)
        data = self.get(self.none).json()
        self.assertEqual(data["basis"]["unlock"]["reason"], "insufficient_data")
        res = self.client.post("/api/credits/unlock/", {"stir": self.none, "level": "basis"}, format="json")
        self.assertEqual(res.status_code, 409)
        self.assertEqual(credits.balance(self.wallet), 3)

    def test_owner_sees_everything_free(self):
        owner = User.objects.create_user(username="pr_owner", password="x")
        Organization.objects.create(user=owner, name="Egasi", tin=self.other)
        self.client.force_authenticate(owner)
        data = self.get(self.other).json()
        self.assertTrue(data["access"]["owner"])
        self.assertFalse(data["basis"]["locked"])
        self.assertFalse(data["deep"]["locked"])

    def test_unknown_and_bad_preset(self):
        self.assertEqual(self.get("999999999").status_code, 404)
        self.assertEqual(self.get(preset="x").status_code, 400)

    @override_settings(DEBUG=False)
    def test_os18_closed(self):
        self.assertEqual(self.get().status_code, 404)

    def test_stored_contribution_matches(self):
        base = EnterpriseScore.objects.get(stir=self.stir, year=2025, preset="muvozanatli")
        stored = base.indicators["_contrib"]
        fresh = explain.contribution(CFG, base.pillars, base.flags, "muvozanatli")
        self.assertEqual(stored["total"], fresh["total"])
        self.assertAlmostEqual(stored["total"], base.overall, delta=0.05)

