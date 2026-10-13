from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from apps.additional_services.models.ex_trade import TradeData
from apps.additional_services.resources.trade_data_resource import TradeDataExcelResource

@admin.register(TradeData)
class TradeDataAdmin(ImportExportModelAdmin):
    resource_class = TradeDataExcelResource
    list_display = [
        'year', 'month', 'trade_type', 'country', 'region', 
        'product', 'sitc', 'value', 'quantity'
    ]
    search_fields = [
        'product__code', 'product__name_uz', 'country__name_uz', 
        'region__name_uz', 'sitc__code'
    ]
    list_filter = [
        'trade_type', 'year', 'month', 'country__country_group'
    ]
    ordering = ['-year__year', 'country__name_uz']
    raw_id_fields = ['product', 'unit', 'year', 'country', 'region', 'sitc']

    def get_queryset(self, request):
        return super().get_queryset(request).select_related(
            'product', 'unit', 'year', 'country', 'region', 'sitc'
        )

    def get_trade_type_display(self, obj):
        return obj.get_trade_type_display()
    get_trade_type_display.short_description = 'Trade Type'
