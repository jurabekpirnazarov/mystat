"""JAHON_TAJRIBASI JT-04: statistik kodlar ma'lumotnomasi va uni tekshirish."""
from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.additional_services.models import Ktut, KtutReportList, ReportList


def _report(rid, form, rtype="yearly"):
    text = dict(type=form, type_uz=form, type_ru=form, type_cry=form, srok="15-martdan", srok_uz="15-martdan  _x000D_",
                srok_ru="", srok_cry="", formsname="Hisobot", formsname_uz="Hisobot", formsname_ru="", formsname_cry="")
    return ReportList.objects.create(id=rid, report_type=rtype, **text)


class StatCodesCertificateTests(APITestCase):
    URL = "/api/additional-services/ktut/{}/certificate/"
    VERIFY = "/api/additional-services/certificate/verify/"

    @classmethod
    def setUpTestData(cls):
        cls.user = User.objects.create_user(username="jt04_user", password="x-Strong-pass-1")
        cls.ktut = Ktut.objects.create(inn="300000001", okpo="12345678", name="Sinov MChJ")
        for rid, form in (("901", "1-korxona"), ("902", "4-mehnat")):
            KtutReportList.objects.create(ktut=cls.ktut, reportlist=_report(rid, form))

    def setUp(self):
        cache.clear()

    def test_requires_login(self):
        self.assertEqual(self.client.get(self.URL.format("300000001")).status_code, 401)

    def test_certificate_content_and_validation(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(self.URL.format("12345")).status_code, 400)
        self.assertEqual(self.client.get(self.URL.format("399999999")).status_code, 404)
        data = self.client.get(self.URL.format("300000001")).json()
        self.assertEqual((data["stir"], data["okpo"], data["name"]), ("300000001", "12345678", "Sinov MChJ"))
        self.assertEqual([r["form"] for r in data["reports"]], ["1-korxona", "4-mehnat"])
        self.assertEqual(data["reports"][0]["deadline_rule"], "15-martdan")   # `_x000D_` tozalangan
        self.assertEqual(data["codes"], {})   # portalda ro'yxatdan o'tmagan — sintetik kod qo'yilmaydi
        self.assertIn(data["verify_code"], data["verify_path"])

    def test_verify_valid_tampered_and_changed(self):
        self.client.force_authenticate(self.user)
        code = self.client.get(self.URL.format("300000001")).json()["verify_code"]
        self.client.force_authenticate(None)

        ok = self.client.get(self.VERIFY, {"code": code}).json()
        self.assertTrue(ok["valid"])
        self.assertEqual((ok["stir"], ok["reports_count"], ok["changed"]), ("300000001", 2, False))

        self.assertFalse(self.client.get(self.VERIFY, {"code": code[:-2] + "xx"}).json()["valid"])

        KtutReportList.objects.create(ktut=self.ktut, reportlist=_report("903", "1-energiya"))
        changed = self.client.get(self.VERIFY, {"code": code}).json()
        self.assertTrue(changed["valid"])
        self.assertTrue(changed["changed"])
