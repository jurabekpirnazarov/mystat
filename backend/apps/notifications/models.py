from django.db import models
from django.contrib.contenttypes.models import ContentType
from django.contrib.contenttypes.fields import GenericForeignKey
from django.utils.translation import gettext_lazy as _

class Notification(models.Model):
    NOTIFICATION_TYPES = (
        ('info', 'Information'),
        ('success', 'Success'),
        ('warning', 'Warning'),
        ('error', 'Error'),
        ('contract_created', 'Shartnoma yaratildi'),
        ('contract_signed', 'Shartnoma imzolandi'),
        ('document_pending', 'Hujjat imzolash kutilmoqda'),
        ('document_rejected', 'Hujjat rad etildi'),
        ('payment_received', "To'lov qabul qilindi"),
    )

    STATUS_CHOICES = (
        ('pending', 'Kutilmoqda'),
        ('sent', 'Yuborildi'),
        ('failed', 'Xatolik'),
    )

    recipient = models.ForeignKey(
        "accounts.User",
        on_delete=models.CASCADE,
        related_name='notifications',
        verbose_name=_("Qabul qiluvchi")
    )
    title = models.CharField(max_length=255, verbose_name=_("Sarlavha"))
    message = models.TextField(verbose_name=_("Xabar"))
    notification_type = models.CharField(
        max_length=30,
        choices=NOTIFICATION_TYPES,
        default='info',
        verbose_name="Tur"
    )
    is_read = models.BooleanField(default=False, verbose_name=_("O'qildimi"))
    created_at = models.DateTimeField(auto_now_add=True, verbose_name=_("Da yaratilgan"))

    # Telegram notification fields
    telegram_status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='pending',
        verbose_name=_("Telegram status")
    )
    sent_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Da jo'natilgan"))
    telegram_message_id = models.CharField(max_length=100, null=True, blank=True, verbose_name=_("Telegram Xabar ID"))
    error_message = models.TextField(null=True, blank=True, verbose_name=_("Xato xabar"))

    # Qo'shimcha ma'lumotlar uchun
    extra_data = models.JSONField(null=True, blank=True, verbose_name=_("Extra Data"))

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, verbose_name=_("Kontent turi"))
    object_id = models.PositiveIntegerField(verbose_name=_("Obyekt ID"))
    content_object = GenericForeignKey('content_type', 'object_id')

    class Meta:
        ordering = ['-created_at']
        verbose_name = _("Bildirishnoma")
        verbose_name_plural = _("Bildirishnomalar")

    def __str__(self):
        return f"{self.title} → {self.recipient}"

    def mark_as_read(self):
        """Mark this notification as read."""
        self.is_read = True
        self.save()

    @staticmethod
    def mark_all_as_read(user):
        Notification.objects.filter(recipient=user).update(is_read=True)

class IndicatorSubscription(models.Model):
    """A-02: foydalanuvchi ko'rsatkich yangilanishiga obuna (in-app, email yoki Telegram)."""
    CHANNELS = (("in_app", _("Saytda")), ("email", _("Email")), ("telegram", _("Telegram")))
    # Ko'rsatkich kaliti: "cpi", "trade", "demography", "region:<id>", "report:<id>"
    BASE_INDICATORS = (("cpi", _("Inflyatsiya (ISN)")), ("trade", _("Tashqi savdo")), ("demography", _("Demografiya")),
                       ("region", _("Hudud ko'rsatkichlari")), ("report", _("Hisobot muddati")))

    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="indicator_subscriptions")
    indicator = models.CharField(max_length=40, db_index=True, verbose_name=_("Ko'rsatkich"))
    title = models.CharField(max_length=160, blank=True, verbose_name=_("Nomi"))
    channel = models.CharField(max_length=10, choices=CHANNELS, default="in_app", verbose_name=_("Kanal"))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "indicator", "channel")
        ordering = ("-created_at",)
        verbose_name = _("Ko'rsatkichga obuna")
        verbose_name_plural = _("Ko'rsatkichlarga obunalar")

    def __str__(self):
        return f"{self.user} → {self.indicator} ({self.channel})"


class IndicatorUpdateEvent(models.Model):
    """A-02: "ko'rsatkich yangilandi" hodisasi; Celery task obunachilarga yuboradi (`dispatched_at`)."""
    indicator = models.CharField(max_length=40, db_index=True)
    title = models.CharField(max_length=200)
    link = models.CharField(max_length=300, blank=True)
    date = models.DateField()
    created_at = models.DateTimeField(auto_now_add=True)
    dispatched_at = models.DateTimeField(null=True, blank=True)
    recipients = models.PositiveIntegerField(default=0)

    class Meta:
        ordering = ("-date", "-id")
        verbose_name = _("Ko'rsatkich yangilanishi")
        verbose_name_plural = _("Ko'rsatkich yangilanishlari")

    def __str__(self):
        return f"{self.indicator}: {self.title}"
