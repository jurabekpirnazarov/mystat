from django.db import models
from apps.common.models import BaseModel
from django.utils.translation import gettext_lazy as _


class PriceIndex(BaseModel):
    id = models.CharField(primary_key=True, max_length=6, unique=True, db_index=True)
    values = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    year = models.DateField(null=True, blank=True)

    class Meta:
        verbose_name = _("Narx Indeksi")
        verbose_name_plural = _("Narxlar Indeksi")



