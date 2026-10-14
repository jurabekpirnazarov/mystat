from django.contrib import admin

from apps.additional_services.models import ReportGuide, SavedQuery


@admin.register(ReportGuide)
class ReportGuideAdmin(admin.ModelAdmin):
    list_display = ("report", "legal_basis", "sample_file", "updated_at")
    search_fields = ("report__id", "report__type_uz", "summary_uz")
    raw_id_fields = ("report",)


@admin.register(SavedQuery)
class SavedQueryAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "name", "created_at")
    list_filter = ("kind",)
    raw_id_fields = ("user",)
