from django.db import models
from apps.common.models import BaseModel, District
from django.utils.translation import gettext_lazy as _


class Organization(BaseModel):
    user = models.OneToOneField('accounts.User', on_delete=models.CASCADE, related_name='organization', verbose_name=_("Foydalanuvchi"))
    branch = models.ForeignKey('common.Branch', on_delete=models.CASCADE, related_name='organizations', verbose_name=_("Filial"), null=True)
    sector = models.ForeignKey('common.Sector', on_delete=models.SET_NULL, null=True, blank=True, related_name='organizations', verbose_name=_("Sektor"))
    name = models.CharField(max_length=255)
    tin = models.CharField(max_length=20, unique=True)
    address = models.TextField(blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    ktyadr_code = models.CharField(max_length=50, unique=True, blank=True, null=True)
    organization_type = models.CharField(max_length=50, help_text="LLC, SP, JSC, etc", blank=True, null=True)
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True)

    def __str__(self):
        return self.name