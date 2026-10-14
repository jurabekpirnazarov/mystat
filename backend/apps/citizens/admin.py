from django.contrib import admin

from .models import (Article, CitizenQuestion, ConsumerPrice, FavoriteIndicator, GlossaryTerm, NameStat,
                     SalaryDistribution, Survey, SurveyQuestion, SurveyResponse)


@admin.register(Article)
class ArticleAdmin(admin.ModelAdmin):
    list_display = ("title_uz", "topic", "reading_minutes", "is_published", "published_at")
    list_filter = ("topic", "is_published")
    prepopulated_fields = {"slug": ("title_uz",)}
    search_fields = ("title_uz", "body_uz")


@admin.register(GlossaryTerm)
class GlossaryTermAdmin(admin.ModelAdmin):
    list_display = ("term_uz", "term_ru", "slug", "article")
    search_fields = ("term_uz", "term_ru", "definition_uz")


class SurveyQuestionInline(admin.TabularInline):
    model = SurveyQuestion
    extra = 1


@admin.register(Survey)
class SurveyAdmin(admin.ModelAdmin):
    list_display = ("title_uz", "is_active", "results_public", "closes_at", "created_at")
    inlines = [SurveyQuestionInline]
    prepopulated_fields = {"slug": ("title_uz",)}


@admin.register(SurveyResponse)
class SurveyResponseAdmin(admin.ModelAdmin):
    list_display = ("survey", "user", "region", "age_group", "is_sample", "created_at")
    list_filter = ("survey", "is_sample", "age_group")
    raw_id_fields = ("user",)


@admin.register(CitizenQuestion)
class CitizenQuestionAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "category", "region", "status", "allow_publish", "created_at")
    list_filter = ("status", "category", "allow_publish")
    raw_id_fields = ("user", "answered_by")
    search_fields = ("question", "answer")


@admin.register(SalaryDistribution)
class SalaryDistributionAdmin(admin.ModelAdmin):
    list_display = ("region", "sector", "year", "median", "mean")
    list_filter = ("year", "region")


@admin.register(ConsumerPrice)
class ConsumerPriceAdmin(admin.ModelAdmin):
    list_display = ("product_name", "region", "month", "price", "unit")
    list_filter = ("product", "region")


@admin.register(NameStat)
class NameStatAdmin(admin.ModelAdmin):
    list_display = ("name", "gender", "year", "region", "count")
    list_filter = ("gender", "year")
    search_fields = ("name", "name_cyr")


@admin.register(FavoriteIndicator)
class FavoriteIndicatorAdmin(admin.ModelAdmin):
    list_display = ("user", "kind", "title", "created_at")
    raw_id_fields = ("user",)
