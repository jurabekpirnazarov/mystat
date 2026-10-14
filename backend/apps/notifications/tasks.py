"""A-02 Celery task'lari: ko'rsatkich yangilanishlarini yuborish va oylik dayjest."""
import logging

from celery import shared_task
from django.utils import timezone

logger = logging.getLogger(__name__)


@shared_task
def dispatch_indicator_updates():
    """Yuborilmagan IndicatorUpdateEvent'larni obunachilarga yuboradi (Celery Beat, har soat)."""
    from .models import IndicatorUpdateEvent
    from .subscriptions import dispatch_event

    total = 0
    for event in IndicatorUpdateEvent.objects.filter(dispatched_at__isnull=True).order_by("id"):
        total += dispatch_event(event)
    logger.info("A-02: %s ta xabar yuborildi", total)
    return total


@shared_task
def monthly_digest(today=None):
    """Har oyning 1-kuni: sevimli ko'rsatkichlari bor foydalanuvchilarga qisqa email (email sozlangan bo'lsa)."""
    from django.conf import settings

    from apps.citizens.models import FavoriteIndicator
    from .models import IndicatorUpdateEvent
    from .subscriptions import _send_email

    today = today or timezone.localdate()
    since = today.replace(day=1) - timezone.timedelta(days=31)
    events = list(IndicatorUpdateEvent.objects.filter(date__gte=since).values_list("title", flat=True)[:10])
    sent = 0
    users = {f.user for f in FavoriteIndicator.objects.select_related("user")}
    for user in users:
        favs = FavoriteIndicator.objects.filter(user=user).values_list("title", flat=True)[:10]
        body = "Sevimli ko'rsatkichlaringiz:\n" + "\n".join(f"• {t}" for t in favs)
        if events:
            body += "\n\nO'tgan oy yangilangan ma'lumotlar:\n" + "\n".join(f"• {t}" for t in events)
        body += f"\n\n{settings.SITE_URL}/cabinet"
        sent += _send_email(user, "my.stat.uz: oylik qisqa hisobot", body)
    return sent
