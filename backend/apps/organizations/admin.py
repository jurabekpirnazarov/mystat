from apps.analytics.company_scoring.admin_mixins import CompanyScoreAdminMixin, KlassFilter
from django.contrib import admin
from .models import Organization
from apps.common.models import Sector

class OrganizationAdmin(CompanyScoreAdminMixin, admin.ModelAdmin):
    # KORXONA_SCORING.md KR-35: "Ball", "Sinf" ustunlari va sinf filtri
    score_stir_field = "tin"
    list_display = ("name", "tin", "organization_type", "district", "company_score_display", "company_klass_display")
    list_filter = (KlassFilter,)
    search_fields = ("name", "tin")

    def get_queryset(self, request):
        """Filter sector field to show only root sectors (without parent)"""
        qs = super().get_queryset(request)
        return qs.select_related('sector')

    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Show only root sectors in the sector dropdown"""
        if db_field.name == 'sector':
            kwargs["queryset"] = Sector.objects.filter(parent__isnull=True).order_by('code')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

admin.site.register(Organization, OrganizationAdmin)
