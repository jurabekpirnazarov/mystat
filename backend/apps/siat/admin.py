"""KR-01/KR-02/KR-14: SIAT ko'rsatkichlari, sinxronlash holati, "hozir yangilash" va qo'lda yuklash."""
import json

from django import forms
from django.contrib import admin, messages
from django.shortcuts import redirect, render
from django.urls import path, reverse
from django.utils.html import format_html, format_html_join

from . import client
from .models import SiatIndicator, SiatSyncLog, Territory
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
