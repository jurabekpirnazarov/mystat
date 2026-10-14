from django.db import models
from apps.common.models import BaseModel
from django.utils.translation import gettext_lazy as _


class IndustrialProductCategory(BaseModel):
    name_uz = models.CharField(max_length=255, null=True, blank=True)
    name_ru = models.CharField(max_length=255, null=True, blank=True)
    name_cyr = models.CharField(max_length=255, null=True, blank=True)
    parent = models.ForeignKey('self', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_active = models.BooleanField(default=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name_uz}"
    
    class Meta:
        verbose_name = _("Sanoat Mahsuloti Kategoriyasi")
        verbose_name_plural = _("Sanoat Mahsuloti Kategoriyalari")


class Skp(models.Model):
    code = models.CharField(max_length=10, unique=True, db_index=True)
    name_ru = models.CharField(max_length=500, null=True, blank=True)
    name_uz = models.CharField(max_length=500, null=True, blank=True)
    name_cyr = models.CharField(max_length=500, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_active = models.BooleanField(default=True, null=True, blank=True)

    def __str__(self):
        return f"{self.code} - {self.name_ru}"
    
    class Meta:
        verbose_name = _("SKP")
        verbose_name_plural = _("SKP")


class IndustrialProduct(BaseModel):
    category = models.ForeignKey(IndustrialProductCategory, on_delete=models.CASCADE, related_name='products')
    skp = models.ForeignKey(Skp, on_delete=models.CASCADE, related_name='products')
    soato_ru = models.CharField(max_length=25, null=True, blank=True)
    soato_uz = models.CharField(max_length=25, null=True, blank=True)
    soato_cyr = models.CharField(max_length=25, null=True, blank=True)
    okpo = models.IntegerField(null=True, blank=True)
    inn = models.CharField(max_length=9, null=True, blank=True)
    name = models.CharField(max_length=255, null=True, blank=True)
    adress_ru = models.CharField(max_length=255, null=True, blank=True)
    adress_uz = models.CharField(max_length=255, null=True, blank=True)
    adress_cyr = models.CharField(max_length=255, null=True, blank=True)
    phone = models.CharField(max_length=43, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    updated_at = models.DateTimeField(auto_now=True, null=True, blank=True)
    is_active = models.BooleanField(default=True, null=True, blank=True)

    def __str__(self):
        return f"{self.name}"
    
    class Meta:
        verbose_name = _("Sanoat Mahsuloti")
        verbose_name_plural = _("Sanoat Mahsulotlari")
        # K-04 hamkor qidiruvi: STIR bo'yicha guruhlash, viloyat (manzil boshi) va tuman filtrlari
        indexes = [
            models.Index(fields=["inn"], name="indprod_inn_idx"),
            models.Index(fields=["adress_uz"], name="indprod_address_idx"),
            models.Index(fields=["soato_uz"], name="indprod_district_idx"),
        ]