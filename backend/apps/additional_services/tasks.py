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
    logger.info("Hisobot eslatmalari: %s ta xabarnoma", created)
    return created
