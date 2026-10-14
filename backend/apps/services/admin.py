from django.contrib import admin
from .models import (
    PackageServiceItem, ServiceCategory, Service, ServiceItem,
    ServicePackage, PackageService, ServicePackagePrice,
    ActivityPlans, ServiceRequests, ServiceRating, UserServicePackage, UserServicePackageItemUse, ServiceRequestResponse
)

class ServiceItemInline(admin.TabularInline):
    model = ServiceItem
    extra = 1


class RootSectorFilter(admin.SimpleListFilter):
    """Filter to show only root sectors (without parent)"""
    title = 'Sector'
    parameter_name = 'sector'

    def lookups(self, request, model_admin):
        from apps.common.models import Sector
        root_sectors = Sector.objects.filter(parent__isnull=True).order_by('code')
        return [(sector.id, f"{sector.code} - {sector.name}") for sector in root_sectors]

    def queryset(self, request, queryset):
        if self.value():
            return queryset.filter(sector_id=self.value())
        return queryset

class PackageServiceInline(admin.TabularInline):
    model = PackageService
    extra = 1

class PackageServiceItemInline(admin.TabularInline):
    model = PackageServiceItem
    extra = 1

@admin.register(ServiceCategory)
class ServiceCategoryAdmin(admin.ModelAdmin):
    list_display = ('id','name', 'is_active')
    search_fields = ('name',)
    list_filter = ('is_active',)
    ordering = ('name',)

@admin.register(Service)
class ServiceAdmin(admin.ModelAdmin):
    list_display = ('name_uz', 'is_free', 'duration', 'is_active', 'is_popular')
    search_fields = ('name_uz', 'description_uz')
    list_filter = ('is_active', 'is_popular', 'duration')
    inlines = [ServiceItemInline]
    ordering = ('name_uz',)

@admin.register(ServiceRating)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ("service", "user", "value", "created_at")
    list_filter = ("value",)
    search_fields = ("service__name_uz", "user__username",)

@admin.register(ServicePackage)
class ServicePackageAdmin(admin.ModelAdmin):
    list_display = ('name_uz', 'price', 'duration_days', 'is_active')
    search_fields = ('name_uz', 'description_uz')
    list_filter = ('is_active',)
    inlines = [PackageServiceItemInline]
    ordering = ('name_uz',)


@admin.register(ServicePackagePrice)
class ServicePackagePriceAdmin(admin.ModelAdmin):
    list_display = ('service_package', 'bhm_count', 'sector', 'created_at')
    search_fields = ('service_package__name_uz', 'sector__code', 'sector__name')
    list_filter = ('service_package', RootSectorFilter, 'created_at')
    ordering = ('-created_at',)
    
    def get_queryset(self, request):
        """Filter sector field to show only root sectors (without parent)"""
        qs = super().get_queryset(request)
        return qs.select_related('service_package', 'sector')
    
    def formfield_for_foreignkey(self, db_field, request, **kwargs):
        """Show only root sectors in the sector dropdown"""
        if db_field.name == 'sector':
            from apps.common.models import Sector
            kwargs["queryset"] = Sector.objects.filter(parent__isnull=True).order_by('code')
        return super().formfield_for_foreignkey(db_field, request, **kwargs)

@admin.register(PackageService)
class PackageServiceAdmin(admin.ModelAdmin):
    pass

@admin.register(PackageServiceItem)
class PackageServiceItemAdmin(admin.ModelAdmin):
    pass


@admin.register(ActivityPlans)
class ActivityPlansAdmin(admin.ModelAdmin):
    list_display = ('region', 'district', 'year', 'month', 'service', 'plan_count', 'created_by_user')
    search_fields = ('region__name', 'district__name', 'service__name')
    list_filter = ('year', 'month', 'service')


@admin.register(ServiceRequests)
class ServiceRequestsAdmin(admin.ModelAdmin):
    list_display = ('contract', 'service', 'status', 'requested_date', 'deadline_date', 'completed_date', 'assigned_to_user')
    search_fields = ('contract__contract_number', 'service__name', 'assigned_to_user__username')
    list_filter = ('status', 'service', 'assigned_to_user')

@admin.register(UserServicePackage)
class UserServicePackageAdmin(admin.ModelAdmin):
    list_display = ('service', 'created_by_user_id', 'starts_at', 'expires_at', 'status_label')
    list_filter = ('service',)

    @admin.display(description="Holat")
    def status_label(self, obj):
        if obj.expires_at is None:
            return "Muddatsiz"
        return "Tugagan" if obj.is_expired else "Faol"


@admin.register(UserServicePackageItemUse)
class UserServicePackageItemUseAdmin(admin.ModelAdmin):
    list_display = ('usp', 'psi')


@admin.register(ServiceRequestResponse)
class ServiceRequestResponseAdmin(admin.ModelAdmin):
    list_display = ('contract', 'package_item', 'client_input_text', 'created_at')