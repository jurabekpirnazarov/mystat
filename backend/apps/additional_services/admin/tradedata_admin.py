# apps/additional_services/admin/trade_data_admin.py
from django import forms
from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from import_export.formats.base_formats import XLSX, CSV
from apps.additional_services.models.ex_trade import TradeData, Year
from apps.additional_services.resources.trade_data_resource import TradeDataExcelResource

class TradeDataImportForm(forms.Form):
    import_file = forms.FileField(label="Excel fayl")
    input_format = forms.ChoiceField(
        label="Format",
        choices=[(i, f().get_title()) for i, f in enumerate((XLSX, CSV))],
        initial=0,
    )
    year = forms.ModelChoiceField(
        queryset=Year.objects.all().order_by("-year"),
        required=True,
        label="Year (majburiy)"
    )

@admin.register(Year)
class YearAdmin(admin.ModelAdmin):
    list_display = ('year',)
    search_fields = ('year',)

@admin.register(TradeData)
class TradeDataAdmin(ImportExportModelAdmin):
    list_filter = [
        'trade_type', 'year', 'month', 'country', 'region'
    ]
    list_display = ["year", "month", "trade_type", "country", "region", "product", "sitc", "value", "quantity"]
    search_fields = ("sitc__code",)
    formats = (XLSX, CSV)
    def get_import_form(self):
        return TradeDataImportForm
    def get_import_resource_classes(self, request):
        return [TradeDataExcelResource]
    def get_import_data_kwargs(self, request, *args, **kwargs):
        data = {}
        if request.method == "POST":
            data["selected_year_id"] = request.POST.get("year") or request.POST.get("selected_year_id")
        return data
    def get_confirm_form_initial(self, request, import_form):
        initial = super().get_confirm_form_initial(request, import_form)
        if hasattr(import_form, "cleaned_data"):
            initial["selected_year_id"] = import_form.cleaned_data["year"].pk
        else:
            initial["selected_year_id"] = request.POST.get("selected_year_id") or request.POST.get("year") or ""
        return initial
