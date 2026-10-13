from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from django.db.models import Q, Sum, F, Value, CharField, Case, When
from django.db.models.functions import Concat, Substr
from collections import defaultdict
from .serializers import TradeDataGetDataSerializer
from ...models import TradeData


class TradeDataGetView(CreateAPIView):
    queryset = TradeData.objects.all()
    serializer_class = TradeDataGetDataSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        validated_data = serializer.validated_data
        
        # Build queryset with filters and apply grouping
        response_data = self._build_grouped_data(validated_data)
        
        return Response(response_data)

    def _build_grouped_data(self, data):
        """Build grouped data using Django ORM aggregation"""
        # Apply base filters
        queryset = self._apply_filters(data)
        
        # Determine grouping configuration
        group_by = data.get('group_by', self._get_default_group_by(data))
        grouping_config = self._get_grouping_config(group_by, data)
        
        # Apply grouping and aggregation at database level
        grouped_queryset = self._apply_database_grouping(queryset, grouping_config, data)
        
        # Build response
        return self._build_response_from_queryset(grouped_queryset, grouping_config, data)

    def _apply_filters(self, data):
        """Apply all filters to base queryset"""
        filters = Q()
        
        # Trade type filter
        trade_type = data.get('trade_type', 1)
        filters &= Q(trade_type=trade_type)
        
        # Year filter
        years = data.get('years', [2022])
        filters &= Q(year__year__in=years)
        
        # Time period filters
        time_filters = self._get_time_filters(data)
        if time_filters:
            filters &= time_filters
        
        # Location filters
        filters &= self._get_location_filters(data)
        
        # Product filters
        filters &= self._get_product_filters(data)
        
        return TradeData.objects.filter(filters).select_related(
            'product', 'country', 'region', 'sitc', 'year', 'unit',
            'country__country_group'
        )

    def _get_time_filters(self, data):
        """Get time-based filters"""
        months = data.get('months', [])
        quarters = data.get('quarters', [])
        
        if quarters:
            quarter_to_months = {
                'Q1': ['M1', 'M2', 'M3'],
                'Q2': ['M4', 'M5', 'M6'],
                'Q3': ['M7', 'M8', 'M9'],
                'Q4': ['M10', 'M11', 'M12']
            }
            all_months = []
            for quarter in quarters:
                all_months.extend(quarter_to_months.get(quarter, []))
            return Q(month__in=all_months)
        
        if months:
            return Q(month__in=months)
        
        return Q(month='M1')  # Default

    def _get_location_filters(self, data):
        """Get location-based filters"""
        filters = Q()
        
        countries = data.get('countries', ['global'])
        country_groups = data.get('country_groups', [])
        regions = data.get('regions', [])
        
        # Country filters
        if countries != ['global']:
            filters &= Q(country__ctrana__in=countries)
        elif country_groups:
            filters &= Q(country__country_group__code__in=country_groups)
        # Agar global bo'lsa va country_groups yo'q bo'lsa, hamma mamlakatlar
        # (Bu yerda filter qo'shmaslik kerak)
        
        # Region filters
        if regions:
            filters &= Q(region__soato__in=regions)
        
        return filters

    def _get_product_filters(self, data):
        """Get product classification filters"""
        filters = Q()
        
        # HS filters
        hs2_codes = data.get('hs2_codes', [])
        hs4_codes = data.get('hs4_codes', [])
        hs6_codes = data.get('hs6_codes', [])
        
        if hs6_codes:
            filters &= Q(product__code__in=hs6_codes)
        elif hs4_codes:
            filters &= Q(product__code__startswith__in=hs4_codes)
        elif hs2_codes:
            hs_filter = Q()
            for code in hs2_codes:
                hs_filter |= Q(product__code__startswith=code)
            filters &= hs_filter
        
        # SITC filters
        sitc1_codes = data.get('sitc1_codes', [])
        sitc2_codes = data.get('sitc2_codes', [])
        sitc3_codes = data.get('sitc3_codes', [])
        sitc4_codes = data.get('sitc4_codes', [])
        
        if sitc4_codes:
            filters &= Q(sitc__code__in=sitc4_codes)
        elif sitc3_codes:
            sitc_filter = Q()
            for code in sitc3_codes:
                sitc_filter |= Q(sitc__code__startswith=code)
            filters &= sitc_filter
        elif sitc2_codes:
            sitc_filter = Q()
            for code in sitc2_codes:
                sitc_filter |= Q(sitc__code__startswith=code)
            filters &= sitc_filter
        elif sitc1_codes:
            sitc_filter = Q()
            for code in sitc1_codes:
                sitc_filter |= Q(sitc__code__startswith=code)
            filters &= sitc_filter
        
        return filters

    def _get_default_group_by(self, data):
        """Determine default group_by based on filters"""
        countries = data.get('countries', ['global'])
        regions = data.get('regions', [])
        
        # Agar countries global bo'lsa va regions mavjud bo'lsa
        if countries == ['global'] and regions:
            return ['country_group', 'region']
        # Agar countries global bo'lsa
        elif countries == ['global']:
            return ['country_group']
        # Agar countries aniq bo'lsa va regions mavjud bo'lsa
        elif regions:
            return ['country', 'region']
        # Agar faqat countries aniq bo'lsa
        else:
            return ['country']

    def _get_grouping_config(self, group_by, data):
        """Get grouping configuration"""
        config = {
            'dimensions': group_by,
            'hs_level': self._get_hs_level(data),
            'sitc_level': self._get_sitc_level(data)
        }
        
        # Agar SITC yoki HS codes mavjud bo'lsa, avtomatik ravishda group_by ga qo'shish
        if config['hs_level'] and 'hs' not in config['dimensions']:
            config['dimensions'].append('hs')
        
        if config['sitc_level'] and 'sitc' not in config['dimensions']:
            config['dimensions'].append('sitc')
        
        return config

    def _get_hs_level(self, data):
        """Determine HS level from filters"""
        if data.get('hs6_codes'):
            return 'hs6'
        elif data.get('hs4_codes'):
            return 'hs4'
        elif data.get('hs2_codes'):
            return 'hs2'
        return None

    def _get_sitc_level(self, data):
        """Determine SITC level from filters"""
        if data.get('sitc4_codes'):
            return 'sitc4'
        elif data.get('sitc3_codes'):
            return 'sitc3'
        elif data.get('sitc2_codes'):
            return 'sitc2'
        elif data.get('sitc1_codes'):
            return 'sitc1'
        return None

    def _apply_database_grouping(self, queryset, config, data):
        """Apply grouping and aggregation at database level"""
        # Build grouping fields and annotations
        group_fields = []
        annotations = {}
        
        for dimension in config['dimensions']:
            if dimension == 'country':
                group_fields.extend(['country__ctrana', 'country__name_uz'])
                annotations.update({
                    'country_code': F('country__ctrana'),
                    'country_name': F('country__name_uz')
                })
            
            elif dimension == 'country_group':
                group_fields.extend(['country__country_group__code', 'country__country_group__name_uz'])
                annotations.update({
                    'country_group_code': F('country__country_group__code'),
                    'country_group_name': F('country__country_group__name_uz')
                })
            
            elif dimension == 'region':
                group_fields.extend(['region__soato', 'region__name_uz'])
                annotations.update({
                    'region_code': F('region__soato'),
                    'region_name': F('region__name_uz')
                })
            
            elif dimension == 'hs':
                hs_level = config['hs_level']
                if hs_level == 'hs6':
                    group_fields.extend(['product__code', 'product__name_uz'])
                    annotations.update({
                        'hs6_code': F('product__code'),
                        'hs6_name': F('product__name_uz')
                    })
                elif hs_level == 'hs4':
                    annotations.update({
                        'hs4_code': Substr('product__code', 1, 4),
                        'hs4_name': F('product__name_uz')
                    })
                    # Substr annotationini ham values ga qo'shish kerak
                    group_fields.extend(['hs4_code'])
                elif hs_level == 'hs2':
                    annotations.update({
                        'hs2_code': Substr('product__code', 1, 2),
                        'hs2_name': F('product__name_uz')
                    })
                    # Substr annotationini ham values ga qo'shish kerak
                    group_fields.extend(['hs2_code'])
            
            elif dimension == 'sitc':
                sitc_level = config['sitc_level']
                if sitc_level == 'sitc4':
                    group_fields.extend(['sitc__code', 'sitc__name_uz'])
                    annotations.update({
                        'sitc4_code': F('sitc__code'),
                        'sitc4_name': F('sitc__name_uz')
                    })
                elif sitc_level == 'sitc3':
                    annotations.update({
                        'sitc3_code': Substr('sitc__code', 1, 3),
                        'sitc3_name': F('sitc__name_uz')
                    })
                    group_fields.extend(['sitc3_code'])
                elif sitc_level == 'sitc2':
                    annotations.update({
                        'sitc2_code': Substr('sitc__code', 1, 2),
                        'sitc2_name': F('sitc__name_uz')
                    })
                    group_fields.extend(['sitc2_code'])
                elif sitc_level == 'sitc1':
                    annotations.update({
                        'sitc1_code': Substr('sitc__code', 1, 1),
                        'sitc1_name': F('sitc__name_uz')
                    })
                    group_fields.extend(['sitc1_code'])
        
        # Add year and period annotations
        annotations['year_value'] = F('year__year')
        
        # Handle quarters vs months
        quarters = data.get('quarters', [])
        if quarters:
            # Map months to quarters
            annotations['period'] = Case(
                When(month__in=['M1', 'M2', 'M3'], then=Value('Q1')),
                When(month__in=['M4', 'M5', 'M6'], then=Value('Q2')),
                When(month__in=['M7', 'M8', 'M9'], then=Value('Q3')),
                When(month__in=['M10', 'M11', 'M12'], then=Value('Q4')),
                default=Value('Q1'),
                output_field=CharField()
            )
        else:
            annotations['period'] = F('month')
        
        # Add all annotation keys to values_fields
        values_fields = list(set(group_fields + list(annotations.keys())))
        
        # Apply annotations first, then values, then aggregate
        return (queryset
                .annotate(**annotations)
                .values(*values_fields)
                .annotate(
                    total_value=Sum('value'),
                    total_quantity=Sum('quantity')
                )
                .order_by(*values_fields))

    def _build_response_from_queryset(self, grouped_queryset, config, data):
        """Build final response from grouped queryset"""
        years = data.get('years', [2022])
        quarters = data.get('quarters', [])
        months = data.get('months', ['M1'])
        trade_type = data.get('trade_type', 1)
        trade_type_name = "Export" if trade_type == 1 else "Import"
        
        # Determine periods
        periods = quarters if quarters else months
        period_type = 'quarter' if quarters else 'month'
        
        # Build period columns
        columns = []
        for year in sorted(years):
            for period in periods:
                columns.append(f"{year}_{period}")
        
        # Group data by dimensions (excluding time)
        dimension_groups = defaultdict(lambda: {
            'meta': {},
            'values': defaultdict(lambda: {'value': 0, 'quantity': 0})
        })
        
        # Process grouped queryset
        for item in grouped_queryset:
            # Build dimension key
            dim_key_parts = []
            meta = {}
            
            for dimension in config['dimensions']:
                if dimension == 'country':
                    country_code = item.get('country__ctrana') or item.get('country_code')
                    country_name = item.get('country__name_uz') or item.get('country_name')
                    if country_code:
                        dim_key_parts.append(f"country_{country_code}")
                        meta.update({
                            'country_code': country_code,
                            'country_name': country_name
                        })
                
                elif dimension == 'country_group':
                    group_code = item.get('country__country_group__code') or item.get('country_group_code')
                    group_name = item.get('country__country_group__name_uz') or item.get('country_group_name')
                    if group_code:
                        dim_key_parts.append(f"group_{group_code}")
                        meta.update({
                            'country_group_code': group_code,
                            'country_group_name': group_name
                        })
                
                elif dimension == 'region':
                    region_code = item.get('region__soato') or item.get('region_code')
                    region_name = item.get('region__name_uz') or item.get('region_name')
                    if region_code:
                        dim_key_parts.append(f"region_{region_code}")
                        meta.update({
                            'region_code': region_code,
                            'region_name': region_name
                        })
                
                elif dimension == 'hs':
                    hs_level = config['hs_level']
                    if hs_level:
                        hs_code = item.get(f'{hs_level}_code')
                        hs_name = item.get(f'{hs_level}_name') or item.get('product__name_uz')
                        if hs_code:
                            dim_key_parts.append(f"{hs_level}_{hs_code}")
                            meta.update({
                                f'{hs_level}_code': hs_code,
                                f'{hs_level}_name': hs_name
                            })
                
                elif dimension == 'sitc':
                    sitc_level = config['sitc_level']
                    if sitc_level:
                        sitc_code = item.get(f'{sitc_level}_code')
                        sitc_name = item.get(f'{sitc_level}_name') or item.get('sitc__name_uz')
                        if sitc_code:
                            dim_key_parts.append(f"{sitc_level}_{sitc_code}")
                            meta.update({
                                f'{sitc_level}_code': sitc_code,
                                f'{sitc_level}_name': sitc_name
                            })
            
            dim_key = "||".join(dim_key_parts) if dim_key_parts else "default"
            
            # Store meta information
            if not dimension_groups[dim_key]['meta']:
                dimension_groups[dim_key]['meta'] = meta
            
            # Build period key
            year_value = item.get('year_value') or item.get('year__year')
            period = item.get('period') or item.get('month')
            period_key = f"{year_value}_{period}"
            
            # Aggregate values
            dimension_groups[dim_key]['values'][period_key]['value'] += float(item['total_value'] or 0)
            dimension_groups[dim_key]['values'][period_key]['quantity'] += float(item['total_quantity'] or 0)
        
        # Build final response data
        data_rows = []
        total_values = {col: {'value': 0, 'quantity': 0} for col in columns}
        
        for dim_key, group_data in dimension_groups.items():
            row = {}
            
            # Add meta information
            row.update(group_data['meta'])
            
            # Add period columns
            for col_name in columns:
                value_key = f"value_{col_name}"
                quantity_key = f"quantity_{col_name}"
                
                if col_name in group_data['values']:
                    row[value_key] = round(group_data['values'][col_name]['value'], 2)
                    row[quantity_key] = round(group_data['values'][col_name]['quantity'], 2)
                    
                    # Add to totals
                    total_values[col_name]['value'] += group_data['values'][col_name]['value']
                    total_values[col_name]['quantity'] += group_data['values'][col_name]['quantity']
                else:
                    row[value_key] = 0
                    row[quantity_key] = 0
            
            row['isGroupSummary'] = False
            data_rows.append(row)
        
        # Add total row
        total_row = {'label': f"{trade_type_name}, Total:", 'isGroupSummary': True}
        for col_name in columns:
            total_row[f"value_{col_name}"] = round(total_values[col_name]['value'], 2)
            total_row[f"quantity_{col_name}"] = round(total_values[col_name]['quantity'], 2)
        data_rows.append(total_row)
        
        # Build headers
        headers = self._build_headers(config, columns, period_type)
        
        # Build final response
        response = {
            'success': True,
            'data': data_rows,
            'total': len(data_rows) - 1,
            'filters': {
                'trade_type': trade_type,
                'trade_type_name': trade_type_name,
                'years': years,
            },
            'headers': headers,
            'units': ['USD 1000', 'kg'],
            'missing': []
        }
        
        # Add period info
        if period_type == 'quarter':
            response['filters']['quarters'] = periods
        else:
            response['filters']['months'] = periods
        
        return response

    def _build_headers(self, config, columns, period_type):
        """Build headers for response"""
        headers = []
        
        # Add dimension headers
        for dimension in config['dimensions']:
            if dimension == 'country':
                headers.extend([
                    {'field': 'country_code', 'label': 'Country Code'},
                    {'field': 'country_name', 'label': 'Country'}
                ])
            elif dimension == 'country_group':
                headers.extend([
                    {'field': 'country_group_code', 'label': 'Group Code'},
                    {'field': 'country_group_name', 'label': 'Country Group'}
                ])
            elif dimension == 'region':
                headers.extend([
                    {'field': 'region_code', 'label': 'Region Code'},
                    {'field': 'region_name', 'label': 'Region'}
                ])
            elif dimension == 'hs':
                level = config.get('hs_level', 'hs2')
                level_upper = level.upper()
                headers.extend([
                    {'field': f'{level}_code', 'label': f'{level_upper} Code'},
                    {'field': f'{level}_name', 'label': f'{level_upper} Product Name'}
                ])
            elif dimension == 'sitc':
                level = config.get('sitc_level', 'sitc1')
                level_upper = level.upper()
                headers.extend([
                    {'field': f'{level}_code', 'label': f'{level_upper} Code'},
                    {'field': f'{level}_name', 'label': f'{level_upper} Category Name'}
                ])
        
        # Add period headers
        for col_name in columns:
            year, period = col_name.split('_', 1)
            
            if period_type == 'quarter':
                period_label = period
            else:
                month_labels = {
                    'M1': 'Jan', 'M2': 'Jan-Feb', 'M3': 'Jan-Mar',
                    'M4': 'Jan-Apr', 'M5': 'Jan-May', 'M6': 'Jan-Jun',
                    'M7': 'Jan-Jul', 'M8': 'Jan-Aug', 'M9': 'Jan-Sep',
                    'M10': 'Jan-Oct', 'M11': 'Jan-Nov', 'M12': 'Jan-Dec'
                }
                period_label = month_labels.get(period, period)
            
            headers.extend([
                {
                    'field': f'value_{col_name}',
                    'label': f'Value {year} {period_label} (USD 1000)'
                },
                {
                    'field': f'quantity_{col_name}',
                    'label': f'Quantity {year} {period_label}'
                }
            ])
        
        return headers