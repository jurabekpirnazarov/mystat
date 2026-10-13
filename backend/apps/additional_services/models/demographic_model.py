from django.db import models
from django.utils.translation import gettext_lazy as _

from apps.common.models import BaseModel


def upload_excel_to(instance, filename):
    return f"demographics/uploads/{instance.slug}__{filename}"


class DemographicSection(BaseModel):
    """Demografik bo'lim — bitta Excel sheet'iga mos keladi.
    Schema admin tomonidan tahrir qilinadi, data parquet'da saqlanadi."""

    slug = models.SlugField(
        verbose_name=_("Slug (URL identifikator)"),
        max_length=64,
        unique=True,
        help_text=_("Masalan: aholi, tugilish, olim. Faqat lotin harfi, raqam va '-'/'_'."),
    )
    name = models.CharField(verbose_name=_("Nomi"), max_length=255)
    description = models.TextField(verbose_name=_("Tavsif"), blank=True, default="")
    icon = models.CharField(verbose_name=_("Ikon (emoji yoki nom)"), max_length=20, default="📊")
    order = models.IntegerField(verbose_name=_("Tartib"), default=0)

    excel_file = models.FileField(
        verbose_name=_("Excel fayl"),
        upload_to=upload_excel_to,
        null=True,
        blank=True,
        help_text=_(".xlsx yoki .xls fayl. Birinchi qator — header (ustun nomlari)."),
    )
    sheet_name = models.CharField(
        verbose_name=_("Sheet nomi"),
        max_length=255,
        blank=True,
        default="",
        help_text=_("Excel ichidagi sheet nomi. Bo'sh qoldirilsa birinchi sheet olinadi."),
    )

    filter_schema = models.JSONField(
        verbose_name=_("Filter schemasi (avto-yaratiladi, tahrirlash mumkin)"),
        default=dict,
        blank=True,
    )

    row_count = models.IntegerField(verbose_name=_("Yozuvlar soni"), default=0)
    last_imported_at = models.DateTimeField(verbose_name=_("Oxirgi import"), null=True, blank=True)
    last_import_error = models.TextField(verbose_name=_("Oxirgi xato (agar bor bo'lsa)"), blank=True, default="")

    is_published = models.BooleanField(
        verbose_name=_("Frontend'da ko'rsatish"),
        default=False,
        help_text=_("Yoqilgan bo'limlar /api/demographics/schema/ orqali frontendga chiqadi."),
    )

    class Meta:
        verbose_name = _("Demografik bo'lim")
        verbose_name_plural = _("Demografik bo'limlar")
        ordering = ["order", "name"]

    def __str__(self):
        return f"{self.icon} {self.name} ({self.slug})"
