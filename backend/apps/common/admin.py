from calendar import month_name
from decimal import Decimal
from datetime import datetime

from django.contrib import admin
from django.contrib.admin.sites import AlreadyRegistered
from django.http import HttpResponseRedirect
from django.db.models import CharField, F, Sum, Window, Q, Value, Count
from django.db.models.functions import Concat, RowNumber, Coalesce
from django.utils.html import format_html

from import_export.admin import ImportExportModelAdmin

from .models import Branch, ConsultingPlan, Region, District, SiteSettings, QuestionAnswer, Contact, Sector, \
    InformationModel, Byulleten, AboutPortal, AdminTOTPDevice
from .resources import SectorResource
from apps.additional_services.models import Year
from apps.contracts.models import Contract
from apps.payment.models import TransactionStatus

from django.db.models.functions import ExtractYear


def format_price(value):
    if value is None:
        return '0'

    amount = Decimal(value)
    if amount == amount.to_integral():
        return f"{int(amount):,}".replace(',', ' ')

    return f"{amount:,.2f}".replace(',', ' ')


class RegionSummaryFilter(admin.SimpleListFilter):
    title = "Viloyatlar kesimida"
    parameter_name = "region_summary"

    def lookups(self, request, model_admin):
        lookups = [('summary', 'Viloyatlar kesimida')]
        region_totals = (
            ConsultingPlan.objects
            .values("district__region__id", "district__region__name")
            .annotate(total_price=Sum("price"))
            .order_by("district__region__name")
        )
        for row in region_totals:
            region_id = row["district__region__id"]
            if not region_id:
                continue
            total_display = format_price(row["total_price"])
            lookups.append((str(region_id), f'{row["district__region__name"]} ({total_display})'))
        return lookups

    def queryset(self, request, queryset):
        region_id = self.value()
        if region_id and region_id != 'summary':
            return queryset.filter(district__region_id=region_id)
        return queryset
    

@admin.register(Region)
class RegionAdmin(admin.ModelAdmin):
    list_display = ('name', 'code')
    search_fields = ('name', 'code')
 

@admin.register(District)
class DistrictAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'code')
    search_fields = ('name', 'code', 'region__name', 'region__code')
    list_filter = ('region',)

    def get_search_results(self, request, queryset, search_term):
        queryset, use_distinct = super().get_search_results(request, queryset, search_term)
        search_term = search_term.strip()
        if search_term:
            full_code_qs = self.get_queryset(request).annotate(
                full_code=Concat('region__code', 'code', output_field=CharField())
            ).filter(full_code__icontains=search_term)
            queryset = queryset | full_code_qs
            use_distinct = True
        return queryset, use_distinct

@admin.register(SiteSettings)
class SiteSettingsAdmin(admin.ModelAdmin):
    list_display = ('site_name', 'contact_email', 'didox_url')
    search_fields = ('site_name', 'contact_email')
    
    def has_add_permission(self, request):
        return not SiteSettings.objects.exists()
    
    def has_delete_permission(self, request, obj=None):
        return False
    
    def changelist_view(self, request, extra_context=None):
        # Agar object mavjud bo'lmasa, yaratish
        if not SiteSettings.objects.exists():
            SiteSettings.objects.create()
        
        # Avtomatik ravishda edit sahifasiga yo'naltirish
        obj = SiteSettings.objects.first()
        return HttpResponseRedirect(f'/admin/common/sitesettings/{obj.pk}/change/')


@admin.register(QuestionAnswer)
class QuestionAnswerAdmin(admin.ModelAdmin):
    list_display = ('id', 'question_uz')
    search_fields = ('question_uz', 'question_ru', 'question_cry', 'answer_uz', 'answer_ru', 'answer_cry')

    
@admin.register(Branch)
class BranchAdmin(admin.ModelAdmin):
    list_display = ('name', 'region', 'inn', 'address')
    search_fields = ('name', 'inn', 'address')
    list_filter = ('region',)


@admin.register(Contact)
class ContactAdmin(admin.ModelAdmin):
    list_display = ('name', 'surname', 'email')
    search_fields = ('name', 'surname', 'email', 'phone_number')
    list_filter = ('email', 'phone_number')


@admin.register(Sector)
class SectorAdmin(ImportExportModelAdmin):
    resource_class = SectorResource
    list_display = ('code', 'name', 'name_cry', 'parent', 'order')
    search_fields = ('code', 'name', 'name_ru', 'name_uz', 'name_cry')
    list_filter = ('stat_classifier',)
    ordering = ('code',)




@admin.register(ConsultingPlan)
class ConsultingPlanAdmin(admin.ModelAdmin):
    list_display = (
        'id',
        'get_district_name',
        'get_price_display',
        'get_contract_total_display',
        'get_contract_paid_display',
        'get_contract_count',
        'get_contract_completion_percentage',
        'get_payment_completion_percentage',
        'get_current_month_target',
        'get_region_name',
        'year',
    )
    search_fields = (
        'district__name',
        'district__region__name',
        'district__code',
        'district__region__code',
        'year__year',
    )
    list_filter = ("year", RegionSummaryFilter)
    autocomplete_fields = ('district', 'year')
    list_select_related = ('district__region', 'year')

    def get_list_display(self, request):
        if request.GET.get('region_summary') == 'summary':
            return (
                'get_region_name',
                'get_region_total',
                'get_region_contract_total_display',
                'get_region_contract_paid_display',
                'get_region_contract_count',
                'get_region_completion_percentage',
                'get_region_payment_percentage',
                'year',
            )
        return self.list_display

    def get_queryset(self, request):
        self._contract_totals = {}
        self._contract_paid = {}
        self._contract_counts = {}
        self._region_contract_totals = {}
        self._region_contract_paid = {}
        self._region_contract_counts = {}

        queryset = super().get_queryset(request).select_related('district__region', 'year')

        plan_pairs = list(
            queryset.filter(
                district__isnull=False,
                year__year__isnull=False,
            ).values('district_id', 'year__year').distinct()
        )

        if plan_pairs:
            district_ids = {item['district_id'] for item in plan_pairs if item['district_id']}
            year_values = {item['year__year'] for item in plan_pairs if item['year__year']}

            if district_ids and year_values:
                district_region_map = dict(
                    District.objects.filter(id__in=district_ids).values_list('id', 'region_id')
                )

                # 1. FAQAT total_amount (transactions bilan bog'liq emas)
                contract_totals = (
                    Contract.objects.filter(
                        start_date__year__in=year_values,
                        status__in=['pending', 'completed'],
                    )
                    .annotate(
                        target_district_id=Coalesce(
                            'user__organization__district_id', 
                            'user__location_id'
                        )
                    )
                    .filter(target_district_id__in=district_ids)
                    .values('target_district_id', 'start_date__year')
                    .annotate(total_amount=Sum('total_amount'))
                )
                
                # 2. FAQAT paid_amount (transactions bilan)
                contract_paid = (
                    Contract.objects.filter(
                        start_date__year__in=year_values,
                        status__in=['pending', 'completed'],
                        transactions__status=TransactionStatus.PAID,
                    )
                    .annotate(
                        target_district_id=Coalesce(
                            'user__organization__district_id',
                            'user__location_id'
                        )
                    )
                    .filter(target_district_id__in=district_ids)
                    .values('target_district_id', 'start_date__year')
                    .annotate(paid_amount=Sum('transactions__amount'))
                )
                
                # 3. Contract counts
                contract_counts = (
                    Contract.objects.filter(
                        start_date__year__in=year_values,
                        status__in=['pending', 'completed'],
                    )
                    .annotate(
                        target_district_id=Coalesce(
                            'user__organization__district_id',
                            'user__location_id'
                        )
                    )
                    .filter(target_district_id__in=district_ids)
                    .values('target_district_id', 'start_date__year')
                    .annotate(contract_count=Count('id'))
                )
                
                # Total amount'larni dictionary'ga saqlash va region uchun aggregatsiya
                for row in contract_totals:
                    district_id = row['target_district_id']
                    year_value = row['start_date__year']
                    if district_id is None or year_value is None:
                        continue
                    
                    total_val = row['total_amount'] or Decimal('0')
                    
                    # District level
                    key = (district_id, year_value)
                    self._contract_totals[key] = total_val
                    
                    # Region level
                    region_id = district_region_map.get(district_id)
                    if region_id:
                        region_key = (region_id, year_value)
                        self._region_contract_totals[region_key] = (
                            self._region_contract_totals.get(region_key, Decimal('0')) + total_val
                        )
                
                # Paid amount'larni dictionary'ga saqlash va region uchun aggregatsiya
                for row in contract_paid:
                    district_id = row['target_district_id']
                    year_value = row['start_date__year']
                    if district_id is None or year_value is None:
                        continue
                    
                    paid_val = row['paid_amount'] or Decimal('0')
                    
                    # District level
                    key = (district_id, year_value)
                    self._contract_paid[key] = paid_val
                    
                    # Region level
                    region_id = district_region_map.get(district_id)
                    if region_id:
                        region_key = (region_id, year_value)
                        self._region_contract_paid[region_key] = (
                            self._region_contract_paid.get(region_key, Decimal('0')) + paid_val
                        )
                
                # Contract counts'larni dictionary'ga saqlash va region uchun aggregatsiya
                for row in contract_counts:
                    district_id = row['target_district_id']
                    year_value = row['start_date__year']
                    if district_id is None or year_value is None:
                        continue
                    
                    count_val = row['contract_count'] or 0
                    
                    # District level
                    key = (district_id, year_value)
                    self._contract_counts[key] = count_val
                    
                    # Region level
                    region_id = district_region_map.get(district_id)
                    if region_id:
                        region_key = (region_id, year_value)
                        self._region_contract_counts[region_key] = (
                            self._region_contract_counts.get(region_key, 0) + count_val
                        )

        # Region summary view uchun
        if request.GET.get('region_summary') == 'summary':
            queryset = queryset.annotate(
                region_total=Window(
                    expression=Sum('price'),
                    partition_by=[F('district__region_id'), F('year_id')],
                ),
                region_row=Window(
                    expression=RowNumber(),
                    partition_by=[F('district__region_id'), F('year_id')],
                    order_by=[F('district__region__name').asc(), F('pk').asc()]
                )
            ).filter(region_row=1).order_by('district__region__name', 'year__year')
        
        return queryset

    def get_price_display(self, obj):
        return format_price(obj.price)

    get_price_display.short_description = "Summa"
    get_price_display.admin_order_field = 'price'

    def _plan_cache_key(self, obj):
        if not obj.district or not obj.year:
            return None
        if obj.year.year is None:
            return None
        return (obj.district_id, obj.year.year)

    def _region_cache_key(self, obj):
        if not obj.district or not obj.year or not obj.district.region:
            return None
        if obj.year.year is None:
            return None
        return (obj.district.region_id, obj.year.year)

    def get_contract_total_display(self, obj):
        key = self._plan_cache_key(obj)
        total = Decimal('0')
        if key:
            total = self._contract_totals.get(key, Decimal('0'))
        return format_price(total)

    get_contract_total_display.short_description = "Shartnoma (jami)"

    def get_contract_paid_display(self, obj):
        key = self._plan_cache_key(obj)
        total = Decimal('0')
        if key:
            total = self._contract_paid.get(key, Decimal('0'))
        return format_price(total)

    get_contract_paid_display.short_description = "Shartnoma (to'langan)"

    def get_district_name(self, obj):
        return obj.district.name if obj.district else '-'

    get_district_name.short_description = "Hududi"
    get_district_name.admin_order_field = 'district__name'

    def get_region_name(self, obj):
        if obj.district and obj.district.region:
            return obj.district.region.name
        return '-'

    get_region_name.short_description = "Viloyat"
    get_region_name.admin_order_field = 'district__region__name'

    def get_region_total(self, obj):
        total = getattr(obj, 'region_total', None)
        return format_price(total)

    get_region_total.short_description = "Summa"
    get_region_total.admin_order_field = 'region_total'

    def get_region_contract_total_display(self, obj):
        key = self._region_cache_key(obj)
        total = Decimal('0')
        if key:
            total = self._region_contract_totals.get(key, Decimal('0'))
        return format_price(total)

    get_region_contract_total_display.short_description = "Viloyat shartnoma (jami)"

    def get_region_contract_paid_display(self, obj):
        key = self._region_cache_key(obj)
        total = Decimal('0')
        if key:
            total = self._region_contract_paid.get(key, Decimal('0'))
        return format_price(total)

    get_region_contract_paid_display.short_description = "Viloyat shartnoma (to'langan)"

    def get_region_contract_count(self, obj):
        key = self._region_cache_key(obj)
        count = 0
        if key:
            count = self._region_contract_counts.get(key, 0)
        return count

    get_region_contract_count.short_description = "Viloyat shartnomalar soni"

    def get_region_completion_percentage(self, obj):
        key = self._region_cache_key(obj)
        if not key:
            return "0%"
        
        region_total = getattr(obj, 'region_total', None) or Decimal('0')
        contract_total = self._region_contract_totals.get(key, Decimal('0'))
        
        if region_total == 0:
            return "0%"
        
        percentage = (contract_total / region_total * 100).quantize(Decimal('0.01'))
        
        # Progress bar uchun ranglar
        if percentage >= 100:
            color = "#28a745"  # Green
        elif percentage >= 75:
            color = "#17a2b8"  # Blue
        elif percentage >= 50:
            color = "#ffc107"  # Yellow
        else:
            color = "#dc3545"  # Red
            
        return format_html(
            '<div class="progress-bar"><div class="progress-bar-fill" style="width:{}%;background:{};">{}</div></div>',
            min(percentage, 100),
            color,
            f"{percentage:.1f}%"
        )

    get_region_completion_percentage.short_description = "Viloyat shartnoma foizi"

    def get_region_payment_percentage(self, obj):
        key = self._region_cache_key(obj)
        if not key:
            return "0%"
        
        region_total = getattr(obj, 'region_total', None) or Decimal('0')
        paid_total = self._region_contract_paid.get(key, Decimal('0'))
        
        if region_total == 0:
            return "0%"
        
        percentage = (paid_total / region_total * 100).quantize(Decimal('0.01'))
        
        # Progress bar uchun ranglar
        if percentage >= 100:
            color = "#28a745"  # Green
        elif percentage >= 75:
            color = "#17a2b8"  # Blue
        elif percentage >= 50:
            color = "#ffc107"  # Yellow
        else:
            color = "#dc3545"  # Red
            
        return format_html(
            '<div class="progress-bar"><div class="progress-bar-fill" style="width:{}%;background:{};">{}</div></div>',
            min(percentage, 100),
            color,
            f"{percentage:.1f}%"
        )

    get_region_payment_percentage.short_description = "Viloyat to'lov foizi"

    def get_contract_count(self, obj):
        key = self._plan_cache_key(obj)
        count = 0
        if key:
            count = self._contract_counts.get(key, 0)
        return count

    get_contract_count.short_description = "Shartnomalar soni"

    def get_contract_completion_percentage(self, obj):
        key = self._plan_cache_key(obj)
        if not key:
            return "0%"
        
        plan_amount = obj.price or Decimal('0')
        contract_total = self._contract_totals.get(key, Decimal('0'))
        
        if plan_amount == 0:
            return "0%"
        
        percentage = (contract_total / plan_amount * 100).quantize(Decimal('0.01'))
        
        # Progress bar uchun ranglar
        if percentage >= 100:
            color = "#28a745"  # Green
        elif percentage >= 75:
            color = "#17a2b8"  # Blue
        elif percentage >= 50:
            color = "#ffc107"  # Yellow
        else:
            color = "#dc3545"  # Red
            
        return format_html(
            '<div class="progress-bar"><div class="progress-bar-fill" style="width:{}%;background:{};">{}</div></div>',
            min(percentage, 100),
            color,
            f"{percentage:.1f}%"
        )

    get_contract_completion_percentage.short_description = "Shartnoma foizi"

    def get_payment_completion_percentage(self, obj):
        key = self._plan_cache_key(obj)
        if not key:
            return "0%"
        
        plan_amount = obj.price or Decimal('0')
        paid_total = self._contract_paid.get(key, Decimal('0'))
        
        if plan_amount == 0:
            return "0%"
        
        percentage = (paid_total / plan_amount * 100).quantize(Decimal('0.01'))
        
        # Progress bar uchun ranglar
        if percentage >= 100:
            color = "#28a745"  # Green
        elif percentage >= 75:
            color = "#17a2b8"  # Blue
        elif percentage >= 50:
            color = "#ffc107"  # Yellow
        else:
            color = "#dc3545"  # Red
            
        return format_html(
            '<div class="progress-bar"><div class="progress-bar-fill" style="width:{}%;background:{};">{}</div></div>',
            min(percentage, 100),
            color,
            f"{percentage:.1f}%"
        )

    get_payment_completion_percentage.short_description = "To'lov foizi"

    UZBEK_MONTHS = {
        1: 'Yanvar',
        2: 'Fevral',
        3: 'Mart',
        4: 'Aprel',
        5: 'May',
        6: 'Iyun',
        7: 'Iyul',
        8: 'Avgust',
        9: 'Sentyabr',
        10: 'Oktyabr',
        11: 'Noyabr',
        12: 'Dekabr'
    }

    def get_current_month_target(self, obj):
        current_month = datetime.now().month
        
        key = self._plan_cache_key(obj)
        total = Decimal('0')
        if key:
            total = self._contract_totals.get(key, Decimal('0'))
        
        monthly_target = (total * Decimal(current_month) / Decimal('12')).quantize(Decimal('0.01'))
        month_name = self.UZBEK_MONTHS.get(current_month, '')
        return f"{format_price(monthly_target)}"
    
    # Dynamically set the short_description based on current month
    current_month = datetime.now().month
    get_current_month_target.short_description = f"{UZBEK_MONTHS[current_month]} uchun"



@admin.register(InformationModel)
class InformationAdmin(admin.ModelAdmin):
    list_display = ('id', 'district', 'region')


@admin.register(Byulleten)
class ByulletenAdmin(admin.ModelAdmin):
    list_display = ('id', 'name_uz')


@admin.register(AboutPortal)
class AboutPortalAdmin(admin.ModelAdmin):
    list_display = ('id', 'video_rolik', 'pdf_file', 'consulting_file')


@admin.register(AdminTOTPDevice)
class AdminTOTPDeviceAdmin(admin.ModelAdmin):
    """Admin 2FA qurilmalar. Yozuvni o'chirib qo'yish — foydalanuvchini qayta sozlashga majburlaydi."""
    list_display = ('user', 'is_active', 'is_verified', 'created_at', 'updated_at')
    list_filter = ('is_active', 'is_verified')
    search_fields = ('user__username', 'user__email')
    readonly_fields = ('secret', 'created_at', 'updated_at')
    actions = ['reset_devices']

    def reset_devices(self, request, queryset):
        """Tanlangan foydalanuvchilarni 2FA'ni qayta sozlashga majburlash."""
        count = queryset.count()
        queryset.delete()
        self.message_user(request, f"{count} ta qurilma o'chirildi. Foydalanuvchilar qayta sozlashga majbur.")
    reset_devices.short_description = "Tanlangan qurilmalarni o'chirish (qayta sozlash uchun)"