from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from apps.additional_services.models import Ktut, ReportList, KtutReportList
from apps.analytics.company_scoring.admin_mixins import CompanyScoreAdminMixin, KlassFilter


@admin.register(ReportList)
class StatisticClassificationAdmin(ImportExportModelAdmin):
    list_display = ('id', 'type', 'srok', 'formsname')
    

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