# apps/<your_app>/resources.py  (masalan: apps.product.resources)
import math
import pandas as pd
import numpy as np
from import_export import resources, results
from import_export.instance_loaders import BaseInstanceLoader
from django.db import transaction
from apps.additional_services.models.ex_trade import Product
from collections import defaultdict


# --- Instance loader: har qator uchun custom upsert ishlatamiz ---
class NoopInstanceLoader(BaseInstanceLoader):
    def __init__(self, resource, dataset=None):
        super().__init__(resource)
    def get_instance(self, row):
        return None


# --- Helperlar ---
def _n(val):
    """
    Kod normalizatsiyasi:
      - NaN -> None
      - '123.0' -> '123'
    """
    if pd.isna(val):
        return None
    if isinstance(val, float) and math.isnan(val):
        return None
    s = str(val).strip()
    if s.endswith(".0"):
        s = s[:-2]
    return s

def _t(val):
    """Matn normalizatsiyasi (NaN -> "", strip)."""
    if pd.isna(val):
        return ""
    return str(val).strip()


# === KOD uzunligi -> level xaritasi (ZNAK qoidalari) ===
# ZNAK_2 = 2 xonali -> level=1
# ZNAK_4 = 4 xonali -> level=2 (parent = first 2)
# ZNAK_6 = 6 xonali -> level=3 (parent = first 4)
LEVEL_BY_LEN = {2: 1, 4: 2, 6: 3}

def parent_of(code: str) -> str | None:
    """ZNAK qoidasi bo'yicha ota kodni qaytaradi."""
    if not code:
        return None
    L = len(code)
    if L == 2:
        return None
    if L == 4:
        return code[:2]
    if L == 6:
        return code[:4]
    return None


class ProductExcelResource(resources.Resource):
    """
    Import-Export Resource:
      - FK=code (parent_id = ota CODE)
      - 3-pass: ZNAK_2 (len=2) -> ZNAK_4 (len=4) -> ZNAK_6 (len=6)
      - Pandas bilan optimallashtirilgan
    """
    supports_export = False

    @classmethod
    def get_display_name(cls):
        return "Product Excel (ZNAK_2→ZNAK_6, FK=code, pandas optimized)"

    class Meta:
        skip_unchanged = True
        report_skipped = True
        use_transactions = True
        instance_loader_class = NoopInstanceLoader

    # Excel ustunlari aliaslari
    COLS = {
        # ZNAK_2
        "ZNAK_2":               ("znak_2", "znak 2", "code_2", "znak2"),
        "ZNAK_2_RU":            ("znak_2_ru", "znak 2 ru"),
        "ZNAK_2_LATIN_UZ":      ("znak_2_latin_uz", "znak 2 latin uz", "znak_2_uz"),
        "ZNAK_2_KIRIL_1_UZ":    ("znak_2_kiril_1_uz", "znak 2 kiril 1 uz"),
        "ZNAK_2_KIRIL_2_UZ":    ("znak_2_kiril_2_uz", "znak 2 kiril 2 uz"),

        # ZNAK_4
        "ZNAK_4":               ("znak_4", "znak 4", "code_4", "znak4"),
        "ZNAK_4_RU":            ("znak_4_ru", "znak 4 ru"),
        "ZNAK_4_LATIN_UZ":      ("znak_4_latin_uz", "znak 4 latin uz", "znak_4_uz"),
        "ZNAK_4_KIRIL_1_UZ":    ("znak_4_kiril_1_uz", "znak 4 kiril 1 uz"),
        "ZNAK_4_KIRIL_2_UZ":    ("znak_4_kiril_2_uz", "znak 4 kiril 2 uz"),

        # ZNAK_6
        "ZNAK_6":               ("znak_6", "znak 6", "code_6", "znak6"),
        "ZNAK_6_RU":            ("znak_6_ru", "znak 6 ru"),
        "ZNAK_6_LATIN_UZ":      ("znak_6_latin_uz", "znak 6 latin uz", "znak_6_uz"),
        "ZNAK_6_KIRIL_1_UZ":    ("znak_6_kiril_1_uz", "znak 6 kiril 1 uz"),
        "ZNAK_6_KIRIL_2_UZ":    ("znak_6_kiril_2_uz", "znak 6 kiril 2 uz"),
    }

    def _normalize_column_names(self, df):
        """DataFrame ustun nomlarini normallash"""
        # Ustun nomlarini kichik harflarga o'tkazish
        df.columns = [str(col).lower().strip() for col in df.columns]
        
        # Aliaslar bo'yicha standart nomlarga o'zgartirish
        col_mapping = {}
        for standard_name, aliases in self.COLS.items():
            for alias in (standard_name.lower(),) + tuple(a.lower() for a in aliases):
                for col in df.columns:
                    if col.startswith(alias):
                        col_mapping[col] = standard_name
                        break
        
        # Ustun nomlarini o'zgartirish
        df = df.rename(columns=col_mapping)
        return df

    # --- Asosiy import ---
    @transaction.atomic
    def before_import(self, dataset, **kwargs):
        # Ma'lumotni DataFramega o'tkazish
        df = pd.DataFrame(dataset.dict)
        
        # Ustun nomlarini normallashtirish
        df = self._normalize_column_names(df)
        
        # Mavjud mahsulotlarni keshlaymiz
        existing_products = {
            p.code: p for p in Product.objects.all().only(
                "id", "code", "level", "parent_id", "name_ru", "name_uz", "name_cry", "name_cry2"
            )
        }
        
        # Counters
        created_count = 0
        updated_count = 0
        
        # ===== ZNAK_2 (level=1) =====
        # ZNAK_2 ustunini normallash va filtrlash
        df['ZNAK_2'] = df['ZNAK_2'].apply(lambda x: _n(x))
        df['ZNAK_2'] = df['ZNAK_2'].apply(lambda x: x.zfill(2) if x else None)
        
        # Nolmaslarini ajratib olish
        znak2_df = df[df['ZNAK_2'].notna()].drop_duplicates(subset=['ZNAK_2'])
        
        # ZNAK_2 mahsulotlarini yaratish uchun DataFrame
        znak2_to_create = []
        znak2_to_update = defaultdict(list)
        
        for _, row in znak2_df.iterrows():
            code = row['ZNAK_2']
            name_ru = _t(row.get('ZNAK_2_RU', ''))
            name_uz = _t(row.get('ZNAK_2_LATIN_UZ', ''))
            name_cry = _t(row.get('ZNAK_2_KIRIL_1_UZ', ''))
            name_cry2 = _t(row.get('ZNAK_2_KIRIL_2_UZ', ''))
            
            if code in existing_products:
                # Update kerak
                p = existing_products[code]
                fields_to_update = {}
                if name_ru and p.name_ru != name_ru:
                    fields_to_update["name_ru"] = name_ru
                if name_uz and p.name_uz != name_uz:
                    fields_to_update["name_uz"] = name_uz
                if name_cry and p.name_cry != name_cry:
                    fields_to_update["name_cry"] = name_cry
                if name_cry2 and p.name_cry2 != name_cry2:
                    fields_to_update["name_cry2"] = name_cry2
                
                if fields_to_update:
                    for field, value in fields_to_update.items():
                        znak2_to_update[field].append((p.id, value))
                    updated_count += 1
            else:
                # Create
                znak2_to_create.append({
                    "code": code,
                    "name_ru": name_ru,
                    "name_uz": name_uz,
                    "name_cry": name_cry,
                    "name_cry2": name_cry2,
                    "level": 1,
                    "parent_id": None
                })
        
        # Bulk create ZNAK_2
        if znak2_to_create:
            znak2_products = [
                Product(**data) for data in znak2_to_create
            ]
            created = Product.objects.bulk_create(znak2_products)
            created_count += len(created)
            
            # Yangi yaratilganlarni keshga qo'shish
            for p in created:
                existing_products[p.code] = p
        
        # ===== ZNAK_4 (level=2) =====
        # ZNAK_4 ustunini normallash va filtrlash
        df['ZNAK_4'] = df['ZNAK_4'].apply(lambda x: _n(x))
        df['ZNAK_4'] = df['ZNAK_4'].apply(lambda x: x.zfill(4) if x else None)
        
        # Nolmaslarini ajratib olish
        znak4_df = df[df['ZNAK_4'].notna()].drop_duplicates(subset=['ZNAK_4'])
        
        # ZNAK_4 mahsulotlarini yaratish uchun DataFrame
        znak4_to_create = []
        znak4_parent_codes = set()
        
        for _, row in znak4_df.iterrows():
            code = row['ZNAK_4']
            parent_code = code[:2]
            znak4_parent_codes.add(parent_code)
            
            name_ru = _t(row.get('ZNAK_4_RU', ''))
            name_uz = _t(row.get('ZNAK_4_LATIN_UZ', ''))
            name_cry = _t(row.get('ZNAK_4_KIRIL_1_UZ', ''))
            name_cry2 = _t(row.get('ZNAK_4_KIRIL_2_UZ', ''))
            
            if code in existing_products:
                # Update kerak
                p = existing_products[code]
                fields_to_update = {}
                if name_ru and p.name_ru != name_ru:
                    fields_to_update["name_ru"] = name_ru
                if name_uz and p.name_uz != name_uz:
                    fields_to_update["name_uz"] = name_uz
                if name_cry and p.name_cry != name_cry:
                    fields_to_update["name_cry"] = name_cry
                if name_cry2 and p.name_cry2 != name_cry2:
                    fields_to_update["name_cry2"] = name_cry2
                
                if fields_to_update:
                    for field, value in fields_to_update.items():
                        znak2_to_update[field].append((p.id, value))
                    updated_count += 1
            else:
                # Create
                znak4_to_create.append({
                    "code": code,
                    "name_ru": name_ru,
                    "name_uz": name_uz,
                    "name_cry": name_cry,
                    "name_cry2": name_cry2,
                    "level": 2,
                    "parent_id": parent_code
                })
        
        # Kerakli ota kategoriyalarini tekshirish
        missing_parents = [code for code in znak4_parent_codes if code not in existing_products]
        
        # Yo'q ota kategoriyalarni yaratish
        if missing_parents:
            missing_parents_create = []
            for code in missing_parents:
                missing_parents_create.append(
                    Product(
                        code=code,
                        name_ru="",
                        name_uz="",
                        name_cry="",
                        name_cry2="",
                        level=1,
                        parent_id=None
                    )
                )
            
            created = Product.objects.bulk_create(missing_parents_create)
            created_count += len(created)
            
            # Yangi yaratilganlarni keshga qo'shish
            for p in created:
                existing_products[p.code] = p
        
        # Bulk create ZNAK_4
        if znak4_to_create:
            znak4_products = [
                Product(**data) for data in znak4_to_create
            ]
            created = Product.objects.bulk_create(znak4_products)
            created_count += len(created)
            
            # Yangi yaratilganlarni keshga qo'shish
            for p in created:
                existing_products[p.code] = p
        
        # ===== ZNAK_6 (level=3) =====
        # ZNAK_6 ustunini normallash va filtrlash
        df['ZNAK_6'] = df['ZNAK_6'].apply(lambda x: _n(x))
        df['ZNAK_6'] = df['ZNAK_6'].apply(lambda x: x.zfill(6) if x else None)
        
        # Nolmaslarini ajratib olish
        znak6_df = df[df['ZNAK_6'].notna()].drop_duplicates(subset=['ZNAK_6'])
        
        # ZNAK_6 mahsulotlarini yaratish uchun DataFrame
        znak6_to_create = []
        znak6_parent_codes = set()
        
        for _, row in znak6_df.iterrows():
            code = row['ZNAK_6']
            parent_code = code[:4]
            znak6_parent_codes.add(parent_code)
            
            name_ru = _t(row.get('ZNAK_6_RU', ''))
            name_uz = _t(row.get('ZNAK_6_LATIN_UZ', ''))
            name_cry = _t(row.get('ZNAK_6_KIRIL_1_UZ', ''))
            name_cry2 = _t(row.get('ZNAK_6_KIRIL_2_UZ', ''))
            
            if code in existing_products:
                # Update kerak
                p = existing_products[code]
                fields_to_update = {}
                if name_ru and p.name_ru != name_ru:
                    fields_to_update["name_ru"] = name_ru
                if name_uz and p.name_uz != name_uz:
                    fields_to_update["name_uz"] = name_uz
                if name_cry and p.name_cry != name_cry:
                    fields_to_update["name_cry"] = name_cry
                if name_cry2 and p.name_cry2 != name_cry2:
                    fields_to_update["name_cry2"] = name_cry2
                
                if fields_to_update:
                    for field, value in fields_to_update.items():
                        znak2_to_update[field].append((p.id, value))
                    updated_count += 1
            else:
                # Create
                znak6_to_create.append({
                    "code": code,
                    "name_ru": name_ru,
                    "name_uz": name_uz,
                    "name_cry": name_cry,
                    "name_cry2": name_cry2,
                    "level": 3,
                    "parent_id": parent_code
                })
        
        # ZNAK_6 ning ota kategoriyalarini tekshirish
        missing_parents = [code for code in znak6_parent_codes if code not in existing_products]
        
        # Yo'q ota kategoriyalarni yaratish
        if missing_parents:
            # ZNAK_4 parents (missing)
            missing_parents_create = []
            for code in missing_parents:
                parent_code = code[:2]  # ZNAK_2 code
                
                # Agar ZNAK_2 mavjud bo'lmasa, uni ham yaratish kerak
                if parent_code not in existing_products:
                    missing_parents_create.append(
                        Product(
                            code=parent_code,
                            name_ru="",
                            name_uz="",
                            name_cry="",
                            name_cry2="",
                            level=1,
                            parent_id=None
                        )
                    )
                
                # ZNAK_4 yaratish
                missing_parents_create.append(
                    Product(
                        code=code,
                        name_ru="",
                        name_uz="",
                        name_cry="",
                        name_cry2="",
                        level=2,
                        parent_id=parent_code
                    )
                )
            
            # Bulk create missing parents
            if missing_parents_create:
                created = Product.objects.bulk_create(missing_parents_create)
                created_count += len(created)
                
                # Yangi yaratilganlarni keshga qo'shish
                for p in created:
                    existing_products[p.code] = p
        
        # Bulk create ZNAK_6
        if znak6_to_create:
            znak6_products = [
                Product(**data) for data in znak6_to_create
            ]
            created = Product.objects.bulk_create(znak6_products)
            created_count += len(created)
        
        # ===== Bulk update =====
        # Har bir maydon bo'yicha batch-batch qilib update
        for field_name, updates in znak2_to_update.items():
            if not updates:
                continue
                
            # Chunklarga bo'lib yangilash
            CHUNK_SIZE = 1000
            for i in range(0, len(updates), CHUNK_SIZE):
                chunk = updates[i:i+CHUNK_SIZE]
                products_to_update = []
                
                for product_id, value in chunk:
                    product = Product(id=product_id)
                    setattr(product, field_name, value)
                    products_to_update.append(product)
                
                Product.objects.bulk_update(products_to_update, [field_name])
        
        # Import natijasi
        self._created = created_count
        self._updated = updated_count
        
        self._summary_text = (
            f"Created: {self._created}, Updated: {self._updated}, "
            f"Total processed: {len(df)}, "
            f"Unique ZNAK_2: {len(znak2_df)}, "
            f"Unique ZNAK_4: {len(znak4_df)}, "
            f"Unique ZNAK_6: {len(znak6_df)}"
        )

    # Admin ko'rinishi uchun: real ish before_import()da bajariladi
    def import_row(self, row, instance_loader, **kwargs):
        rr = results.RowResult()
        rr.import_type = results.RowResult.IMPORT_TYPE_SKIP
        rr.diff = [getattr(self, "_summary_text", "done (pandas bulk operations)")]
        rr.errors = []
        return rr
