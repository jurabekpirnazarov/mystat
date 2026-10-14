"""S-12 hisobot yo'riqnomalari va U-16/K-04 saqlangan so'rovlar."""
from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _


class ReportGuide(models.Model):
    """Hisobot shakli bo'yicha yo'riqnoma (kim topshiradi, qadamlar, keng tarqalgan xatolar, namuna)."""
    report = models.OneToOneField("additional_services.ReportList", on_delete=models.CASCADE, related_name="guide",
                                  verbose_name=_("Hisobot shakli"))
    summary_uz = models.TextField(verbose_name=_("Qisqacha (uz)"))
    summary_ru = models.TextField(blank=True, verbose_name=_("Qisqacha (ru)"))
    summary_cry = models.TextField(blank=True, verbose_name=_("Qisqacha (cry)"))
    steps_uz = models.TextField(verbose_name=_("To'ldirish qadamlari (uz, Markdown)"))
    steps_ru = models.TextField(blank=True)
    steps_cry = models.TextField(blank=True)
    common_errors_uz = models.TextField(blank=True, verbose_name=_("Keng tarqalgan xatolar (uz)"))
    common_errors_ru = models.TextField(blank=True)
    common_errors_cry = models.TextField(blank=True)
    sample_file = models.FileField(upload_to="report_guides/", null=True, blank=True,
                                   verbose_name=_("Namunaviy to'ldirilgan shakl (PDF)"))
    legal_basis = models.CharField(max_length=500, blank=True, verbose_name=_("Huquqiy asos"))
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Hisobot yo'riqnomasi")
        verbose_name_plural = _("Hisobot yo'riqnomalari")

    def __str__(self):
        return f"{self.report_id}: {self.report.type_uz}"


class SavedQuery(models.Model):
    """Foydalanuvchi saqlagan filtr (U-16 tashqi savdo, K-04 hamkor qidiruvi)."""
    KINDS = (("trade", _("Tashqi savdo")), ("partners", _("Hamkor qidiruvi")))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="saved_queries")
    kind = models.CharField(max_length=16, choices=KINDS, db_index=True)
    name = models.CharField(max_length=120, verbose_name=_("Nomi"))
    params = models.JSONField(default=dict, verbose_name=_("Filtr"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Saqlangan so'rov")
        verbose_name_plural = _("Saqlangan so'rovlar")

    def __str__(self):
        return f"{self.user_id}: {self.name}"
