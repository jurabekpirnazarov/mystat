# apps/book_market/admin.py
from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from apps.additional_services.models import Unit
from apps.additional_services.resources.unit_resource import UnitResource


@admin.register(Unit)
class BookAdmin(ImportExportModelAdmin):
    resource_class = UnitResource
    list_display = ('code', 'name', 'short_name')
    search_fields = ('code', 'name', 'short_name')
