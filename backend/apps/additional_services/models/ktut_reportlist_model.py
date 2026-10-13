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

