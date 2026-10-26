"""HT-01..HT-04, HT-10: muddatlar qoidasi, davr qatorlari, holat lug'ati, submitted-report himoyasi."""
from datetime import date

from django.test import TestCase
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.additional_services import deadlines
from apps.additional_services.models import Holiday, Ktut, KtutReportList, ReportDeadlineOverride, ReportList
from apps.additional_services.report_status import deadline_flag, resolve_status
from apps.common.models import SiteSettings
from apps.organizations.models import Organization


def make_report(pk, kind, rule="", deadline=None):
    return ReportList.objects.create(id=pk, type=pk, type_uz=f"{pk}-shakl", type_ru=pk, type_cry=pk, srok="x", srok_uz="x",
                                     srok_ru="x", srok_cry="x", formsname="F", formsname_uz="F", formsname_ru="F",
                                     formsname_cry="F", deadline=deadline, report_type=kind, deadline_rule=rule)


class DeadlineRuleTests(TestCase):
    def test_parse(self):
        self.assertEqual(deadlines.parse_rule("Q+25d"), ("Q", 25))
        self.assertEqual(deadlines.parse_rule("Y+03-15"), ("YF", (3, 15)))
        for bad in ("", "Q25", "X+5d", "Y+13-01", "Y+02-30"):
            self.assertIsNone(deadlines.parse_rule(bad))

    def test_monthly_rule_every_month_2026_and_2027(self):
        r = make_report("M", "monthly", "M+5d")
        for year in (2026, 2027):
            rows = deadlines.deadlines_for(r, year, shift=False)
            self.assertEqual(len(rows), 12)
            self.assertEqual(rows[0]["due"], date(year, 1, 5))
            self.assertEqual(rows[0]["period"], f"{year - 1}-M12")
            self.assertEqual(rows[-1]["due"], date(year, 12, 5))

    def test_quarterly_rule(self):
        r = make_report("Q", "quarterly", "Q+25d")
        rows = deadlines.deadlines_for(r, 2026, shift=False)
        self.assertEqual([x["due"] for x in rows],
                         [date(2026, 1, 25), date(2026, 4, 25), date(2026, 7, 25), date(2026, 10, 25)])
        self.assertEqual(rows[0]["period"], "2025-Q4")

    def test_half_year_and_yearly_offset(self):
        h = make_report("H", "", "H+20d")
        self.assertEqual([x["due"] for x in deadlines.deadlines_for(h, 2026, shift=False)],
                         [date(2026, 1, 20), date(2026, 7, 20)])
        y = make_report("Y", "yearly", "Y+60d")
        self.assertEqual([x["due"] for x in deadlines.deadlines_for(y, 2026, shift=False)], [date(2026, 3, 1)])

    def test_fixed_yearly_date_does_not_drift_in_leap_year(self):
        y = make_report("YF", "yearly", "Y+03-15")
        for year in (2027, 2028):
            rows = deadlines.deadlines_for(y, year, shift=False)
            self.assertEqual([x["due"] for x in rows], [date(year, 3, 15)])
            self.assertEqual(rows[0]["period"], f"{year - 1}-Y")

    def test_legacy_fallback_without_rule(self):
        r = make_report("L", "quarterly", "", date(2025, 1, 15))
        rows = deadlines.deadlines_for(r, 2026, shift=False)
        self.assertEqual([x["due"].month for x in rows], [1, 4, 7, 10])
        self.assertTrue(all(x["source"] == "legacy" and x["period"] is None for x in rows))
        self.assertEqual(deadlines.next_occurrence(r, date(2026, 10, 26)), date(2027, 1, 15))

    def test_override_replaces_one_period_and_is_not_shifted(self):
        r = make_report("O", "quarterly", "Q+25d")
        ReportDeadlineOverride.objects.create(report=r, period="2026-Q2", date=date(2026, 8, 1), reason="buyruq")  # shanba
        rows = {x["period"]: x for x in deadlines.deadlines_for(r, 2026, shift=True)}
        self.assertEqual(rows["2026-Q2"]["due"], date(2026, 8, 1))
        self.assertEqual(rows["2026-Q2"]["source"], "override")
        self.assertEqual(rows["2026-Q1"]["source"], "rule")

    def test_shift_to_workday_with_holiday(self):
        r = make_report("S", "monthly", "M+5d")
        # 2026-09-05 shanba, 2026-10-05 dushanba (bayram deb belgilangan)
        Holiday.objects.create(date=date(2026, 10, 5), name="test")
        off = {x["due"] for x in deadlines.deadlines_for(r, 2026, shift=False)}
        on = {x["due"] for x in deadlines.deadlines_for(r, 2026, shift=True)}
        self.assertIn(date(2026, 9, 5), off)
        self.assertIn(date(2026, 9, 7), on)
        self.assertIn(date(2026, 10, 6), on)
        self.assertNotIn(date(2026, 9, 5), on)

    def test_shift_flag_default_off(self):
        SiteSettings.objects.get_or_create(pk=1)
        self.assertFalse(deadlines.shift_enabled())
        SiteSettings.objects.filter(pk=1).update(deadline_shift_to_workday=True)
        self.assertTrue(deadlines.shift_enabled())

    def test_infer_rule(self):
        self.assertEqual(deadlines.infer_rule("monthly", date(2025, 11, 5)), "M+5d")
        self.assertEqual(deadlines.infer_rule("quarterly", date(2025, 1, 15)), "Q+15d")
        self.assertEqual(deadlines.infer_rule("quarterly", date(2025, 12, 5)), "")
        self.assertEqual(deadlines.infer_rule("yearly", date(2025, 3, 18)), "Y+03-18")
        self.assertEqual(deadlines.infer_rule("yearly", date(2025, 12, 11)), "")
        self.assertEqual(deadlines.infer_rule("", date(2025, 3, 18)), "")


class StatusTests(TestCase):
    def test_flags(self):
        today = date(2026, 10, 26)
        self.assertEqual(deadline_flag(date(2026, 10, 25), today, "unknown"), "overdue")
        self.assertEqual(deadline_flag(date(2026, 10, 31), today, "unknown"), "due_soon")
        self.assertIsNone(deadline_flag(date(2026, 11, 1), today, "unknown"))
        self.assertIsNone(deadline_flag(date(2026, 10, 1), today, "submitted"))

    def test_no_source_is_unknown_not_not_started(self):
        self.assertEqual(resolve_status(None), "unknown")
        self.assertEqual(resolve_status({"status": "accepted"}), "accepted")


class PeriodRowsTests(APITestCase):
    def test_quarterly_form_gives_four_rows_for_current_year(self):
        user = User.objects.create_user(username="ht_u", password="x")
        Organization.objects.create(user=user, name="HT LLC", tin="900000555")
        ktut = Ktut.objects.create(inn="900000555", okpo="1", name="HT LLC")
        KtutReportList.objects.create(ktut=ktut, reportlist=make_report("QQ", "quarterly", "Q+25d"))
        self.client.force_authenticate(user)
        data = self.client.get("/api/additional-services/my-reports/").data
        year = date.today().year
        rows = [r for r in data["rows"] if r["due"].startswith(str(year))]
        self.assertEqual(len(rows), 4)
        self.assertTrue(all(r["status"] == "unknown" and r["period_label"] for r in rows))
        self.assertEqual({s["code"] for s in data["status_legend"]["statuses"]},
                         {"not_started", "submitted", "accepted", "rejected", "unknown"})


class SubmittedReportAccessTests(APITestCase):
    url = "/api/additional-services/submitted-report"

    def setUp(self):
        self.user = User.objects.create_user(username="ht_a", password="x")
        Organization.objects.create(user=self.user, name="A", tin="900000601")

    def test_guest_rejected(self):
        self.assertIn(self.client.get(self.url, {"stir_number": "900000601"}).status_code, (401, 403))

    def test_foreign_stir_404(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(self.url, {"stir_number": "900000602"}).status_code, 404)

    def test_own_stir_ok_and_invalid_400(self):
        self.client.force_authenticate(self.user)
        self.assertEqual(self.client.get(self.url, {"stir_number": "900000601"}).status_code, 200)
        self.assertEqual(self.client.get(self.url, {"stir_number": "123"}).status_code, 400)


class DefaultRemindersAndFeedTests(APITestCase):
    def setUp(self):
        from apps.additional_services.models import ReportReminder  # noqa: F401
        self.user = User.objects.create_user(username="ht_r", password="x")
        Organization.objects.create(user=self.user, name="R", tin="900000777")
        ktut = Ktut.objects.create(inn="900000777", okpo="1", name="R")
        self.report = make_report("RR", "monthly", "M+5d")
        KtutReportList.objects.create(ktut=ktut, reportlist=self.report)

    def test_default_reminders_5_1_and_overdue_once(self):
        from apps.additional_services.tasks import report_reminder_notifications_task as task
        from apps.notifications.models import Notification
        self.assertEqual(task(today="2026-11-30"), 1)      # 5 kun qoldi (2026-12-05)
        self.assertEqual(task(today="2026-11-30"), 0)      # ikki marta yaratilmaydi
        self.assertEqual(task(today="2026-12-04"), 1)      # 1 kun
        self.assertEqual(task(today="2026-12-06"), 1)      # muddat o'tgan kuni
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 3)

    def test_opt_out_and_explicit_reminder_skip_defaults(self):
        from apps.additional_services.models import ReportReminder
        from apps.additional_services.tasks import report_reminder_notifications_task as task
        self.client.force_authenticate(self.user)
        self.assertTrue(self.client.get("/api/additional-services/report-reminder-settings/").data["enabled"])
        self.client.put("/api/additional-services/report-reminder-settings/", {"enabled": False}, format="json")
        self.assertEqual(task(today="2026-11-30"), 0)
        self.client.put("/api/additional-services/report-reminder-settings/", {"enabled": True}, format="json")
        ReportReminder.objects.create(user=self.user, report=self.report, days_before=3)
        self.assertEqual(task(today="2026-11-30"), 0)      # alohida sozlama ustun, 5 kunda yo'q

    def test_calendar_feed_token_flow(self):
        self.client.force_authenticate(self.user)
        url = self.client.post("/api/additional-services/calendar-feed/", {}, format="json").data["url"]
        path = url.split("testserver")[1]
        self.client.force_authenticate(None)
        res = self.client.get(path)
        body = res.content.decode()
        self.assertEqual(res.status_code, 200)
        self.assertTrue(body.startswith("BEGIN:VCALENDAR"))
        self.assertIn("Hisobot muddati: RR-shakl", body)
        self.assertNotIn("R LLC", body)
        self.client.force_authenticate(self.user)
        self.client.delete("/api/additional-services/calendar-feed/")
        self.client.force_authenticate(None)
        self.assertEqual(self.client.get(path).status_code, 404)

    def test_no_ktut_message_and_submit_system(self):
        other = User.objects.create_user(username="ht_n", password="x")
        Organization.objects.create(user=other, name="N", tin="900000778")
        self.client.force_authenticate(other)
        res = self.client.get("/api/additional-services/my-reports/")
        self.assertEqual(res.status_code, 404)
        self.assertIn("hududiy statistika", res.data["detail"])
        self.assertIsNone(res.data["submit_system"])
        SiteSettings.objects.update_or_create(pk=1, defaults={"report_submit_system_name": "eStat", "report_submit_system_url": "https://example.uz"})
        self.assertEqual(self.client.get("/api/additional-services/my-reports/").data["submit_system"]["name"], "eStat")
