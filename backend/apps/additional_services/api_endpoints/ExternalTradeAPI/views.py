from rest_framework import viewsets, filters, generics
from rest_framework.decorators import action
from django_filters.rest_framework import DjangoFilterBackend
from apps.common.pagination import CustomLimitOffsetPagination
from ...models.ex_trade import Country, CountryGroup, Region, Unit, TradeData, Product, Year, SITC
from .serializers import (
    CountryGroupSerializer, CountrySerializer, TradeDataGetDataSerializer, UnitSerializer, RegionSerializer,
    SITCSerializer, YearSerializer, ProductSerializer, TradeDataSerializer,
    CountryDetailSerializer, SITCDetailSerializer, ProductDetailSerializer,
    TradeDataDetailSerializer
)


class CountryGroupViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint uchun davlat guruhlarini ko'rish va filterlash
    """
    queryset = CountryGroup.objects.all().order_by('code')
    serializer_class = CountryGroupSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['code']
    search_fields = ['name_uz', 'name_ru', 'name_en', 'code']
    ordering_fields = ['code', 'name_uz']

    @action(detail=True, methods=['get'])
    def countries(self, request, pk=None):
        """
        Davlat guruhi bo'yicha davlatlarni olish
        """
        group = self.get_object()
        print(group.countries.all())
        countries = Country.objects.filter(country_group=group)
        serializer = CountrySerializer(countries, many=True)
        return Response(serializer.data)


class CountryViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint uchun davlatlarni ko'rish va filterlash
    """
    queryset = Country.objects.all().prefetch_related('country_group').order_by('name_uz')
    serializer_class = CountrySerializer
    pagination_class = None
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['country_group', 'kod_kont', 'ctrana']
    search_fields = ['name_uz', 'name_ru', 'name_en', 'name', 'kod_kont', 'ctrana']
    ordering_fields = ['name_uz', 'kod_kont']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return CountryDetailSerializer
        return CountrySerializer

    @action(detail=True, methods=['get'])
    def trade_data(self, request, pk=None):
        """
        Davlat bo'yicha savdo ma'lumotlarini olish
        """
        country = self.get_object()
        year = request.query_params.get('year')
        trade_type = request.query_params.get('trade_type')
        
        queryset = TradeData.objects.filter(country=country)
        
        if year:
            queryset = queryset.filter(year__year=year)
        if trade_type:
            queryset = queryset.filter(trade_type=trade_type)
            
        queryset = queryset.select_related('product', 'unit', 'year', 'region', 'sitc')
        serializer = TradeDataSerializer(queryset, many=True)
        return Response(serializer.data)


class UnitViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint uchun o'lchov birliklarini ko'rish va filterlash
    """
    queryset = Unit.objects.all()
    serializer_class = UnitSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['code']
    search_fields = ['code', 'name', 'short_name']
    ordering_fields = ['code', 'name']


class RegionViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint uchun mintaqalarni ko'rish va filterlash
    """
    queryset = Region.objects.all()
    pagination_class = None
    serializer_class = RegionSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['soato']
    search_fields = ['name_uz', 'name_ru', 'name_en', 'soato']
    ordering_fields = ['name_uz', 'soato']

    @action(detail=True, methods=['get'])
    def trade_data(self, request, pk=None):
        """
        Mintaqa bo'yicha savdo ma'lumotlarini olish
        """
        region = self.get_object()
        year = request.query_params.get('year')
        trade_type = request.query_params.get('trade_type')
        
        queryset = TradeData.objects.filter(region=region)
        
        if year:
            queryset = queryset.filter(year__year=year)
        if trade_type:
            queryset = queryset.filter(trade_type=trade_type)
            
        queryset = queryset.select_related('product', 'unit', 'year', 'country', 'sitc')
        serializer = TradeDataSerializer(queryset, many=True)
        return Response(serializer.data)


class SITCViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint uchun SITC klassifikatsiyalarini ko'rish va filterlash
    """
    queryset = SITC.objects.all().select_related('parent')
    serializer_class = SITCSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['code', 'level', 'parent']
    search_fields = ['code', 'name_uz', 'name_ru']
    ordering_fields = ['code', 'level']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return SITCDetailSerializer
        return SITCSerializer

    def get_queryset(self):
        queryset = SITC.objects.all().select_related('parent')
        level = self.request.query_params.get('level')
        
        if level:
            queryset = queryset.filter(level=level)
        
        return queryset

    @action(detail=False, methods=['get'])
    def sections(self, request):
        """
        Faqat 1-darajali SITC bo'limlarini olish
        """
        queryset = SITC.objects.filter(level=1)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def divisions(self, request):
        """
        Faqat 2-darajali SITC bo'limlarini olish
        """
        queryset = SITC.objects.filter(level=2).select_related('parent')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def groups(self, request):
        """
        Faqat 3-darajali SITC guruhlarini olish
        """
        queryset = SITC.objects.filter(level=3).select_related('parent')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def subgroups(self, request):
        """
        Faqat 4 va 5-darajali SITC subguruhlarini olish
        """
        queryset = SITC.objects.filter(level__in=[4, 5]).select_related('parent')
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        SITC elementining bolalarini olish
        """
        sitc = self.get_object()
        children = SITC.objects.filter(parent=sitc).select_related('parent')
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def trade_data(self, request, pk=None):
        """
        SITC elementi bo'yicha savdo ma'lumotlarini olish
        """
        sitc = self.get_object()
        year = request.query_params.get('year')
        trade_type = request.query_params.get('trade_type')
        
        queryset = TradeData.objects.filter(sitc=sitc)
        
        if year:
            queryset = queryset.filter(year__year=year)
        if trade_type:
            queryset = queryset.filter(trade_type=trade_type)
            
        queryset = queryset.select_related('product', 'unit', 'year', 'country', 'region')
        serializer = TradeDataSerializer(queryset, many=True)
        return Response(serializer.data)


class YearViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint uchun yillarni ko'rish va filterlash
    """
    queryset = Year.objects.all().order_by('-year')
    serializer_class = YearSerializer
    filter_backends = [DjangoFilterBackend, filters.OrderingFilter]
    filterset_fields = ['year']
    ordering_fields = ['year']

    @action(detail=True, methods=['get'])
    def trade_data(self, request, pk=None):
        """
        Yil bo'yicha savdo ma'lumotlarini olish
        """
        year = self.get_object()
        trade_type = request.query_params.get('trade_type')
        country = request.query_params.get('country')
        region = request.query_params.get('region')
        
        queryset = TradeData.objects.filter(year=year)
        
        if trade_type:
            queryset = queryset.filter(trade_type=trade_type)
        if country:
            queryset = queryset.filter(country__id=country)
        if region:
            queryset = queryset.filter(region__id=region)
            
        queryset = queryset.select_related('product', 'unit', 'country', 'region', 'sitc')
        serializer = TradeDataSerializer(queryset, many=True)
        return Response(serializer.data)


class ProductViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint uchun mahsulotlarni ko'rish va filterlash
    """
    queryset = Product.objects.all().select_related('parent')
    serializer_class = ProductSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = ['code', 'level', 'parent']
    search_fields = ['code', 'name_uz', 'name_ru']
    ordering_fields = ['code', 'level']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return ProductDetailSerializer
        return ProductSerializer

    def get_queryset(self):
        queryset = Product.objects.all().select_related('parent')
        level = self.request.query_params.get('level')
        
        if level:
            queryset = queryset.filter(level=level)
        
        return queryset

    @action(detail=False, methods=['get'])
    def categories(self, request):
        """
        Faqat 1-darajali mahsulotlarni (2 xona) olish
        """
        queryset = Product.objects.filter(level=1)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def subcategories(self, request):
        """
        Faqat 2-darajali mahsulotlarni (4 xona) olish
        """
        queryset = Product.objects.filter(level=2).select_related('parent')
        category = request.query_params.get('category')
        
        if category:
            queryset = queryset.filter(parent__code=category)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def products(self, request):
        """
        Faqat 3-darajali mahsulotlarni (6 xona) olish
        """
        queryset = Product.objects.filter(level=3).select_related('parent')
        subcategory = request.query_params.get('subcategory')
        
        if subcategory:
            queryset = queryset.filter(parent__code=subcategory)
            
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def children(self, request, pk=None):
        """
        Mahsulot elementining bolalarini olish
        """
        product = self.get_object()
        children = Product.objects.filter(parent=product).select_related('parent')
        serializer = self.get_serializer(children, many=True)
        return Response(serializer.data)

    @action(detail=True, methods=['get'])
    def trade_data(self, request, pk=None):
        """
        Mahsulot bo'yicha savdo ma'lumotlarini olish
        """
        product = self.get_object()
        year = request.query_params.get('year')
        trade_type = request.query_params.get('trade_type')
        
        queryset = TradeData.objects.filter(product=product)
        
        if year:
            queryset = queryset.filter(year__year=year)
        if trade_type:
            queryset = queryset.filter(trade_type=trade_type)
            
        queryset = queryset.select_related('unit', 'year', 'country', 'region', 'sitc')
        serializer = TradeDataSerializer(queryset, many=True)
        return Response(serializer.data)


class TradeDataViewSet(viewsets.ReadOnlyModelViewSet):
    """
    API endpoint uchun savdo ma'lumotlarini ko'rish va filterlash
    """
    queryset = TradeData.objects.all().select_related(
        'product', 'unit', 'year', 'country', 'region', 'sitc'
    )
    serializer_class = TradeDataSerializer
    filter_backends = [DjangoFilterBackend, filters.SearchFilter, filters.OrderingFilter]
    filterset_fields = [
        'trade_type', 'product', 'unit', 'year', 'month', 'country', 'region', 'sitc'
    ]
    search_fields = ['product__name_uz', 'country__name_uz', 'region__name_uz', 'sitc__name_uz']
    ordering_fields = ['year__year', 'month', 'value', 'quantity']

    def get_serializer_class(self):
        if self.action == 'retrieve':
            return TradeDataDetailSerializer
        return TradeDataSerializer

    def get_queryset(self):
        queryset = TradeData.objects.all().select_related(
            'product', 'unit', 'year', 'country', 'region', 'sitc'
        )
        
        # Asosiy filterlar
        filters_kwargs = {}
        trade_type = self.request.query_params.getlist('trade_type')
        year = self.request.query_params.getlist('year')
        country = self.request.query_params.getlist('country')
        region = self.request.query_params.getlist('region')
        product_category = self.request.query_params.getlist('product_category')
        sitc = self.request.query_params.getlist('sitc')

        if trade_type:
            filters_kwargs['trade_type__in'] = trade_type
        if year:
            filters_kwargs['year__year__in'] = year
        if country:
            filters_kwargs['country__id__in'] = country
        if region:
            filters_kwargs['region__id__in'] = region
        if sitc:
            filters_kwargs['sitc__id__in'] = sitc
        if product_category:
            queryset = queryset.filter(product__parent__code__in=product_category)

        queryset = queryset.filter(**filters_kwargs)

        return queryset.distinct()


    @action(detail=False, methods=['get'])
    def export(self, request):
        """
        Faqat eksport ma'lumotlarini olish
        """
        queryset = self.get_queryset().filter(trade_type=1)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def imports(self, request):
        """
        Faqat import ma'lumotlarini olish
        """
        queryset = self.get_queryset().filter(trade_type=2)
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
        
    @action(detail=False, methods=['get'])
    def stats(self, request):
        """
        Savdo statistikalarini olish
        """
        year = request.query_params.get('year')
        
        queryset = TradeData.objects.all()
        if year:
            queryset = queryset.filter(year__year=year)
        
        export_sum = queryset.filter(trade_type=1).aggregate(total=Sum('value'))['total'] or 0
        import_sum = queryset.filter(trade_type=2).aggregate(total=Sum('value'))['total'] or 0
        
        stats = {
            'export_total': export_sum,
            'import_total': import_sum,
            'balance': export_sum - import_sum,
            'countries_count': queryset.values('country').distinct().count(),
            'products_count': queryset.values('product').distinct().count(),
        }
        
        return Response(stats)
    

class TradeDataGetDataView(generics.CreateAPIView):
    serializer_class = TradeDataGetDataSerializer
    pagination_class = CustomLimitOffsetPagination

    def post(self, request, *args, **kwargs):
        serializer = TradeDataGetDataSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        print(data)
        filters = Q()
        country_groups = data.get('country_groups', [])
        years = data.get('years', [])
        months = data.get('months', [])
        countries = data.get('countries', [])
        regions = data.get('regions', [])
        trade_type = data.get('trade_type', 1) # default export
        group_by = data.get('group_by', ['country_groups']) # default country
        products2 = data.get('products2', [])
        products4 = data.get('products4', [])
        products6 = data.get('products6', [])
        sitc1 = data.get('sitc1', [])
        sitc2 = data.get('sitc2', [])
        sitc3 = data.get('sitc3', [])
        sitc4 = data.get('sitc4', [])


        if len(country_groups) > 0 and len(countries)==0:
            filters &= Q(country__country_group__code__in=country_groups)
        
        if len(countries) > 0:
            filters &= Q(country__ctrana__in=countries)
        if len(years) > 0:
            filters &= Q(year__year__in=years)
        if len(months) > 0:
            filters &= Q(month__in=months)
        if len(regions) > 0:
            filters &= Q(region__soato__in=regions)
        if trade_type in [1,2]:
            filters &= Q(trade_type=trade_type)

        if len(products2) > 0 and len(products4)==0 and len(products6)==0:
            filters &= Q(product__code__in=products2, product__level=1)

        if len(products4) > 0 and len(products6)==0:
            filters &= Q(product__code__in=products4, product__level=2)
        
        if len(products6) > 0:
            filters &= Q(product__code__in=products6, product__level=3)

        if len(sitc1) > 0 and len(sitc2)==0 and len(sitc3)==0 and len(sitc4)==0:
            filters &= Q(sitc__code__in=sitc1, sitc__level=1)
        if len(sitc2) > 0 and len(sitc3)==0 and len(sitc4)==0:
            filters &= Q(sitc__code__in=sitc2, sitc__level=2)
        if len(sitc3) > 0 and len(sitc4)==0:
            filters &= Q(sitc__code__in=sitc3, sitc__level=3)
        if len(sitc4) > 0:
            filters &= Q(sitc__code__in=sitc4, sitc__level__in=4)


        queryset = TradeData.objects.none()
        if filters:
            queryset = TradeData.objects.filter(filters).select_related(
                'product', 'unit', 'year', 'country', 'region', 'sitc'
         )
        paginator = self.pagination_class()
        paginated_queryset = paginator.paginate_queryset(queryset, request, view=self)
        output_serializer = TradeDataSerializer(paginated_queryset, many=True)
        return paginator.get_paginated_response(output_serializer.data)
 

from django.db.models import Sum, Count, F, Q, Case, When, CharField, Value
from rest_framework import generics, status
from rest_framework.response import Response

class TradeDataExportView(generics.CreateAPIView):
    serializer_class = TradeDataGetDataSerializer


    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        
        validated_data = serializer.validated_data
        queryset = self._build_queryset(validated_data)
        result = self._apply_grouping_and_aggregation(queryset, validated_data)
        
        return Response({
            'data': result,
            'total_records': len(result),
            'filters_applied': self._get_applied_filters(validated_data)
        })

    def _build_queryset(self, data):
        """Base queryset ni build qilish"""
        filters = Q()
        
        # Trade flow (export=1, import=2)
        trade_type = data['trade_type']
        filters &= Q(trade_type=int(trade_type))
        
        # Location filters
        filters = self._apply_location_filters(filters, data)
        
        # Classification filters    
        filters = self._apply_classification_filters(filters, data)
        print(filters,"filters")
        return TradeData.objects.filter(filters).select_related(
            'product', 'country', 'region', 'sitc', 'year',
            'country__country_group'
        )

    def _apply_time_filters(self, filters, data):
        """Vaqt filtrlari"""
        years = data.get('years', [])
        quarters = data.get('quarters', [])
        months = data.get('months', [])
        
        if years:
            filters &= Q(year__year__in=years)
        
        if quarters:
            quarter_months = []
            for q in quarters:
                if q == 'Q1':
                    quarter_months.extend(['M1', 'M2', 'M3'])
                elif q == 'Q2':
                    quarter_months.extend(['M4', 'M5', 'M6'])
                elif q == 'Q3':
                    quarter_months.extend(['M7', 'M8', 'M9'])
                elif q == 'Q4':
                    quarter_months.extend(['M10', 'M11', 'M12'])
            filters &= Q(month__in=quarter_months)
        
        if months:
            filters &= Q(month__in=months)
            
        return filters

    def _apply_location_filters(self, filters, data):
        """Joylashuv filtrlari"""
        countries = data.get('countries', [])
        country_groups = data.get('country_groups', [])
        regions = data.get('regions', [])
        
        if countries:
            filters &= Q(country__ctrana__in=countries)
        elif country_groups:
            if 'WORLD' in country_groups:
                pass    
            else:
                print("Country groups:", country_groups)    
                filters &= Q(country__country_group__code__in=["528"])

        
        if regions:
            filters &= Q(region__soato__in=regions)
            
        return filters

    def _apply_classification_filters(self, filters, data):
        """Klassifikatsiya filtrlari - TO'G'RI OR LOGIC"""
        
        # HS filters with OR logic
        hs_filters = Q()
        hs2_codes = data.get('hs2_codes', [])
        hs4_codes = data.get('hs4_codes', [])
        hs6_codes = data.get('hs6_codes', [])
        
        if hs6_codes:
            hs_filters = Q(product__code__in=hs6_codes)

        elif hs4_codes:
            hs_filters = Q(product__parent__code__in=hs4_codes)

        elif hs2_codes:
            hs_filters = Q(product__parent__parent__code__in=hs2_codes)

        if hs_filters:
            filters &= hs_filters
        
        # SITC filters with OR logic
        sitc_filters = Q()
        sitc1_codes = data.get('sitc1_codes', [])
        sitc2_codes = data.get('sitc2_codes', [])
        sitc3_codes = data.get('sitc3_codes', [])
        sitc4_codes = data.get('sitc4_codes', [])

        if sitc4_codes:
            sitc_filters = Q(sitc__code__in=sitc4_codes)
        elif sitc3_codes:
            sitc_filters = Q(sitc__parent__code__in=sitc3_codes)
        elif sitc2_codes:
            sitc_filters = Q(sitc__parent__parent__code__in=sitc2_codes)
        elif sitc1_codes:
            sitc_filters = Q(sitc__parent__parent__parent__code__in=sitc1_codes)

        if sitc_filters:
            filters &= sitc_filters
            
        return filters

    # def _apply_grouping_and_aggregation(self, queryset, data):
        """Group by va aggregation qo'llash"""
        group_by = data['group_by']
        
        # Group by fields mapping
        group_fields = []
        select_fields = {}
        
        for field in group_by:
            if field == 'country_group':
                group_fields.append('country__country_group__code')
                select_fields['country_group_code'] = F('country__country_group__code')
                select_fields['country_group_name'] = F('country__country_group__name_uz')
                
            elif field == 'country':
                select_fields['country_code'] = Case(
                    When(country__ctrana='WORLD', then=Value('WORLD')),
                    default=F('country__ctrana'),
                    output_field=CharField()
                )
                select_fields['country_name'] = Case(
                    When(country__ctrana='WORLD', then=Value('World Total')),
                    default=F('country__name_uz'),
                    output_field=CharField()
                )
                group_fields.append('country__ctrana')
                
            elif field == 'region':
                group_fields.append('region__soato')
                select_fields['region_code'] = F('region__soato')
                select_fields['region_name'] = F('region__name_uz')
                
            elif field == 'hs':
                group_fields.append('product__code')
                select_fields['hs_code'] = F('product__code')
                select_fields['hs_name'] = F('product__name_uz')
                
            elif field == 'sitc':
                group_fields.append('sitc__code')
                select_fields['sitc_code'] = F('sitc__code')
                select_fields['sitc_name'] = F('sitc__name_uz')
                
            elif field == 'year':
                group_fields.append('year__year')
                select_fields['year'] = F('year__year')
                
            elif field == 'quarter':
                # Month dan quarter ga konvert
                select_fields['quarter'] = Case(
                    When(month__in=['M1', 'M2', 'M3'], then=Value('Q1')),
                    When(month__in=['M4', 'M5', 'M6'], then=Value('Q2')),
                    When(month__in=['M7', 'M8', 'M9'], then=Value('Q3')),
                    When(month__in=['M10', 'M11', 'M12'], then=Value('Q4')),
                    output_field=CharField()
                )
                group_fields.append('quarter')
                
            elif field == 'month':
                group_fields.append('month')
                select_fields['month'] = F('month')

        # Aggregation
        aggregations = {
            'total_value': Sum('value'),
            'total_quantity': Sum('quantity'),
            'record_count': Count('id')
        }

        # Query execution
        result = (
            queryset
            .values(*group_fields)
            .annotate(**select_fields, **aggregations)
            .order_by(*group_fields)
        )

        return list(result)

    def _apply_grouping_and_aggregation(self, queryset, data, lang='uz'):
        data = []

        has_country_group = 'country_group' in data['group_by']
        has_country = 'country' in data['group_by']

        if has_country_group:
            ctgs = CountryGroup.objects.filter(
                code__in= data.get('country_groups', [])
            ).values('code', f'name_{lang}')

            for ctg in ctgs:
                item = {
                    'country_group_code': ctg['code'],
                    'country_group_name': ctg[f'name_{lang}'],
                    'trade_type': data['trade_type'],
                }
                ctys = Country.objects.filter(country_group__code=ctg['code']).values('ctrana', f'name_{lang}')
                if has_country and ctys:
                    item['countries'] = list(ctys)
                

        for q in queryset:
            item = {
                'country_code': q.country.ctrana,
                'country_name': q.country.name_uz,
                'trade_type': q.trade_type,
            }
            data.append(item)
        return data

    def _get_applied_filters(self, data):
        """Qo'llanilgan filtrlarni qaytarish"""
        applied = {}
        
        if data.get('years'):
            applied['years'] = data['years']
        if data.get('quarters'):
            applied['quarters'] = data['quarters']
        if data.get('months'):
            applied['months'] = data['months']
        if data.get('countries'):
            applied['countries'] = data['countries']
        if data.get('country_groups'):
            applied['country_groups'] = data['country_groups']
        if data.get('regions'):
            applied['regions'] = data['regions']
        if data.get('hs_codes'):
            applied['hs_codes'] = data['hs_codes']
        if data.get('sitc_codes'):
            applied['sitc_codes'] = data['sitc_codes']
        
        applied['trade_type'] = data['trade_type']
        applied['group_by'] = data['group_by']
        return applied
    

