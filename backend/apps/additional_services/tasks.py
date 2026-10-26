import logging

from celery import shared_task
from django.core.management import call_command

logger = logging.getLogger(__name__)


@shared_task
def send_report_notifications_task(days=10):
    """Hisobot muddati yaqinlashgan foydalanuvchilarga Telegram xabar (Celery Beat, B-06)."""
    logger.info("Hisobot eslatmalari boshlandi (days=%s)", days)
    call_command("send_report_notifications", "--days", str(days))


@shared_task
def report_reminder_notifications_task(today=None):
    """U-13: eslatma yoqilgan hisobotlar uchun muddatdan `days_before` kun oldin in-app xabarnoma.
    Har muddat uchun bir marta (extra_data.reminder_key bo'yicha). -> yaratilganlar soni"""
    from datetime import date, timedelta

    from django.contrib.contenttypes.models import ContentType

    from apps.additional_services.api_endpoints.KtutReportAPI.calendar import next_occurrence
    from apps.additional_services.models import ReportReminder
    from apps.notifications.models import Notification

    today = date.fromisoformat(today) if isinstance(today, str) else (today or date.today())
    ct = ContentType.objects.get_for_model(ReportReminder)
    created = 0
    for reminder in ReportReminder.objects.select_related("report", "user"):
        deadline = next_occurrence(reminder.report, today)
        if deadline is None or deadline - today != timedelta(days=reminder.days_before):
            continue
        key = f"report-reminder:{reminder.id}:{deadline.isoformat()}"
        if Notification.objects.filter(recipient=reminder.user, extra_data__reminder_key=key).exists():
            continue
        Notification.objects.create(
            recipient=reminder.user,
            title="Hisobot muddati yaqinlashmoqda",
            message=f"{reminder.report.type_uz or reminder.report.type} — topshirish muddati {deadline:%d.%m.%Y} "
                    f"({reminder.days_before} kun qoldi).",
            notification_type="warning",
            content_type=ct,
            object_id=reminder.id,
            extra_data={"reminder_key": key, "report_id": reminder.report_id, "deadline": deadline.isoformat()},
        )
        created += 1
    created += _default_reminders(today, ct)
    logger.info("Hisobot eslatmalari: %s ta xabarnoma", created)
    return created


DEFAULT_REMINDER_DAYS = (5, 1)


def _default_reminders(today, ct):
    """HT-06: yuridik shaxs (STIR'i KTUT'da bor) uchun standart eslatma: muddatdan 5 va 1 kun oldin hamda
    muddat o'tgan kuni bitta xabar. O'chirilgan (`ReportReminderPreference.enabled=False`) yoki shu shakl uchun
    alohida `ReportReminder` bor foydalanuvchilarga yuborilmaydi (ular o'z sozlamasi bilan ishlaydi)."""
    from datetime import timedelta

    from apps.additional_services.deadlines import next_occurrence, previous_occurrence
    from apps.additional_services.models import KtutReportList, ReportReminder, ReportReminderPreference
    from apps.notifications.models import Notification
    from apps.organizations.models import Organization

    from django.contrib.contenttypes.models import ContentType
    org_ct = ContentType.objects.get_for_model(Organization)
    off = set(ReportReminderPreference.objects.filter(enabled=False).values_list("user_id", flat=True))
    explicit = set(ReportReminder.objects.values_list("user_id", "report_id"))
    created = 0
    for org in Organization.objects.select_related("user").filter(is_active=True):
        if org.user_id in off:
            continue
        links = KtutReportList.objects.filter(ktut__inn=org.tin).select_related("reportlist")
        for link in links:
            report = link.reportlist
            if not report.is_active or (org.user_id, report.id) in explicit:
                continue
            items = []
            nxt = next_occurrence(report, today)
            if nxt is not None and (nxt - today).days in DEFAULT_REMINDER_DAYS:
                days = (nxt - today).days
                items.append((f"d{days}", nxt, "warning", "Hisobot muddati yaqinlashmoqda",
                              f"{report.type_uz or report.type} — topshirish muddati {nxt:%d.%m.%Y} ({days} kun qoldi)."))
            prev = previous_occurrence(report, today)
            if prev is not None and prev == today - timedelta(days=1):
                items.append(("over", prev, "info", "Hisobot muddati o'tdi",
                              f"{report.type_uz or report.type} — muddat {prev:%d.%m.%Y} edi. Topshirgan bo'lsangiz, "
                              f"e'tiborga olmang: topshirish holati portalga ulanmagan."))
            for kind, due, ntype, title, message in items:
                key = f"report-default:{org.user_id}:{report.id}:{due.isoformat()}:{kind}"
                if Notification.objects.filter(recipient=org.user, extra_data__reminder_key=key).exists():
                    continue
                Notification.objects.create(recipient=org.user, title=title, message=message, notification_type=ntype,
                                            content_type=org_ct, object_id=org.pk,
                                            extra_data={"reminder_key": key, "report_id": report.id,
                                                        "deadline": due.isoformat()})
                created += 1
    return created
