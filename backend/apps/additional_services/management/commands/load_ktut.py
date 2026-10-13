import os
import pandas as pd
import django
from django.core.management.base import BaseCommand
from django.db import transaction
from django.conf import settings
import multiprocessing
from tqdm import tqdm
from django import db


def initialize_django():
    """Initialize Django for each worker process"""
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
    django.setup()
    db.connections.close_all()  # Close any existing connections


def process_chunk(df_chunk):
    """Process a chunk of data"""
    # Initialize Django in the worker process
    initialize_django()
    
    # Now import model after Django is initialized
    from apps.additional_services.models import Ktut
    
    ktut_objects = []
    for _, row in df_chunk.iterrows():
        try:
            inn = str(row['INN']).strip()
            okpo = str(row['OKPO']).strip()
            name = str(row['NAME']).strip()
            
            ktut = Ktut(
                inn=inn,
                okpo=okpo,
                name=name
            )
            ktut_objects.append(ktut)
        except Exception as e:
            print(f"Error processing row: {e}")
    
    # Use update_or_create with bulk operation
    with transaction.atomic():
        # Use bulk_create with update_conflicts to efficiently handle duplicates
        Ktut.objects.bulk_create(
            ktut_objects,
            update_conflicts=True,
            update_fields=['okpo', 'name'],
            unique_fields=['inn']
        )
    
    return len(ktut_objects)


class Command(BaseCommand):
    help = 'Import Ktut data from Excel file using multiprocessing'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, default="reports_list.xlsx", help='Excel file name in datas directory')
        parser.add_argument('--workers', type=int, default=None, help='Number of worker processes')
        parser.add_argument('--single', action='store_true', help='Force single-process mode')
    
    def handle(self, *args, **options):
        file_name = options.get('file', "reports_list.xlsx")
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
            # Read Excel file
            self.stdout.write(self.style.SUCCESS(f'Reading Excel file: {file_path}'))
            df = pd.read_excel(file_path)
            
            # Clean column names
            df.columns = df.columns.str.strip()
            
            # Verify required columns
            required_columns = ['OKPO', 'NAME', 'INN']
            for col in required_columns:
                if col not in df.columns:
                    self.stderr.write(self.style.ERROR(f'Required column {col} not found'))
                    return
            
            self.stdout.write(self.style.SUCCESS(f'Found {len(df)} records to import'))
            
            # Use single process if data is small or forced
            if len(df) < 1000 or force_single:
                self.stdout.write(self.style.SUCCESS('Using single process mode'))
                total_processed = process_chunk(df)
                self.stdout.write(self.style.SUCCESS(f'Processed {total_processed} records'))
                return
            
            # Split dataframe into chunks for parallel processing
            chunk_size = len(df) // workers + 1
            df_chunks = [df[i:i + chunk_size] for i in range(0, len(df), chunk_size)]
            
            self.stdout.write(self.style.SUCCESS(f'Starting parallel import with {workers} workers'))
            
            # Process chunks in parallel
            total_processed = 0
            with multiprocessing.Pool(processes=workers, initializer=initialize_django) as pool:
                results = list(tqdm(
                    pool.imap(process_chunk, df_chunks),
                    total=len(df_chunks),
                    desc="Processing chunks"
                ))
                
                # Sum up results
                total_processed = sum(results)
            
            self.stdout.write(self.style.SUCCESS(f'Import complete: {total_processed} records processed'))
            
        except Exception as e:
            import traceback
            self.stderr.write(self.style.ERROR(f'Error importing data: {str(e)}'))
            self.stderr.write(self.style.ERROR(traceback.format_exc()))