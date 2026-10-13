"""Parquet writer/reader — barcha sectionlar bitta `demographics.parquet` faylda.
'section' ustuni bo'yicha ajratib turamiz (wide format)."""
from __future__ import annotations

from pathlib import Path
from typing import Iterable

import pandas as pd
from django.conf import settings


PARQUET_DIR = Path(settings.MEDIA_ROOT) / "demographics"
PARQUET_PATH = PARQUET_DIR / "data.parquet"


def _ensure_dir():
    PARQUET_DIR.mkdir(parents=True, exist_ok=True)


def _normalize_for_parquet(df: pd.DataFrame) -> pd.DataFrame:
    """Aralash turli ustunlarni (object dtype) nullable string'ga aylantiramiz.
    Bu PyArrow xatosini ('Could not convert '101+' to int64') oldini oladi —
    masalan Yosh ustunida int (0,1,2,...) va str ('101+') aralashganda."""
    df = df.copy()
    for col in df.columns:
        if df[col].dtype == "object":
            df[col] = df[col].astype("string")
    return df


def read_section_df(slug: str) -> pd.DataFrame:
    """Berilgan section qatorlarini qaytaradi (parquet'da yo'q bo'lsa, bo'sh DF)."""
    if not PARQUET_PATH.exists():
        return pd.DataFrame()
    try:
        df = pd.read_parquet(PARQUET_PATH, filters=[("section", "=", slug)])
    except Exception:
        df = pd.read_parquet(PARQUET_PATH)
        df = df[df["section"] == slug] if "section" in df.columns else pd.DataFrame()
    # Faqat shu section'da ishlatiladigan ustunlarni qoldiramiz
    if not df.empty:
        df = df.dropna(axis=1, how="all")
        if "section" in df.columns:
            df = df.drop(columns=["section"])
    return df


def write_section_df(slug: str, new_df: pd.DataFrame) -> int:
    """Eski section qatorlarini o'chiradi, yangisini qo'shadi, parquet'ga yozadi.
    Return: yangi qator soni."""
    _ensure_dir()
    new_df = new_df.copy()
    new_df["section"] = slug
    new_df = _normalize_for_parquet(new_df)

    if PARQUET_PATH.exists():
        existing = pd.read_parquet(PARQUET_PATH)
        if "section" in existing.columns:
            existing = existing[existing["section"] != slug]
        else:
            existing = pd.DataFrame()
        combined = pd.concat([existing, new_df], ignore_index=True, sort=False)
        # Concat'dan keyin yana normalize qilamiz — yangi va eski turlar
        # to'qnashganda object dtype paydo bo'lishi mumkin
        combined = _normalize_for_parquet(combined)
    else:
        combined = new_df

    combined.to_parquet(PARQUET_PATH, index=False)
    return int(len(new_df))


def delete_section(slug: str) -> None:
    if not PARQUET_PATH.exists():
        return
    df = pd.read_parquet(PARQUET_PATH)
    if "section" in df.columns:
        df = df[df["section"] != slug]
        if df.empty:
            PARQUET_PATH.unlink(missing_ok=True)
        else:
            df.to_parquet(PARQUET_PATH, index=False)


def _coerce_for_filter(val_list, series: pd.Series):
    """Filterlash qiymatlarini ustun dtype'iga moslab keltiramiz.
    Bu int/float/string aralashishini hal qiladi (masalan: 2021 vs 2021.0 vs '2021')."""
    if pd.api.types.is_integer_dtype(series):
        out = []
        for v in val_list:
            if v is None:
                continue
            try:
                out.append(int(float(v)))
            except (TypeError, ValueError):
                pass
        return out
    if pd.api.types.is_float_dtype(series):
        out = []
        for v in val_list:
            if v is None:
                continue
            try:
                out.append(float(v))
            except (TypeError, ValueError):
                pass
        return out
    # String/object/category
    return [str(v) for v in val_list if v is not None]


def apply_filters(df: pd.DataFrame, schema: dict, filters: dict) -> pd.DataFrame:
    """Schema'dagi filter ta'riflari va frontend payload'iga qarab filter qo'llaydi.
    Numerik ustunlar uchun numerik solishtirish, string uchun string solishtirish ishlatadi."""
    schema_filters = {f["column"]: f for f in schema.get("filters", [])}
    for col, val in (filters or {}).items():
        if col not in df.columns:
            continue
        if val is None:
            continue
        fdef = schema_filters.get(col, {})
        series = df[col]

        # Range diapazon ({"min": ..., "max": ...})
        if isinstance(val, dict) and ("min" in val or "max" in val):
            lo = val.get("min")
            hi = val.get("max")
            if pd.api.types.is_numeric_dtype(series):
                if lo is not None:
                    df = df[series >= float(lo)]
                if hi is not None:
                    df = df[series <= float(hi)]
            else:
                if lo is not None:
                    df = df[series.astype(str) >= str(lo)]
                if hi is not None:
                    df = df[series.astype(str) <= str(hi)]
            continue

        # List multi-select — dtype-aware comparison
        if isinstance(val, list):
            if not val:
                continue
            target = _coerce_for_filter(val, series)
            if pd.api.types.is_numeric_dtype(series):
                df = df[series.isin(target)]
            else:
                # String solishtirishda Yosh kabi aralash ustunlar ham qamrab olinadi
                df = df[series.astype(str).isin([str(v) for v in target])]
            continue

        # Skalyar — text yoki single value
        if fdef.get("ui") == "text":
            df = df[series.astype(str).str.contains(str(val), case=False, na=False)]
        else:
            if pd.api.types.is_numeric_dtype(series):
                try:
                    df = df[series == float(val)]
                except (TypeError, ValueError):
                    df = df[series.astype(str) == str(val)]
            else:
                df = df[series.astype(str) == str(val)]

    return df


def group_and_aggregate(df: pd.DataFrame, value_col: str, group_by: Iterable[str]) -> pd.DataFrame:
    group_by = [c for c in (group_by or []) if c in df.columns]
    if not group_by or not value_col or value_col not in df.columns:
        return df
    agg = df.groupby(group_by, as_index=False, dropna=False)[value_col].sum()
    return agg
