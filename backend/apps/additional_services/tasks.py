import logging

from celery import shared_task
from django.core.management import call_command

logger = logging.getLogger(__name__)


@shared_task
def send_report_notifications_task(days=10):
    """Hisobot muddati yaqinlashgan foydalanuvchilarga Telegram xabar (Celery Beat, B-06)."""
    logger.info("Hisobot eslatmalari boshlandi (days=%s)", days)
    call_command("send_report_notifications", "--days", str(days))
