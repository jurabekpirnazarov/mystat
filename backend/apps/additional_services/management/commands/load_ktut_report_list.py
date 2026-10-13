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
    
    # Now import models after Django is initialized
    from apps.additional_services.models import Ktut, ReportList, KtutReportList
    
    # Batch objects for bulk creation
    ktut_report_list_objects = []
    errors = 0
    processed = 0
    
    # Pre-fetch all needed Ktut and ReportList objects to minimize database queries
    unique_inns = df_chunk['inn'].unique().tolist()
    unique_report_ids = df_chunk['id'].unique().tolist()
    
    # Get all needed Ktut objects in one query
    ktut_dict = {ktut.inn: ktut for ktut in Ktut.objects.filter(inn__in=unique_inns)}
    
    # Get all needed ReportList objects in one query
    report_dict = {str(report.id): report for report in ReportList.objects.filter(id__in=unique_report_ids)}
    
    for _, row in df_chunk.iterrows():
        try:
            inn = str(row['inn']).strip()
            report_id = str(row['id']).strip()
            
            # Check if both objects exist
            ktut = ktut_dict.get(inn)
            report = report_dict.get(report_id)
            
            if ktut and report:
                # Create relation object
                ktut_report_list = KtutReportList(
                    ktut=ktut,
                    reportlist=report
                )
                ktut_report_list_objects.append(ktut_report_list)
                processed += 1
            else:
                if not ktut:
                    print(f"Ktut with inn {inn} not found")
                if not report:
                    print(f"ReportList with id {report_id} not found")
                errors += 1
                
        except Exception as e:
            print(f"Error processing row: {e}")
            errors += 1
    
    # Bulk create with ignore_conflicts to handle duplicates
    with transaction.atomic():
        KtutReportList.objects.bulk_create(
            ktut_report_list_objects, 
            ignore_conflicts=True
        )
    
    return processed, errors


class Command(BaseCommand):
    help = 'Import KtutReportList data from Excel file using multiprocessing'

    def add_arguments(self, parser):
        parser.add_argument('--file', type=str, default="ktut_report_list.xlsx", 
                            help='Excel file name in datas directory')
        parser.add_argument('--workers', type=int, default=None, 
                            help='Number of worker processes')
        parser.add_argument('--single', action='store_true', 
                            help='Force single-process mode')
        parser.add_argument('--chunk-size', type=int, default=5000,
                            help='Chunk size for processing')
    
    def handle(self, *args, **options):
        file_name = options.get('file', "ktut_report_list.xlsx")
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
        chunk_size = options.get('chunk_size', 5000)
        
        try:
            # Read Excel file
            self.stdout.write(self.style.SUCCESS(f'Reading Excel file: {file_path}'))
            df = pd.read_excel(file_path)
            
            # Clean column names and convert to lowercase
            df.columns = [col.strip().lower() for col in df.columns]
            
            # Verify required columns
            required_columns = ['id', 'inn']
            for col in required_columns:
                if col not in df.columns:
                    self.stderr.write(self.style.ERROR(f'Required column {col} not found'))
                    return
            
            self.stdout.write(self.style.SUCCESS(f'Found {len(df)} records to import'))
            
            # Use single process if data is small or forced
            if len(df) < 1000 or force_single:
                self.stdout.write(self.style.SUCCESS('Using single process mode'))
                processed, errors = process_chunk(df)
                self.stdout.write(self.style.SUCCESS(
                    f'Import complete: {processed} records processed, {errors} errors'
                ))
                return
            
            # Split dataframe into chunks for parallel processing
            df_chunks = [df[i:i + chunk_size] for i in range(0, len(df), chunk_size)]
            
            self.stdout.write(self.style.SUCCESS(
                f'Starting parallel import with {workers} workers and {len(df_chunks)} chunks'
            ))
            
            # Process chunks in parallel
            total_processed = 0
            total_errors = 0
            
            with multiprocessing.Pool(processes=workers, initializer=initialize_django) as pool:
                results = list(tqdm(
                    pool.imap(process_chunk, df_chunks),
                    total=len(df_chunks),
                    desc="Processing chunks"
                ))
                
                # Sum up results
                for processed, errors in results:
                    total_processed += processed
                    total_errors += errors
            
            self.stdout.write(self.style.SUCCESS(
                f'Import complete: {total_processed} records processed, {total_errors} errors'
            ))
            
        except Exception as e:
            import traceback
            self.stderr.write(self.style.ERROR(f'Error importing data: {str(e)}'))
            self.stderr.write(self.style.ERROR(traceback.format_exc()))