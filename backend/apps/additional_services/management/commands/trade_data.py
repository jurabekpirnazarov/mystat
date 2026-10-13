import pandas as pd
import os
import django
from django.core.management.base import BaseCommand
from django.db import transaction
from decimal import Decimal, InvalidOperation
from django.conf import settings
import multiprocessing
from tqdm import tqdm
import numpy as np
from django import db


def initialize_django():
    """Initialize Django for each worker process"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
    django.setup()
    db.connections.close_all()  # Close any existing connections


def process_chunk(chunk_data):
    """Process a chunk of data"""
    # Initialize Django in the worker process
    initialize_django()
    from apps.additional_services.models import (
        Product, SITC, Year, Country, Region, Unit, TradeData
    )
    # Now import models after Django is initialized
    from apps.additional_services.models import TradeData
    
    df_chunk, product_dict, sitc_dict, country_dict, region_dict, unit_dict, years = chunk_data
    
    success_count = 0
    error_count = 0
    trade_data_objects = []
    for index, row in df_chunk.iterrows():
        try:
            # Process year
            year_str = str(row['GOD']).split('.')[0].split(',')[0]
            year_int = int(year_str)
            year_obj = years[0]
            
            # Process month
            if 'M' in str(row['GOD']):
                month = str(row['GOD']).split('M')[1]
                month = f"M{month}"
            else:
                month = "M1"
            
            # Get objects from cached dictionaries
            product = product_dict.get(str(row['TOVAR6']))
            sitc = sitc_dict.get(str(row['SITC5']))
            country = country_dict.get(str(row['CTRANA']))
            region = region_dict.get(str(row['TERR']))
            unit = unit_dict.get(str(row['EDIZM']))
            
            if not all([product, sitc, country, region, unit, year_obj]):
                error_count += 1
                continue
            
            # Convert trade_type
            trade_type = 1 if int(row['EI']) == 1 else 2
            
            # Handle quantity and value - FIXED NAN HANDLING
            quantity = None
            value = None
            
            # Safely handle quantity
            try:
                quantity_val = row['SUM_KOL']
                if pd.notna(quantity_val) and quantity_val != '#########':
                    quantity_str = str(quantity_val).replace(',', '.')
                    quantity = Decimal(quantity_str)
            except (InvalidOperation, TypeError, ValueError):
                pass  # Keep as None if conversion fails
                
            # Safely handle value
            try:
                value_val = row['SUM_SUM']
                if pd.notna(value_val) and value_val != '#########':
                    value_str = str(value_val).replace(',', '.')
                    value = Decimal(value_str)
            except (InvalidOperation, TypeError, ValueError):
                pass  # Keep as None if conversion fails
            
            # Create TradeData object dict (with only IDs to avoid serialization issues)
            trade_data = TradeData(
                year=year_obj,
                country_id=country.id,
                product_id=product.id,
                trade_type=trade_type,
                unit_id=unit.id,
                month=month,
                region_id=region.id,
                sitc_id=sitc.id,
                value=value,
                quantity=quantity
            )
            
            trade_data_objects.append(trade_data)
            success_count += 1
            
        except Exception as e:
            error_count += 1
    
    # Bulk create all objects at once
    with transaction.atomic():
        TradeData.objects.bulk_create(trade_data_objects, ignore_conflicts=True)
    
    return success_count, error_count


class Command(BaseCommand):
    help = 'Import trade data from Excel file'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, help='Path to the Excel file')
        parser.add_argument('--workers', type=int, default=None, help='Number of worker processes')
        parser.add_argument('--single', action='store_true', help='Force single-process mode')
        parser.add_argument('--year', type=int, default=None, help='Enter a yer')
    
    def handle(self, *args, **options):
        file_name = options.get('file', "trade_data.xlsx")
        year = options.get('year', None)
        file_path = os.path.join(settings.BASE_DIR, f"datas/{file_name}")
        
        if not os.path.exists(file_path):
            self.stderr.write(self.style.ERROR(f'File not found: {file_path}'))
            return
        
        # Get number of worker processes
        workers = options.get('workers')
        if not workers:
            # Use max 75% of available cores but at least 1
            workers = max(1, int(multiprocessing.cpu_count() * 0.75))
        
        # Force single process if requested
        force_single = options.get('single', False)
        
        try:
            # Read Excel file with string data types for code columns
            self.stdout.write(self.style.SUCCESS('Reading Excel file...'))
            
            # Define which columns should be treated as strings to preserve leading zeros
            string_columns = ['TOVAR2', 'TOVAR4', 'TOVAR6', 'SITC1', 'SITC2', 'SITC3', 'SITC4', 'SITC5', 'CTRANA', 'TERR', 'EDIZM']
            dtype_dict = {col: str for col in string_columns}
            
            # Read with proper data types
            df = pd.read_excel(file_path, dtype=dtype_dict)
            df.columns = df.columns.str.strip()
            
            # Replace NaN values with None in the entire DataFrame
            df = df.replace({np.nan: None})
            
            # Validate required columns
            expected_columns = ['EI', 'TOVAR6', 'EDIZM', 'GOD', 'CTRANA', 'TERR', 'SITC5', 'SUM_KOL', 'SUM_SUM']
            for col in expected_columns:
                if col not in df.columns:
                    self.stderr.write(self.style.ERROR(f'Required column {col} not found in file'))
                    return
            
            self.stdout.write(self.style.SUCCESS(f'Found {len(df)} records to import'))
            
            # Use single process if data is small or forced
            if len(df) < 10000 or force_single:
                self.stdout.write(self.style.SUCCESS('Using single process mode'))
                self._process_data_single(df)
                return
            
            # Import necessary models here in the main process
            from apps.additional_services.models import (
                Product, SITC, Year, Country, Region, Unit
            )
            
            # Preload all reference data once
            self.stdout.write(self.style.SUCCESS('Preloading reference data...'))
            products = {p.code: p for p in Product.objects.all()}
            sitcs = {s.code: s for s in SITC.objects.all()}
            countries = {c.ctrana: c for c in Country.objects.all()}
            regions = {r.soato: r for r in Region.objects.all()}
            units = {u.code: u for u in Unit.objects.all()}
            
            # Get or create all years upfront
            self.stdout.write(self.style.SUCCESS('Preparing years...'))
            # unique_years = set()
            #
            # # Safely extract years
            # for year_val in df['GOD']:
            #     try:
            #         if pd.notna(year_val):
            #             year_str = str(year_val).split('.')[0].split(',')[0]
            #             unique_years.add(int(year_str))
            #     except (ValueError, TypeError, AttributeError):
            #         pass  # Skip invalid years
            #
            years = []
            year_int = int(year)
            year_obj, _ = Year.objects.get_or_create(year=year_int)
            years.append(year_obj)
            
            # Split dataframe into chunks for parallel processing
            chunk_size = len(df) // workers + 1
            df_chunks = [df[i:i + chunk_size] for i in range(0, len(df), chunk_size)]
            
            self.stdout.write(self.style.SUCCESS(f'Starting parallel import with {workers} workers...'))
            # Use multiprocessing.Pool for better Windows compatibility
            pool_data = [(chunk, products, sitcs, countries, regions, units, years) for chunk in df_chunks]
            
            total_success = 0
            total_errors = 0
            
            # Use Pool instead of ProcessPoolExecutor for better Windows compatibility
            with multiprocessing.Pool(processes=workers, initializer=initialize_django) as pool:

                results = list(tqdm(
                    pool.imap(process_chunk, pool_data),
                    total=len(pool_data),
                    desc="Processing chunks"
                ))
                
                # Combine results
                for success, errors in results:
                    total_success += success
                    total_errors += errors
            
            self.stdout.write(self.style.SUCCESS(f'Import complete: {total_success} records imported, {total_errors} errors'))
            
        except Exception as e:
            import traceback
            self.stderr.write(self.style.ERROR(f'Error importing data: {str(e)}'))
            self.stderr.write(self.style.ERROR(traceback.format_exc()))
    
    def _process_data_single(self, df):
        """Process data in a single process for small datasets"""
        from apps.additional_services.models import (
            Product, SITC, Year, Country, Region, Unit, TradeData
        )
        
        # Preload reference data
        products = {p.code: p for p in Product.objects.all()}
        sitcs = {s.code: s for s in SITC.objects.all()}
        countries = {c.ctrana: c for c in Country.objects.all()}
        regions = {r.soato: r for r in Region.objects.all()}
        units = {u.code: u for u in Unit.objects.all()}
        years = {}
        
        success_count = 0
        error_count = 0
        batch_size = 5000
        trade_data_objects = []
        
        with tqdm(total=len(df), desc="Processing records") as pbar:
            for index, row in df.iterrows():
                try:
                    # Process year
                    year_str = str(row['GOD']).split('.')[0].split(',')[0]
                    year_int = int(year_str)
                    
                    # Get or create year (with caching)
                    if year_int not in years:
                        years[year_int], _ = Year.objects.get_or_create(year=year_int)
                    year_obj = years[year_int]
                    
                    # Process month
                    if 'M' in str(row['GOD']):
                        month = str(row['GOD']).split('M')[1]
                        month = f"M{month}"
                    else:
                        month = "M1"
                    
                    # Get objects from cached dictionaries
                    product = products.get(str(row['TOVAR6']))
                    sitc = sitcs.get(str(row['SITC5']))
                    country = countries.get(str(row['CTRANA']))
                    region = regions.get(str(row['TERR']))
                    unit = units.get(str(row['EDIZM']))
                    
                    if not all([product, sitc, country, region, unit]):
                        error_count += 1
                        pbar.update(1)
                        continue
                    
                    # Convert trade_type
                    trade_type = 1 if int(row['EI']) == 1 else 2
                    
                    # Safely handle quantity and value
                    quantity = None
                    value = None
                    
                    # Safely handle quantity
                    try:
                        quantity_val = row['SUM_KOL']
                        if pd.notna(quantity_val) and quantity_val != '#########':
                            quantity_str = str(quantity_val).replace(',', '.')
                            quantity = Decimal(quantity_str)
                    except (InvalidOperation, TypeError, ValueError):
                        pass  # Keep as None if conversion fails
                        
                    # Safely handle value
                    try:
                        value_val = row['SUM_SUM']
                        if pd.notna(value_val) and value_val != '#########':
                            value_str = str(value_val).replace(',', '.')
                            value = Decimal(value_str)
                    except (InvalidOperation, TypeError, ValueError):
                        pass  # Keep as None if conversion fails
                    
                    # Create TradeData object
                    trade_data = TradeData(
                        year=year_obj,
                        country=country,
                        product=product,
                        trade_type=trade_type,
                        unit=unit,
                        month=month,
                        region=region,
                        sitc=sitc,
                        value=value,
                        quantity=quantity
                    )
                    
                    trade_data_objects.append(trade_data)
                    success_count += 1
                    
                    # Bulk create in batches
                    if len(trade_data_objects) >= batch_size:
                        with transaction.atomic():
                            TradeData.objects.bulk_create(trade_data_objects, ignore_conflicts=True)
                        trade_data_objects = []
                        
                except Exception as e:
                    error_count += 1
                    self.stderr.write(f"Error on row {index+1}: {str(e)}")
                
                pbar.update(1)
            
            # Create any remaining objects
            if trade_data_objects:
                with transaction.atomic():
                    TradeData.objects.bulk_create(trade_data_objects, ignore_conflicts=True)
        
        self.stdout.write(self.style.SUCCESS(f'Import complete: {success_count} records imported, {error_count} errors'))