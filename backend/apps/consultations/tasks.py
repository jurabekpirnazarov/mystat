"""A-03: konsultatsiyadan 24 soat va 1 soat oldin eslatma (Celery Beat, har 15 daqiqa)."""
from datetime import timedelta

from celery import shared_task
from django.contrib.contenttypes.models import ContentType
from django.utils import timezone


@shared_task
def consultation_reminders(now=None):
    from apps.notifications.models import Notification

    from .models import ConsultationBooking

    now = now or timezone.now()
    ct = ContentType.objects.get_for_model(ConsultationBooking)
    sent = 0
    for flag, window, label in (("reminded_24h", timedelta(hours=24), "ertaga"), ("reminded_1h", timedelta(hours=1), "1 soatdan keyin")):
        qs = ConsultationBooking.objects.filter(status="booked", **{flag: False}, slot__starts_at__gt=now,
                                                slot__starts_at__lte=now + window).select_related("slot__consultant__user", "user")
        for b in qs:
            for user in (b.user, b.slot.consultant.user):
                Notification.objects.create(recipient=user, title=f"Konsultatsiya {label}",
                                            message=f"{b.slot.starts_at:%d.%m %H:%M} — {b.topic}", notification_type="info",
                                            content_type=ct, object_id=b.pk)
                sent += 1
            setattr(b, flag, True)
            b.save(update_fields=[flag])
    return sent
