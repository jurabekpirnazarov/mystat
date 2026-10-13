"""Excel inspector va schema generator.
Excel faylni o'qiydi, sheet'lar va ustunlarni qaytaradi,
DataFrame'dan filter_schema avtomatik yaratadi."""
from __future__ import annotations

import re
from typing import Any

import pandas as pd


# Filter UI turlari (frontend renderer shularni biladi)
UI_TYPES = [
    "radio",                # 2-4 variant — pill tugmalar
    "select",               # bitta tanlash — dropdown
    "multi_select",         # bir nechta — checkbox ro'yxat
    "multi_select_search",  # bir nechta + qidiruv
    "range_or_list",        # yil uchun — ro'yxat/diapazon almashtirish
    "range_slider",         # raqamli diapazon — slider
    "text",                 # erkin matn (unique_extracted=False)
]


def _is_year_column(col_name: str, sample_values: list) -> bool:
    """Ustun yil ma'lumoti ekanini aniqlash."""
    name = col_name.lower()
    if any(k in name for k in ("year", "yil", "god", "год")):
        return True
    # Yoki qiymatlar 1900-2100 oralig'idagi butun sonlar bo'lsa
    try:
        ints = [int(v) for v in sample_values[:20] if v is not None]
        if ints and all(1900 <= v <= 2100 for v in ints):
            return True
    except (TypeError, ValueError):
        pass
    return False


def _detect_value_column(df: pd.DataFrame) -> str | None:
    """Qiymat (numeric, eng katta cardinality) ustunini topish."""
    candidates = []
    for col in df.columns:
        series = df[col]
        if not pd.api.types.is_numeric_dtype(series):
            continue
        name = col.lower()
        score = 0
        if any(k in name for k in ("count", "soni", "value", "miqdor", "qiymat", "son", "число", "количество")):
            score += 100
        # Yuqori unique = qiymat
        try:
            score += min(int(series.nunique()), 1000)
        except Exception:
            pass
        candidates.append((col, score))
    if not candidates:
        return None
    return max(candidates, key=lambda x: x[1])[0]


def _suggest_ui(unique_count: int, is_year: bool) -> str:
    if is_year:
        return "range_or_list"
    if unique_count <= 4:
        return "radio"
    if unique_count <= 30:
        return "multi_select"
    return "multi_select_search"


def inspect_excel(file_path_or_obj) -> dict[str, Any]:
    """Excel faylni tahlil qiladi va sheet'lar/ustunlar haqida ma'lumot qaytaradi.
    Hech narsa saqlamaydi — admin preview uchun."""
    xls = pd.ExcelFile(file_path_or_obj)
    sheets = []
    for sheet_name in xls.sheet_names:
        df = pd.read_excel(xls, sheet_name=sheet_name, header=0, nrows=50)
        df.columns = [str(c).strip() for c in df.columns]
        columns = []
        for col in df.columns:
            series = df[col]
            sample = series.dropna().head(20).tolist()
            columns.append({
                "name": col,
                "dtype": str(series.dtype),
                "sample": [str(s) for s in sample[:5]],
                "non_null": int(series.notna().sum()),
            })
        # To'liq qator soni
        full = pd.read_excel(xls, sheet_name=sheet_name, header=0, usecols=[df.columns[0]])
        sheets.append({
            "name": sheet_name,
            "columns": columns,
            "row_count": int(len(full)),
            "preview_rows": df.head(5).fillna("").astype(str).values.tolist(),
        })
    return {"sheets": sheets}


def generate_schema(
    df: pd.DataFrame,
    column_config: dict[str, dict] | None = None,
) -> dict[str, Any]:
    """DataFrame'dan filter_schema yaratadi.

    column_config (ixtiyoriy) — admin tomonidan qaytarilgan sozlamalar:
      { "year": {"role": "filter", "extract_unique": True, "ui": "range_or_list"},
        "count": {"role": "value"},
        "comment": {"role": "filter", "extract_unique": False, "ui": "text"} }

    Agar berilmasa, hammasi avto-aniqlanadi.
    """
    column_config = column_config or {}
    df = df.copy()
    df.columns = [str(c).strip() for c in df.columns]

    # 1. Value column'ni aniqlash
    value_col = None
    for col, cfg in column_config.items():
        if cfg.get("role") == "value":
            value_col = col
            break
    if value_col is None:
        value_col = _detect_value_column(df)

    # 2. Filter ustunlarini aniqlash
    filter_cols = []
    for col in df.columns:
        cfg = column_config.get(col, {})
        role = cfg.get("role")
        if role == "skip":
            continue
        if col == value_col:
            continue
        if role is None and col == value_col:
            continue
        filter_cols.append(col)

    # 3. Har filter uchun schema
    filters = []
    for idx, col in enumerate(filter_cols):
        cfg = column_config.get(col, {})
        series = df[col]
        sample = series.dropna().tolist()
        is_year = _is_year_column(col, sample)
        unique_count = int(series.nunique(dropna=True))
        extract_unique = cfg.get("extract_unique", True)

        ui = cfg.get("ui") or _suggest_ui(unique_count, is_year)
        if not extract_unique:
            ui = "text"

        options: list = []
        if extract_unique:
            uniq = series.dropna().unique().tolist()
            # Tartib: numerik bo'lsa son bo'yicha, aks holda alifbo
            try:
                uniq_sorted = sorted(uniq, key=lambda x: (0, float(x)) if isinstance(x, (int, float)) else (1, str(x)))
            except Exception:
                uniq_sorted = sorted(map(str, uniq))
            options = [
                int(v) if isinstance(v, (int,)) or (isinstance(v, float) and v.is_integer())
                else (str(v) if not isinstance(v, (int, float)) else v)
                for v in uniq_sorted
            ]

        multiple = cfg.get("multiple")
        if multiple is None:
            multiple = ui not in ("radio", "select", "text")
        searchable = cfg.get("searchable")
        if searchable is None:
            searchable = (ui == "multi_select_search") or unique_count > 30

        filters.append({
            "column": col,
            "label": cfg.get("label") or col.replace("_", " ").title(),
            "ui": ui,
            "multiple": bool(multiple),
            "searchable": bool(searchable),
            "options": options,
            "unique_extracted": bool(extract_unique),
            "order": idx + 1,
        })

    return {
        "value_column": {
            "name": value_col or "",
            "label": (column_config.get(value_col, {}).get("label") if value_col else "")
                     or (value_col.replace("_", " ").title() if value_col else "Qiymat"),
        },
        "filters": filters,
    }


def slugify_column_name(name: str) -> str:
    """Ustun nomidan toza slug — ASCII, lowercase, '_'."""
    s = str(name).strip().lower()
    s = re.sub(r"[^\w]+", "_", s, flags=re.UNICODE)
    s = re.sub(r"_+", "_", s).strip("_")
    return s or "col"
