import math
import pandas as pd
import numpy as np
from import_export import resources, results
from import_export.instance_loaders import BaseInstanceLoader
from django.db import transaction
from apps.additional_services.models.ex_trade import TradeData, Product, Unit, Year, Country, Region, SITC
from collections import defaultdict
from decimal import Decimal


class NoopInstanceLoader(BaseInstanceLoader):
    def __init__(self, resource, dataset=None):
        super().__init__(resource)

    def get_instance(self, row):
        return None


def _n(val):
    """
    Raqam normalizatsiyasi:
      - NaN -> None
      - '123.0' -> 123
    """
    if pd.isna(val):
        return None
    if isinstance(val, (int, float)):
        if math.isnan(val) if isinstance(val, float) else False:
            return None
        return val
    
    s = str(val).strip()
    if not s:
        return None
    
    try:
        if '.' in s:
            return float(s)
        return int(s)
    except (ValueError, TypeError):
        return None


def _t(val):
    """Matn normalizatsiyasi (NaN -> "", strip)."""
    if pd.isna(val):
        return ""
    return str(val).strip()


def _d(val):
    """Decimal normalizatsiyasi"""
    if pd.isna(val) or val is None:
        return None
    try:
        return Decimal(str(val))
    except:
        return None


def parse_god_month(god_value):
    """
    GOD qiymatini parse qilish: '2022.M1' -> (2022, 'M1')
    """
    if pd.isna(god_value):
        return None, None
    
    god_str = str(god_value).strip()
    if '.' in god_str:
        parts = god_str.split('.')
        if len(parts) == 2:
            try:
                year = int(parts[0])
                month = parts[1].strip()
                return year, month
            except:
                pass
    
    # Agar format noto'g'ri bo'lsa, faqat yil deb hisoblaymiz
    try:
        year = int(float(god_str))
        return year, 'M1'  # Default month
    except:
        return None, None


class TradeDataExcelResource(resources.Resource):
    """
    TradeData Import Resource with Pandas optimization:
      - Excel headers: EI, TOVAR6, EDIZM, GOD, CTRANA, TERR, SITC5, SUM_KOL, SUM_SUM
      - Bulk operations with foreign key lookups
      - Pandas optimized processing
    """
    supports_export = False

    @classmethod
    def get_display_name(cls):
        return "Trade Data Excel (optimized with pandas and bulk operations)"

    class Meta:
        skip_unchanged = True
        report_skipped = True
        use_transactions = True
        instance_loader_class = NoopInstanceLoader

    # Excel ustunlari mapping
    COLUMN_MAPPING = {
        'ei': 'trade_type',
        'tovar6': 'product_code', 
        'edizm': 'unit_code',
        'god': 'year_month',
        'ctrana': 'country_code',
        'terr': 'region_code',
        'sitc5': 'sitc_code',
        'sum_kol': 'quantity',
        'sum_sum': 'value'
    }

    def _normalize_column_names(self, df):
        """DataFrame ustun nomlarini normallash"""
        # Ustun nomlarini kichik harflarga o'tkazish
        df.columns = [str(col).lower().strip() for col in df.columns]
        
        # Mapping bo'yicha o'zgartirish
        df = df.rename(columns=self.COLUMN_MAPPING)
        return df

    def _safe_create_dataframe_from_queryset(self, queryset, expected_columns):
        """QuerySet'dan DataFrame yaratish va ustunlarni tekshirish"""
        try:
            data = list(queryset)
            if not data:
                # Bo'sh DataFrame yaratish
                return pd.DataFrame(columns=expected_columns), {}
            
            df = pd.DataFrame(data)
            
            # Kerakli ustunlar mavjudligini tekshirish
            missing_cols = [col for col in expected_columns if col not in df.columns]
            if missing_cols:
                print(f"Warning: Missing columns {missing_cols} in queryset")
                for col in missing_cols:
                    df[col] = None
            
            return df, dict(zip(df[expected_columns[1]], df[expected_columns[0]]))
        except Exception as e:
            print(f"Error creating DataFrame: {e}")
            return pd.DataFrame(columns=expected_columns), {}

    @transaction.atomic
    def before_import(self, dataset, **kwargs):
        # Ma'lumotni DataFramega o'tkazish
        df = pd.DataFrame(dataset.dict)
        
        if df.empty:
            self._summary_text = "No data to import"
            return
        
        # Ustun nomlarini normallashtirish
        df = self._normalize_column_names(df)
        
        # Kerakli ustunlar mavjudligini tekshirish
        required_columns = ['trade_type', 'product_code', 'unit_code', 'year_month', 
                          'country_code', 'region_code', 'sitc_code', 'quantity', 'value']
        
        missing_columns = [col for col in required_columns if col not in df.columns]
        if missing_columns:
            self._summary_text = f"Missing columns: {missing_columns}"
            return
        
        # Ma'lumotlarni tozalash va normallash
        df['trade_type'] = df['trade_type'].apply(lambda x: _n(x))
        df['product_code'] = df['product_code'].apply(lambda x: _t(x))
        df['unit_code'] = df['unit_code'].apply(lambda x: _t(x))
        df['year_month'] = df['year_month'].apply(lambda x: _t(x))
        df['country_code'] = df['country_code'].apply(lambda x: _t(x))
        df['region_code'] = df['region_code'].apply(lambda x: _t(x))
        df['sitc_code'] = df['sitc_code'].apply(lambda x: _t(x))
        df['quantity'] = df['quantity'].apply(lambda x: _d(x))
        df['value'] = df['value'].apply(lambda x: _d(x))
        
        # Bo'sh qatorlarni olib tashlash
        df = df.dropna(subset=['product_code', 'country_code', 'region_code'])
        df = df[df['product_code'] != '']
        df = df[df['country_code'] != '']
        
        # GOD ustunini parse qilish
        df[['year_value', 'month_value']] = df['year_month'].apply(
            lambda x: pd.Series(parse_god_month(x))
        )
        
        # Bo'sh year qatorlarni olib tashlash
        df = df.dropna(subset=['year_value'])
        df['year_value'] = df['year_value'].astype(int)
        
        # Month default qiymatini o'rnatish
        df['month_value'] = df['month_value'].fillna('M1')
        
        # Foreign key obyektlarini bulk olish
        print(f"Loading foreign key objects...")
        
        # Products (level=3, 6 xonali)
        product_codes = df['product_code'].unique()
        product_codes = [code for code in product_codes if code]  # Bo'sh kodlarni olib tashlash
        print(f"Looking for {len(product_codes)} product codes")
        
        products_df, product_map = self._safe_create_dataframe_from_queryset(
            Product.objects.filter(code__in=product_codes, level=3).values('id', 'code'),
            ['id', 'code']
        )
        
        # Units
        unit_codes = df['unit_code'].unique()
        unit_codes = [code for code in unit_codes if code]  # Bo'sh kodlarni olib tashlash
        print(f"Looking for {len(unit_codes)} unit codes")
        
        units_df, unit_map = self._safe_create_dataframe_from_queryset(
            Unit.objects.filter(code__in=unit_codes).values('id', 'code'),
            ['id', 'code']
        )
        
        # Years
        year_values = df['year_value'].unique()
        year_values = [year for year in year_values if not pd.isna(year)]
        print(f"Looking for {len(year_values)} years")
        
        years_df, year_map = self._safe_create_dataframe_from_queryset(
            Year.objects.filter(year__in=year_values).values('id', 'year'),
            ['id', 'year']
        )
        
        # Countries
        country_codes = df['country_code'].unique()
        country_codes = [code for code in country_codes if code]
        print(f"Looking for {len(country_codes)} country codes")
        
        countries_df, country_map = self._safe_create_dataframe_from_queryset(
            Country.objects.filter(ctrana__in=country_codes).values('id', 'ctrana'),
            ['id', 'ctrana']
        )
        
        # Regions
        region_codes = df['region_code'].unique()
        region_codes = [code for code in region_codes if code]
        print(f"Looking for {len(region_codes)} region codes")
        
        regions_df, region_map = self._safe_create_dataframe_from_queryset(
            Region.objects.filter(soato__in=region_codes).values('id', 'soato'),
            ['id', 'soato']
        )
        
        # SITC (level=4)
        sitc_codes = df['sitc_code'].unique()
        sitc_codes = [code for code in sitc_codes if code]
        print(f"Looking for {len(sitc_codes)} SITC codes")
        
        sitc_df, sitc_map = self._safe_create_dataframe_from_queryset(
            SITC.objects.filter(code__in=sitc_codes, level=4).values('id', 'code'),
            ['id', 'code']
        )
        
        print(f"Loaded FKs: Products={len(product_map)}, Units={len(unit_map)}, "
              f"Years={len(year_map)}, Countries={len(country_map)}, "
              f"Regions={len(region_map)}, SITC={len(sitc_map)}")
        
        # Yo'q foreign keylarni yaratish
        missing_years = [year for year in year_values if year not in year_map]
        if missing_years:
            print(f"Creating {len(missing_years)} missing years: {missing_years}")
            year_objects = [Year(year=year) for year in missing_years]
            Year.objects.bulk_create(year_objects, ignore_conflicts=True)
            # Qayta yuklash
            years_df, year_map = self._safe_create_dataframe_from_queryset(
                Year.objects.filter(year__in=year_values).values('id', 'year'),
                ['id', 'year']
            )
        
        # DataFrame'ga foreign key ID'larni qo'shish
        df['product_id'] = df['product_code'].map(product_map)
        df['unit_id'] = df['unit_code'].map(unit_map)
        df['year_id'] = df['year_value'].map(year_map)
        df['country_id'] = df['country_code'].map(country_map)
        df['region_id'] = df['region_code'].map(region_map)
        df['sitc_id'] = df['sitc_code'].map(sitc_map)
        
        # Missing FK'lari haqida ma'lumot berish
        missing_products = df[df['product_id'].isna()]['product_code'].unique()
        missing_units = df[df['unit_id'].isna()]['unit_code'].unique()
        missing_countries = df[df['country_id'].isna()]['country_code'].unique()
        missing_regions = df[df['region_id'].isna()]['region_code'].unique()
        missing_sitc = df[df['sitc_id'].isna()]['sitc_code'].unique()
        
        if len(missing_products) > 0:
            print(f"Missing products (level=3): {list(missing_products)[:10]}...")
        if len(missing_units) > 0:
            print(f"Missing units: {list(missing_units)[:10]}...")
        if len(missing_countries) > 0:
            print(f"Missing countries: {list(missing_countries)[:10]}...")
        if len(missing_regions) > 0:
            print(f"Missing regions: {list(missing_regions)[:10]}...")
        if len(missing_sitc) > 0:
            print(f"Missing SITC (level=4): {list(missing_sitc)[:10]}...")
        
        # Yo'q foreign key'li qatorlarni olib tashlash
        initial_count = len(df)
        df = df.dropna(subset=['product_id', 'unit_id', 'year_id', 'country_id', 'region_id', 'sitc_id'])
        final_count = len(df)
        
        if initial_count > final_count:
            print(f"Filtered out {initial_count - final_count} rows due to missing foreign keys")
        
        if final_count == 0:
            self._summary_text = f"No valid rows after FK filtering. Check missing FK mappings above."
            return
        
        # Mavjud TradeData obyektlarini tekshirish
        existing_keys = set()
        if not df.empty:
            existing_trade_data = TradeData.objects.filter(
                year_id__in=df['year_id'].unique(),
                country_id__in=df['country_id'].unique(),
                product_id__in=df['product_id'].unique()
            ).values_list('year_id', 'country_id', 'product_id')
            
            for yk_tuple in existing_trade_data:
                existing_keys.add(yk_tuple)
        
        print(f"Found {len(existing_keys)} existing trade data records")
        
        # Yangi qo'shilishi kerak bo'lgan qatorlarni aniqlash
        def is_new_record(row):
            key = (int(row['year_id']), int(row['country_id']), int(row['product_id']))
            return key not in existing_keys
        
        df['is_new'] = df.apply(is_new_record, axis=1)
        new_df = df[df['is_new']].copy()
        
        print(f"Creating {len(new_df)} new trade data records")
        
        # Bulk create
        if not new_df.empty:
            trade_data_objects = []
            
            for _, row in new_df.iterrows():
                trade_data_objects.append(TradeData(
                    trade_type=int(row['trade_type']) if not pd.isna(row['trade_type']) else 1,
                    product_id=int(row['product_id']),
                    unit_id=int(row['unit_id']),
                    year_id=int(row['year_id']),
                    month=row['month_value'],
                    country_id=int(row['country_id']),
                    region_id=int(row['region_id']),
                    sitc_id=int(row['sitc_id']),
                    value=row['value'],
                    quantity=row['quantity']
                ))
            
            # Chunk'larga bo'lib yaratish
            CHUNK_SIZE = 1000
            created_count = 0
            
            for i in range(0, len(trade_data_objects), CHUNK_SIZE):
                chunk = trade_data_objects[i:i+CHUNK_SIZE]
                try:
                    created = TradeData.objects.bulk_create(chunk, ignore_conflicts=True)
                    created_count += len(created)
                    print(f"Created chunk {i//CHUNK_SIZE + 1}: {len(created)} records")
                except Exception as e:
                    print(f"Error creating chunk {i//CHUNK_SIZE + 1}: {e}")
            
            self._created = created_count
        else:
            self._created = 0
        
        self._updated = 0  # Update operatsiyasi yo'q
        
        self._summary_text = (
            f"Created: {self._created}, Updated: {self._updated}, "
            f"Total processed: {len(df)}, "
            f"Skipped existing: {len(df) - len(new_df)}, "
            f"FK mappings: P={len(product_map)}, U={len(unit_map)}, "
            f"Y={len(year_map)}, C={len(country_map)}, R={len(region_map)}, S={len(sitc_map)}"
        )

    def import_row(self, row, instance_loader, **kwargs):
        rr = results.RowResult()
        rr.import_type = results.RowResult.IMPORT_TYPE_SKIP
        rr.diff = [getattr(self, "_summary_text", "done (pandas bulk operations)")]
        rr.errors = []
        return rr
