from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from apps.additional_services.models import Region


@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('id', 'name_uz', 'soato')
