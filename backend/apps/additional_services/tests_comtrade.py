from unittest import mock

from django.test import SimpleTestCase, TestCase, override_settings
from rest_framework.test import APIClient

from apps.additional_services.models.comtrade import ComtradeFlow
from apps.additional_services.models.ex_trade import Country, Product
from apps.additional_services.services import comtrade


def row(**kw):
    base = {"freqCode": "A", "refYear": 2023, "refMonth": 52, "reporterCode": 860, "flowCode": "X", "partnerCode": 398, "partner2Code": 0,
            "motCode": 0, "customsCode": "C00", "cmdCode": "170199", "primaryValue": 1504251.0, "netWgt": 2008500.0, "qty": 2008500.0, "qtyUnitCode": 8}
    return {**base, **kw}


class FakeSession:
    def __init__(self, rows, status=200):
        self.rows, self.status, self.calls = rows, status, []

    def get(self, url, params=None, headers=None, timeout=None):
        self.calls.append((url, params, headers))
        resp = mock.Mock(status_code=self.status, text="err", headers={})
        resp.json.return_value = {"data": self.rows}
        return resp


class ParseTests(SimpleTestCase):
    def test_parse_skips_detail_breakdowns_and_maps_fields(self):
        rows = [row(), row(motCode=1000), row(partner2Code=156), row(customsCode="C01")]
        out = comtrade.parse(rows, "api")
        self.assertEqual(len(out), 1)
        self.assertEqual((out[0]["year"], out[0]["month"], out[0]["flow"], out[0]["partner_code"]), (2023, 0, "X", 398))
        self.assertEqual(str(out[0]["value_usd"]), "1504251.0")

    def test_monthly_period_keeps_month(self):
        out = comtrade.parse([row(freqCode="M", refMonth=3)], "api")
        self.assertEqual((out[0]["period_type"], out[0]["month"]), ("M", 3))


class FetchTests(SimpleTestCase):
    @override_settings(COMTRADE_API_KEY="")
    def test_without_key_uses_public_preview_and_flags_truncation(self):
        s = FakeSession([row()] * 500)
        data, truncated = comtrade.fetch("A", "2023", "X", cmd="1701", session=s)
        self.assertIn("/public/v1/preview/", s.calls[0][0])
        self.assertEqual(s.calls[0][2], {})
        self.assertTrue(truncated)
        self.assertEqual(len(data), 500)

    @override_settings(COMTRADE_API_KEY="k123")
    def test_with_key_uses_full_api_and_header(self):
        s = FakeSession([row()])
        _data, truncated = comtrade.fetch("A", "2023", "X", session=s)
        self.assertIn("/data/v1/get/", s.calls[0][0])
        self.assertEqual(s.calls[0][2], {"Ocp-Apim-Subscription-Key": "k123"})
        self.assertFalse(truncated)

    @override_settings(COMTRADE_API_KEY="bad")
    def test_unauthorized_raises(self):
        with self.assertRaises(comtrade.ComtradeError):
            comtrade.fetch("A", "2023", "X", session=FakeSession([], status=401))

    @override_settings(COMTRADE_API_KEY="")
    def test_sync_needs_hs_without_key(self):
        with self.assertRaises(comtrade.ComtradeError):
            comtrade.sync(years=[2023])


@override_settings(COMTRADE_API_KEY="", COMTRADE_PAUSE=0)
class SyncTests(TestCase):
    def setUp(self):
        Country.objects.create(ctrana="398", zar0="", zar1="", zar="", name="Kazakhstan", name_en="Kazakhstan", name_cry="", name_uz="Qozog'iston", name_ru="", kod_kont="")
        Product.objects.create(code="170199", name_ru="", name_uz="Shakar", name_cry="", name_cry2="", level=3)

    def test_sync_saves_with_fk_and_is_idempotent(self):
        s = FakeSession([row(), row(partnerCode=0, primaryValue=9.0)])
        e1 = comtrade.sync(years=[2023], flows=["X"], hs=["170199"], session=s)
        e2 = comtrade.sync(years=[2023], flows=["X"], hs=["170199"], session=s)
        self.assertEqual((e1.status, e1.calls, e1.rows), ("ok", 1, 2))
        self.assertEqual(e2.status, "ok")
        self.assertEqual(ComtradeFlow.objects.count(), 2)      # takroriy yuklash dublikat yaratmaydi
        kz = ComtradeFlow.objects.get(partner_code=398)
        self.assertEqual(kz.partner.name_uz, "Qozog'iston")
        self.assertEqual(kz.product.code, "170199")
        self.assertIsNone(ComtradeFlow.objects.get(partner_code=0).partner)
        self.assertEqual(kz.source, "preview")

    def test_truncated_preview_marks_partial(self):
        e = comtrade.sync(years=[2023], flows=["X"], hs=["170199"], session=FakeSession([row(partnerCode=i) for i in range(1, 501)]))
        self.assertEqual(e.status, "partial")
        self.assertIn("500", e.error)

    def test_overview_endpoint_totals_and_top_partners(self):
        comtrade.sync(years=[2023], flows=["X"], hs=["170199"], session=FakeSession([row(), row(partnerCode=0, primaryValue=9.0)]))
        r = APIClient().get("/api/additional-services/external-trade/comtrade/overview/", {"year": 2023, "hs": "170199"})
        self.assertEqual(r.status_code, 200)
        self.assertEqual(r.data["years"], [2023])
        self.assertEqual(r.data["totals"], {"export": 1504251.0})          # 0 = Dunyo qatori ikki marta sanalmaydi
        self.assertEqual(r.data["partners"][0]["country"], "Qozog'iston")
        self.assertEqual(r.data["last_sync"]["status"], "ok")

    def test_overview_empty_before_first_sync(self):
        r = APIClient().get("/api/additional-services/external-trade/comtrade/overview/")
        self.assertEqual((r.status_code, r.data["years"]), (200, []))

    def test_trade_code_alias_maps_to_iso_country(self):
        Country.objects.create(ctrana="250", zar0="", zar1="", zar="", name="France", name_en="France", name_cry="", name_uz="Fransiya", name_ru="", kod_kont="")
        comtrade.save(comtrade.parse([row(partnerCode=251)], "api"))
        self.assertEqual(ComtradeFlow.objects.get(partner_code=251).partner.name_uz, "Fransiya")
