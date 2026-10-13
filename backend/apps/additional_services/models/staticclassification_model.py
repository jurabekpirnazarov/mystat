from django.db import models
from apps.common.models import BaseModel
from django.utils.translation import gettext_lazy as _



class StatisticClassificationCategory(BaseModel):
    name = models.CharField(max_length=255)

    class Meta:
        verbose_name = _("Statistik klassifikatsiya kategoriyasi")
        verbose_name_plural = _("Statistik klassifikatsiya kategoriyalari")


class StatisticClassification(BaseModel):
    name_uz = models.CharField(max_length=255)
    name_ru = models.CharField(max_length=255)
    name_cry = models.CharField(max_length=255)
    analog_uz = models.CharField(max_length=255)
    analog_ru = models.CharField(max_length=255)
    analog_cry = models.CharField(max_length=255)
    confirm_document = models.CharField(max_length=255)
    date = models.DateField(null=True, blank=True)
    file = models.FileField(upload_to='statistic-classification', null=True, blank=True)
    slug = models.CharField(max_length=255, null=True, blank=True)
    category = models.ForeignKey(StatisticClassificationCategory, on_delete=models.PROTECT)


    class Meta:
        verbose_name = _("Statistik klassifikatsiya")
        verbose_name_plural = _("Statistik klassifikatsiyalar")
