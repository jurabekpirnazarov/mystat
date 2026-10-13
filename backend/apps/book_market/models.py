from django.db import models
from urllib.parse import urlencode
from django.utils import timezone
from ckeditor.fields import RichTextField
from decimal import Decimal, ROUND_HALF_UP
from django.conf import settings
from django.db.models.functions import Coalesce
from django.db.models import F, Sum
from django.utils.translation import gettext_lazy as _
from apps.common.models import BaseModel
from apps.accounts.models import User
from apps.payment.models import Provider


# Create your models here.


class Book(BaseModel):
    name_uz = models.CharField(max_length=100)
    name_ru = models.CharField(max_length=100)
    name_cry = models.CharField(max_length=100)
    file = models.FileField(upload_to='books/book_pdf/', blank=True, null=True, verbose_name=_("Fayl"))
    image_url = models.ImageField(upload_to='book_images/', blank=True, null=True, verbose_name=_("Rasm"))
    description = RichTextField(blank=True, verbose_name=_("Tasnif"))
    year = models.PositiveSmallIntegerField(blank=True, null=True, verbose_name=_("Yil"))
    base_file = models.FileField(upload_to='books/book_files/', blank=True, null=True, verbose_name=_("Mundarija"))

    class Meta:
        verbose_name = _("Kitob")
        verbose_name_plural = _("Kitoblar")

    def __str__(self):
        return f"{self.name_uz} {self.year}"


class BookOption(models.Model):
    class BookType(models.TextChoices):
        ElECTRON = "electron", "Electron"
        PRINT = "print", "Print"
        DISK = "disk", "Disk"

    book = models.ForeignKey(Book, on_delete=models.CASCADE, related_name="options", verbose_name=_("Kitob"))
    book_type = models.CharField(max_length=20, choices=BookType.choices, default=BookType.ElECTRON)
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Narx"), null=True, blank=True)

    class Meta:
        unique_together = ("book_type", "book")
        verbose_name = _("Kitob tasnif")
        verbose_name_plural = _("Kitob tasniflari")

    def __str__(self):
        return self.book.name_uz



class PostalLocation(BaseModel):
    lat = models.FloatField(verbose_name=_("Uzunlik"))
    lng = models.FloatField(verbose_name=_("Kenglik"))
    name = models.CharField(max_length=255, verbose_name=_("Nom"))
    index = models.CharField(max_length=12, verbose_name=_("Indeks"), unique=True)
    is_active = models.BooleanField(default=True, verbose_name=_("Aktivmi"))

    class Meta:
        verbose_name = "Pochta lokatsiyasi"
        verbose_name_plural = _("Pochta lokatsiyalari")
        db_table = _("postal_locations")


class OrderBook(BaseModel):
    class Status(models.TextChoices):
        PENDING = "pending", "Pending"
        PAID = "paid", "Paid"
        CANCELLED = "cancelled", "Cancelled"

    class PostalStatus(models.TextChoices):
        PROCESSING = "processing", "Processing"
        SENT = "sent", "Sent"
        DELIVERED = "delivered", "Delivered"

    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name=_("Foydalanuvchi"))
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    is_paid = models.BooleanField(verbose_name=_("To'langanmi"), default=False)
    is_canceled = models.BooleanField(verbose_name=_("Bekor qilinganmi"), default=False)
    postal_location = models.ForeignKey(PostalLocation, on_delete=models.SET_NULL, verbose_name=_("Pochta manzili"), null=True, blank=True)
    provider = models.CharField(verbose_name=_("Provayder"), max_length=255, choices=Provider.choices, null=True, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    postal_status = models.CharField(max_length=20, choices=PostalStatus.choices, default=PostalStatus.PROCESSING)
    postal_tracking_number = models.CharField(max_length=255, verbose_name=_("Pochta kuzatuv raqami"), null=True, blank=True)

    class Meta:
        verbose_name = _("Kitob buyurtma")
        verbose_name_plural = _("Kitob buyurtmalar")

    def __str__(self):
        return f"Book Order #{self.pk} by {self.user}"

    def get_payment_url(self, provider: str) -> str:
        if self.status == self.Status.CANCELLED:
            raise ValueError("This order is cancelled.")
        if self.is_paid or self.status == self.Status.PAID:
            raise ValueError("This order is already paid.")
        if self.total_amount <= 0:
            raise ValueError("Order amount must be greater than zero.")

        amount = Decimal(self.total_amount).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        return_url = settings.PROVIDERS["return_url"]

        self.provider = provider
        self.save(update_fields=["provider"])

        if provider == Provider.CLICK:
            base_url = settings.PROVIDERS["click"]["url"]
            merchant_id = settings.PROVIDERS["click"]["merchant_id"]
            service_id = settings.PROVIDERS["click"]["merchant_service_id"]

            merchant_trans_id = f"book:{self.pk}:{int(timezone.now().timestamp())}"

            params = {
                "service_id": service_id,
                "merchant_id": merchant_id,
                "amount": f"{amount}",
                "transaction_param": merchant_trans_id,
                "return_url": return_url,
            }
            return f"{base_url}?{urlencode(params)}"

        elif provider == Provider.PAYME:
            raise ValueError("Payme uchun avval serveringizda invoice yaratish kerak (checkout token).")

        else:
            raise ValueError("Unknown provider.")

    def recalc_total(self):
        agg = self.items.aggregate(
            total=Coalesce(Sum(F('price_snapshot') * F('quantity')), Decimal('0.00'))
        )
        total = (agg['total'] or Decimal('0.00')).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        self.total_amount = total
        return total


class OrderItem(BaseModel):
    class OrderType(models.TextChoices):
        ElECTRON = "electron", "Electron"
        PRINT = "print", "Print"
        DISK = "disk", "Disk"

    order = models.ForeignKey(OrderBook, on_delete=models.CASCADE, related_name="items", verbose_name=_("Buyurtma"))
    book = models.ForeignKey(Book, on_delete=models.PROTECT, related_name="order_items", verbose_name=_("Kitob"))
    order_type = models.CharField(max_length=20, choices=OrderType.choices, default=OrderType.ElECTRON)
    quantity = models.PositiveIntegerField(default=1)
    price_snapshot = models.DecimalField(max_digits=10, decimal_places=2)

    class Meta:
        verbose_name = _("Buyurtma elementi")
        verbose_name_plural = _("Buyurtma elementlari")

        indexes = [
            models.Index(fields=["order"]),
            models.Index(fields=["book"])
        ]

    def __str__(self):

        book_name = getattr(self.book, "name", None) or "No Book"
        return f"{book_name} × {self.quantity} (#{self.pk})"

    @property
    def subtotal(self):
        return (self.price_snapshot or Decimal('0.00')) * Decimal(self.quantity or 0)



