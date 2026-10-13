from django.contrib import admin
from import_export.admin import ImportExportModelAdmin

from apps.additional_services.models.priceindex_model import PriceIndex
from apps.additional_services.resources.priceindex_resources import PriceIndexResource


@admin.register(PriceIndex)
class PersonAdmin(ImportExportModelAdmin):
    resource_class = PriceIndexResource


