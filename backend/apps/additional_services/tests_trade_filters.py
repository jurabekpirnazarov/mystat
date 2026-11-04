from django.test import TestCase
from rest_framework.test import APIClient

from apps.additional_services.models.ex_trade import SITC, Country, Product, Region, TradeData, Unit, Year

URL = "/api/additional-services/external-trade/trade-data/"


class TradeFilterTests(TestCase):
    """Parametrli tahlilning qo'shimcha filtrlari: davlatni chiqarish, qidiruv, qiymat oralig'i, top-N, saralash, ulush, o'sish."""

    @classmethod
    def setUpTestData(cls):
        unit = Unit.objects.create(code="U", name="kg", short_name="kg")
        region = Region.objects.create(name_uz="Toshkent", name_ru="", name_en="", name_cry="", soato="1726")
        sitc = SITC.objects.create(code="0", name_uz="Oziq-ovqat", name_ru="")
        product = Product.objects.create(code="170199", name_uz="Shakar", name_ru="", name_cry="", name_cry2="")
        for y in (2023, 2024):
            Year.objects.create(year=y)
        names = {"643": ("Rossiya", {2023: 100, 2024: 300}), "398": ("Qozog'iston", {2023: 50, 2024: 25}),
                 "156": ("Xitoy", {2023: 10, 2024: 10})}
        for code, (name, by_year) in names.items():
            c = Country.objects.create(ctrana=code, zar0="", zar1="", zar="", name=name, name_en=name, name_cry=name,
                                       name_uz=name, name_ru=name, kod_kont="")
            for y, v in by_year.items():
                TradeData.objects.create(trade_type=1, product=product, unit=unit, year_id=y, month="M12", country=c,
                                         region=region, sitc=sitc, value=v)

    def q(self, **extra):
        body = {"lang": "uz", "years": [2024], "months": ["M12"], "trade_type": 1, "countries": ["643", "398", "156"],
                "group_by": ["country"], **extra}
        res = APIClient().post(URL, body, format="json")
        self.assertEqual(res.status_code, 200, res.content)
        return res.json()

    @staticmethod
    def names(res):
        return [r["davlat_nomi"] for r in res["data"] if not r.get("isGroupSummary")]

    def test_exclude_countries(self):
        self.assertNotIn("Rossiya", self.names(self.q(exclude_countries=["643"])))

    def test_search_by_name(self):
        self.assertEqual(self.names(self.q(search="xit")), ["Xitoy"])

    def test_value_range_uses_last_period(self):
        self.assertEqual(self.names(self.q(min_value=20, max_value=100)), ["Qozog'iston"])

    def test_sort_and_top_n_keep_full_total(self):
        res = self.q(sort_by="value_desc", top_n=2)
        self.assertEqual(self.names(res), ["Rossiya", "Qozog'iston"])
        self.assertEqual(res["data"][-1]["qiymat_2024_M12"], 335)  # jami qator qisqartirilmagan

    def test_sort_by_name_and_asc(self):
        self.assertEqual(self.names(self.q(sort_by="value_asc"))[0], "Xitoy")
        self.assertEqual(self.names(self.q(sort_by="name"))[0], "Qozog'iston")

    def test_share_and_growth_columns(self):
        res = self.q(years=[2023, 2024], show_share=True, show_growth=True)
        rus = next(r for r in res["data"] if r.get("davlat_nomi") == "Rossiya")
        self.assertEqual(rus["ulush_foiz"], round(300 / 335 * 100, 1))
        self.assertEqual(rus["osish_foiz"], 200.0)
        self.assertEqual(res["data"][-1]["ulush_foiz"], 100.0)
        fields = [h["field"] for h in res["headers"]]
        self.assertEqual(fields[-2:], ["ulush_foiz", "osish_foiz"])

    def test_growth_needs_two_periods(self):
        res = self.q(show_growth=True)
        self.assertNotIn("osish_foiz", [h["field"] for h in res["headers"]])

    def test_rejects_inverted_range(self):
        res = APIClient().post(URL, {"lang": "uz", "min_value": 10, "max_value": 5}, format="json")
        self.assertEqual(res.status_code, 400)

    def test_without_new_params_nothing_changes(self):
        res = self.q()
        self.assertEqual(len(self.names(res)), 3)
        self.assertNotIn("ulush_foiz", [h["field"] for h in res["headers"]])
