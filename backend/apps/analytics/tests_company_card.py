"""IHAMKOR_MUQOBIL.md IH-01..IH-03, IH-08: kontragent kartasi — faqat real manbalar, shaxsiy ma'lumotsiz."""
from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.additional_services.models import (IndustrialProduct, IndustrialProductCategory, Ktut, KtutReportList,
                                             ReportList, Skp)

from . import company_card


def _report(rid, form, rtype):
    text = dict(type=form, type_uz=form, type_ru=form, type_cry=form, srok="5-sanagacha", srok_uz="5-sanagacha",
                srok_ru="", srok_cry="", formsname="Hisobot", formsname_uz="Hisobot", formsname_ru="", formsname_cry="")
    return ReportList.objects.create(id=rid, report_type=rtype, **text)


class CompanyCardTests(APITestCase):
    URL = "/api/analytics/company-card/{}/"
    ADDRESS = "Navoiy viloyati, Navoiy sh. Sinov ko'chasi, 1-uy"

    @classmethod
    def setUpTestData(cls):
        cls.ktut = Ktut.objects.create(inn="300000011", okpo="29903881.0", name='"SINOV ZAVOD" MChJ')
        KtutReportList.objects.create(ktut=cls.ktut, reportlist=_report("911", "12-narx", "monthly"))
        KtutReportList.objects.create(ktut=cls.ktut, reportlist=_report("912", "4-kb", "quarterly"))
        cat = IndustrialProductCategory.objects.create(name_uz="Nasoslar ishlab chiqarish")
        for i, code in enumerate(("2813100", "2813200")):
            skp = Skp.objects.create(code=code, name_uz=f"Mahsulot {i}")
            IndustrialProduct.objects.create(category=cat, skp=skp, inn="300000011", okpo=29903881, name='"SINOV ZAVOD" MChJ',
                                             soato_uz="Navoiy shahar", adress_uz=cls.ADDRESS, phone="998901234567")
        # Bir manzilda yana 10 korxona — "ommaviy manzil"
        mass = "Toshkent shahri, Yakkasaroy tumani, Biznes-markaz, 1-uy"
        skp = Skp.objects.create(code="9999999", name_uz="Boshqa")
        for i in range(11):
            IndustrialProduct.objects.create(category=cat, skp=skp, inn=f"40000{i:04d}", name=f"Korxona {i}",
                                             soato_uz="Yakkasaroy tumani", adress_uz=mass, phone="998900000000")

    def setUp(self):
        cache.clear()

    def test_card_from_real_sources(self):
        res = self.client.get(self.URL.format("300000011"))
        self.assertEqual(res.status_code, 200)
        d = res.json()
        p = d["passport"]
        self.assertEqual((p["okpo"], p["region"], p["district"]), ("29903881", "Navoiy viloyati", "Navoiy shahar"))
        self.assertIn("OKED", p["missing"])           # manbada yo'q maydon o'ylab topilmaydi
        self.assertEqual(d["discipline"]["reports_count"], 2)
        self.assertEqual(d["discipline"]["by_periodicity"], {"Oylik": 1, "Choraklik": 1})
        self.assertIsNone(d["discipline"]["timely_share"])
        self.assertEqual(d["production"]["products_count"], 2)
        codes = {b["code"] for b in d["badges"]}
        self.assertEqual(codes, {"reporter", "producer", "reports"})
        self.assertEqual(d["links"]["certificate"], "/stat-codes?stir=300000011")

    def test_no_personal_data(self):
        body = self.client.get(self.URL.format("300000011")).content.decode()
        self.assertNotIn("998901234567", body)
        self.assertNotIn("phone", body)

    def test_mass_address_badge_and_not_in_reporters_is_neutral(self):
        d = self.client.get(self.URL.format("400000000")).json()
        codes = {b["code"]: b for b in d["badges"]}
        self.assertIn("mass_address", codes)
        self.assertEqual(codes["mass_address"]["text"], "Ommaviy manzil: yana 10 korxona")
        # Hisobot topshiruvchilar ro'yxatida yo'qlik salbiy belgi bermaydi
        self.assertFalse(any(b["tone"] == "warn" and b["code"] != "mass_address" for b in d["badges"]))
        self.assertFalse(d["discipline"]["available"])

    def test_not_found_and_bad_stir(self):
        self.assertEqual(self.client.get(self.URL.format("399999999")).status_code, 404)
        self.assertEqual(self.client.get(self.URL.format("12345")).status_code, 404)

    def test_search_merges_sources(self):
        rows = self.client.get("/api/analytics/company-card/search/", {"q": "SINOV"}).json()["results"]
        self.assertEqual(len(rows), 1)
        self.assertEqual((rows[0]["stir"], rows[0]["in_ktut"], rows[0]["products"]), ("300000011", True, 2))
        self.assertEqual(self.client.get("/api/analytics/company-card/search/", {"q": "ab"}).json()["results"], [])

    def test_clean_okpo(self):
        self.assertEqual(company_card.clean_okpo("29903881.0"), "29903881")
        self.assertIsNone(company_card.clean_okpo(""))
