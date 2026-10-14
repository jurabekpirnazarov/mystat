"""K-05 hisobot yordamchisi, S-12 yo'riqnomalar, minimal PDF."""
from datetime import date

from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.additional_services.models import Ktut, KtutReportList, ReportGuide, ReportList, ReportReminder
from apps.additional_services.tasks import report_reminder_notifications_task
from apps.common.pdf import render_pdf
from apps.notifications.models import Notification
from apps.organizations.models import Organization


def _report(pk, kind, deadline):
    return ReportList.objects.create(id=pk, type=pk, type_uz=f"{pk}-shakl", type_ru=pk, type_cry=pk, srok="x", srok_uz="x",
                                     srok_ru="x", srok_cry="x", formsname="F", formsname_uz="F", formsname_ru="F",
                                     formsname_cry="F", deadline=deadline, report_type=kind)


class MyReportsTests(APITestCase):
    url = "/api/additional-services/my-reports/"

    def setUp(self):
        self.user = User.objects.create_user(username="r_user", password="x")
        Organization.objects.create(user=self.user, name="R LLC", tin="900000333")
        ktut = Ktut.objects.create(inn="900000333", okpo="1", name="R LLC")
        self.monthly = _report("M1", "monthly", date(2025, 1, 15))
        self.yearly = _report("Y1", "yearly", date(2025, 3, 18))
        for r in (self.monthly, self.yearly):
            KtutReportList.objects.create(ktut=ktut, reportlist=r)
        _report("OTHER", "monthly", date(2025, 1, 1))  # biriktirilmagan
        ReportGuide.objects.create(report=self.monthly, summary_uz="S", steps_uz="1. A")
        self.client.force_authenticate(self.user)

    def test_lists_only_linked_reports_with_deadlines(self):
        data = self.client.get(self.url).data
        ids = {i["report_id"] for i in data["items"]}
        self.assertEqual(ids, {"M1", "Y1"})
        monthly = next(i for i in data["items"] if i["report_id"] == "M1")
        self.assertEqual(len(monthly["year_deadlines"]), 12)
        self.assertTrue(monthly["has_guide"])
        self.assertGreaterEqual(monthly["days_left"], 0)
        self.assertFalse(data["submission_status_available"])

    def test_stir_not_in_ktut(self):
        other = User.objects.create_user(username="r_none", password="x")
        Organization.objects.create(user=other, name="N", tin="900000334")
        self.client.force_authenticate(other)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, 404)
        self.assertEqual(response.data["code"], "no_ktut")

    def test_guide_endpoint(self):
        data = self.client.get("/api/additional-services/report-guide/M1/").data
        self.assertEqual(data["guide"]["steps"], "1. A")
        self.assertIsNone(self.client.get("/api/additional-services/report-guide/Y1/").data["guide"])

    def test_reminder_days_before_and_task_fires_on_that_day(self):
        response = self.client.post("/api/additional-services/reportlist/M1/remind/", {"days_before": 5}, format="json")
        self.assertEqual(response.data["days_before"], 5)
        reminder = ReportReminder.objects.get(user=self.user, report=self.monthly)
        self.assertEqual(reminder.days_before, 5)
        self.assertEqual(report_reminder_notifications_task(today=date(2026, 11, 9)), 0)
        self.assertEqual(report_reminder_notifications_task(today=date(2026, 11, 10)), 1)  # 15-noyabrdan 5 kun oldin
        self.assertEqual(report_reminder_notifications_task(today=date(2026, 11, 10)), 0)  # takror yo'q
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 1)


class PdfTests(APITestCase):
    def test_render_pdf_is_valid_and_has_watermark(self):
        data = render_pdf([("h1", "Sarlavha ‘namuna’"), ("p", "matn " * 1500)])
        self.assertTrue(data.startswith(b"%PDF-1.4"))
        self.assertTrue(data.rstrip().endswith(b"%%EOF"))
        self.assertIn(b"NAMUNA", data)
        self.assertIn(b"/Count 2", data)  # uzun matn ikki sahifaga bo'lindi
