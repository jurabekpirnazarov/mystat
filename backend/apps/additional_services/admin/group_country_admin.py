# apps/geo/admin.py
from django.contrib import admin, messages
from django.db import transaction
from import_export.admin import ImportExportModelAdmin
from apps.additional_services.models import CountryGroup, Country
from apps.additional_services.resources.group_and_country_resource import CountryGroupResource, CountryResource
from django.template.response import TemplateResponse
from django import forms
from io import BytesIO
import tablib
from django.urls import path, reverse
from openpyxl import load_workbook
from django.http import HttpResponseRedirect


def ws_to_dataset(ws):
    rows = list(ws.iter_rows(values_only=True))
    if not rows:
        return tablib.Dataset()
    headers = [(str(h).strip() if h is not None else '') for h in rows[0]]
    data = tablib.Dataset(headers=headers)
    for r in rows[1:]:
        data.append([c if c is not None else '' for c in r])
    return data


def extract_errors(result):
    """
    import-export dry_run natijasidan qator va xato tafsilotlarini chiqarib beradi.
    Excel foydalanuvchiga qulay bo‘lishi uchun row indeksini +2 qilamiz (header + 1-based).
    """
    out = []
    # Qator xatolari
    for row_num, row_errors in result.row_errors():
        human_row = (row_num + 2) if isinstance(row_num, int) else row_num
        for err in row_errors:
            out.append({
                "row": human_row,
                "error": str(getattr(err, "error", err)),
                "traceback": getattr(err, "traceback", ""),
            })
    # Bazaviy xatolar
    for base_err in getattr(result, "base_errors", []):
        out.append({
            "row": None,
            "error": str(getattr(base_err, "error", base_err)),
            "traceback": getattr(base_err, "traceback", ""),
        })
    return out


class BulkExcelImportForm(forms.Form):
    import_file = forms.FileField(help_text="XLSX fayl (ichida 2 ta sheet: groups, davlatlar).")
    groups_sheet = forms.CharField(initial="groups", help_text="CountryGroup’lar turgan sheet nomi (masalan: groups)")
    countries_sheet = forms.CharField(initial="davlatlar", help_text="Country’lar turgan sheet nomi (masalan: davlatlar)")
    dry_run = forms.BooleanField(required=False, initial=True, help_text="Preview rejimi (bazaga yozmaydi)")


@admin.register(CountryGroup)
class CountryGroupAdmin(ImportExportModelAdmin):
    resource_class = CountryGroupResource
    list_display = ('code', 'name_uz', 'name_ru', 'name_en', 'name_cry')
    search_fields = ('code', 'name_uz', 'name_ru', 'name_en', 'name_cry')


@admin.register(Country)
class CountryAdmin(ImportExportModelAdmin):
    resource_class = CountryResource
    list_display = (
        'ctrana', 'zar0', 'zar1', 'zar',
        'name_uz', 'name_ru', 'name_en', 'name_cry',
        'kod_kont',
    )
    search_fields = (
        'ctrana', 'zar0', 'zar1', 'zar',
        'name_uz', 'name_ru', 'name_en', 'name_cry',
        'kod_kont',
    )
    # list_select_related = ("country_group",)

    def get_urls(self):
        urls = super().get_urls()
        app_label = self.model._meta.app_label
        model_name = self.model._meta.model_name
        my_urls = [
            path(
                "bulk-import-excel/",
                self.admin_site.admin_view(self.bulk_import_excel_view),
                name=f"{app_label}_{model_name}_bulk_import_excel",
            ),
        ]
        return my_urls + urls

    def bulk_import_excel_view(self, request):
        context = dict(
            self.admin_site.each_context(request),
            opts=self.model._meta,
            title="Bulk import (2 sheets): CountryGroup + Country",
        )

        if request.method == "POST":
            form = BulkExcelImportForm(request.POST, request.FILES)
            if form.is_valid():
                f = form.cleaned_data["import_file"]
                groups_sheet = form.cleaned_data["groups_sheet"].strip()
                countries_sheet = form.cleaned_data["countries_sheet"].strip()
                dry_run = form.cleaned_data["dry_run"]

                mem = BytesIO(f.read())
                wb = load_workbook(filename=mem, data_only=True)

                missing = [s for s in (groups_sheet, countries_sheet) if s not in wb.sheetnames]
                if missing:
                    messages.error(
                        request,
                        f"Sheet topilmadi: {', '.join(missing)}. Mavjud: {', '.join(wb.sheetnames)}"
                    )
                    context["form"] = form
                    return TemplateResponse(request, "admin/bulk_import_2sheets.html", context)

                ds_groups = ws_to_dataset(wb[groups_sheet])
                ds_countries = ws_to_dataset(wb[countries_sheet])

                if not ds_groups.headers:
                    messages.error(request, f"'{groups_sheet}' sheet’da header (1-qator) topilmadi.")
                    context["form"] = form
                    return TemplateResponse(request, "admin/bulk_import_2sheets.html", context)
                if not ds_countries.headers:
                    messages.error(request, f"'{countries_sheet}' sheet’da header (1-qator) topilmadi.")
                    context["form"] = form
                    return TemplateResponse(request, "admin/bulk_import_2sheets.html", context)

                gr_res = CountryGroupResource()
                ct_res = CountryResource()

                # 1) DRY-RUN ikkisi uchun ham
                r1 = gr_res.import_data(ds_groups, dry_run=True)
                r2 = ct_res.import_data(ds_countries, dry_run=True)

                context.update({
                    "form": form,
                    "preview": True,
                    "groups_result": r1,
                    "countries_result": r2,
                    # xatolarni ham ko‘rsatamiz:
                    "groups_errors": extract_errors(r1),
                    "countries_errors": extract_errors(r2),
                })

                if r1.has_errors() or r2.has_errors():
                    messages.error(request, "Dry-run xatolari aniqlandi. Pastdagi tafsilotlarni ko‘rib tuzating.")
                    return TemplateResponse(request, "admin/bulk_import_2sheets.html", context)

                # 2) Real import so'ralgan bo'lsa — transactional
                if not dry_run:
                    try:
                        with transaction.atomic():
                            r1_real = gr_res.import_data(ds_groups, dry_run=False)
                            if r1_real.has_errors():
                                raise RuntimeError("CountryGroup real importida xatolar bor.")

                            r2_real = ct_res.import_data(ds_countries, dry_run=False)
                            if r2_real.has_errors():
                                raise RuntimeError("Country real importida xatolar bor.")
                    except Exception as e:
                        messages.error(request, f"Import rollback qilindi: {e}")
                        return TemplateResponse(request, "admin/bulk_import_2sheets.html", context)

                    messages.success(request, "Bulk import yakunlandi ✅ (CountryGroup → Country).")
                    cl_url = reverse(f"admin:{self.model._meta.app_label}_{self.model._meta.model_name}_changelist")
                    return HttpResponseRedirect(cl_url)

                # Dry-run OK bo'lsa
                messages.info(request, "Dry-run OK ✅. 'Preview (dry_run)' belgini olib tashlab yana yuborsangiz — bazaga yozadi.")
                return TemplateResponse(request, "admin/bulk_import_2sheets.html", context)

        else:
            form = BulkExcelImportForm()

        context["form"] = form
        return TemplateResponse(request, "admin/bulk_import_2sheets.html", context)
