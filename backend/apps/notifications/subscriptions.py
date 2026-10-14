"""A-02: ko'rsatkichlarga obuna — yuborish mantiqi va API.

Kanallar: in_app (doim), email (EMAIL_HOST yoki konsol backend), telegram (TELEGRAM_BOT_TOKEN va chat ID bo'lsa).
Sozlanmagan kanal jim o'tkazib yuboriladi — in-app ishlayveradi, hech narsa yiqilmaydi.
"""
import logging

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.mail import send_mail
from django.db import IntegrityError
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import IndicatorSubscription, IndicatorUpdateEvent, Notification

logger = logging.getLogger(__name__)


def subscribers_for(indicator):
    """"region:5" hodisasi — "region:5" va umumiy "region" obunachilariga; umumiy "cpi" — "cpi" va "cpi:*" ga."""
    from django.db.models import Q

    base = indicator.split(":")[0]
    cond = Q(indicator=indicator) | Q(indicator=base) if ":" in indicator else Q(indicator=indicator) | Q(indicator__startswith=f"{base}:")
    return IndicatorSubscription.objects.filter(cond, is_active=True).select_related("user")


def _send_email(user, subject, body):
    if not user.email or user.email.endswith(".invalid"):
        return False
    if not settings.EMAIL_HOST and "smtp" in settings.EMAIL_BACKEND:
        return False
    try:
        send_mail(subject, body, settings.DEFAULT_FROM_EMAIL if hasattr(settings, "DEFAULT_FROM_EMAIL") else None,
                  [user.email], fail_silently=False)
        return True
    except Exception:
        logger.warning("A-02: email yuborilmadi (user=%s)", user.pk, exc_info=True)
        return False


def _send_telegram(user, text):
    if not settings.TELEGRAM_BOT_TOKEN or not user.telegram_chat_id:
        return False
    try:
        from apps.common.utils import send_message
        send_message(chat_id=user.telegram_chat_id, text=text)
        return True
    except Exception:
        logger.warning("A-02: Telegram xabar yuborilmadi (user=%s)", user.pk, exc_info=True)
        return False


def dispatch_event(event):
    """Bitta hodisani obunachilarga yuboradi. -> yuborilgan (foydalanuvchi, kanal) soni."""
    ct = ContentType.objects.get_for_model(IndicatorUpdateEvent)
    link = f"{settings.SITE_URL.rstrip('/')}{event.link}" if event.link.startswith("/") else event.link
    sent = 0
    for sub in subscribers_for(event.indicator):
        user = sub.user
        if sub.channel == "in_app":
            if Notification.objects.filter(recipient=user, content_type=ct, object_id=event.pk).exists():
                continue
            Notification.objects.create(recipient=user, title="Ko'rsatkich yangilandi", message=event.title,
                                        notification_type="info", content_type=ct, object_id=event.pk,
                                        extra_data={"indicator": event.indicator, "link": event.link})
            sent += 1
        elif sub.channel == "email":
            sent += _send_email(user, f"my.stat.uz: {event.title}", f"{event.title}\n\n{link}\n\nObunani kabinetda o'chirishingiz mumkin.")
        elif sub.channel == "telegram":
            sent += _send_telegram(user, f"📊 {event.title}\n{link}")
    event.dispatched_at = timezone.now()
    event.recipients = sent
    event.save(update_fields=["dispatched_at", "recipients"])
    return sent


# ------------------------------------------------------------------ API
class SubscriptionSerializer(serializers.ModelSerializer):
    channel_label = serializers.CharField(source="get_channel_display", read_only=True)

    class Meta:
        model = IndicatorSubscription
        fields = ("id", "indicator", "title", "channel", "channel_label", "is_active", "created_at")
        read_only_fields = ("id", "created_at")

    def validate_indicator(self, value):
        base, _, ident = value.partition(":")
        if base not in dict(IndicatorSubscription.BASE_INDICATORS) or (ident and not ident.isalnum()):
            raise serializers.ValidationError("Noma'lum ko'rsatkich")
        return value


class SubscriptionListView(APIView):
    """GET — obunalarim, Telegram holati va oxirgi hodisalar; POST — obuna bo'lish."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        subs = IndicatorSubscription.objects.filter(user=request.user)
        indicators = set(subs.filter(is_active=True).values_list("indicator", flat=True))
        bases = {i.split(":")[0] for i in indicators}
        events = [e for e in IndicatorUpdateEvent.objects.all()[:50]
                  if e.indicator in indicators or e.indicator in bases][:15]
        tg_link = None
        if settings.TELEGRAM_BOT_USERNAME:
            from apps.common.utils import TelegramTokenManager
            tg_link = f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={TelegramTokenManager.generate_token(request.user.id)}"
        return Response({
            "subscriptions": SubscriptionSerializer(subs, many=True).data,
            "events": [{"id": e.id, "indicator": e.indicator, "title": e.title, "link": e.link, "date": e.date} for e in events],
            "telegram": {"connected": bool(request.user.telegram_chat_id), "link": tg_link,
                         "bot_configured": bool(settings.TELEGRAM_BOT_TOKEN)},
            "email": {"address": None if (request.user.email or "").endswith(".invalid") else request.user.email},
            "indicators": [{"code": c, "name": str(n)} for c, n in IndicatorSubscription.BASE_INDICATORS],
        })

    def post(self, request):
        s = SubscriptionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        try:
            obj, created = IndicatorSubscription.objects.get_or_create(
                user=request.user, indicator=s.validated_data["indicator"], channel=s.validated_data.get("channel", "in_app"),
                defaults={"title": s.validated_data.get("title", "")})
        except IntegrityError:
            return Response({"detail": "Obuna mavjud"}, status=400)
        if not obj.is_active:
            obj.is_active = True
            obj.save(update_fields=["is_active"])
        return Response(SubscriptionSerializer(obj).data, status=status.HTTP_201_CREATED if created else 200)


class SubscriptionDetailView(APIView):
    """DELETE — obunadan bir bosishda chiqish; PATCH {is_active}."""
    permission_classes = (IsAuthenticated,)

    def delete(self, request, pk):
        deleted, _ = IndicatorSubscription.objects.filter(user=request.user, pk=pk).delete()
        return Response(status=204 if deleted else 404)

    def patch(self, request, pk):
        sub = IndicatorSubscription.objects.filter(user=request.user, pk=pk).first()
        if sub is None:
            return Response(status=404)
        sub.is_active = bool(request.data.get("is_active", sub.is_active))
        sub.save(update_fields=["is_active"])
        return Response(SubscriptionSerializer(sub).data)
