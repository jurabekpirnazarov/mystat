# apps/<your_app>/admin.py
from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export.formats.base_formats import XLSX, CSV
from apps.additional_services.models.ex_trade import Product
from apps.additional_services.resources.product_resource import ProductExcelResource


@admin.register(Product)
class ProductAdmin(ImportExportModelAdmin):
    # Import/Export sozlamalari
    formats = (XLSX, CSV)
    # Agar eski import-export versiyasi bo‘lsa, resource_class ishlating:
    # resource_class = ProductExcelResource

    # Yangi versiyalar uchun ko‘p resurs qo‘llab-quvvatlasa:
    def get_import_resource_classes(self, request):
        # bitta resursimiz bor: ProductExcelResource
        return [ProductExcelResource]

    # Ro‘yxat ko‘rinishi
    list_display = ("code", "name_ru", "name_uz", "level", "parent")
    list_display_links = ("code", "name_ru")
    ordering = ("code",)
    list_filter = ("level","code")
    search_fields = ("code", "name_ru", "name_uz", "name_cry", "name_cry2")
    list_per_page = 50

    # FK=code bo‘lgani uchun ham autocomplete yaxshi ishlaydi
    autocomplete_fields = ("parent",)

    # Tezlik: parent’ni oldindan join qiladi
    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.select_related("parent")
