from django.contrib import admin

from .models import EnterpriseIndicator, RegionIndicator


@admin.register(EnterpriseIndicator)
class EnterpriseIndicatorAdmin(admin.ModelAdmin):
    list_display = ("stir", "year", "oked_section", "region", "employees", "revenue", "is_peer")
    list_filter = ("year", "oked_section", "region", "is_peer")
    search_fields = ("stir",)


@admin.register(RegionIndicator)
class RegionIndicatorAdmin(admin.ModelAdmin):
    list_display = ("region", "district", "indicator", "year", "period", "value", "unit")
    list_filter = ("indicator", "year", "period", "region")
    raw_id_fields = ("district",)
