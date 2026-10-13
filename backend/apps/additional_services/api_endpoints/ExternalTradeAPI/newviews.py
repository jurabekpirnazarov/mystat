from django.db.models.aggregates import Max, Avg
from rest_framework import status
from rest_framework.generics import CreateAPIView
from rest_framework.response import Response
from django.db.models import Q, Sum, F, Value, CharField, Case, When
from django.db.models.functions import  Substr
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

        return Response(response_data, status=status.HTTP_200_OK)

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

        # HS da eng aniq (yuqori) darajani tanlash
        if hs6_codes:
            filters &= Q(product__code__in=hs6_codes)
        elif hs4_codes:
            filters &= Q(product__parent__code__in=hs4_codes)
        elif hs2_codes:
            filters &= Q(product__parent__parent__code__in=hs2_codes)

        sitc1_codes = data.get('sitc1_codes', [])
        sitc2_codes = data.get('sitc2_codes', [])
        sitc3_codes = data.get('sitc3_codes', [])
        sitc4_codes = data.get('sitc4_codes', [])

        # SITC da eng aniq (yuqori) darajani tanlash - faqat bittasini
        if sitc4_codes:
            filters &= Q(sitc__code__in=sitc4_codes)
        elif sitc3_codes:
            filters &= Q(sitc__parent__code__in=sitc3_codes)
        elif sitc2_codes:
            filters &= Q(sitc__parent__parent__code__in=sitc2_codes)
        elif sitc1_codes:
            filters &= Q(sitc__parent__parent__parent__code__in=sitc1_codes)

        return filters

    def _get_default_group_by(self, data):
        """Determine default group_by based on filters"""
        countries = data.get('countries', ['global'])
        regions = data.get('regions', [])

        if countries == ['global'] and regions:
            return ['country_group', 'region']
        elif countries == ['global']:
            return ['country_group']
        elif regions:
            return ['country', 'region']
        else:
            return ['country']

    def _get_hs_levels(self, data):
        """Get all HS levels present in data"""
        levels = []
        if data.get('hs6_codes'):
            levels.append('hs6')
        if data.get('hs4_codes'):
            levels.append('hs4')
        if data.get('hs2_codes'):
            levels.append('hs2')
        return levels

    def _get_sitc_levels(self, data):
        """Get all SITC levels present in data"""
        levels = []
        if data.get('sitc4_codes'):
            levels.append('sitc4')
        if data.get('sitc3_codes'):
            levels.append('sitc3')
        if data.get('sitc2_codes'):
            levels.append('sitc2')
        if data.get('sitc1_codes'):
            levels.append('sitc1')
        return levels

    def _get_grouping_config(self, group_by, data):
        """Get grouping configuration"""
        config = {
            'dimensions': list(group_by),
            'hs_levels': self._get_hs_levels(data),
            'sitc_levels': self._get_sitc_levels(data)
        }

        # Agar SITC yoki HS codes mavjud bo'lsa, avtomatik ravishda group_by ga qo'shish
        if config['hs_levels'] and 'hs' not in config['dimensions']:
            config['dimensions'].append('hs')

        if config['sitc_levels'] and 'sitc' not in config['dimensions']:
            config['dimensions'].append('sitc')

        return config

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
                hs_levels = config['hs_levels']

                # HS6 level
                if 'hs6' in hs_levels:
                    group_fields.extend(['product__code', 'product__name_uz'])
                    annotations.update({
                        'hs6_code': F('product__code'),
                        'hs6_name': F('product__name_uz')
                    })

                # HS4 level
                if 'hs4' in hs_levels:
                    # Substr returns string slice starting from 1
                    annotations.update({
                        'hs4_code': Substr('product__code', 1, 4),
                        'hs4_name': F('product__name_uz')
                    })
                    group_fields.append('hs4_code')

                # HS2 level
                if 'hs2' in hs_levels:
                    annotations.update({
                        'hs2_code': Substr('product__code', 1, 2),
                        'hs2_name': F('product__name_uz')
                    })
                    group_fields.append('hs2_code')

            elif dimension == 'sitc':
                sitc_levels = config['sitc_levels']

                # SITC4 level
                if 'sitc4' in sitc_levels:
                    group_fields.extend(['sitc__code', 'sitc__name_uz'])
                    annotations.update({
                        'sitc4_code': F('sitc__code'),
                        'sitc4_name': F('sitc__name_uz')
                    })

                # SITC3 level
                if 'sitc3' in sitc_levels:
                    annotations.update({
                        'sitc3_code': Substr('sitc__code', 1, 3),
                        'sitc3_name': F('sitc__name_uz')
                    })
                    group_fields.append('sitc3_code')

                # SITC2 level
                if 'sitc2' in sitc_levels:
                    annotations.update({
                        'sitc2_code': Substr('sitc__code', 1, 2),
                        'sitc2_name': F('sitc__name_uz')
                    })
                    group_fields.append('sitc2_code')

                # SITC1 level
                if 'sitc1' in sitc_levels:
                    annotations.update({
                        'sitc1_code': Substr('sitc__code', 1, 1),
                        'sitc1_name': F('sitc__name_uz')
                    })
                    group_fields.append('sitc1_code')

        # Add year and period annotations
        annotations['year_value'] = F('year__year')

        # Handle quarters vs months
        quarters = data.get('quarters', [])
        if quarters:
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

        # Determine whether to include quantity aggregation (faqat hs6 tanlanganida)
        include_quantity = 'hs6' in config.get('hs_levels', [])

        # Apply annotations first, then values, then aggregate
        qs = queryset.annotate(**annotations).values(*values_fields)

        agg_kwargs = {'total_value': Sum('value')}
        if include_quantity:
            agg_kwargs['total_quantity'] = Sum('quantity')

        return qs.annotate(**agg_kwargs).order_by(*values_fields)

    def _build_response_from_queryset(self, grouped_queryset, config, data):
        """Build final response from grouped queryset with localized keys"""
        years = data.get('years', [2022])
        quarters = data.get('quarters', [])
        months = data.get('months', ['M1'])
        trade_type = data.get('trade_type', 1)
        lang = data.get('lang', 'uz')

        # Field name translations (local key names)
        field_name_map = {
            'uz': {
                'country_code': 'davlat_kod',
                'country_name': 'davlat_nomi',
                'country_group_code': 'guruh_kod',
                'country_group_name': 'guruh_nomi',
                'region_code': 'region_kod',
                'region_name': 'region_nomi',
                'hs6_code': 'hs6_kod',
                'hs6_name': 'hs6_nomi',
                'hs4_code': 'hs4_kod',
                'hs4_name': 'hs4_nomi',
                'hs2_code': 'hs2_kod',
                'hs2_name': 'hs2_nomi',
                'sitc4_code': 'sitc4_kod',
                'sitc4_name': 'sitc4_nomi',
                'sitc3_code': 'sitc3_kod',
                'sitc3_name': 'sitc3_nomi',
                'sitc2_code': 'sitc2_kod',
                'sitc2_name': 'sitc2_nomi',
                'sitc1_code': 'sitc1_kod',
                'sitc1_name': 'sitc1_nomi',
                'value_prefix': 'qiymat_',
                'quantity_prefix': 'miqdor_',
                'total': 'jami_yozuvlar',
                'total_quantity': 'jami_qiymat',
                'average_quantity': 'ortacha_qiymat',
                'max_quantity': 'eng_katta_qiymat',
            },
            'ru': {
                'country_code': 'код_страны',
                'country_name': 'название_страны',
                'country_group_code': 'код_группы',
                'country_group_name': 'название_группы',
                'region_code': 'код_региона',
                'region_name': 'название_региона',
                'hs6_code': 'hs6_код',
                'hs6_name': 'hs6_наименование',
                'hs4_code': 'hs4_код',
                'hs4_name': 'hs4_наименование',
                'hs2_code': 'hs2_код',
                'hs2_name': 'hs2_наименование',
                'sitc4_code': 'sitc4_код',
                'sitc4_name': 'sitc4_наименование',
                'sitc3_code': 'sitc3_код',
                'sitc3_name': 'sitc3_наименование',
                'sitc2_code': 'sitc2_код',
                'sitc2_name': 'sitc2_наименование',
                'sitc1_code': 'sitc1_код',
                'sitc1_name': 'sitc1_наименование',
                'value_prefix': 'стоимость_',  # -> стоимость_2022_M1
                'quantity_prefix': 'количество_',
                'total': 'общее_количество_записей',
                'total_quantity': 'общее_значение',
                'average_quantity': 'среднее_значение',
                'max_quantity': 'самое_высокое_значение',
            },
            'cry': {
                'country_code': 'давлат_код',
                'country_name': 'давлат_номи',
                'country_group_code': 'групп_код',
                'country_group_name': 'групп_номи',
                'region_code': 'регион_код',
                'region_name': 'регион_номи',
                'hs6_code': 'hs6_код',
                'hs6_name': 'hs6_номи',
                'hs4_code': 'hs4_код',
                'hs4_name': 'hs4_номи',
                'hs2_code': 'hs2_код',
                'hs2_name': 'hs2_номи',
                'sitc4_code': 'sitc4_код',
                'sitc4_name': 'sitc4_номи',
                'sitc3_code': 'sitc3_код',
                'sitc3_name': 'sitc3_номи',
                'sitc2_code': 'sitc2_код',
                'sitc2_name': 'sitc2_номи',
                'sitc1_code': 'sitc1_код',
                'sitc1_name': 'sitc1_номи',
                'value_prefix': 'қиймат_',
                'quantity_prefix': 'миқдор_',
                'total': 'жами_ёзувлар',
                'total_quantity': 'жами_қиймат',
                'average_quantity': 'ортача_қиймат',
                'max_quantity': 'энг_катта_қиймат',
            }
        }

        # Label translations for headers
        label_map = {
            'uz': {
                'Country Code': 'Davlat kod',
                'Country': 'Davlat',
                'Group Code': 'Guruh kod',
                'Country Group': 'Guruh',
                'Region Code': 'Region kod',
                'Region': 'Region',
                'Value': 'Qiymat',
                'Quantity': 'Miqdor',
                'Total': 'Jami'
            },
            'ru': {
                'Country Code': 'Код страны',
                'Country': 'Страна',
                'Group Code': 'Код группы',
                'Country Group': 'Группа',
                'Region Code': 'Код региона',
                'Region': 'Регион',
                'Value': 'Стоимость',
                'Quantity': 'Количество',
                'Total': 'Итого'
            },
            'cry': {
                'Country Code': 'Давлат код',
                'Country': 'Давлат',
                'Group Code': 'Групп код',
                'Country Group': 'Группа',
                'Region Code': 'Регион код',
                'Region': 'Регион',
                'Value': 'Қиймат',
                'Quantity': 'Миқдор',
                'Total': 'Жами'
            }
        }

        field_map = field_name_map.get(lang, field_name_map['uz'])
        labels = label_map.get(lang, label_map['uz'])

        # trade type label localized
        if lang == 'ru':
            trade_type_name = "Экспорт" if trade_type == 1 else "Импорт"
        elif lang == 'cry':
            trade_type_name = "Экспорт" if trade_type == 1 else "Импорт"
        else:
            trade_type_name = "Export" if trade_type == 1 else "Import"

        # Determine periods
        periods = quarters if quarters else months
        period_type = 'quarter' if quarters else 'month'

        # Build period columns
        columns = []
        for year in sorted(years):
            for period in periods:
                columns.append(f"{year}_{period}")

        # Decide whether to include quantity columns (only when hs6 is selected)
        include_quantity = 'hs6' in config.get('hs_levels', [])

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
                        meta[field_map['country_code']] = country_code
                        meta[field_map['country_name']] = country_name

                elif dimension == 'country_group':
                    group_code = item.get('country__country_group__code') or item.get('country_group_code')
                    group_name = item.get('country__country_group__name_uz') or item.get('country_group_name')
                    if group_code:
                        dim_key_parts.append(f"group_{group_code}")
                        meta[field_map['country_group_code']] = group_code
                        meta[field_map['country_group_name']] = group_name

                elif dimension == 'region':
                    region_code = item.get('region__soato') or item.get('region_code')
                    region_name = item.get('region__name_uz') or item.get('region_name')
                    if region_code:
                        dim_key_parts.append(f"region_{region_code}")
                        meta[field_map['region_code']] = region_code
                        meta[field_map['region_name']] = region_name

                elif dimension == 'hs':
                    hs_levels = config['hs_levels']
                    for level in hs_levels:
                        hs_code = item.get(f'{level}_code')
                        hs_name = item.get(f'{level}_name') or item.get('product__name_uz')
                        if hs_code:
                            dim_key_parts.append(f"{level}_{hs_code}")
                            code_key = f'{level}_code'
                            name_key = f'{level}_name'
                            meta[field_map.get(code_key, code_key)] = hs_code
                            meta[field_map.get(name_key, name_key)] = hs_name

                elif dimension == 'sitc':
                    sitc_levels = config['sitc_levels']
                    for level in sitc_levels:
                        sitc_code = item.get(f'{level}_code')
                        sitc_name = item.get(f'{level}_name') or item.get('sitc__name_uz')
                        if sitc_code:
                            dim_key_parts.append(f"{level}_{sitc_code}")
                            code_key = f'{level}_code'
                            name_key = f'{level}_name'
                            meta[field_map.get(code_key, code_key)] = sitc_code
                            meta[field_map.get(name_key, name_key)] = sitc_name

            dim_key = "||".join(dim_key_parts) if dim_key_parts else "default"

            # Store meta information
            if not dimension_groups[dim_key]['meta']:
                dimension_groups[dim_key]['meta'] = meta

            # Build period key
            year_value = item.get('year_value') or item.get('year__year')
            period = item.get('period') or item.get('month')
            period_key = f"{year_value}_{period}"

            # Aggregate values
            dimension_groups[dim_key]['values'][period_key]['value'] += float(item.get('total_value') or 0)

            if include_quantity:
                dimension_groups[dim_key]['values'][period_key]['quantity'] += float(item.get('total_quantity') or 0)

        # Build final response data
        data_rows = []
        total_values = {col: {'value': 0, 'quantity': 0 if include_quantity else None} for col in columns}

        value_prefix = field_map.get('value_prefix', 'value_')
        quantity_prefix = field_map.get('quantity_prefix', 'quantity_')

        for dim_key, group_data in dimension_groups.items():
            row = {}

            # Add meta information
            row.update(group_data['meta'])

            # Add period columns (localized keys for value/quantity)
            for col_name in columns:
                value_key = f"{value_prefix}{col_name}"
                row[value_key] = round(group_data['values'].get(col_name, {}).get('value', 0), 2)

                if include_quantity:
                    qty_key = f"{quantity_prefix}{col_name}"
                    row[qty_key] = round(group_data['values'].get(col_name, {}).get('quantity', 0), 2)
                    # Add to totals
                    total_values[col_name]['value'] += group_data['values'].get(col_name, {}).get('value', 0)
                    total_values[col_name]['quantity'] += group_data['values'].get(col_name, {}).get('quantity', 0)
                else:
                    total_values[col_name]['value'] += group_data['values'].get(col_name, {}).get('value', 0)

            row['isGroupSummary'] = False
            data_rows.append(row)

        total_label = f"{trade_type_name}, {labels.get('Total','Total')}:"
        total_row = {'label': total_label, 'isGroupSummary': True}
        for col_name in columns:
            total_row[f"{value_prefix}{col_name}"] = round(total_values[col_name]['value'], 2)
            if include_quantity:
                total_row[f"{quantity_prefix}{col_name}"] = round(total_values[col_name]['quantity'], 2)
        data_rows.append(total_row)

        total = field_map.get('total')
        total_quantity = field_map.get('total_quantity')
        average_quantity = field_map.get('average_quantity')
        max_quantity = field_map.get('max_quantity')
        if grouped_queryset:
            stat = {
                f"{total}": len(grouped_queryset),
                f"{total_quantity}": grouped_queryset.aggregate(max_quantity=Max('quantity')),
                f"{average_quantity}": grouped_queryset.aggregate(avg_quantity=Avg('quantity'),),
                f"{max_quantity}": grouped_queryset.aggregate(total_quantity=Sum('quantity')),
            }
        else:
            stat = {}
        # Build headers
        headers = self._build_headers(config, columns, period_type, include_quantity, lang=lang,
                                     field_map=field_map, labels=labels)

        # Build final response
        units = ['USD 1000']
        if include_quantity:
            units.append('kg')

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
            'units': units,
            'missing': [],
            'stat': stat,
        }

        # Add period info
        if period_type == 'quarter':
            response['filters']['quarters'] = periods
        else:
            response['filters']['months'] = periods

        return response

    # -------------------------
    # Localized headers builder
    # -------------------------
    def _build_headers(self, config, columns, period_type, include_quantity=False, lang='uz',
                       field_map=None, labels=None):
        """Build headers for response with localized field names and labels"""
        headers = []
        if field_map is None:
            field_map = {}
        if labels is None:
            labels = {}

        value_prefix = field_map.get('value_prefix', 'value_')
        quantity_prefix = field_map.get('quantity_prefix', 'quantity_')

        # Add dimension headers (use localized field names)
        for dimension in config['dimensions']:
            if dimension == 'country':
                headers.extend([
                    {'field': field_map.get('country_code', 'country_code'),
                     'label': labels.get('Country Code', 'Country Code')},
                    {'field': field_map.get('country_name', 'country_name'),
                     'label': labels.get('Country', 'Country')}
                ])
            elif dimension == 'country_group':
                headers.extend([
                    {'field': field_map.get('country_group_code', 'country_group_code'),
                     'label': labels.get('Group Code', 'Group Code')},
                    {'field': field_map.get('country_group_name', 'country_group_name'),
                     'label': labels.get('Country Group', 'Country Group')}
                ])
            elif dimension == 'region':
                headers.extend([
                    {'field': field_map.get('region_code', 'region_code'),
                     'label': labels.get('Region Code', 'Region Code')},
                    {'field': field_map.get('region_name', 'region_name'),
                     'label': labels.get('Region', 'Region')}
                ])
            elif dimension == 'hs':
                hs_levels = config.get('hs_levels', [])
                for level in hs_levels:
                    code_key = f'{level}_code'
                    name_key = f'{level}_name'
                    headers.extend([
                        {'field': field_map.get(code_key, code_key),
                         'label': f"{level.upper()} {labels.get('Code','Code')}"},
                        {'field': field_map.get(name_key, name_key),
                         'label': f"{level.upper()} {labels.get('Value','Product Name')}"}
                    ])
            elif dimension == 'sitc':
                sitc_levels = config.get('sitc_levels', [])
                for level in sitc_levels:
                    code_key = f'{level}_code'
                    name_key = f'{level}_name'
                    headers.extend([
                        {'field': field_map.get(code_key, code_key),
                         'label': f"{level.upper()} {labels.get('Code','Code')}"},
                        {'field': field_map.get(name_key, name_key),
                         'label': f"{level.upper()} {labels.get('Value','Category Name')}"}
                    ])

        # Add period headers (value_XXXX and quantity_XXXX localized)
        for col_name in columns:
            year, period = col_name.split('_', 1)

            if period_type == 'quarter':
                period_label = period
            else:
                month_labels_en = {
                    'M1': 'Jan', 'M2': 'Jan-Feb', 'M3': 'Jan-Mar',
                    'M4': 'Jan-Apr', 'M5': 'Jan-May', 'M6': 'Jan-Jun',
                    'M7': 'Jan-Jul', 'M8': 'Jan-Aug', 'M9': 'Jan-Sep',
                    'M10': 'Jan-Oct', 'M11': 'Jan-Nov', 'M12': 'Jan-Dec'
                }
                period_label = month_labels_en.get(period, period)

            headers.append({
                'field': f"{value_prefix}{col_name}",
                'label': f"{labels.get('Value','Value')} {year} {period_label} (USD 1000)"
            })

            if include_quantity:
                headers.append({
                    'field': f"{quantity_prefix}{col_name}",
                    'label': f"{labels.get('Quantity','Quantity')} {year} {period_label}"
                })

        return headers