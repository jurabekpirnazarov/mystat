from django.contrib import admin
from django.core.management import call_command
from django.contrib import messages
from django.db.models import Count, Sum, Q
from django.http import HttpResponseRedirect, JsonResponse
from django.urls import path
from django.shortcuts import render, redirect
from django.utils.html import format_html
from django.contrib.contenttypes.admin import GenericTabularInline
from decimal import Decimal
import threading
import json
from decimal import Decimal, InvalidOperation
from apps.common.models import SiteSettings, Region, District
from .models import Contract, ContractStats
from .utils import (
    search_organization_by_inn, 
    get_user_from_organization, 
    create_contract_number,
    send_contract_to_didox,
    create_consulting_contract
)
from openpyxl.styles import Alignment, Border, Side, Font, PatternFill
from django.http import HttpResponse, HttpResponseForbidden
from django.db.models.functions import ExtractMonth, ExtractYear
from datetime import datetime
import openpyxl
from openpyxl.utils import get_column_letter
from apps.payment.models import Transaction, TransactionStatus
from apps.services.models import ServicePackage


class TransactionInline(GenericTabularInline):
    model = Transaction
    # extra = 0
    # readonly_fields = ('amount', 'status', 'created_at')
    # can_delete = False
    # max_num = 0
    ct_field = 'content_type'
    ct_fk_field = 'object_id'
    
    # def has_add_permission(self, request, obj=None):
    #     return False



@admin.register(Contract)
class ContractAdmin(admin.ModelAdmin):
    inlines = [TransactionInline]
    list_display = (
        "id",
        "contract_number",
        "user",
        "boshqarma",
        "package",
        "total_amount",
        "status",
        "start_date",
        "signed_by_client",
        "signed_by_admin",
        "didox_link",

    )
    list_filter = ("status", "signed_by_client", "signed_by_admin", "start_date")
    search_fields = ("contract_number", "user__username", "user__email")
    readonly_fields = ("contract_number", "start_date", "end_date", "file")
    actions = ['check_didox_documents_action']

    def branch(self, obj):
        return obj.user.organization.branch if obj.user.organization else None
    
    def boshqarma(self, obj):
        return obj.user.organization.district if obj.user.organization and obj.user.organization.district else None
    
    boshqarma.short_description = 'Boshqarma'
    boshqarma.admin_order_field = 'user__organization__district'

    
    def didox_link(self, obj):
        """DIDOX shartnomasi linkini ko'rsatish"""
        settings = SiteSettings.load()
        if obj.didox_contract_data:
            try:
                data = obj.didox_contract_data if isinstance(obj.didox_contract_data, dict) else json.loads(obj.didox_contract_data)
                url = f"{settings.didox_client_url}/documents/{data.get('_id', '')}"
                if url:
                    return format_html('<a href="{}" target="_blank">📄 o\'tish</a>', url)
            except:
                pass
        return format_html('<span style="color: #ccc;">—</span>')
    
    didox_link.short_description = 'DIDOX'
    didox_link.admin_order_field = 'didx_contract_id'
    
    def get_queryset(self, request):
        """
        Buxgalter faqat o'zining branchiga tegishli shartnomalarni ko'radi
        """
        qs = super().get_queryset(request)
        # Optimize queries by using select_related for foreign key relationships
        qs = qs.select_related(
            'user',
            'user__organization',
            'user__organization__district',
            'user__organization__district__region',
            'package'
        )
        
        if request.user.is_superuser:
            return qs
        if hasattr(request.user, 'role') and request.user.role == "bugalter":
            accountant_profile = request.user.accountant_profile

            if accountant_profile:
                branch_ids = accountant_profile.branches.values_list('id', flat=True)
                return qs.filter(user__organization__branch__in=branch_ids).distinct()
        elif hasattr(request.user, 'role') and request.user.role == "employee":  
            return qs.filter(created_by=request.user).distinct()
        return qs.none()
    
    def has_add_permission(self, request):
        """
        Faqat superuser qo'sha oladi
        """
        return request.user.is_superuser 
    
    def has_change_permission(self, request, obj=None):
        """
        Superuser barcha shartnomalarni o'zgartira oladi
        Buxgalter faqat main_branch dagi shartnomalarning statusini o'zgartira oladi
        """
        if request.user.is_superuser:
            return True
        
        if hasattr(request.user, 'role') and request.user.role == "bugalter":
            if obj is None:
                return True

            accountant_profile = request.user.accountant_profile
            if accountant_profile:
                if obj.user.organization.branch == accountant_profile.main_branch:
                    return True
        
        return False
    
    def has_delete_permission(self, request, obj=None):
        """
        Faqat superuser o'chira oladi
        """
        return request.user.is_superuser
    
    def get_readonly_fields(self, request, obj=None):
        """
        Buxgalter uchun faqat status maydonini tahrirlash mumkin
        """
        readonly = list(self.readonly_fields)
        
        if not request.user.is_superuser:
            if hasattr(request.user, 'role') and request.user.role == "bugalter":
                readonly.extend([
                    'user',
                    'package',
                    'signed_by_client',
                    'signed_by_admin',
                    'client_signature_date',
                    'admin_signature_date',
                    'didox_contract_data',
                    'notes',
                    'created_by'
                ])
                return readonly
            else:
                return [f.name for f in self.model._meta.fields]
        
        return readonly
    
    def has_module_permission(self, request):
        """
        Buxgalter va superuser uchun modulni ko'rsatish
        """
        if request.user.is_superuser:
            return True

        elif hasattr(request.user, 'role') and request.user.role == "bugalter":
            return True

        elif hasattr(request.user, 'role') and request.user.role == "employee":
            return True

        return False

    def check_didox_documents_action(self, request, queryset):
        """DIDOX hujjatlarini tekshirish va bildirishnoma yuborish"""
        try:
            def run_command():
                try:
                    call_command('check_didox_documents')
                except Exception as e:
                    import logging
                    logger = logging.getLogger(__name__)
                    logger.error(f'Error running check_didox_documents command: {str(e)}')

            thread = threading.Thread(target=run_command)
            thread.daemon = True
            thread.start()
            
            self.message_user(
                request,
                "DIDOX hujjatlari tekshiruvi boshlandi. Jarayon background da davom etmoqda.",
                messages.SUCCESS
            )
        except Exception as e:
            self.message_user(
                request,
                f"Xatolik yuz berdi: {str(e)}",
                messages.ERROR
            )

    check_didox_documents_action.short_description = "📄 DIDOX hujjatlarini tekshirish va ogohlantirish yuborish"

    def get_urls(self):
        urls = super().get_urls()
        custom_urls = [
            path('didox-check/', self.admin_site.admin_view(self.didox_check_view), name='contracts_didox_check'),
            path('create-consulting-contract/', self.admin_site.admin_view(self.create_consulting_contract_view), name='contracts_create_consulting_contract'),
        ]
        return custom_urls + urls

    def didox_check_view(self, request):
        """DIDOX tekshiruvi uchun alohida view"""
        if request.method == 'POST':
            force_check = request.POST.get('force_check', False)
            
            try:
                def run_command():
                    try:
                        if force_check:
                            call_command('check_didox_documents', '--force')
                        else:
                            call_command('check_didox_documents')
                    except Exception as e:
                        import logging
                        logger = logging.getLogger(__name__)
                        logger.error(f'Error running check_didox_documents command: {str(e)}')

                thread = threading.Thread(target=run_command)
                thread.daemon = True
                thread.start()
                
                messages.success(request, "DIDOX hujjatlari tekshiruvi boshlandi!")
                return HttpResponseRedirect('../')
            except Exception as e:
                messages.error(request, f"Xatolik: {str(e)}")
        
        context = {
            'title': 'DIDOX Hujjatlari Tekshiruvi',
            'opts': self.model._meta,
            'has_change_permission': self.has_change_permission(request),
        }
        return render(request, 'admin/contracts/didox_check.html', context)

    def create_contract_view(self, request):
        """Yangi shartnoma yaratish view"""
        if request.method == 'POST':
            # AJAX request for organization search
            if request.POST.get('action') == 'search_organization':
                inn = request.POST.get('inn', '').strip()
                if not inn:
                    return JsonResponse({'success': False, 'error': 'INN kiritilmagan'})
                
                organization = search_organization_by_inn(inn)
                if organization:
                    user = get_user_from_organization(organization)
                    return JsonResponse({
                        'success': True,
                        'organization': {
                            'id': organization.id,
                            'name': organization.name,
                            'tin': organization.tin,
                            'address': getattr(organization, 'address', ''),
                            'owner_name': user.full_name if user else user.username if user else ''
                        }
                    })
                else:
                    return JsonResponse({
                        'success': False, 
                        'error': f'INN {inn} bo\'yicha tashkilot topilmadi'
                    })
            
            # Contract creation
            inn = request.POST.get('inn', '').strip()
            package_id = request.POST.get('package')
            total_amount = request.POST.get('total_amount')
            notes = request.POST.get('notes', '')
            send_to_didox = request.POST.get('send_to_didox') == 'on'
            
            try:
                # Validate inputs
                if not inn:
                    messages.error(request, 'INN kiritilishi shart!')
                    return self._render_create_form(request)
                
                if not package_id:
                    messages.error(request, 'Xizmat paketi tanlanishi shart!')
                    return self._render_create_form(request)
                
                # Find organization and user
                organization = search_organization_by_inn(inn)
                if not organization:
                    messages.error(request, f'INN {inn} bo\'yicha tashkilot topilmadi!')
                    return self._render_create_form(request)
                
                user = get_user_from_organization(organization)
                if not user:
                    messages.error(request, 'Tashkilot egasi topilmadi!')
                    return self._render_create_form(request)
                
                # Get package
                try:
                    package = ServicePackage.objects.get(id=package_id)
                except ServicePackage.DoesNotExist:
                    messages.error(request, 'Tanlangan xizmat paketi topilmadi!')
                    return self._render_create_form(request)
                
                # Validate amount
                try:
                    total_amount = Decimal(total_amount)
                    if total_amount <= 0:
                        raise ValueError("Amount must be positive")
                except (ValueError, TypeError):
                    messages.error(request, 'Noto\'g\'ri summa kiritildi!')
                    return self._render_create_form(request)
                
                # Create contract
                contract = Contract.objects.create(
                    contract_number=create_contract_number(),
                    user=user,
                    package=package,
                    total_amount=total_amount,
                    notes=notes,
                    created_by=request.user,
                    status='created'
                )
                
                # Send to DIDOX if requested
                didox_success = True
                if send_to_didox:
                    try:
                        didox_response = send_contract_to_didox(contract, inn)
                        if not didox_response.success:
                            didox_success = False
                            messages.warning(
                                request, 
                                f'Shartnoma yaratildi, lekin DIDOX ga yuborishda xatolik: {didox_response.error}'
                            )
                    except Exception as e:
                        didox_success = False
                        messages.warning(
                            request, 
                            f'Shartnoma yaratildi, lekin DIDOX ga yuborishda xatolik: {str(e)}'
                        )
                
                if didox_success or not send_to_didox:
                    success_msg = f'Shartnoma #{contract.contract_number} muvaffaqiyatli yaratildi!'
                    if send_to_didox and didox_success:
                        success_msg += ' DIDOX ga yuborildi.'
                    messages.success(request, success_msg)
                
                return redirect('admin:contracts_contract_change', contract.id)
                
            except Exception as e:
                messages.error(request, f'Xatolik yuz berdi: {str(e)}')
                return self._render_create_form(request)
        
        return self._render_create_form(request)
    
    def _render_create_form(self, request):
        """Render create contract form"""
        packages = ServicePackage.objects.filter(is_active=True)
        context = {
            'title': 'Yangi Shartnoma Yaratish',
            'packages': packages,
            'opts': self.model._meta,
            'has_change_permission': self.has_change_permission(request),
        }
        return render(request, 'admin/contracts/create_contract.html', context)

    def create_consulting_contract_view(self, request):
        """Employee uchun konsalting shartnomasi yaratish"""
        if request.method == 'POST':
            # AJAX request for organization search
            if request.POST.get('action') == 'search_organization':
                inn = request.POST.get('inn', '').strip()
                if not inn:
                    return JsonResponse({'success': False, 'error': 'INN kiritilmagan'})
                
                organization = search_organization_by_inn(inn)
                if organization:
                    user = get_user_from_organization(organization)
                    return JsonResponse({
                        'success': True,
                        'organization': {
                            'id': organization.id,
                            'name': organization.name,
                            'tin': organization.tin,
                            'address': getattr(organization, 'address', ''),
                            'owner_name': user.full_name if user else user.username if user else ''
                        }
                    })
                else:
                    return JsonResponse({
                        'success': False, 
                        'error': f'INN {inn} bo\'yicha tashkilot topilmadi'
                    })
            
            # Consulting contract creation
            inn = request.POST.get('inn', '').strip()
            total_amount = request.POST.get('total_amount')
            service_description = request.POST.get('service_description', '')
            notes = request.POST.get('notes', '')
            send_to_didox = request.POST.get('send_to_didox') == 'on'
            
            try:
                # Validate inputs
                if not inn:
                    messages.error(request, 'INN kiritilishi shart!')
                    return self._render_consulting_form(request)
                
                if not service_description:
                    messages.error(request, 'Xizmat tavsifi kiritilishi shart!')
                    return self._render_consulting_form(request)
                
                # Find organization and user
                organization = search_organization_by_inn(inn)
                if not organization:
                    messages.error(request, f'INN {inn} bo\'yicha tashkilot topilmadi!')
                    return self._render_consulting_form(request)
                
                user = get_user_from_organization(organization)
                if not user:
                    messages.error(request, 'Tashkilot egasi topilmadi!')
                    return self._render_consulting_form(request)
                
                # Validate amount
                try:
                    total_amount = Decimal(total_amount)
                    if total_amount <= 0:
                        raise ValueError("Amount must be positive")
                except (ValueError, TypeError):
                    messages.error(request, 'Noto\'g\'ri summa kiritildi!')
                    return self._render_consulting_form(request)
                
                # Create consulting contract
                contract = create_consulting_contract(
                    user=user,
                    organization=organization,
                    total_amount=total_amount,
                    service_description=service_description,
                    notes=notes,
                    created_by=request.user
                )
                
                # Send to DIDOX if requested
                didox_success = True
                if send_to_didox:
                    try:
                        didox_response = send_contract_to_didox(contract, inn)
                        if not didox_response.success:
                            didox_success = False
                            messages.warning(
                                request, 
                                f'Shartnoma yaratildi, lekin DIDOX ga yuborishda xatolik: {didox_response.error}'
                            )
                    except Exception as e:
                        didox_success = False
                        messages.warning(
                            request, 
                            f'Shartnoma yaratildi, lekin DIDOX ga yuborishda xatolik: {str(e)}'
                        )
                
                if didox_success or not send_to_didox:
                    success_msg = f'Konsalting shartnomasi #{contract.contract_number} muvaffaqiyatli yaratildi!'
                    if send_to_didox and didox_success:
                        success_msg += ' DIDOX ga yuborildi.'
                    messages.success(request, success_msg)
                
                return redirect('admin:contracts_contract_change', contract.id)
                
            except Exception as e:
                messages.error(request, f'Xatolik yuz berdi: {str(e)}')
                return self._render_consulting_form(request)
        
        return self._render_consulting_form(request)
    
    def _render_consulting_form(self, request):
        """Render consulting contract form"""
        context = {
            'title': 'Konsalting Shartnomasi Yaratish',
            'opts': self.model._meta,
            'has_change_permission': self.has_change_permission(request),
        }
        return render(request, 'admin/contracts/create_consulting_contract.html', context)

    def changelist_view(self, request, extra_context=None):
        """Changelist view ga qo'shimcha tugma qo'shish"""
        extra_context = extra_context or {}
        extra_context['didox_check_url'] = 'didox-check/'
        extra_context['create_contract_url'] = 'create-contract/'
        extra_context['create_consulting_contract_url'] = 'create-consulting-contract/'
        return super().changelist_view(request, extra_context=extra_context)


class ContractStatAdmin(admin.ModelAdmin):
    change_list_template = "admin/contracts/contract_stat.html"

    def get_urls(self):
        urls = super().get_urls()
        my_urls = [
            path('export-xlsx/', self.admin_site.admin_view(self.export_xlsx), name='contractstat_export_xlsx'),
            path('export-yearly-xlsx/', self.admin_site.admin_view(self.export_yearly_xlsx), name='contractstat_export_yearly_xlsx'),
        ]
        return my_urls + urls

    def compute_regions_data(self, year_int, region=None):

        # Normalize region param: can be Region instance, int id, or None
        region_obj = None
        if region is not None:
            try:
                # if region is id
                if isinstance(region, int):
                    region_obj = Region.objects.filter(id=region).first()
                else:
                    # assume Region instance or string name - try to fetch by id/name loosely
                    region_obj = Region.objects.filter(id=getattr(region, 'id', None)).first() or \
                                 Region.objects.filter(name__iexact=str(region)).first()
            except Exception:
                region_obj = None

        month_names = [
            "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
            "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
        ]

        if region_obj:
            # compute per-district for the given region
            masters = District.objects.filter(region=region_obj).order_by('name')
            # totals grouped by district id
            contract_total_qs = Contract.objects.filter(
                created_at__year=year_int,
                user__organization__district__region=region_obj
            )

            total_count_qs = contract_total_qs.values(
                'user__organization__district_id'
            ).annotate(
                total_count=Count('id'),
                total_amount=Sum('total_amount')
            )
            # map: district_id -> totals
            count_map = {row['user__organization__district_id']: row['total_count'] for row in total_count_qs}
            amount_map = {row['user__organization__district_id']: row['total_amount'] or 0 for row in total_count_qs}

            amounts_qs = Contract.objects.filter(
                user__organization__district__region=region_obj,
                transactions__status=TransactionStatus.PAID,
                transactions__created_at__year=year_int
            ).annotate(
                tx_month=ExtractMonth('transactions__created_at')
            ).values(
                'user__organization__district_id', 'tx_month'
            ).annotate(
                total_amount=Sum('transactions__amount')
            )

            # build map: district_id -> {month: amt}
            master_month_map = {}
            for row in amounts_qs:
                mid = row['user__organization__district_id']
                m = row['tx_month']
                amt = row.get('total_amount') or 0
                if mid not in master_month_map:
                    master_month_map[mid] = {}
                master_month_map[mid][m] = amt

            data = []
            for d in masters:
                monthly_amounts = [master_month_map.get(d.id, {}).get(m, 0) for m in range(1, 13)]
                total_count = count_map.get(d.id, 0)
                total_amount = amount_map.get(d.id, 0)
                monthly_pairs = list(zip(month_names, monthly_amounts))
                data.append({
                    'id': d.id,
                    'name': d.name,
                    'monthly_amounts': monthly_amounts,
                    'monthly_pairs': monthly_pairs,
                    'total_amount': total_amount,
                    'total_count': int(total_count),
                })

            # totals for the whole region (Butun Viloyat)
            total_monthly = [0] * 12
            total_count_all = 0
            total_amount_all = 0
            for item in data:
                for i in range(12):
                    total_monthly[i] += item['monthly_amounts'][i]
                total_count_all += item['total_count']
                total_amount_all += item['total_amount']

            data.append({
                'id': 'all',
                'name': f'Butun {region_obj.name}',
                'monthly_amounts': total_monthly,
                'monthly_pairs': list(zip(month_names, total_monthly)),
                'total_count': total_count_all,
                'total_amount': total_amount_all,
            })

            return data, month_names

        else:
            # compute per-region (original behavior)
            masters = Region.objects.all().order_by('name')

            contract_total_qs = Contract.objects.filter(
                created_at__year=year_int,
                user__organization__district__region__isnull=False
            )

            total_count_qs = contract_total_qs.values(
                'user__organization__district__region__id'
            ).annotate(
                total_count=Count('id'),
                total_amount=Sum('total_amount')
            )
            region_count_map = {row['user__organization__district__region__id']: row['total_count'] for row in
                                total_count_qs}
            region_amount_map = {row['user__organization__district__region__id']: row['total_amount'] or 0 for row in
                                 total_count_qs}

            amounts_qs = Contract.objects.filter(
                user__organization__district__region__isnull=False,
                transactions__status=TransactionStatus.PAID,
                transactions__created_at__year=year_int
            ).annotate(
                tx_month=ExtractMonth('transactions__created_at')
            ).values(
                'user__organization__district__region__id', 'tx_month'
            ).annotate(
                total_amount=Sum('transactions__amount')
            )

            region_month_map = {}
            for row in amounts_qs:
                rid = row['user__organization__district__region__id']
                m = row['tx_month']
                amt = row.get('total_amount') or 0
                if rid not in region_month_map:
                    region_month_map[rid] = {}
                region_month_map[rid][m] = amt

            data = []
            for r in masters:
                monthly_amounts = [region_month_map.get(r.id, {}).get(m, 0) for m in range(1, 13)]
                total_count = region_count_map.get(r.id, 0)
                total_amount = region_amount_map.get(r.id, 0)
                monthly_pairs = list(zip(month_names, monthly_amounts))

                data.append({
                    'id': r.id,
                    'name': r.name,
                    'monthly_amounts': monthly_amounts,
                    'monthly_pairs': monthly_pairs,
                    'total_amount': total_amount,
                    'total_count': int(total_count),
                })

            # totals (Butun Respublika)
            total_monthly = [0] * 12
            total_count_all = 0
            total_amount_all = 0
            for rd in data:
                for i in range(12):
                    total_monthly[i] += rd['monthly_amounts'][i]
                total_count_all += rd['total_count']
                total_amount_all += rd['total_amount']

            data.append({
                'id': 'all',
                'name': 'Butun Respublika',
                'monthly_amounts': total_monthly,
                'monthly_pairs': list(zip(month_names, total_monthly)),
                'total_count': total_count_all,
                'total_amount': total_amount_all,
            })
            return data, month_names

    def export_xlsx(self, request):
        if not self.has_change_permission(request):
            return HttpResponseForbidden("You don't have permission to export this data.")

        year_q = request.GET.get('year', '').strip()
        try:
            year_int = int(year_q) if year_q else datetime.now().year
        except ValueError:
            year_int = datetime.now().year
        region_q = request.GET.get('region')
        if region_q:
            region = Region.objects.get(id=region_q)
        else:
            region = None

        regions_data, month_names = self.compute_regions_data(year_int, region)

        month_count = len(month_names)

        # Remove "Butun Respublika" if present
        regions_data = [r for r in regions_data if r['id'] != 'all']

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"Contracts_{year_int}"

        total_columns = 8 + month_count
        ws.merge_cells(start_row=1, start_column=1, end_row=1, end_column=total_columns)
        tcell = ws.cell(row=1, column=1)
        tcell.value = f"{year_int}-йил давомида консалтинг шартномаларидан тушган тушумлари тўғрисида\nМ А Ъ Л У М О Т Н О М А"
        tcell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
        tcell.font = Font(size=14, bold=True)
        tcell.fill = PatternFill(start_color="BFEFFF", end_color="BFEFFF", fill_type="solid")  # Orqa fon

        hdr_main = 2
        hdr_sub = 3

        fixed_headers = [
            "Т/р", "Код", "Тармоқ бўлимлари номи", "РЕЖА",
            "Тузилган шартнома сони", "Тузилган шартнома суммаси",
            "ФАРК", "ЖАМИ ТУШГАН МАБЛАГ"
        ]

        thin = Side(border_style="thin", color="000000")
        border = Border(top=thin, left=thin, right=thin, bottom=thin)
        fill_header = PatternFill(start_color="B0E0E6", end_color="B0E0E6", fill_type="solid")  # Och ko‘k fon

        # Fixed headers
        for col_idx, title in enumerate(fixed_headers, start=1):
            ws.merge_cells(start_row=hdr_main, start_column=col_idx, end_row=hdr_sub, end_column=col_idx)
            cell = ws.cell(row=hdr_main, column=col_idx)
            cell.value = title
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True, indent=1)
            cell.font = Font(bold=True)
            cell.border = border
            cell.fill = fill_header

        # Shu jumladan (oylar)
        months_start_col = len(fixed_headers) + 1
        months_end_col = months_start_col + month_count - 1
        ws.merge_cells(start_row=hdr_main, start_column=months_start_col, end_row=hdr_main, end_column=months_end_col)
        cell = ws.cell(row=hdr_main, column=months_start_col)
        cell.value = "Шу жумладан"
        cell.alignment = Alignment(horizontal="center", vertical="center")
        cell.font = Font(bold=True)
        cell.fill = fill_header

        # Month names row
        for i, month in enumerate(month_names):
            cell = ws.cell(row=hdr_sub, column=months_start_col + i, value=month)
            cell.alignment = Alignment(horizontal="center", vertical="center", indent=1)
            cell.font = Font(bold=True)
            cell.border = border
            cell.fill = fill_header

        # Data rows
        data_start_row = hdr_sub + 1
        fill_data = PatternFill(start_color="E0FFFF", end_color="E0FFFF", fill_type="solid")  # Och ko‘k fon
        for idx, rd in enumerate(regions_data, start=1):
            cur_row = data_start_row + idx - 1
            ws.cell(row=cur_row, column=1, value=idx).alignment = Alignment(indent=1)
            ws.cell(row=cur_row, column=2, value="").alignment = Alignment(indent=1)
            ws.cell(row=cur_row, column=3, value=rd.get('name', '')).alignment = Alignment(indent=1)
            ws.cell(row=cur_row, column=4, value="").alignment = Alignment(indent=1)

            total_count = rd.get('total_count') or 0
            total_amount = rd.get('total_amount') or 0
            monthly_amounts = rd.get('monthly_amounts') or []

            ws.cell(row=cur_row, column=5, value=total_count)
            ws.cell(row=cur_row, column=6, value=float(total_amount))
            jami = sum([Decimal(str(x or 0)) for x in monthly_amounts])
            fark = jami - Decimal(str(total_amount))
            fark_cell = ws.cell(row=cur_row, column=7, value=float(fark))
            fark_cell.font = Font(color="FF0000", bold=True)
            ws.cell(row=cur_row, column=8, value=float(jami))

            for i, val in enumerate(monthly_amounts):
                ws.cell(row=cur_row, column=months_start_col + i, value=float(val or 0))

            # Format numeric columns
            for col in range(6, total_columns + 1):
                cell = ws.cell(row=cur_row, column=col)
                cell.number_format = '#,##0.00'
                cell.fill = fill_data
                cell.border = border
                cell.alignment = Alignment(horizontal="right", vertical="center", indent=1)

        # Totals row: Butun Respublika
        totals_row = data_start_row + len(regions_data)
        if region:
            ws.cell(row=totals_row, column=3, value="Butun Viloyat")
        else:
            ws.cell(row=totals_row, column=3, value="Butun Respublika")
        for col_idx, col_letter in enumerate(['E', 'F', 'G', 'H'], start=5):
            ws.cell(row=totals_row, column=col_idx,
                    value=f"=SUM({col_letter}{data_start_row}:{col_letter}{totals_row - 1})")
            ws.cell(row=totals_row, column=col_idx).font = Font(bold=True)
            ws.cell(row=totals_row, column=7).font = Font(color="FF0000", bold=True)
            ws.cell(row=totals_row, column=col_idx).fill = fill_data
            ws.cell(row=totals_row, column=col_idx).number_format = '#,##0.00'

        # Month totals
        for i in range(month_count):
            col_idx = months_start_col + i
            col_letter = get_column_letter(col_idx)
            ws.cell(row=totals_row, column=col_idx,
                    value=f"=SUM({col_letter}{data_start_row}:{col_letter}{totals_row - 1})")
            ws.cell(row=totals_row, column=col_idx).font = Font(bold=True)
            ws.cell(row=totals_row, column=col_idx).fill = fill_data
            ws.cell(row=totals_row, column=col_idx).number_format = '#,##0.00'

        # Column widths
        widths = {1: 6, 2: 10, 3: 35, 4: 12, 5: 18, 6: 20, 7: 18, 8: 20}
        for i in range(month_count):
            widths[months_start_col + i] = 14

        for i in range(1, total_columns + 1):
            ws.column_dimensions[get_column_letter(i)].width = widths.get(i, 14)

        # Response
        filename = f"contracts_by_region_{year_int}.xlsx"
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        wb.save(response)
        return response

    def export_yearly_xlsx(self, request):
        year_q = request.GET.get('year', '').strip()
        try:
            year_int = int(year_q) if year_q else datetime.datetime.now().year
        except ValueError:
            year_int = datetime.datetime.now().year

        contracts = Contract.objects.filter(created_at__year=year_int).prefetch_related('user__organization',
                                                                                        'transactions')

        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = f"{year_int} yil reestr"

        # First header row
        ws.merge_cells('A1:I1')
        header_cell = ws['A1']
        header_cell.value = f"{year_int} йил мобайнида тузилган шартномалар\nРЕЕСТРИ"
        header_cell.font = Font(size=14, bold=True)
        header_cell.alignment = Alignment(horizontal='center', vertical='center', wrap_text=True)
        header_cell.fill = PatternFill(start_color="BFEFFF", end_color="BFEFFF", fill_type="solid")

        # Column headers
        headers = [
            "No", "Sana", "STIR", "Sotib oluvchi nomi",
            "Shartnoma raqami", "Shartnoma holati", "Shartnoma summasi", "To'langan", "Qoldiq", "Bo'lim", "Ta'rif"
        ]
        ws.append(headers)

        # Styles for header
        thin = Side(border_style="thin", color="000000")
        border = Border(top=thin, left=thin, right=thin, bottom=thin)
        fill_header = PatternFill(start_color="B0E0E6", end_color="B0E0E6", fill_type="solid")

        for col_idx, _ in enumerate(headers, start=1):
            cell = ws.cell(row=2, column=col_idx)
            cell.font = Font(bold=True)
            cell.alignment = Alignment(horizontal="center", vertical="center", wrap_text=True)
            cell.border = border
            cell.fill = fill_header

        # Fill data rows
        fill_data = PatternFill(start_color="E0FFFF", end_color="E0FFFF", fill_type="solid")
        for idx, contract in enumerate(contracts, start=1):
            user_org = getattr(contract.user, 'organization', None)
            org_name = getattr(user_org, 'name', '') if user_org else ''
            total_paid = contract.transactions.filter(status=TransactionStatus.PAID).aggregate(total_paid_sum=Sum('amount'))[
                             'total_paid_sum'] or 0
            balance = total_paid - contract.total_amount

            branch = getattr(contract.created_by, 'location', '') or ''
            tarif = contract.package.name_uz
            row = [
                idx,
                contract.created_at.strftime("%Y-%m-%d"),
                user_org.tin,
                org_name,
                contract.contract_number,
                contract.status,
                float(contract.total_amount),
                float(total_paid),
                float(balance),
                branch,
                tarif

            ]
            ws.append(row)

            cur_row = ws.max_row
            for col in range(7, 12):  # numeric columns
                cell = ws.cell(row=cur_row, column=col)
                ws.cell(row=cur_row, column=9).font = Font(color="FF0000", bold=True)

                cell.number_format = '#,##0.00'
                cell.fill = fill_data
                cell.border = border
                cell.alignment = Alignment(horizontal="right", vertical="center")
            # Apply border to other cells
            for col in range(1, 7):
                cell = ws.cell(row=cur_row, column=col)
                cell.border = border
                cell.alignment = Alignment(vertical="center", indent=1 if col in [1, 3, 4] else 0)

        # Adjust column widths
        col_widths = [6, 12, 15, 25, 18, 15, 15, 15, 15]
        for i, width in enumerate(col_widths, start=1):
            ws.column_dimensions[get_column_letter(i)].width = width

        # Response
        response = HttpResponse(content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet')
        response['Content-Disposition'] = f'attachment; filename=reestr_{year_int}.xlsx'
        wb.save(response)
        return response


    def changelist_view(self, request, extra_context=None):
        regions = Region.objects.all().order_by('name')
        month_names = [
            "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun",
            "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
        ]

        year_q = request.GET.get('year', '2025').strip()
        try:
            year_int = int(year_q) if year_q else datetime.now().year
        except ValueError:
            year_int = datetime.now().year

        region_q = request.GET.get('region')
        if region_q:
            region = Region.objects.get(id=region_q)
        else:
            region = None
        regions_data, _ = self.compute_regions_data(year_int, region)

        # Yillar ro'yxati
        years_list = Contract.objects.annotate(year=ExtractYear('created_at')) \
            .values_list('year', flat=True).distinct().order_by('-year')

        ctx = {
            'title': "Contracts by Region",
            'regions': regions_data,
            'year_filter': year_int,
            'years_list': years_list,
            'months': month_names,
            'region_list': regions,
            'region_filter': region.id if region else None
        }

        if extra_context:
            ctx.update(extra_context)
        final_ctx = self.admin_site.each_context(request)
        final_ctx.update(ctx)

        return render(request, self.change_list_template, final_ctx)


admin.site.register(ContractStats, ContractStatAdmin)