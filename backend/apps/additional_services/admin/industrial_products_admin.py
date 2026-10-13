from django.contrib import admin
from apps.additional_services.models import IndustrialProduct, IndustrialProductCategory, Skp


@admin.register(IndustrialProduct)
class IndustrialProductAdmin(admin.ModelAdmin):
    list_display = ('soato_uz', 'okpo', 'inn')


@admin.register(IndustrialProductCategory)
class IndustrialProductCategoryAdmin(admin.ModelAdmin):
    list_display = ('name_uz', 'parent')


@admin.register(Skp)
class SkpAdmin(admin.ModelAdmin):
    list_display = ('code', 'name_uz')