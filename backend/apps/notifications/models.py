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