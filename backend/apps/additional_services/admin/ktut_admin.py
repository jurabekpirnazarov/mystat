from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from apps.additional_services.models import Holiday, Ktut, KtutReportList, ReportDeadlineOverride, ReportList
from apps.analytics.company_scoring.admin_mixins import CompanyScoreAdminMixin, KlassFilter


class RuleFilter(admin.SimpleListFilter):
    """HT-01: muddat qoidasi kiritilmagan shakllar."""
    title = "Muddat qoidasi"
    parameter_name = "rule"

    def lookups(self, request, model_admin):
        return (("no", "Qoida kiritilmagan"), ("yes", "Qoida bor"))

    def queryset(self, request, queryset):
        if self.value() == "no":
            return queryset.filter(deadline_rule="")
        if self.value() == "yes":
            return queryset.exclude(deadline_rule="")
        return queryset


class DeadlineOverrideInline(admin.TabularInline):
    model = ReportDeadlineOverride
    extra = 0


@admin.register(ReportList)
class StatisticClassificationAdmin(ImportExportModelAdmin):
    list_display = ('id', 'type', 'report_type', 'deadline_rule', 'srok', 'formsname')
    list_filter = (RuleFilter, 'report_type')
    inlines = [DeadlineOverrideInline]


@admin.register(Holiday)
class HolidayAdmin(admin.ModelAdmin):
    list_display = ('date', 'name')
    

@admin.register(Ktut)
class KtutAdmin(CompanyScoreAdminMixin, ImportExportModelAdmin):
    # KORXONA_SCORING.md KR-35: "Ball", "Sinf" ustunlari va sinf filtri
    score_stir_field = "inn"
    list_display = ('id', 'okpo', 'inn', 'name', 'company_score_display', 'company_klass_display')
    list_filter = (KlassFilter,)
    search_fields = ('inn', 'name')


@admin.register(KtutReportList)
class KtutReportListAdmin(ImportExportModelAdmin):
    list_display = ('id', 'ktut')