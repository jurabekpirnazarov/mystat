# apps/additional_services/resources.py

import math
import pandas as pd
import numpy as np
from import_export import resources, results
from import_export.instance_loaders import BaseInstanceLoader
from django.db import transaction
from apps.additional_services.models.ex_trade import SITC
from collections import defaultdict


# --- Instance loader: har qator uchun custom upsert ishlatamiz, instanceni qidirmaymiz ---
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
    return s if s else None


def _t(val):
    """Matn normalizatsiyasi (NaN -> "", strip)."""
    if pd.isna(val):
        return ""
    return str(val).strip()


# === KOD uzunligi -> level xaritasi (sizning qoidalaringiz) ===
LEVEL_BY_LEN = {1: 1, 2: 2, 3: 3, 5: 4, 4: 4}  # len(code) -> level


def parent_of(code: str) -> str | None:
    """Kodni darajaga ko'ra ota kodga qisqartiradi."""
    if not code:
        return None
    L = len(code)
    if L == 1:
        return None
    if L == 2:
        return code[:1]   # N2 -> N1
    if L == 3:
        return code[:2]   # N3 -> N2
    if L == 5 or L == 4:
        return code[:3]   # N4 -> N3
    return None


class SITCExcelResource(resources.Resource):
    """
    SITC Import Resource with Pandas optimization:
      - FK=code (parent_id = ota CODE)
      - 4-pass: N1 (len=1) -> N2 (len=2) -> N3 (len=3) -> N4 (len=5)
      - Pandas bilan optimallashtirilgan
    """
    supports_export = False

    @classmethod
    def get_display_name(cls):
        return "SITC Excel (N1→N4, FK=code, pandas optimized)"

    class Meta:
        skip_unchanged = True
        report_skipped = True
        use_transactions = True
        instance_loader_class = NoopInstanceLoader
        use_bulk = True
        model = SITC
    # Excel ustunlari aliaslari (har xil nomlashlarni tutib olish uchun)
    COLS = {
        "code": ("kod", "code", "kod n1", "kod n2", "kod n3", "kod n4"),
        "name_uz": ("name_uz", "nomi_uz", "uz", "uzbek"),
        "name_ru": ("name_ru", "nomi_ru", "ru", "russian"),
        "name_cry": ("name_cry", "nomi_cry", "cry", "kirill"),
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
                    if alias in col:
                        col_mapping[col] = standard_name
                        break
        
        # Ustun nomlarini o'zgartirish
        df = df.rename(columns=col_mapping)
        return df

    @transaction.atomic
    def before_import(self, dataset, **kwargs):
        # Ma'lumotni DataFramega o'tkazish
        df = pd.DataFrame(dataset.dict)
        
        # Ustun nomlarini normallashtirish
        df = self._normalize_column_names(df)
        
        # Kerakli ustunlar mavjudligini tekshirish
        required_columns = ['code', 'name_uz', 'name_ru']
        for col in required_columns:
            if col not in df.columns:
                df[col] = ""
        
        if 'name_cry' not in df.columns:
            df['name_cry'] = ""
        
        # Ma'lumotlarni tozalash
        df['code'] = df['code'].apply(lambda x: _n(x))
        df['name_uz'] = df['name_uz'].apply(lambda x: _t(x))
        df['name_ru'] = df['name_ru'].apply(lambda x: _t(x))
        df['name_cry'] = df['name_cry'].apply(lambda x: _t(x))
        
        # Bo'sh kodlarni olib tashlash
        df = df[df['code'].notna()]
        df = df[df['code'] != '']
        
        # Takroriy kodlarni olib tashlash
        df = df.drop_duplicates(subset=['code'], keep='first')
        
        # Level va parent qo'shish
        df['code_length'] = df['code'].str.len()
        df['level'] = df['code_length'].map(LEVEL_BY_LEN)
        df['parent_code'] = df['code'].apply(parent_of)
        
        # Level bo'yicha saralash
        df = df.sort_values(['level', 'code'])
        
        # Mavjud SITC obyektlarini kesh qilish
        existing_sitc = {
            s.code: s for s in SITC.objects.all().only(
                "id", "code", "level", "parent_id", "name_uz", "name_ru", "name_cry"
            )
        }
        
        # Counters
        self._created = 0
        self._updated = 0
        
        # Level bo'yicha guruhlashtirish
        levels_to_process = [1, 2, 3, 4]
        
        for level in levels_to_process:
            level_df = df[df['level'] == level].copy()
            if level_df.empty:
                continue
            
            # Yaratish va yangilash ro'yxatlari
            to_create = []
            to_update = defaultdict(list)
            missing_parents = set()
            
            # Har bir qator uchun
            for _, row in level_df.iterrows():
                code = row['code']
                name_uz = row['name_uz']
                name_ru = row['name_ru']
                name_cry = row['name_cry']
                parent_code = row['parent_code']
                
                # Parent mavjudligini tekshirish
                if parent_code and parent_code not in existing_sitc:
                    missing_parents.add(parent_code)
                
                if code in existing_sitc:
                    # Mavjud obyektni yangilash
                    obj = existing_sitc[code]
                    fields_to_update = {}
                    
                    if name_uz and obj.name_uz != name_uz:
                        fields_to_update["name_uz"] = name_uz
                    if name_ru and obj.name_ru != name_ru:
                        fields_to_update["name_ru"] = name_ru
                    if name_cry and obj.name_cry != name_cry:
                        fields_to_update["name_cry"] = name_cry
                    if obj.level != level:
                        fields_to_update["level"] = level
                    
                    if fields_to_update:
                        for field, value in fields_to_update.items():
                            to_update[field].append((obj.id, value))
                        self._updated += 1
                else:
                    # Yangi obyekt yaratish
                    to_create.append({
                        'code': code,
                        'name_uz': name_uz or "",
                        'name_ru': name_ru or "",
                        'name_cry': name_cry or "",
                        'level': level,
                        'parent_id': parent_code
                    })
            
            # Yo'q parentlarni yaratish
            if missing_parents:
                parents_to_create = []
                for parent_code in missing_parents:
                    if parent_code not in existing_sitc:
                        parent_level = LEVEL_BY_LEN.get(len(parent_code), 1)
                        grandparent_code = parent_of(parent_code)
                        
                        # Grandparent ham yo'q bo'lsa, uni ham yaratish
                        if grandparent_code and grandparent_code not in existing_sitc:
                            grandparent_level = LEVEL_BY_LEN.get(len(grandparent_code), 1)
                            great_grandparent_code = parent_of(grandparent_code)
                            
                            if great_grandparent_code and great_grandparent_code not in existing_sitc:
                                great_grandparent_level = LEVEL_BY_LEN.get(len(great_grandparent_code), 1)
                                parents_to_create.append(SITC(
                                    code=great_grandparent_code,
                                    name_uz="",
                                    name_ru="",
                                    name_cry="",
                                    level=great_grandparent_level,
                                    parent_id=None
                                ))
                                existing_sitc[great_grandparent_code] = parents_to_create[-1]
                            
                            parents_to_create.append(SITC(
                                code=grandparent_code,
                                name_uz="",
                                name_ru="",
                                name_cry="",
                                level=grandparent_level,
                                parent_id=great_grandparent_code
                            ))
                            existing_sitc[grandparent_code] = parents_to_create[-1]
                        
                        parents_to_create.append(SITC(
                            code=parent_code,
                            name_uz="",
                            name_ru="",
                            name_cry="",
                            level=parent_level,
                            parent_id=grandparent_code
                        ))
                        existing_sitc[parent_code] = parents_to_create[-1]
                
                if parents_to_create:
                    created = SITC.objects.bulk_create(parents_to_create, ignore_conflicts=True)
                    self._created += len(created)
            
            # Asosiy obyektlarni yaratish
            if to_create:
                objects_to_create = []
                for data in to_create:
                    obj = SITC(**data)
                    objects_to_create.append(obj)
                    existing_sitc[data['code']] = obj
                
                created = SITC.objects.bulk_create(objects_to_create, ignore_conflicts=True)
                self._created += len(created)
            
            # Bulk update
            for field_name, updates in to_update.items():
                if not updates:
                    continue
                
                # Chunklarga bo'lib yangilash
                CHUNK_SIZE = 1000
                for i in range(0, len(updates), CHUNK_SIZE):
                    chunk = updates[i:i+CHUNK_SIZE]
                    objects_to_update = []
                    
                    for obj_id, value in chunk:
                        obj = SITC(id=obj_id)
                        setattr(obj, field_name, value)
                        objects_to_update.append(obj)
                    
                    SITC.objects.bulk_update(objects_to_update, [field_name])
        
        # FK target tekshiruv
        fk_target = SITC._meta.get_field('parent').target_field.name
        
        self._summary_text = (
            f"Created: {self._created}, Updated: {self._updated}, "
            f"Total processed: {len(df)}, FK→{fk_target}, "
            f"Levels processed: {', '.join(map(str, levels_to_process))}"
        )

    # Admin natijasi uchun: real ish before_import()da bajariladi
    def import_row(self, row, instance_loader, **kwargs):
        rr = results.RowResult()
        rr.import_type = results.RowResult.IMPORT_TYPE_SKIP
        rr.diff = [getattr(self, "_summary_text", "done (pandas bulk operations with hierarchical creation)")]
        rr.errors = []
        return rr
