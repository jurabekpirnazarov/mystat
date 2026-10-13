import os
import django
import multiprocessing
from decimal import Decimal, InvalidOperation
from django.conf import settings
from django import db
from django.db import transaction
import pandas as pd
import numpy as np
from tqdm import tqdm
import logging
import re
from collections import Counter, defaultdict


logger = logging.getLogger(__name__)
# -----------------------------------------
# Django initialization for main process & workers
# -----------------------------------------
def initialize_django():
    """
    Call django.setup() for the process and ensure DB connections are closed.
    This is safe to call multiple times; worker initializer calls it too.
    """
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings.base')
    django.setup()
    db.connections.close_all()

# -----------------------------------------
# Worker function: processes a DataFrame chunk
# -----------------------------------------

# -------------------------
def normalize_key(k):
    """
    Normalize map lookup keys:
    - None -> None
    - strip spaces
    - remove trailing .0 from floats like '123.0'
    - upper-case for stable lookups
    """
    if k is None:
        return None
    s = str(k).strip()
    # remove trailing .0 for integer-like floats
    m = re.match(r'^(-?\d+)\.0+$', s)
    if m:
        s = m.group(1)
    return s.upper()


# -------------------------
# Worker: process a DataFrame chunk
# -------------------------
def process_chunk(chunk_data):
    """
    chunk_data = (df_chunk, product_map, sitc_map, country_map, region_map, unit_map, year_id)
    Returns: (success_count, error_count, errors_by_reason_dict)
    """
    # Ensure django is initialized in worker (initializer should already do it, but safe)
    try:
        initialize_django()
    except Exception:
        # initializer might have already run — ignore if it fails here
        pass

    # Local import after django.setup()
    from apps.additional_services.models import TradeData, Year

    df_chunk, product_map, sitc_map, country_map, region_map, unit_map, year_id = chunk_data

    # Try get Year by PK if main process provided id; fallback to get_or_create with year value
    try:
        # If year_id is actual PK integer, try get by pk
        year_obj = Year.objects.get(pk=year_id)
    except Exception:
        try:
            year_obj, _ = Year.objects.get_or_create(year=int(year_id))
        except Exception:
            # as last resort, create Year with given value (log it)
            logger.exception("Failed to resolve Year with id/year=%s", year_id)
            year_obj, _ = Year.objects.get_or_create(year=int(year_id))

    trade_objs = []
    success = 0
    errors = 0
    errors_by_reason = defaultdict(int)

    # Precompile month regex
    month_re = re.compile(r'M\s*?(\d{1,2})', re.IGNORECASE)

    for idx, row in df_chunk.iterrows():
        try:
            # --- Month parsing (robust) ---
            raw_month = row.get('MONTH', None)
            month = "M1"
            if raw_month is not None:
                try:
                    rs = str(raw_month)
                    mm = month_re.search(rs)
                    if mm:
                        mnum = int(mm.group(1))
                        if 1 <= mnum <= 12:
                            month = f"M{mnum}"
                        else:
                            month = "M1"
                    else:
                        # try direct like '12' or ' 12 '
                        rs_digits = re.search(r'(\d{1,2})', rs)
                        if rs_digits:
                            mnum = int(rs_digits.group(1))
                            if 1 <= mnum <= 12:
                                month = f"M{mnum}"
                except Exception:
                    errors_by_reason['month_parse'] += 1
                    month = "M1"

            # --- Map lookups (normalized) ---
            def n(x):
                return normalize_key(x)

            product_id = product_map.get(n(row.get('TOVAR6')))
            sitc_id = sitc_map.get(n(row.get('SITC5')))
            country_id = country_map.get(n(row.get('CTRANA')))
            region_id = region_map.get(n(row.get('TERR')))
            unit_id = unit_map.get(n(row.get('EDIZM')))

            if not all([product_id, sitc_id, country_id, region_id, unit_id]):
                errors += 1
                errors_by_reason['missing_map'] += 1
                # debug log to help identify which key missing
                logger.debug(
                    "Missing mapping at row %s: TOVAR6=%s(S->%s) SITC5=%s(S->%s) CTRANA=%s(S->%s) TERR=%s(S->%s) EDIZM=%s(S->%s)",
                    idx,
                    row.get('TOVAR6'), n(row.get('TOVAR6')),
                    row.get('SITC5'), n(row.get('SITC5')),
                    row.get('CTRANA'), n(row.get('CTRANA')),
                    row.get('TERR'), n(row.get('TERR')),
                    row.get('EDIZM'), n(row.get('EDIZM')),
                )
                continue

            # --- EI parsing ---
            try:
                trade_type = 1 if int(row.get('EI', 2)) == 1 else 2
            except Exception:
                trade_type = 2
                errors_by_reason['ei_parse'] += 1

            # --- Quantity parsing ---
            quantity = None
            try:
                qv = row.get('SUM_KOL')
                if pd.notna(qv) and str(qv).strip() not in ('', '#########'):
                    q_str = str(qv).strip().replace(',', '.')
                    # remove non-numeric characters except dot and minus
                    q_str = re.sub(r'[^\d\.\-]', '', q_str)
                    if q_str:
                        quantity = Decimal(q_str)
            except (InvalidOperation, TypeError, ValueError) as e:
                quantity = None
                errors_by_reason['quantity_parse'] += 1
                logger.debug("Quantity parse failed at row %s: %s -- raw=%r", idx, e, row.get('SUM_KOL'))

            # --- Value parsing ---
            value = None
            try:
                vv = row.get('SUM_SUM')
                if pd.notna(vv) and str(vv).strip() not in ('', '#########'):
                    v_str = str(vv).strip().replace(',', '.')
                    v_str = re.sub(r'[^\d\.\-]', '', v_str)
                    if v_str:
                        value = Decimal(v_str)
            except (InvalidOperation, TypeError, ValueError) as e:
                value = None
                errors_by_reason['value_parse'] += 1
                logger.debug("Value parse failed at row %s: %s -- raw=%r", idx, e, row.get('SUM_SUM'))

            # --- Build TradeData instance (not saved yet) ---
            td = TradeData(
                year=year_obj,
                country_id=country_id,
                product_id=product_id,
                trade_type=trade_type,
                unit_id=unit_id,
                month=month,
                region_id=region_id,
                sitc_id=sitc_id,
                value=value,
                quantity=quantity
            )
            trade_objs.append(td)
            success += 1

        except Exception as e:
            errors += 1
            errors_by_reason['other'] += 1
            # log full stacktrace and row for debugging
            logger.exception("Unhandled error processing row idx=%s: %s -- row: %s", idx, e, row.to_dict())

    # --- bulk_create in batches to avoid huge single queries ---
    if trade_objs:
        try:
            batch_size = 1000
            with transaction.atomic():
                TradeData.objects.bulk_create(trade_objs, ignore_conflicts=True, batch_size=batch_size)
        except Exception as e:
            # if bulk_create fails, count them as errors and log
            logger.exception("bulk_create failed in worker: %s", e)
            errors += len(trade_objs)
            errors_by_reason['bulk_create'] += 1

    # Close DB connections in worker
    try:
        db.connections.close_all()
    except Exception:
        pass

    # Return diagnostics
    return success, errors, dict(errors_by_reason)

# -----------------------------------------
# CSV entry point
# -----------------------------------------
# def process_csv_file(file_path, year, encoding=None, dtype_dict=None):
#
#     initialize_django()
#
#     if hasattr(file_path, "chunks"):
#         save_dir = os.path.join(settings.BASE_DIR, "datas")
#         os.makedirs(save_dir, exist_ok=True)
#         save_path = os.path.join(save_dir, file_path.name)
#         with open(save_path, "wb") as f:
#             for chunk in file_path.chunks():
#                 f.write(chunk)
#         access_path = save_path
#     elif isinstance(file_path, str):
#         access_path = file_path
#     else:
#         raise RuntimeError("file_path must be path string or UploadedFile-like object")
#
#     print("Processing CSV file:", access_path)
#     if not os.path.exists(access_path):
#         raise RuntimeError(f"CSV file not found: {access_path}")
#
#     # default dtype for string-like cols
#     string_columns = ['TOVAR2', 'TOVAR4', 'TOVAR6', 'SITC1', 'SITC2', 'SITC3', 'SITC4', 'SITC5', 'CTRANA', 'TERR', 'EDIZM', "MONTH"]
#     if dtype_dict is None:
#         dtype_dict = {col: str for col in string_columns}
#
#     tried_encodings = [encoding] if encoding else ['utf-8', 'cp1251', 'latin1']
#     last_err = None
#     df = None
#     for enc in tried_encodings:
#         try:
#             df = pd.read_csv(access_path, dtype=dtype_dict, encoding=enc)
#             print("Read CSV with encoding:", enc)
#             break
#         except Exception as e:
#             last_err = e
#             print(f"Failed to read CSV with encoding {enc}: {e}")
#
#     if df is None:
#         raise RuntimeError(f"Could not read CSV. Last error: {last_err}")
#
#     df.columns = df.columns.str.strip()
#     df = df.replace({np.nan: None})
#
#     expected_columns = ['EI', 'TOVAR6', 'EDIZM', 'MONTH', 'CTRANA', 'TERR', 'SITC5', 'SUM_KOL', 'SUM_SUM']
#     for col in expected_columns:
#         if col not in df.columns:
#             raise RuntimeError(f"Required column {col} not found in CSV file")
#
#     # Preload reference maps (id maps safe to send to workers)
#     from apps.additional_services.models import Product, SITC, Year, Country, Region, Unit, TradeData
#
#     print('Preloading reference data...')
#     products = {str(p.code): p.id for p in Product.objects.all()}
#     sitcs = {str(s.code): s.id for s in SITC.objects.all()}
#     countries = {str(c.ctrana): c.id for c in Country.objects.all()}
#     regions = {str(r.soato): r.id for r in Region.objects.all()}
#     units = {str(u.code): u.id for u in Unit.objects.all()}
#
#     year_int = int(year)
#     # Delete old rows once in main process
#     year_obj, _ = Year.objects.get_or_create(year=year_int)
#     print("Removing old TradeData for year", year_int)
#     TradeData.objects.filter(year=year_obj).delete()
#
#     total_rows = len(df)
#     print(f'Found {total_rows} records to import from CSV')
#
#     # parallel
#     workers = max(1, int(multiprocessing.cpu_count() * 0.75))
#     chunk_size = total_rows // workers + 1
#     df_chunks = [df[i:i + chunk_size] for i in range(0, total_rows, chunk_size)]
#
#     pool_data = [
#         (chunk, products, sitcs, countries, regions, units, year_int)
#         for chunk in df_chunks
#     ]
#
#     total_success = 0
#     total_errors = 0
#
#     print(f'Starting parallel import with {workers} workers...')
#     with multiprocessing.Pool(processes=workers, initializer=initialize_django) as pool:
#         results = list(tqdm(
#             pool.imap(process_chunk, pool_data),
#             total=len(pool_data),
#             desc="Processing CSV chunks"
#         ))
#         for success, errors in results:
#             total_success += success
#             total_errors += errors
#
#     print(f'CSV import complete: {total_success} records imported, {total_errors} errors')
#     return {"imported": total_success, "errors": total_errors}


# -----------------------------------------
# Excel entry point
# -----------------------------------------

def process_excel_file(file_path, year, sheet_name=0, dtype_dict=None):
    """
    Read Excel and import to DB in parallel.
    Returns a dict: {"imported": int, "errors": int, "errors_by_reason": {...}}
    """
    initialize_django()

    # Resolve path (handle UploadedFile-like objects)
    if hasattr(file_path, "chunks"):
        save_dir = os.path.join(settings.BASE_DIR, "datas")
        os.makedirs(save_dir, exist_ok=True)
        save_path = os.path.join(save_dir, file_path.name)
        with open(save_path, "wb") as f:
            for chunk in file_path.chunks():
                f.write(chunk)
        access_path = save_path
    elif isinstance(file_path, str):
        access_path = file_path
    else:
        raise RuntimeError("file_path must be path string or UploadedFile-like object")

    logger.info("Processing Excel file: %s", access_path)
    if not os.path.exists(access_path):
        raise RuntimeError(f"Excel file not found: {access_path}")

    # Read Excel (note: for very large files prefer CSV + chunksize)
    try:
        df = pd.read_excel(access_path, sheet_name=sheet_name)
        logger.info("Read Excel successfully")
    except Exception as e:
        raise RuntimeError(f"Failed to read Excel: {e}")

    df.columns = df.columns.str.strip()
    df = df.replace({np.nan: None})

    expected_columns = ['EI', 'TOVAR6', 'EDIZM', 'MONTH', 'CTRANA', 'TERR', 'SITC5', 'SUM_KOL', 'SUM_SUM']
    for col in expected_columns:
        if col not in df.columns:
            raise RuntimeError(f"Required column {col} not found in Excel file")

    # Preload reference maps with normalized keys
    from apps.additional_services.models import Product, SITC, Year, Country, Region, Unit, TradeData

    def mkmap(qs, key_attr):
        m = {}
        for o in qs:
            raw = getattr(o, key_attr, None)
            k = normalize_key(raw)
            if k is not None:
                m[k] = o.id
        return m

    logger.info("Preloading reference data...")
    products = mkmap(Product.objects.all(), 'code')
    sitcs = mkmap(SITC.objects.all(), 'code')
    countries = mkmap(Country.objects.all(), 'ctrana')
    regions = mkmap(Region.objects.all(), 'soato')
    units = mkmap(Unit.objects.all(), 'code')

    year_int = int(year)
    year_obj, _ = Year.objects.get_or_create(year=year_int)

    logger.info("Removing old TradeData for year %s", year_int)
    TradeData.objects.filter(year=year_obj).delete()

    total_rows = len(df)
    logger.info("Found %s records to import from Excel", total_rows)

    # Determine workers and split DataFrame into chunks
    workers = max(1, int(multiprocessing.cpu_count() * 0.75))
    chunk_size = max(1, total_rows // workers + 1)
    df_chunks = [df[i:i + chunk_size].copy() for i in range(0, total_rows, chunk_size)]

    pool_data = [
        (chunk, products, sitcs, countries, regions, units, year_obj.id)
        for chunk in df_chunks
    ]

    total_success = 0
    total_errors = 0
    total_errors_by_reason = Counter()

    logger.info("Starting parallel import with %s workers for Excel...", workers)

    # Use 'fork' on POSIX for speed; 'spawn' on Windows
    ctx = multiprocessing.get_context('fork') if os.name == 'posix' else multiprocessing.get_context('spawn')

    with ctx.Pool(processes=workers, initializer=initialize_django) as pool:
        results = list(tqdm(
            pool.imap(process_chunk, pool_data),
            total=len(pool_data),
            desc="Processing Excel chunks"
        ))

    # Results may be (s, e) or (s, e, dict). Handle both shapes gracefully.
    for item in results:
        if isinstance(item, (list, tuple)):
            if len(item) == 2:
                s, e = item
                total_success += s
                total_errors += e
            elif len(item) == 3:
                s, e, err_map = item
                total_success += s
                total_errors += e
                if isinstance(err_map, dict):
                    total_errors_by_reason.update(err_map)
            else:
                logger.warning("Unexpected worker result shape: %r", item)
        else:
            logger.warning("Unexpected worker result type: %r", type(item))

    logger.info("Excel import complete: %s records imported, %s errors", total_success, total_errors)
    logger.info("Errors by reason: %s", dict(total_errors_by_reason))

    # Close connections
    try:
        db.connections.close_all()
    except Exception:
        pass

    return {"imported": total_success, "errors": total_errors, "errors_by_reason": dict(total_errors_by_reason)}


# -------------------------
# process_file wrapper
# -------------------------
def process_file(file_path, year, format=None, **kwargs):
    fmt = format.lower() if isinstance(format, str) else None

    file_name = None
    if hasattr(file_path, "name"):
        file_name = file_path.name
    elif isinstance(file_path, str):
        file_name = file_path

    if fmt is None and file_name:
        ext = os.path.splitext(file_name)[1].lower()
        if ext == '.csv':
            fmt = 'csv'
        elif ext in ('.xls', '.xlsx', '.xlsm', '.xlsb'):
            fmt = 'excel'

    if fmt == 'excel':
        return process_excel_file(file_path, year, sheet_name=kwargs.get('sheet_name', 0), dtype_dict=kwargs.get('dtype_dict'))
    elif fmt == 'csv':
        # If you want, implement process_csv_file with chunksize (recommended for very large files)
        # return process_csv_file(file_path, year, encoding=kwargs.get('encoding'))
        raise NotImplementedError("CSV processing not implemented in this snippet. Convert to Excel or implement CSV path.")
    else:
        raise RuntimeError("Unsupported file format")

