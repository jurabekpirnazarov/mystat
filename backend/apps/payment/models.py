from decimal import Decimal
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _
from apps.services.models import Service
from apps.accounts.models import User
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType


class Provider(models.TextChoices):
    PAYME = "payme", _("Payme")
    CLICK = "click", _("Click")


class TransactionStatus(models.TextChoices):
    WAITING = "waiting", _("Waiting")
    PAID = "paid", _("Paid")
    FAILED = "failed", _("Failed")
    CANCELED = "canceled", _("Canceled")


class TimeStamped(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        self.is_active = False
        self.save()

    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)


class Order(TimeStamped):
    user = models.ForeignKey(verbose_name=_("Foydalanuvchi"), to=User, on_delete=models.CASCADE)
    service = models.ForeignKey(verbose_name=_("Servis"), to=Service, on_delete=models.CASCADE)
    provider = models.CharField(verbose_name=_("Provayder"), max_length=255, choices=Provider.choices)
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="Qiymati")
    is_paid = models.BooleanField(verbose_name=_("To'langanmi"), default=False)
    is_canceled = models.BooleanField(verbose_name=_("Bekor qilinganmi"), default=False)

    class Meta:
        verbose_name = _("Buyurtma")
        verbose_name_plural = _("Buyurtmalar")


    def get_payment_url(self):
        payment_url = ""
        return_url = settings.PROVIDERS["return_url"]

        if self.provider == Provider.CLICK:
            url = settings.PROVIDERS["click"]["url"]
            merchant_id = settings.PROVIDERS["click"]["merchant_id"]
            service_id = settings.PROVIDERS["click"]["merchant_service_id"]
            merchant_trans_id = f"service:{self.id}"

            params = (
                f"?service_id={service_id}&merchant_id={merchant_id}&"                                  
                f"amount={self.amount}&transaction_param={merchant_trans_id}&return_url={return_url}"
            )
            payment_url = f'{url}/{params}'

        return payment_url

    def save(self, *args, **kwargs):
        if not self.pk:
            # self.amount = self.service.price if self.service_id else Decimal("0.00")
            self.amount = Decimal("0.00")
        else:
            if self.is_paid:
                pass
        super().save(*args, **kwargs)


class Transaction(TimeStamped):
    transaction_id = models.CharField(verbose_name=_("Tranzaksiya id"), max_length=255)
    amount = models.DecimalField(verbose_name=_("Qiymati"), max_digits=10, decimal_places=2)
    status = models.CharField(max_length=63, verbose_name=_("Status"), choices=TransactionStatus.choices)
    paid_at = models.DateTimeField(verbose_name=_("Da to'langan"), null=True, blank=True)
    cancel_time = models.DateTimeField(verbose_name=_("Bekor qilingan vaqti"), null=True, blank=True)

    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True, blank=True)
    object_id = models.PositiveIntegerField(null=True, blank=True)
    payable = GenericForeignKey("content_type", "object_id")

    class Meta:
        verbose_name = _("Tranzaksiya")
        verbose_name_plural = _("Tranzaksiyalar")
        constraints = [
            models.UniqueConstraint(
                fields=["transaction_id", "content_type", "object_id"],
                name="uniq_txn_per_payable_provider",
            ),
        ]


class PaymentMerchantRequestLog(TimeStamped):
    provider = models.CharField(max_length=63, verbose_name=_("Provayder"), choices=Provider.choices)
    header = models.TextField(verbose_name=_("Header"))
    body = models.TextField(verbose_name=_("Body"))
    method = models.CharField(verbose_name=_("Method"), max_length=32)
    response = models.TextField(null=True, blank=True)
    response_status_code = models.IntegerField(null=True, blank=True)
    type = models.CharField(max_length=32)

    class Meta:
        verbose_name = _("Payment Merchant Request Log")
        verbose_name_plural = _("Payment Merchant Request Logs")
