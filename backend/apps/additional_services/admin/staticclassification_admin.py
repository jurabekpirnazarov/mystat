from django.contrib import admin
from apps.additional_services.models.staticclassification_model import StatisticClassification, \
    StatisticClassificationCategory


@admin.register(StatisticClassification)
class StatisticClassificationAdmin(admin.ModelAdmin):
    list_display = ('id', 'name_uz',)


@admin.register(StatisticClassificationCategory)
class StatisticClassificationCategoryAdmin(admin.ModelAdmin):
    list_display = ('name',)