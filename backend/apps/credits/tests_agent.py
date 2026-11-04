from datetime import timedelta
from decimal import Decimal
from unittest import mock

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase
from django.utils import timezone

from . import agent, service
from .models import CreditLedger, DataOffer, DataPurchase

SPEC = {"kind": "countries", "hs": "1701", "flows": [1], "periods": {"2024": "M12"}}


def _items(owned=()):
    return [
        {"id": "yearly", "kind": "yearly", "title": "Yillar", "description": "", "rows": 2, "price": 5500.0,
         "owned": "yearly" in owned, "purchase_id": None, "teaser": "", "spec": {**SPEC, "kind": "yearly"}},
        {"id": "countries", "kind": "countries", "title": "Davlatlar", "description": "", "rows": 18, "price": 17500.0,
         "owned": "countries" in owned, "purchase_id": None, "teaser": "", "spec": SPEC},
        {"id": "regions", "kind": "regions", "title": "Viloyatlar", "description": "", "rows": 13, "price": 12000.0,
         "owned": False, "purchase_id": None, "teaser": "", "spec": {**SPEC, "kind": "regions"}},
    ]


class PolicyTests(SimpleTestCase):
    def test_item_price_rounds_up_and_caps(self):
        with mock.patch("apps.credits.service.price_of", return_value=None):
            self.assertEqual(agent.item_price("yearly", 2), Decimal("5500"))
            self.assertEqual(agent.item_price("countries", 18), Decimal("17500"))   # 16500 + 0.18 * 3300 = 17094 -> 17500
            self.assertEqual(agent.item_price("products", 10_000_000), Decimal("165000"))  # yuqori chegara

    def test_bundle_discount(self):
        with mock.patch("apps.credits.service.price_of", return_value=None):
            one = agent.price_total([Decimal(10000)])
            two = agent.price_total([Decimal(10000), Decimal(10000)])
            three = agent.price_total([Decimal(10000)] * 3)
        self.assertEqual(one, (Decimal(10000), Decimal(0), Decimal(0)))
        self.assertEqual(two[1], Decimal(5))
        self.assertEqual(three[1], Decimal(10))
        self.assertEqual(three[0], Decimal(27000))

    def test_parse_query(self):
        p = agent.parse_query("Shakar eksport va import 2023 2024")
        self.assertEqual(p["flows"], [1, 2])
        self.assertEqual(p["years"], [2023, 2024])
        self.assertEqual(p["words"], ["shakar"])
        self.assertEqual(agent.parse_query("hs 1701 export")["hs"], "1701")

    def test_fingerprint_depends_on_period(self):
        other = {**SPEC, "periods": {"2024": "M9"}}
        self.assertNotEqual(agent.fingerprint(SPEC), agent.fingerprint(other))
        self.assertEqual(agent.fingerprint(SPEC), agent.fingerprint(dict(SPEC)))


class AcceptTests(TestCase):
    def setUp(self):
        self.user = get_user_model().objects.create_user(username="buyer", password="x")
        self.wallet = service.wallet_of(self.user, create=True)

    def _offer(self, items=None, minutes=30):
        items = items or _items()
        return DataOffer.objects.create(wallet=self.wallet, user=self.user, query="shakar eksport", items=items,
                                        total=Decimal(35000), expires_at=timezone.now() + timedelta(minutes=minutes))

    def test_insufficient_balance_keeps_offer_and_charges_nothing(self):
        offer = self._offer()
        with self.assertRaises(service.CreditError) as ctx:
            agent.accept(self.user, offer.id)
        self.assertEqual(ctx.exception.code, "insufficient")
        self.assertEqual(ctx.exception.status, 402)
        offer.refresh_from_db()
        self.assertEqual(offer.status, "open")
        self.assertFalse(DataPurchase.objects.exists())

    def test_accept_charges_stored_price_once_and_records_purchases(self):
        service.grant(self.wallet, 100000)
        offer = self._offer()
        with mock.patch("apps.credits.service.price_of", return_value=None):
            out = agent.accept(self.user, offer.id)
        # 5500 + 17500 + 12000 = 35000, 3 ta to'plam -> 10% chegirma = 31500
        self.assertEqual(out["charged"], 31500.0)
        self.assertEqual(out["balance"], 68500.0)
        self.assertEqual(DataPurchase.objects.filter(wallet=self.wallet).count(), 3)
        spent = -sum(r.amount for r in CreditLedger.objects.filter(wallet=self.wallet, kind="spend"))
        self.assertEqual(spent, Decimal(31500))
        offer.refresh_from_db()
        self.assertEqual(offer.status, "accepted")
        # Qayta qabul qilib bo'lmaydi
        with self.assertRaises(service.CreditError) as ctx:
            agent.accept(self.user, offer.id)
        self.assertEqual(ctx.exception.code, "expired")

    def test_already_owned_is_not_charged_again(self):
        service.grant(self.wallet, 100000)
        with mock.patch("apps.credits.service.price_of", return_value=None):
            agent.accept(self.user, self._offer(_items()).id, {"countries"})
            before = service.balance(self.wallet)
            again = self._offer(_items())
            out = agent.accept(self.user, again.id)           # countries allaqachon bor: faqat yearly + regions
        self.assertEqual(DataPurchase.objects.filter(wallet=self.wallet).count(), 3)
        self.assertEqual(Decimal(str(out["charged"])), Decimal(17000))  # (5500 + 12000) * 0.95 = 16625, 500 so'mgacha yuqoriga yaxlitlanadi
        self.assertEqual(before - service.balance(self.wallet), Decimal(str(out["charged"])))

    def test_expired_offer_rejected(self):
        service.grant(self.wallet, 100000)
        offer = self._offer(minutes=-1)
        with self.assertRaises(service.CreditError) as ctx:
            agent.accept(self.user, offer.id)
        self.assertEqual(ctx.exception.code, "expired")
        self.assertEqual(service.balance(self.wallet), Decimal(100000))

    def test_other_users_offer_not_visible(self):
        offer = self._offer()
        other = get_user_model().objects.create_user(username="other", password="x")
        with self.assertRaises(service.CreditError) as ctx:
            agent.accept(other, offer.id)
        self.assertEqual(ctx.exception.code, "not_found")

    def test_decline_removes_offer_without_charge(self):
        service.grant(self.wallet, 50000)
        offer = self._offer()
        self.assertEqual(agent.decline(self.user, offer.id), 1)
        self.assertFalse(DataOffer.objects.filter(pk=offer.pk).exists())
        self.assertEqual(service.balance(self.wallet), Decimal(50000))

    def test_history_lists_purchases_of_wallet(self):
        service.grant(self.wallet, 100000)
        agent.accept(self.user, self._offer().id)
        rows = agent.history(self.user)
        self.assertEqual(len(rows), 3)
        self.assertEqual({r["kind"] for r in rows}, {"yearly", "countries", "regions"})


class SampleTests(SimpleTestCase):
    HEADER = ["Yil", "Oqim", "Davlat", "ISO kod", "Qiymat (ming AQSh $)", "Miqdor"]
    ROWS = [[2024, "Eksport", "Qozog'iston", "KZ", 1234.5, 99.0], [2024, "Eksport", "Rossiya", "RU", 800.0, 40.0]]

    def test_sample_hides_names_and_values(self):
        qs = mock.MagicMock()
        qs.values.return_value.distinct.return_value.count.return_value = 12
        with mock.patch("apps.credits.agent.dataset", return_value=(self.HEADER, self.ROWS)), \
                mock.patch("apps.credits.agent._qs", return_value=qs):
            s = agent.sample(SPEC)
        self.assertEqual(s["columns"], self.HEADER)
        self.assertEqual(s["rows"][0], [2024, "Eksport", "•••", "•••", "•••", "•••"])
        flat = str(s)
        for secret in ("Qozog'iston", "Rossiya", "1234.5", "800.0", "KZ"):
            self.assertNotIn(secret, flat)
        self.assertIn("12 ta davlat", s["coverage"])
        self.assertIn("eksport", s["coverage"])

    def test_preview_clamps_limit_and_returns_chart(self):
        purchase = mock.Mock(spec_set=["spec", "id", "title", "rows"], spec=SPEC, id=7, title="Davlatlar", rows=2)
        purchase.spec = SPEC
        qs = mock.MagicMock()
        qs.values.return_value.annotate.return_value.order_by.return_value = [
            {"year_id": 2023, "trade_type": 1, "v": 5}, {"year_id": 2023, "trade_type": 2, "v": 3}, {"year_id": 2024, "trade_type": 1, "v": 9}]
        with mock.patch("apps.credits.agent.dataset", return_value=(self.HEADER, self.ROWS)) as ds, \
                mock.patch("apps.credits.agent._qs", return_value=qs), mock.patch("apps.credits.agent._rows", return_value=2):
            out = agent.preview(purchase, offset=-5, limit=9999)
        ds.assert_called_once_with(SPEC, 0, 100)
        self.assertEqual(out["rows"], self.ROWS)
        self.assertEqual(out["chart"], [{"year": 2023, "Eksport": 5.0, "Import": 3.0}, {"year": 2024, "Eksport": 9.0}])
        self.assertEqual(out["total"], 2)
