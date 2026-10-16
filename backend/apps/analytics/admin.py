from django.contrib import admin

import json

from django.utils.html import format_html

from .models import CompanyScoringReport, EnterpriseIndicator, EnterpriseScore, RegionIndicator


@admin.register(EnterpriseIndicator)
class EnterpriseIndicatorAdmin(admin.ModelAdmin):
    list_display = ("stir", "year", "oked_section", "region", "employees", "revenue", "is_peer", "is_synthetic")
    list_filter = ("year", "oked_section", "region", "is_peer", "is_synthetic")
    search_fields = ("stir",)


@admin.register(RegionIndicator)
class RegionIndicatorAdmin(admin.ModelAdmin):
    list_display = ("region", "district", "indicator", "year", "period", "value", "unit")
    list_filter = ("indicator", "year", "period", "region")
    raw_id_fields = ("district",)


class _ReadOnly(admin.ModelAdmin):
    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False


@admin.register(EnterpriseScore)
class EnterpriseScoreAdmin(_ReadOnly):
    """KORXONA_SCORING.md KR-31: hisoblangan ballar (faqat o'qish; `compute_company_scores` yangilaydi)."""
    list_display = ("stir", "year", "preset", "overall", "klass", "coverage", "peer_group", "peer_size", "data_source")
    list_filter = ("year", "preset", "klass", "data_source", "oked_section", "region_code", "model_version")
    search_fields = ("stir",)


@admin.register(CompanyScoringReport)
class CompanyScoringReportAdmin(_ReadOnly):
    """KR-38: `validate_company_scoring` hisoboti (hududlar scoringi tekshiruvi — siat admin'ida)."""
    list_display = ("created_at", "model_version", "warnings")
    readonly_fields = ("created_at", "model_version", "report_view")
    exclude = ("report",)

    @admin.display(description="Ogohlantirishlar")
    def warnings(self, obj):
        return len((obj.report or {}).get("warnings", []))

    @admin.display(description="Hisobot")
    def report_view(self, obj):
        return format_html("<pre style='white-space:pre-wrap;max-width:1100px'>{}</pre>",
                           json.dumps(obj.report, ensure_ascii=False, indent=2))
