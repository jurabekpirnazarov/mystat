"""KORXONA_SCORING.md KR-35, 12-band: admin ro'yxatlarida (KTUT, Organization) "Ball", "Sinf" ustunlari va sinf filtri.

Ball standart preset, oxirgi yil bo'yicha, bitta subquery bilan (N+1 yo'q). Admin — qo'mita xodimlari, shuning uchun
OS-18 cheklovi bu yerga tegishli emas.
"""
from django.contrib import admin
from django.db.models import OuterRef, Subquery


def _subquery(stir_field, field):
    from ..models import EnterpriseScore
    from . import api, config

    cfg = config.get()
    return Subquery(EnterpriseScore.objects.filter(stir=OuterRef(stir_field), preset=cfg["default_preset"],
                                                   model_version=cfg["version"], year=api.latest_year(cfg))
                    .values(field)[:1])


class KlassFilter(admin.SimpleListFilter):
    title = "Korxona bali sinfi"
    parameter_name = "company_klass"

    def lookups(self, request, model_admin):
        return [("A", "A · Yuqori"), ("B", "B · Yaxshi"), ("C", "C · O'rta"), ("D", "D · Past"), ("E", "E · Xavf zonasi"),
                ("none", "— · Ma'lumot yetarli emas")]

    def queryset(self, request, queryset):
        value = self.value()
        if not value:
            return queryset
        if value == "none":
            return queryset.exclude(company_klass__in=list("ABCDE"))
        return queryset.filter(company_klass=value)


class CompanyScoreAdminMixin:
    """`score_stir_field` — STIR saqlangan maydon nomi (Ktut.inn, Organization.tin)."""

    score_stir_field = "inn"

    def get_queryset(self, request):
        qs = super().get_queryset(request)
        return qs.annotate(company_score=_subquery(self.score_stir_field, "overall"),
                           company_klass=_subquery(self.score_stir_field, "klass"))

    @admin.display(description="Ball", ordering="company_score")
    def company_score_display(self, obj):
        return "—" if obj.company_score is None else f"{obj.company_score:.0f}"

    @admin.display(description="Sinf", ordering="company_klass")
    def company_klass_display(self, obj):
        return obj.company_klass or "—"
