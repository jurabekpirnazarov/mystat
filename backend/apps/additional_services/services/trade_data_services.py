"""Tashqi savdo (TradeData) importi: Excel/CSV -> baza.

Oqim:
  1. Fayl barcha kod ustunlari MATN sifatida o'qiladi (aks holda '010121' -> 10121 bo'lib, bosh nol yo'qoladi).
  2. Qatorlar parallel (django'siz, bazaga tegmasdan) tayyorlanadi.
  3. Asosiy jarayonda BITTA atomik transaksiya: yilning eski qatorlari o'chiriladi va yangilari yoziladi.
     Xato bo'lsa, eski ma'lumot saqlanib qoladi.
  4. Hisobot: nechta qator o'tdi, nechtasi rad etildi va nima uchun (qaysi kodlar topilmadi).
"""
import logging
import multiprocessing
import os
import re
from collections import Counter, defaultdict
from decimal import Decimal, InvalidOperation

import numpy as np
import pandas as pd
from django.conf import settings
from django.db import transaction

logger = logging.getLogger(__name__)

EXPECTED_COLUMNS = ['EI', 'TOVAR6', 'EDIZM', 'MONTH', 'CTRANA', 'TERR', 'SITC5', 'SUM_KOL', 'SUM_SUM']
# Kod ustunlari: har doim matn (bosh nollar saqlanishi uchun)
STRING_COLUMNS = ['TOVAR2', 'TOVAR4', 'TOVAR6', 'SITC1', 'SITC2', 'SITC3', 'SITC4', 'SITC5',
                  'CTRANA', 'TERR', 'EDIZM', 'MONTH']
# Qaysi ustun qaysi lug'atdan qidiriladi
KEY_COLUMNS = (('TOVAR6', 'product'), ('SITC5', 'sitc'), ('CTRANA', 'country'), ('TERR', 'region'), ('EDIZM', 'unit'))
MISSING_SAMPLE_LIMIT = 20
_MONTH_RE = re.compile(r'M\s*?(\d{1,2})', re.IGNORECASE)
_NUM_CLEAN_RE = re.compile(r'[^\d\.\-]')


def normalize_key(k):
    """Lug'at kaliti: bo'shliqsiz, '123.0' -> '123', katta harf."""
    if k is None:
        return None
    try:
        if pd.isna(k):
            return None
    except (TypeError, ValueError):
        pass
    s = str(k).strip()
    m = re.match(r'^(-?\d+)\.0+$', s)
    if m:
        s = m.group(1)
    return s.upper() or None


def _parse_month(raw):
    """'M12', 'm 3', '12' -> 'M12'. Tanib bo'lmasa None (jimgina 'M1' qo'yilmaydi)."""
    if raw is None:
        return None
    s = str(raw)
    mm = _MONTH_RE.search(s) or re.search(r'(\d{1,2})', s)
    if mm and 1 <= int(mm.group(1)) <= 12:
        return f"M{int(mm.group(1))}"
    return None


def _parse_decimal(raw):
    """(qiymat, xato_bormi). Bo'sh va '#########' xato emas, shunchaki None."""
    if raw is None:
        return None, False
    try:
        if pd.isna(raw):
            return None, False
    except (TypeError, ValueError):
        pass
    s = str(raw).strip()
    if s in ('', '#########'):
        return None, False
    s = _NUM_CLEAN_RE.sub('', s.replace(',', '.'))
    if not s:
        return None, True
    try:
        return Decimal(s), False
    except InvalidOperation:
        return None, True


def build_chunk(chunk_data):
    """Bazaga TEGMAYDI: DataFrame bo'lagidan TradeData maydonlari lug'atlarini tayyorlaydi.

    chunk_data = (df_chunk, maps, year_id)  maps = {'product': {...}, 'sitc': {...}, ...}
    Qaytaradi: (rows, errors, errors_by_reason, missing)  missing = {ustun: {qiymat: soni}}
    """
    df_chunk, maps, year_id = chunk_data
    rows = []
    errors = 0
    reasons = defaultdict(int)
    missing = defaultdict(Counter)

    for idx, row in df_chunk.iterrows():
        month = _parse_month(row.get('MONTH'))
        if month is None:
            errors += 1
            reasons['month_parse'] += 1
            continue

        ids = {}
        bad = False
        for col, name in KEY_COLUMNS:
            key = normalize_key(row.get(col))
            found = maps[name].get(key)
            if not found:
                bad = True
                missing[col][key if key is not None else '(bo\'sh)'] += 1
            ids[name] = found
        if bad:
            errors += 1
            reasons['missing_map'] += 1
            continue

        try:
            trade_type = 1 if int(float(row.get('EI'))) == 1 else 2
        except (TypeError, ValueError):
            errors += 1
            reasons['ei_parse'] += 1
            continue

        quantity, q_bad = _parse_decimal(row.get('SUM_KOL'))
        value, v_bad = _parse_decimal(row.get('SUM_SUM'))
        if q_bad:
            reasons['quantity_parse'] += 1
        if v_bad:
            reasons['value_parse'] += 1

        rows.append(dict(
            year_id=year_id, month=month, trade_type=trade_type,
            product_id=ids['product'], sitc_id=ids['sitc'], country_id=ids['country'],
            region_id=ids['region'], unit_id=ids['unit'], value=value, quantity=quantity,
        ))

    return rows, errors, dict(reasons), {c: dict(v) for c, v in missing.items()}


def _read_table(path, kind, sheet_name=0):
    dtype = {c: str for c in STRING_COLUMNS}
    try:
        if kind == 'csv':
            last = None
            for enc in ('utf-8-sig', 'cp1251', 'latin1'):
                try:
                    df = pd.read_csv(path, dtype=dtype, encoding=enc)
                    break
                except UnicodeDecodeError as e:
                    last = e
            else:
                raise RuntimeError(f"CSV kodirovkasi tanilmadi: {last}")
        else:
            df = pd.read_excel(path, sheet_name=sheet_name, dtype=dtype)
    except RuntimeError:
        raise
    except Exception as e:
        raise RuntimeError(f"Faylni o'qib bo'lmadi: {e}")

    df.columns = df.columns.astype(str).str.strip()
    absent = [c for c in EXPECTED_COLUMNS if c not in df.columns]
    if absent:
        raise RuntimeError(f"Majburiy ustunlar topilmadi: {', '.join(absent)}")
    return df.replace({np.nan: None})


def _load_maps():
    from apps.additional_services.models import Country, Product, Region, SITC, Unit

    def mk(qs, attr):
        m = {}
        for o in qs.only('id', attr):
            k = normalize_key(getattr(o, attr, None))
            if k is not None:
                m[k] = o.id
        return m

    return {
        'product': mk(Product.objects.all(), 'code'),
        'sitc': mk(SITC.objects.all(), 'code'),
        'country': mk(Country.objects.all(), 'ctrana'),
        'region': mk(Region.objects.all(), 'soato'),
        'unit': mk(Unit.objects.all(), 'code'),
    }


def import_dataframe(df, year, workers=None, mode='replace'):
    """DataFrame'ni bitta atomik transaksiyada yuklaydi.

    mode='replace': yilning eski qatorlari o'chirilib, fayldagilar yoziladi.
    mode='fill':    bazada BOR davrlar (oy + eksport/import) o'zgarmaydi, faqat YO'Q davrlar fayldan qo'shiladi
                    (baza ma'lumoti ustun, fayl bo'shliqni to'ldiradi — ikkalasining birlashmasi).
    """
    if mode not in ('replace', 'fill'):
        raise RuntimeError("mode: replace yoki fill")
    from apps.additional_services.models import TradeData, Year

    year_int = int(year)
    maps = _load_maps()
    total = len(df)

    workers = workers or max(1, int((os.cpu_count() or 2) * 0.75))
    chunk_size = max(1, total // workers + 1)
    chunks = [df[i:i + chunk_size] for i in range(0, total, chunk_size)]

    with transaction.atomic():
        year_obj, _ = Year.objects.get_or_create(year=year_int)
        pool_data = [(c, maps, year_obj.year) for c in chunks]
        if len(chunks) > 1 and os.name == 'posix':
            # Bazaga ulanishdan oldin fork qilinadi, ishchilar django'ni ishlatmaydi
            with multiprocessing.get_context('fork').Pool(processes=min(workers, len(chunks))) as pool:
                results = pool.map(build_chunk, pool_data)
        else:
            results = [build_chunk(p) for p in pool_data]

        all_rows, errors, reasons, missing = [], 0, Counter(), defaultdict(Counter)
        for rows, err, rsn, miss in results:
            all_rows.extend(rows)
            errors += err
            reasons.update(rsn)
            for col, vals in miss.items():
                missing[col].update(vals)

        if total and not all_rows:
            # Hamma qator rad etilsa, eski ma'lumotni O'CHIRMAYMIZ
            transaction.set_rollback(True)
            return _report(0, errors, reasons, missing, replaced=0, total=total, applied=False)

        replaced = 0
        if mode == 'fill':
            have = set(TradeData.objects.filter(year=year_obj).values_list('month', 'trade_type').distinct())
            skipped = [r for r in all_rows if (r['month'], r['trade_type']) in have]
            all_rows = [r for r in all_rows if (r['month'], r['trade_type']) not in have]
            reasons['skipped_existing_period'] = len(skipped)
        else:
            replaced = TradeData.objects.filter(year=year_obj).delete()[0]
        TradeData.objects.bulk_create([TradeData(**r) for r in all_rows], batch_size=2000)

    return _report(len(all_rows), errors, reasons, missing, replaced=replaced, total=total, applied=True)


def _report(imported, errors, reasons, missing, replaced, total, applied):
    return {
        "imported": imported,
        "errors": errors,
        "total_rows": total,
        "replaced_rows": replaced,
        "applied": applied,
        "errors_by_reason": dict(reasons),
        # Qaysi kodlar bazada topilmadi (ustun -> eng ko'p uchraganlar)
        "missing_codes": {c: dict(v.most_common(MISSING_SAMPLE_LIMIT)) for c, v in missing.items()},
    }


def process_file(file_path, year, format=None, **kwargs):
    """file_path: yo'l (str) yoki UploadedFile. format: 'excel' | 'csv' | None (kengaytmadan)."""
    fmt = format.lower() if isinstance(format, str) else None

    if hasattr(file_path, "chunks"):
        save_dir = os.path.join(settings.BASE_DIR, "datas")
        os.makedirs(save_dir, exist_ok=True)
        path = os.path.join(save_dir, os.path.basename(file_path.name))
        with open(path, "wb") as f:
            for chunk in file_path.chunks():
                f.write(chunk)
    elif isinstance(file_path, str):
        path = file_path
    else:
        raise RuntimeError("file_path yo'l yoki UploadedFile bo'lishi kerak")

    if fmt is None:
        ext = os.path.splitext(path)[1].lower()
        fmt = 'csv' if ext == '.csv' else 'excel' if ext in ('.xls', '.xlsx', '.xlsm', '.xlsb') else None
    if fmt not in ('excel', 'csv'):
        raise RuntimeError("Qo'llab-quvvatlanmaydigan format (excel yoki csv)")
    if not os.path.exists(path):
        raise RuntimeError(f"Fayl topilmadi: {path}")

    df = _read_table(path, fmt, sheet_name=kwargs.get('sheet_name', 0))
    logger.info("Tashqi savdo importi: %s, %s qator, yil %s", path, len(df), year)
    result = import_dataframe(df, year, workers=kwargs.get('workers'), mode=kwargs.get('mode', 'replace'))
    logger.info("Import tugadi: %s", {k: v for k, v in result.items() if k != 'missing_codes'})
    return result


# Eski nom (orqaga moslik)
def process_excel_file(file_path, year, sheet_name=0, dtype_dict=None):
    return process_file(file_path, year, format='excel', sheet_name=sheet_name)
