# apps/additional_services/admin.py
from django.contrib import admin
from import_export.admin import ImportMixin
from apps.additional_services.models.ex_trade import SITC
from apps.additional_services.resources.sitc_resource import SITCExcelResource
# (ixtiyoriy) faqat xlsx ko'rsatish uchun:
from import_export.formats.base_formats import XLSX


@admin.register(SITC)
class SITCAdmin(ImportMixin, admin.ModelAdmin):
    list_display  = ("code", "level", "parent", "name_uz", "name_ru")
    search_fields = ("code", "name_uz", "name_ru")
    list_filter   = ("level",)

    def get_import_resource_classes(self, request):
        from apps.additional_services.resources.sitc_resource import SITCExcelResource
        return [SITCExcelResource]


