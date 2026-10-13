"""Demografik bo'limlar uchun admin sahifa.

Workflow:
1. Admin yangi section yaratadi: slug, name, Excel fayl yuklaydi
2. Saqlash paytida tizim Excel'ni o'qiydi va `filter_schema`ni avto-yaratadi
3. Admin schema'ni JSON editor orqali tahrir qila oladi
4. "Import to parquet" action bilan ma'lumot wide parquet'ga yoziladi
5. "Inspect Excel" action bilan sheet/columnlarni ko'rish mumkin
"""
from __future__ import annotations

import os
import re
import time
import traceback
import unicodedata
from pathlib import Path

import pandas as pd
from django.conf import settings
from django.contrib import admin, messages
from django.core.files.base import File
from django.http import JsonResponse
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils.html import format_html
from django.utils import timezone

from apps.additional_services.models import DemographicSection
from apps.additional_services.api_endpoints.DemographicsAPI import parser, writer


# Bulk upload temp directory
TEMP_UPLOAD_DIR = Path(settings.MEDIA_ROOT) / "demographics" / "temp"


def _ascii_slugify(value: str) -> str:
    """Cyrillic/Uzbek sheet nomidan ASCII slug yaratish (default uchun)."""
    if value is None:
        return ""
    value = str(value)
    # Transliteration map for common cyrillic and apostrophes
    repl = {
        "'": "", "'": "", "ʻ": "", "`": "",
        "о'": "o", "ў": "u", "ғ": "g", "қ": "q", "ҳ": "h",
    }
    for k, v in repl.items():
        value = value.replace(k, v)
    nfkd = unicodedata.normalize("NFKD", value)
    ascii_str = nfkd.encode("ascii", "ignore").decode("ascii")
    ascii_str = ascii_str.lower()
    ascii_str = re.sub(r"[^a-z0-9]+", "_", ascii_str).strip("_")
    return ascii_str or "section"


try:
    from django_jsonform.widgets import JSONFormWidget
    HAS_JSONFORM = True
except Exception:  # paket o'rnatilmagan bo'lsa
    HAS_JSONFORM = False


FILTER_SCHEMA_FORM = {
    "type": "dict",
    "keys": {
        "value_column": {
            "type": "dict",
            "keys": {
                "name": {"type": "string", "title": "Ustun nomi"},
                "label": {"type": "string", "title": "Sarlavha"},
            },
        },
        "filters": {
            "type": "array",
            "title": "Filterlar",
            "items": {
                "type": "dict",
                "keys": {
                    "column": {"type": "string", "title": "Ustun"},
                    "label": {"type": "string", "title": "Sarlavha"},
                    "ui": {
                        "type": "string",
                        "title": "UI turi",
                        "choices": parser.UI_TYPES,
                    },
                    "multiple": {"type": "boolean", "title": "Ko'pchilik tanlash"},
                    "searchable": {"type": "boolean", "title": "Qidiruv qutisi"},
                    "unique_extracted": {"type": "boolean", "title": "Unique qiymatlar ajratilgan"},
                    "order": {"type": "integer", "title": "Tartib"},
                    "options": {
                        "type": "array",
                        "title": "Variantlar",
                        "items": {"type": "string"},
                    },
                },
            },
        },
    },
}


@admin.register(DemographicSection)
class DemographicSectionAdmin(admin.ModelAdmin):
    change_list_template = "admin/demographics/change_list.html"
    list_display = (
        "icon_display",
        "slug",
        "name",
        "row_count",
        "is_published",
        "last_imported_at",
        "actions_links",
    )
    list_display_links = ("slug", "name")
    list_filter = ("is_published", "is_active")
    search_fields = ("slug", "name", "description")
    readonly_fields = ("row_count", "last_imported_at", "last_import_error", "inspect_panel", "parquet_panel")
    fieldsets = (
        ("Asosiy", {
            "fields": ("slug", "name", "description", "icon", "order", "is_published"),
        }),
        ("Excel manba", {
            "fields": ("excel_file", "sheet_name", "inspect_panel"),
            "description": "Excel faylni yuklang va saqlang — schema avto-yaratiladi.",
        }),
        ("Filter schemasi", {
            "fields": ("filter_schema",),
            "description": "Bu schema /api/demographics/schema/ endpointidan frontend'ga chiqadi.",
        }),
        ("Parquet ma'lumot", {
            "fields": ("row_count", "last_imported_at", "last_import_error", "parquet_panel"),
            "description": "Saqlangandan keyin 'Import qilish' tugmasini bosing.",
        }),
    )

    class Media:
        css = {"all": ("admin/css/demographics.css",)}

    # ---- formfield_overrides — JSON editor ----
    def get_form(self, request, obj=None, **kwargs):
        form = super().get_form(request, obj, **kwargs)
        if HAS_JSONFORM and "filter_schema" in form.base_fields:
            form.base_fields["filter_schema"].widget = JSONFormWidget(schema=FILTER_SCHEMA_FORM)
        return form

    # ---- list_display callable'lar ----
    def icon_display(self, obj):
        return obj.icon or "📊"
    icon_display.short_description = ""

    def actions_links(self, obj):
        if not obj.pk:
            return ""
        import_url = reverse("admin:demographics_import", args=[obj.pk])
        inspect_url = reverse("admin:demographics_inspect", args=[obj.pk])
        return format_html(
            '<a class="button" href="{}">Excel ko\'rib chiqish</a>&nbsp;'
            '<a class="button" style="background:#10b981;color:white;padding:4px 10px;border-radius:4px;text-decoration:none;" href="{}">Parquet\'ga import</a>',
            inspect_url, import_url,
        )
    actions_links.short_description = "Amallar"

    def inspect_panel(self, obj):
        if not obj or not obj.pk or not obj.excel_file:
            return "Avval Excel yuklang va saqlang."
        url = reverse("admin:demographics_inspect", args=[obj.pk])
        return format_html(
            '<a class="button" href="{}" target="_blank">Sheet va ustunlarni ko\'rish</a>',
            url,
        )
    inspect_panel.short_description = "Excel ko'rib chiqish"

    def parquet_panel(self, obj):
        if not obj or not obj.pk:
            return "—"
        url = reverse("admin:demographics_import", args=[obj.pk])
        info = ""
        if obj.row_count:
            info = f"<br><small>Oxirgi: {obj.row_count} qator</small>"
        if obj.last_import_error:
            info += f'<br><small style="color:#b91c1c;">Xato: {obj.last_import_error[:200]}</small>'
        return format_html(
            '<a class="button" style="background:#10b981;color:white;padding:6px 14px;border-radius:6px;text-decoration:none;font-weight:600;" href="{}">Parquet\'ga import qilish</a>{}',
            url, format_html(info),
        )
    parquet_panel.short_description = "Import"

    # ---- save_model — Excel saqlanganda schema avto-yaratish ----
    def save_model(self, request, obj, form, change):
        is_new_excel = "excel_file" in form.changed_data
        super().save_model(request, obj, form, change)

        if is_new_excel and obj.excel_file:
            try:
                df = self._read_section_df(obj)
                # Avval schema bor bo'lsa, ustun konfiguratsiyasini saqlaymiz
                old_schema = obj.filter_schema or {}
                col_cfg = {}
                if old_schema.get("value_column", {}).get("name"):
                    col_cfg[old_schema["value_column"]["name"]] = {"role": "value"}
                for f in old_schema.get("filters", []):
                    col_cfg[f["column"]] = {
                        "role": "filter",
                        "extract_unique": f.get("unique_extracted", True),
                        "ui": f.get("ui"),
                        "label": f.get("label"),
                        "multiple": f.get("multiple"),
                        "searchable": f.get("searchable"),
                    }
                obj.filter_schema = parser.generate_schema(df, col_cfg)
                obj.last_import_error = ""
                obj.save(update_fields=["filter_schema", "last_import_error"])
                messages.success(request, f"Schema avto-yaratildi: {len(obj.filter_schema.get('filters', []))} ta filter aniqlandi.")
            except Exception as e:
                obj.last_import_error = f"{type(e).__name__}: {e}"
                obj.save(update_fields=["last_import_error"])
                messages.error(request, f"Excel o'qishda xato: {e}")

    # ---- helper — section uchun DataFrame'ni o'qish va transformlash ----
    @staticmethod
    def _read_section_df(obj: DemographicSection) -> pd.DataFrame:
        path = obj.excel_file.path
        sheet = obj.sheet_name.strip() or 0
        df = pd.read_excel(path, sheet_name=sheet, header=0)
        df.columns = [str(c).strip() for c in df.columns]
        return df

    # ---- custom admin URL'lar ----
    def get_urls(self):
        urls = super().get_urls()
        custom = [
            path(
                "bulk-upload/",
                self.admin_site.admin_view(self.bulk_upload_view),
                name="demographics_bulk_upload",
            ),
            path(
                "bulk-upload/configure/",
                self.admin_site.admin_view(self.bulk_configure_view),
                name="demographics_bulk_configure",
            ),
            path(
                "<int:pk>/import-parquet/",
                self.admin_site.admin_view(self.import_to_parquet_view),
                name="demographics_import",
            ),
            path(
                "<int:pk>/inspect/",
                self.admin_site.admin_view(self.inspect_view),
                name="demographics_inspect",
            ),
        ]
        return custom + urls

    # ────────────────────────────────────────────────────────────────
    # BULK UPLOAD: bitta Excel'da bir nechta sheet → bir nechta section
    # ────────────────────────────────────────────────────────────────
    def bulk_upload_view(self, request):
        """1-qadam: foydalanuvchi Excel'ni yuklab beradi.
        Fayl temp'ga saqlanadi va configure sahifasiga yo'naltiriladi."""
        if request.method == "POST" and request.FILES.get("excel_file"):
            f = request.FILES["excel_file"]
            if not f.name.lower().endswith((".xlsx", ".xls")):
                messages.error(request, "Faqat .xlsx yoki .xls fayl yuklash mumkin.")
                return redirect("admin:demographics_bulk_upload")

            TEMP_UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
            stamp = int(time.time())
            safe_name = re.sub(r"[^A-Za-z0-9._-]", "_", f.name)
            tmp_filename = f"{stamp}_{safe_name}"
            tmp_path = TEMP_UPLOAD_DIR / tmp_filename
            with open(tmp_path, "wb") as out:
                for chunk in f.chunks():
                    out.write(chunk)
            return redirect(
                reverse("admin:demographics_bulk_configure") + f"?file={tmp_filename}"
            )

        context = {
            **self.admin_site.each_context(request),
            "title": "Excel'dan to'plam yuklash",
            "opts": self.model._meta,
        }
        return render(request, "admin/demographics/bulk_upload.html", context)

    def bulk_configure_view(self, request):
        """2-qadam: har sheet uchun to'liq schema preview va tahrir.
        GET — har ustun uchun avto-aniqlangan rol/UI/options ko'rsatiladi
        POST — tahrirlangan schema'dan yakuniy filter_schema quriladi, DB+parquet yoziladi"""
        filename = request.GET.get("file") or request.POST.get("file") or ""
        filename = os.path.basename(filename)
        tmp_path = TEMP_UPLOAD_DIR / filename

        if not filename or not tmp_path.exists():
            messages.error(request, "Yuklangan fayl topilmadi yoki muddati o'tgan. Qaytadan yuklang.")
            return redirect("admin:demographics_bulk_upload")

        if request.method == "POST":
            return self._bulk_process_submit(request, tmp_path, filename)

        # GET — har sheet'ni to'liq o'qib, schema preview qilamiz
        try:
            xls = pd.ExcelFile(tmp_path)
        except Exception as e:
            messages.error(request, f"Excel o'qishda xato: {e}")
            return redirect("admin:demographics_bulk_upload")

        sheets_preview = []
        for s_idx, sheet_name in enumerate(xls.sheet_names):
            try:
                df = pd.read_excel(xls, sheet_name=sheet_name, header=0)
                df.columns = [str(c).strip() for c in df.columns]
                suggested = parser.generate_schema(df)
            except Exception as e:
                messages.warning(request, f"'{sheet_name}' sheet o'qib bo'lmadi: {e}")
                continue

            suggested_value_name = (suggested.get("value_column") or {}).get("name", "")
            suggested_value_label = (suggested.get("value_column") or {}).get("label", "")
            suggested_filters = {f["column"]: f for f in suggested.get("filters", [])}

            columns_full = []
            for c_idx, col in enumerate(df.columns):
                series = df[col]
                unique_count = int(series.nunique(dropna=True))
                dtype_str = str(series.dtype)
                sample_vals = series.dropna().head(5).tolist()
                sample_str = ", ".join(str(v) for v in sample_vals)

                if col == suggested_value_name:
                    options_preview = "(qiymat ustuni — agregatsiya: SUM)"
                    columns_full.append({
                        "idx": c_idx,
                        "name": col,
                        "dtype": dtype_str,
                        "unique_count": unique_count,
                        "sample": sample_str,
                        "suggested_role": "value",
                        "suggested_label": suggested_value_label,
                        "suggested_ui": "",
                        "suggested_unique": False,
                        "suggested_multiple": False,
                        "suggested_searchable": False,
                        "options_preview": options_preview,
                    })
                elif col in suggested_filters:
                    f = suggested_filters[col]
                    opts = f.get("options") or []
                    preview_items = [str(o) for o in opts[:8]]
                    preview = ", ".join(preview_items)
                    if len(opts) > 8:
                        preview += f"  …  ({len(opts)} ta jami)"
                    columns_full.append({
                        "idx": c_idx,
                        "name": col,
                        "dtype": dtype_str,
                        "unique_count": unique_count,
                        "sample": sample_str,
                        "suggested_role": "filter",
                        "suggested_label": f.get("label", col),
                        "suggested_ui": f.get("ui", "multi_select"),
                        "suggested_unique": f.get("unique_extracted", True),
                        "suggested_multiple": f.get("multiple", True),
                        "suggested_searchable": f.get("searchable", False),
                        "options_preview": preview,
                    })
                else:
                    columns_full.append({
                        "idx": c_idx,
                        "name": col,
                        "dtype": dtype_str,
                        "unique_count": unique_count,
                        "sample": sample_str,
                        "suggested_role": "skip",
                        "suggested_label": col.replace("_", " ").title(),
                        "suggested_ui": "multi_select",
                        "suggested_unique": True,
                        "suggested_multiple": True,
                        "suggested_searchable": False,
                        "options_preview": "",
                    })

            suggested_slug = _ascii_slugify(sheet_name)
            sheets_preview.append({
                "idx": s_idx,
                "name": sheet_name,
                "row_count": int(len(df)),
                "suggested_slug": suggested_slug,
                "suggested_display_name": sheet_name,
                "exists": DemographicSection.objects.filter(slug=suggested_slug).exists(),
                "columns": columns_full,
                "value_column_name": suggested_value_name,
            })

        context = {
            **self.admin_site.each_context(request),
            "title": "Sheet'lar va schemalarni sozlash",
            "opts": self.model._meta,
            "filename": filename,
            "sheets": sheets_preview,
            "ui_types": parser.UI_TYPES,
        }
        return render(request, "admin/demographics/bulk_configure.html", context)

    def _bulk_process_submit(self, request, tmp_path, filename):
        """POST — har sheet/ustun uchun form ma'lumotini o'qib schema'ni qurish va saqlash."""
        try:
            xls = pd.ExcelFile(tmp_path)
        except Exception as e:
            messages.error(request, f"Excel o'qishda xato: {e}")
            return redirect("admin:demographics_bulk_upload")

        success_count = 0
        errors = []

        for s_idx, sheet_name in enumerate(xls.sheet_names):
            include = request.POST.get(f"sheet_{s_idx}_include") == "on"
            if not include:
                continue

            slug = (request.POST.get(f"sheet_{s_idx}_slug") or "").strip() or _ascii_slugify(sheet_name)
            display_name = (request.POST.get(f"sheet_{s_idx}_display_name") or "").strip() or sheet_name
            icon = (request.POST.get(f"sheet_{s_idx}_icon") or "").strip() or "📊"
            publish = request.POST.get(f"sheet_{s_idx}_publish") == "on"

            try:
                df = pd.read_excel(xls, sheet_name=sheet_name, header=0)
                df.columns = [str(c).strip() for c in df.columns]

                # Har ustun uchun form ma'lumotini yig'amiz
                column_config = {}
                skip_cols = []
                for c_idx, col in enumerate(df.columns):
                    role = request.POST.get(f"col_{s_idx}_{c_idx}_role", "filter")
                    label = (request.POST.get(f"col_{s_idx}_{c_idx}_label") or col).strip()
                    ui = request.POST.get(f"col_{s_idx}_{c_idx}_ui") or None
                    extract_unique = request.POST.get(f"col_{s_idx}_{c_idx}_unique") == "on"
                    multiple = request.POST.get(f"col_{s_idx}_{c_idx}_multiple") == "on"
                    searchable = request.POST.get(f"col_{s_idx}_{c_idx}_searchable") == "on"

                    if role == "skip":
                        skip_cols.append(col)
                        continue

                    column_config[col] = {
                        "role": role,
                        "label": label,
                        "ui": ui,
                        "extract_unique": extract_unique,
                        "multiple": multiple,
                        "searchable": searchable,
                    }

                # Skip qilingan ustunlarni DataFrame'dan ham olib tashlaymiz
                if skip_cols:
                    df = df.drop(columns=skip_cols, errors="ignore")

                schema = parser.generate_schema(df, column_config)

                section, _created = DemographicSection.objects.get_or_create(
                    slug=slug,
                    defaults={
                        "name": display_name,
                        "icon": icon,
                        "sheet_name": sheet_name,
                        "is_published": publish,
                    },
                )
                section.name = display_name
                section.icon = icon
                section.sheet_name = sheet_name
                section.is_published = publish
                section.filter_schema = schema
                section.last_import_error = ""

                with open(tmp_path, "rb") as src:
                    section.excel_file.save(filename, File(src), save=False)

                row_count = writer.write_section_df(slug, df)
                section.row_count = row_count
                section.last_imported_at = timezone.now()
                section.save()
                success_count += 1
            except Exception as e:
                tb = traceback.format_exc()
                errors.append(f"{sheet_name}: {type(e).__name__}: {e}")
                # Section bo'lsa, xato'ni saqlaymiz
                try:
                    sec = DemographicSection.objects.filter(slug=slug).first()
                    if sec:
                        sec.last_import_error = f"{type(e).__name__}: {e}\n{tb[-500:]}"
                        sec.save(update_fields=["last_import_error"])
                except Exception:
                    pass

        if success_count:
            messages.success(request, f"{success_count} ta bo'lim muvaffaqiyatli import qilindi.")
        for err in errors:
            messages.error(request, err)

        try:
            tmp_path.unlink(missing_ok=True)
        except Exception:
            pass

        return redirect("admin:additional_services_demographicsection_changelist")

    def import_to_parquet_view(self, request, pk):
        from django.shortcuts import redirect
        try:
            obj = DemographicSection.objects.get(pk=pk)
        except DemographicSection.DoesNotExist:
            messages.error(request, "Topilmadi.")
            return redirect("admin:additional_services_demographicsection_changelist")

        if not obj.excel_file:
            messages.error(request, "Excel fayl yuklanmagan.")
            return redirect("admin:additional_services_demographicsection_change", obj.pk)

        try:
            df = self._read_section_df(obj)
            row_count = writer.write_section_df(obj.slug, df)
            obj.row_count = row_count
            obj.last_imported_at = timezone.now()
            obj.last_import_error = ""
            obj.save(update_fields=["row_count", "last_imported_at", "last_import_error"])
            messages.success(request, f"Muvaffaqiyatli import qilindi: {row_count} qator.")
        except Exception as e:
            tb = traceback.format_exc()
            obj.last_import_error = f"{type(e).__name__}: {e}\n{tb[-500:]}"
            obj.save(update_fields=["last_import_error"])
            messages.error(request, f"Import xatosi: {e}")
        return redirect("admin:additional_services_demographicsection_change", obj.pk)

    def inspect_view(self, request, pk):
        try:
            obj = DemographicSection.objects.get(pk=pk)
        except DemographicSection.DoesNotExist:
            return JsonResponse({"error": "Topilmadi"}, status=404)
        if not obj.excel_file:
            return JsonResponse({"error": "Excel fayl yuklanmagan"}, status=400)
        try:
            info = parser.inspect_excel(obj.excel_file.path)
            return JsonResponse(info, json_dumps_params={"ensure_ascii": False, "indent": 2})
        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)
