from django.db import models
from apps.common.models import BaseModel
from django.utils.translation import gettext_lazy as _


class ReportList(BaseModel):
    id = models.CharField(primary_key=True, max_length=6, unique=True, db_index=True)
    type = models.CharField(max_length=255)
    type_uz = models.CharField(max_length=255)
    type_ru = models.CharField(max_length=255)
    type_cry = models.CharField(max_length=255)
    srok = models.CharField(max_length=255)
    srok_uz = models.CharField(max_length=255)
    srok_ru = models.CharField(max_length=255)
    srok_cry = models.CharField(max_length=255)
    formsname = models.TextField()
    formsname_uz = models.TextField()
    formsname_ru = models.TextField()
    formsname_cry = models.TextField()
    deadline = models.DateField(null=True, blank=True, db_index=True)
    report_type = models.CharField(max_length=10, 
        choices=(
            ('monthly', 'Monthly'), ('quarterly', 'Quarterly'), ('yearly', 'Yearly')
        ),
        db_index=True, null=True, blank=True
    )
    # HT-01: davr qoidasi (`Q+25d`, `Y+03-15`), qarang apps/additional_services/deadlines.py.
    # Bo'sh bo'lsa eski `deadline` zaxira sifatida ishlatiladi.
    deadline_rule = models.CharField(max_length=20, blank=True, default="", verbose_name=_("Muddat qoidasi"))

    class Meta:
        verbose_name = _("Hisobot Ro'yxati")
        verbose_name_plural = _("Hisobotlar Ro'yxati")
        indexes = [
            models.Index(fields=['is_active', 'deadline']),  
            models.Index(fields=['-deadline']),
        ]


class Ktut(BaseModel):
    okpo = models.CharField(max_length=255)
    inn = models.CharField(max_length=255, unique=True, db_index=True)
    name = models.CharField(max_length=255)

    class Meta:
        verbose_name = _("Ktut")
        verbose_name_plural = _("Ktut")

class KtutReportList(models.Model):
    ktut = models.ForeignKey(Ktut, on_delete=models.CASCADE, related_name='reportlists', to_field='inn')
    reportlist = models.ForeignKey(ReportList, on_delete=models.CASCADE, related_name='ktuts', to_field='id')


    class Meta:
        unique_together = ('ktut', 'reportlist')
        verbose_name = _("Korxonaning Hisobot Ro'yxati")
        verbose_name_plural = _("Korxonaning Hisobotlar Ro'yxati")



class ReportReminder(models.Model):
    """U-13: foydalanuvchi hisobot muddatidan oldin in-app eslatma olishni yoqqan."""
    user = models.ForeignKey("accounts.User", on_delete=models.CASCADE, related_name="report_reminders")
    report = models.ForeignKey(ReportList, on_delete=models.CASCADE, related_name="reminders")
    days_before = models.PositiveSmallIntegerField(default=3)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("user", "report")
        verbose_name = _("Hisobot eslatmasi")
        verbose_name_plural = _("Hisobot eslatmalari")



class ReportDeadlineOverride(models.Model):
    """HT-01: rasmiy muddat buyruq bilan o'zgarganda bitta davr uchun qo'lda sana (`period` = `2026-Q3`, `2025-Y`)."""
    report = models.ForeignKey(ReportList, on_delete=models.CASCADE, related_name="deadline_overrides")
    period = models.CharField(max_length=12, help_text="2026-M09, 2026-Q3, 2026-H1, 2025-Y")
    date = models.DateField(verbose_name=_("Muddat"))
    reason = models.CharField(max_length=255, blank=True)

    class Meta:
        unique_together = ("report", "period")
        verbose_name = _("Muddat istisnosi")
        verbose_name_plural = _("Muddat istisnolari")

    def __str__(self):
        return f"{self.report_id} {self.period}: {self.date}"


class Holiday(models.Model):
    """HT-10: bayram kunlari (muddatni keyingi ish kuniga ko'chirish yoqilganda)."""
    date = models.DateField(unique=True)
    name = models.CharField(max_length=120, blank=True)

    class Meta:
        ordering = ["date"]
        verbose_name = _("Bayram kuni")
        verbose_name_plural = _("Bayram kunlari")

    def __str__(self):
        return f"{self.date} {self.name}"


class ReportReminderPreference(models.Model):
    """HT-06: yuridik shaxs uchun eslatma standart yoqilgan (muddatdan 5 va 1 kun oldin); bu yerda o'chiriladi.
    Shakl uchun alohida `ReportReminder` bo'lsa, o'sha ustun turadi."""
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="report_reminder_pref")
    enabled = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Eslatma sozlamasi")
        verbose_name_plural = _("Eslatma sozlamalari")


class CalendarFeedToken(models.Model):
    """YF-02: kalendarga doimiy obuna uchun shaxsiy maxfiy havola tokeni."""
    user = models.OneToOneField("accounts.User", on_delete=models.CASCADE, related_name="calendar_feed")
    token = models.CharField(max_length=64, unique=True, db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Kalendar obuna tokeni")
        verbose_name_plural = _("Kalendar obuna tokenlari")
