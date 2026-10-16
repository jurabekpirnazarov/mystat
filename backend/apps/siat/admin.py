"""KR-01/KR-02/KR-14: SIAT ko'rsatkichlari, sinxronlash holati, "hozir yangilash" va qo'lda yuklash."""
import json

from django import forms
from django.contrib import admin, messages
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils.html import format_html, format_html_join

from . import client
from .models import (ForecastModelRun, ForecastVersion, ScoringReport, SiatIndicator, SiatSyncLog, Territory,
                     TerritoryScore)
from .sync import _indicator_for, bump_cache, load_payload, rebuild_derived, rebuild_groups, run_sync


class UploadForm(forms.Form):
    siat_id = forms.IntegerField(label="SIAT ID", help_text="Masalan 246 (https://siat.stat.uz/data/246/)")
    file = forms.FileField(label="JSON fayl", help_text="SIAT sahifasidagi 'JSON' yuklab olish fayli (format 1)")


@admin.register(SiatIndicator)
class SiatIndicatorAdmin(admin.ModelAdmin):
    list_display = ("key", "short_name", "kind", "geo_level", "theme", "show_on_map", "is_active", "sort_order",
                    "source_updated_at", "last_synced_at", "status")
    list_editable = ("show_on_map", "theme", "sort_order")
    list_filter = ("show_on_map", "is_active", "kind", "geo_level", "dimension", "theme", "periodicity")
    search_fields = ("key", "code", "name_uz", "name_ru")
    readonly_fields = ("siat_link", "kind", "code", "geo_level", "dimension", "periodicity", "group_key",
                       "group_region", "derived_from", "first_published", "source_updated_at", "last_synced_at",
                       "last_error", "issues", "preliminary_periods")
    fieldsets = (
        (None, {"fields": ("key", "siat_id", "siat_link", "kind", "code", "name_uz", "name_ru", "name_en", "name_uzc")}),
        ("Karta", {"fields": ("show_on_map", "is_active", "theme", "sort_order", "higher_is_better", "diverging_center",
                              "zero_is_value")}),
        ("Tasnif (avtomatik)", {"fields": ("geo_level", "dimension", "periodicity", "group_key", "group_region",
                                           "group_region_override",
                                           "derived_from", "unit_uz", "unit_ru", "unit_en", "preliminary_periods")}),
        ("Sinxronlash va sifat", {"fields": ("first_published", "source_updated_at", "last_synced_at", "last_error",
                                             "issues")}),
        ("Izoh va metodika", {"classes": ("collapse",), "fields": ("notes_uz", "notes_ru", "notes_en", "methodology_uz")}),
    )
    actions = ("sync_now",)
    change_list_template = "admin/siat/siatindicator/change_list.html"

    @admin.display(description="Nomi")
    def short_name(self, obj):
        return (obj.name_uz or "—")[:80]

    @admin.display(description="Holat")
    def status(self, obj):
        if obj.last_error:
            return format_html('<span style="color:#b91c1c" title="{}">✖ xato</span>', obj.last_error[:300])
        if obj.quality_issues:
            return format_html('<span style="color:#b45309" title="{}">⚠ {}</span>',
                               "\n".join(obj.quality_issues)[:600], len(obj.quality_issues))
        return format_html('<span style="color:#047857">✔</span>')

    @admin.display(description="SIAT sahifasi")
    def siat_link(self, obj):
        return format_html('<a href="{0}" target="_blank" rel="noopener">{0}</a>', obj.siat_url) if obj.siat_url else "—"

    @admin.display(description="Sifat ogohlantirishlari")
    def issues(self, obj):
        if not obj.quality_issues:
            return "—"
        return format_html("<ul>{}</ul>", format_html_join("", "<li>{}</li>", ((i,) for i in obj.quality_issues)))

    @admin.action(description="Hozir yangilash (SIAT'dan qayta yuklash)")
    def sync_now(self, request, queryset):
        ids = [i for i in queryset.values_list("siat_id", flat=True) if i]
        if not ids:
            self.message_user(request, "Tanlanganlar orasida SIAT jadvali yo'q", messages.WARNING)
            return
        log = run_sync(ids=ids, force=True, trigger=f"admin:{request.user.pk}")
        level = messages.SUCCESS if not log.failed else messages.WARNING
        self.message_user(request, f"Yangilandi: {log.updated}, xato: {log.failed}. {log.details[:300]}", level)

    def get_urls(self):
        return [
            path("upload/", self.admin_site.admin_view(self.upload_view), name="siat_upload"),
            path("sync-all/", self.admin_site.admin_view(self.sync_all_view), name="siat_sync_all"),
        ] + super().get_urls()

    def upload_view(self, request):
        """Production serverdan api.siat.stat.uz ga ulanish bo'lmasa: JSON faylni qo'lda yuklash (KR-01, 3-qadam)."""
        form = UploadForm(request.POST or None, request.FILES or None)
        if request.method == "POST" and form.is_valid():
            try:
                payload = json.loads(form.cleaned_data["file"].read().decode("utf-8-sig"))
                indicator = load_payload(_indicator_for(form.cleaned_data["siat_id"]), payload)
            except (ValueError, client.SiatError) as exc:
                form.add_error("file", f"Fayl o'qilmadi: {exc}")
            else:
                rebuild_groups()
                rebuild_derived()
                bump_cache()
                self.message_user(request, f"{indicator.key}: {indicator.values.count()} ta qiymat yuklandi")
                return redirect(reverse("admin:siat_siatindicator_change", args=[indicator.pk]))
        context = {**self.admin_site.each_context(request), "form": form, "title": "SIAT faylini qo'lda yuklash",
                   "opts": self.model._meta}
        return render(request, "admin/siat/upload.html", context)

    def sync_all_view(self, request):
        if request.method != "POST":
            return redirect(reverse("admin:siat_siatindicator_changelist"))
        log = run_sync(trigger=f"admin:{request.user.pk}")
        self.message_user(request, f"Yangilandi: {log.updated}, o'zgarmagan: {log.unchanged}, xato: {log.failed}",
                          messages.SUCCESS if not log.failed else messages.WARNING)
        return redirect(reverse("admin:siat_siatindicator_changelist"))


@admin.register(Territory)
class TerritoryAdmin(admin.ModelAdmin):
    list_display = ("soato", "name_uz", "name_ru", "level", "kind", "parent", "area_km2")
    list_filter = ("level", "kind")
    search_fields = ("soato", "name_uz", "name_ru", "name_en")


@admin.register(SiatSyncLog)
class SiatSyncLogAdmin(admin.ModelAdmin):
    list_display = ("started_at", "finished_at", "trigger", "updated", "unchanged", "failed")
    readonly_fields = ("started_at", "finished_at", "trigger", "updated", "unchanged", "failed", "details")

    def has_add_permission(self, request):
        return False


class ReadOnlyAdmin(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


def _pre(data):
    return format_html("<pre style='white-space:pre-wrap;max-width:1100px'>{}</pre>",
                       json.dumps(data, ensure_ascii=False, indent=2))


@admin.register(TerritoryScore)
class TerritoryScoreAdmin(ReadOnlyAdmin):
    """SCORING_MODEL.md KR-16: oldindan hisoblangan indeks (faqat o'qish; `compute_scores` yangilaydi)."""
    list_display = ("soato", "level", "period", "preset", "is_forecast", "score", "rank", "rank_low", "rank_high",
                    "coverage", "status", "methodology_version")
    list_filter = ("level", "preset", "is_forecast", "status", "methodology_version", "period")
    search_fields = ("soato",)


@admin.register(ScoringReport)
class ScoringReportAdmin(ReadOnlyAdmin):
    """KR-18 (qoidalar, faqat o'qish) va KR-22 (tekshiruv hisoboti)."""
    list_display = ("created_at", "methodology_version", "warnings")
    readonly_fields = ("created_at", "methodology_version", "report_view", "rules_view")
    exclude = ("report",)

    @admin.display(description="Ogohlantirishlar")
    def warnings(self, obj):
        return sum(len(v.get("warnings", [])) for v in (obj.report.get("levels") or {}).values())

    @admin.display(description="Hisobot")
    def report_view(self, obj):
        return _pre(obj.report)

    @admin.display(description="Tavsiya qoidalari (scoring.yaml)")
    def rules_view(self, obj):
        from .scoring.config import load

        return _pre(load().get("rules"))


@admin.register(ForecastVersion)
class ForecastVersionAdmin(ReadOnlyAdmin):
    """KR-26, KR-28: prognoz versiyalari, orqaga sinov hisoboti va prognoz/haqiqat monitoringi (faqat staff)."""
    list_display = ("version", "created_at", "is_current", "has_error")
    readonly_fields = ("version", "created_at", "is_current", "data_until_view", "report_view", "monitoring_view", "error")
    exclude = ("data_until", "report", "monitoring", "what_if")

    @admin.display(description="Xato", boolean=True)
    def has_error(self, obj):
        return bool(obj.error)

    @admin.display(description="Ma'lumot oxiri")
    def data_until_view(self, obj):
        return _pre(obj.data_until)

    @admin.display(description="Orqaga sinov")
    def report_view(self, obj):
        return _pre(obj.report)

    @admin.display(description="Monitoring")
    def monitoring_view(self, obj):
        return _pre(obj.monitoring)


@admin.register(ForecastModelRun)
class ForecastModelRunAdmin(ReadOnlyAdmin):
    list_display = ("indicator", "level", "horizon", "model_kind", "data_until", "version", "trained_at")
    list_filter = ("indicator", "level", "horizon", "model_kind", "version")
