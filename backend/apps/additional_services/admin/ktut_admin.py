from django.contrib import admin
from import_export.admin import ImportExportModelAdmin
from apps.additional_services.models import Ktut, ReportList, KtutReportList


@admin.register(ReportList)
class StatisticClassificationAdmin(ImportExportModelAdmin):
    list_display = ('id', 'type', 'srok', 'formsname')
    

@admin.register(Ktut)
class StatisticClassificationAdmin(ImportExportModelAdmin):
    list_display = ('id', 'okpo', 'inn', 'name')
    list_filter = ('inn',)


@admin.register(KtutReportList)
class KtutReportListAdmin(ImportExportModelAdmin):
    list_display = ('id', 'ktut')