"""B-08: lokal dev uchun sintetik demografiya parquet.

Asosiy `media/demographics/data.parquet` dump bilan kelmaydi. Bu generator `DemographicSection.filter_schema`
dagi filtr variantlarining to'liq kombinatsiyasidan `data.synthetic.parquet` yaratadi.
Asosiy fayl hech qachon ustidan yozilmaydi; sintetik fayl faqat DEBUG=True va asosiy fayl yo'q bo'lsa o'qiladi.
"""
import itertools
import random
import zlib

import pandas as pd

from apps.additional_services.api_endpoints.DemographicsAPI import writer
from apps.additional_services.models import DemographicSection

from . import SEED

# Bitta kesim (hudud × yil × boshqa filtrlar) uchun o'rtacha qiymat — real tartibga yaqin
BASE = {
    "aholi_soni": 6000,
    "ajrim": 1400,
    "kochib_kelganlar": 3500,
    "kochib_ketganlar": 3800,
    "nikoh": 10000,
    "olim": 3000,
    "tugilish": 16000,
}
# Hududlar aholisiga taxminiy proporsional vaznlar
REGION_WEIGHT = {
    "Samarqand": 1.55, "Farg'ona": 1.50, "Qashqadaryo": 1.32, "Andijon": 1.28, "Toshkent shahri": 1.22,
    "Namangan": 1.17, "Toshkent": 1.15, "Surxondaryo": 1.08, "Buxoro": 0.84, "Xorazm": 0.78,
    "Qoraqalpog'iston Respublikasi": 0.80, "Jizzax": 0.62, "Navoiy": 0.43, "Sirdaryo": 0.38,
}


def _stable_factor(*parts, lo=0.8, hi=1.2):
    """Variant uchun barqaror koeffitsiyent (hash asosida, har ishga tushishda bir xil)."""
    h = zlib.crc32("|".join(map(str, parts)).encode()) / 0xFFFFFFFF
    return lo + (hi - lo) * h


def _year_factor(year, years):
    try:
        y = int(year)
        y0 = min(int(v) for v in years)
    except (TypeError, ValueError):
        return 1.0
    return 0.75 + 0.012 * (y - y0)  # sekin o'sish


def _age_factor(age):
    try:
        a = int(str(age).rstrip("+"))
    except ValueError:
        return 0.3
    return max(0.05, 1.25 - a / 75)  # yosh oshgan sari kamayadi


def section_frame(section, rnd):
    schema = section.filter_schema or {}
    filters = [f for f in schema.get("filters", []) if f.get("options")]
    value_col = (schema.get("value_column") or {}).get("name")
    if not filters or not value_col:
        return pd.DataFrame()

    columns = [f["column"] for f in filters]
    base = BASE.get(section.slug, 2000)
    years = next((f["options"] for f in filters if f["column"].lower() == "yil"), [])
    rows = []
    for combo in itertools.product(*(f["options"] for f in filters)):
        row = dict(zip(columns, combo))
        value = base
        for col, v in row.items():
            name = col.lower()
            if name == "yil":
                value *= _year_factor(v, years)
            elif name == "hudud":
                value *= REGION_WEIGHT.get(str(v), _stable_factor(section.slug, v, lo=0.5, hi=1.4))
            elif name == "yosh":
                value *= _age_factor(v)
            else:
                value *= _stable_factor(section.slug, col, v)
        row[value_col] = int(round(value * rnd.uniform(0.92, 1.08)))
        rows.append(row)
    return pd.DataFrame(rows)


def write_synthetic_parquet():
    """-> (fayl yo'li, qatorlar soni)"""
    rnd = random.Random(f"{SEED}:demographics")
    frames = []
    for section in DemographicSection.objects.filter(is_active=True).order_by("id"):
        df = section_frame(section, rnd)
        if not df.empty:
            df["section"] = section.slug
            frames.append(df)
    if not frames:
        return writer.SYNTHETIC_PATH, 0

    combined = writer._normalize_for_parquet(pd.concat(frames, ignore_index=True, sort=False))
    writer.SYNTHETIC_PATH.parent.mkdir(parents=True, exist_ok=True)
    combined.to_parquet(writer.SYNTHETIC_PATH, index=False)
    return writer.SYNTHETIC_PATH, len(combined)
