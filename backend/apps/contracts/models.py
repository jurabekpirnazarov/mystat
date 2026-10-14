from decimal import Decimal
from django.contrib.contenttypes.fields import GenericRelation
from django.db import models
from django.db.models import Sum
from apps.accounts.models import User
from apps.common.models import BaseModel, Branch
from apps.services.models import ServicePackage
from django.utils.translation import gettext_lazy as _
# Create your models here.


class Contract(BaseModel):
    STATUS_CHOICES = (
        ("created", "Created"),
        ("pending", "Pending"),
        ('processing', 'Processing'),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    contract_number = models.CharField(max_length=50, unique=True, null=False, blank=False)
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    package = models.ForeignKey(ServicePackage, on_delete=models.CASCADE)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default="created")
    start_date = models.DateTimeField(auto_now_add=True)
    end_date = models.DateTimeField(auto_now=True)
    signed_by_client = models.BooleanField(default=False)
    signed_by_admin = models.BooleanField(default=False)
    client_signature_date = models.DateTimeField(null=True, blank=True)
    admin_signature_date = models.DateTimeField(null=True, blank=True)
    didx_contract_id = models.CharField(max_length=100, null=True, blank=True)
    didox_contract_data = models.JSONField(null=True, blank=True)
    file = models.FileField(upload_to='contracts/', null=True, blank=True, editable=False)
    notes = models.TextField(null=True, blank=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='created_contracts', verbose_name=_("Tomonidan yaratildi"))
    attached_user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='attached_contracts', verbose_name=_("Ga biriktirildi"))
    transactions = GenericRelation(
        'payment.Transaction',
        related_query_name='contract_payments',
    )
    branch = models.ForeignKey(Branch, on_delete=models.SET_NULL, null=True, blank=True)

    @property
    def payed_amount(self):
        from apps.payment.models import TransactionStatus

        result = self.transactions.filter(
            status=TransactionStatus.PAID
        ).aggregate(total=Sum('amount'))['total']
        return result if result is not None else Decimal('0')

    class Meta:
        verbose_name = _('Kontrakt')
        verbose_name_plural = _('Kontraktlar')

    def __str__(self):
        return f"{self.user}"


class ContractStats(Contract):
    class Meta:
        proxy = True
        verbose_name = "Contract (by region)"
        verbose_name_plural = "Contracts (by region)"

class ContractStatusLog(models.Model):
    """K-08: shartnoma holati tarixi. `signals.py` holat o'zgarganda yozadi (DIDOX tekshiruvi, admin, API)."""
    contract = models.ForeignKey(Contract, on_delete=models.CASCADE, related_name="status_logs")
    status = models.CharField(max_length=50, verbose_name=_("Holat"))
    signed_by_client = models.BooleanField(default=False)
    signed_by_admin = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("created_at", "id")
        verbose_name = _("Shartnoma holati tarixi")
        verbose_name_plural = _("Shartnoma holati tarixi")

    def __str__(self):
        return f"{self.contract_id}: {self.status}"
