# apps/additional_services/services/excel_positional_to_models.py
import io
from typing import Dict, List, Tuple, Optional

import pandas as pd
from django.db import transaction
from django.core.exceptions import ValidationError

from apps.additional_services.models import Country, CountryGroup


def _nan_to_none(df: pd.DataFrame) -> pd.DataFrame:
    """NaN -> None."""
    return df.where(pd.notnull(df), None)


def _to_int_or_none(v):
    if v is None or v == "":
        return None
    try:
        if isinstance(v, float) and pd.notna(v) and float(v).is_integer():
            return int(v)
        return int(v)
    except (TypeError, ValueError):
        return None


_PLACEHOLDERS = {"N", "NN", "NNN", "N/A", "NA", "-", "--", "NONE", "NULL", "0"}


def _norm_code(v: object) -> Optional[str]:

    if v is None:
        return None
    try:
        if pd.isna(v):  # pandas NaN
            return None
    except Exception:
        pass

    s = str(v).strip()
    if s == "":
        return None

    s_up = s.upper()
    if s_up in _PLACEHOLDERS:
        return None

    # 840.0 -> "840"
    try:
        f = float(s)
        if pd.notna(f) and float(f).is_integer():
            return str(int(f))
    except Exception:
        pass

    return s_up


class ExcelPositionalToModelsService:

    USING = "default"

    @classmethod
    def import_all(cls, file) -> Dict[str, int]:
        bio = io.BytesIO(file.read())
        try:
            xls = pd.ExcelFile(bio)
        finally:
            file.seek(0)

        with transaction.atomic(using=cls.USING):
            gi, gu = cls._import_groups(xls)
            ci, cu, fk_miss = cls._import_countries(xls)

        return {
            "groups_inserted": gi,
            "groups_updated": gu,
            "countries_inserted": ci,
            "countries_updated": cu,
            "country_fk_missing_group_rows": fk_miss,
        }

    # ---------------- groups (col1..col5) ----------------
    @classmethod
    def _import_groups(cls, xls) -> Tuple[int, int]:
        try:
            raw = pd.read_excel(xls, sheet_name="groups", header=None)
        except ValueError:
            raise ValidationError("'groups' sheet topilmadi")

        if raw.empty:
            return 0, 0

        df = _nan_to_none(raw.iloc[:, :5].copy())
        if df.shape[1] < 5:
            raise ValidationError("'groups' shetda kamida 5 ta ustun (col1..col5) bo‘lishi shart.")

        df.columns = ["code", "name_uz_lat", "name_ru", "name_en", "name_uz_cyr"]

        df["code"] = df["code"].apply(_norm_code)
        df = df[df["code"].notna()]
        df = df.drop_duplicates(subset=["code"], keep="last")

        for col in ["name_uz_lat", "name_ru", "name_en", "name_uz_cyr"]:
            df[col] = df[col].apply(lambda v: "" if v in (None, "") else str(v).strip())

        existing = CountryGroup.objects.using(cls.USING).in_bulk(field_name="code")
        to_create: List[CountryGroup] = []
        to_update: List[CountryGroup] = []

        for _, row in df.iterrows():
            code = row["code"]
            data = dict(
                code=code,
                name_uz_lat=row["name_uz_lat"],
                name_ru=row["name_ru"],
                name_en=row["name_en"],
                name_uz_cyr=row["name_uz_cyr"],
            )
            if code in existing:
                obj = existing[code]
                obj.name_uz_lat = data["name_uz_lat"]
                obj.name_ru = data["name_ru"]
                obj.name_en = data["name_en"]
                obj.name_uz_cyr = data["name_uz_cyr"]
                to_update.append(obj)
            else:
                to_create.append(CountryGroup(**data))

        ins = upd = 0
        if to_create:
            CountryGroup.objects.using(cls.USING).bulk_create(to_create)
            ins = len(to_create)
        if to_update:
            CountryGroup.objects.using(cls.USING).bulk_update(
                to_update, ["name_uz_lat", "name_ru", "name_en", "name_uz_cyr"]
            )
            upd = len(to_update)
        return ins, upd


    @classmethod
    def _import_countries(cls, xls) -> Tuple[int, int, int]:
        try:
            raw = pd.read_excel(xls, sheet_name="davlatlar", header=None)
        except ValueError:
            raise ValidationError("'davlatlar' sheet topilmadi")

        if raw.empty:
            return 0, 0, 0

        df = _nan_to_none(raw.iloc[:, :11].copy())
        if df.shape[1] < 11:
            raise ValidationError("'davlatlar' shetda kamida 11 ta ustun (col1..col11) bo‘lishi shart.")

        df.columns = [
            "ctrana", "zar0", "zar1", "zar", "name",
            "name_en", "name_uz_cyr", "name_uz_lat", "name_ru",
            "kod_kont", "country_group_code",
        ]

        df["ctrana"] = df["ctrana"].apply(_norm_code)
        df = df[df["ctrana"].notna()]
        df = df.drop_duplicates(subset=["ctrana"], keep="last")

        for col in ["zar0", "zar1", "zar", "kod_kont"]:
            df[col] = df[col].apply(_to_int_or_none)

        # string maydonlar
        for col in ["name", "name_en", "name_uz_cyr", "name_uz_lat", "name_ru"]:
            df[col] = df[col].apply(lambda v: "" if v in (None, "") else str(v).strip())

        # FK: to_field='code' → code saqlanadi; mavjud bo'lmasa None
        fk_field = Country._meta.get_field("country_group")
        assert fk_field.target_field.name == "code", "Country.country_group to_field='code' bo‘lishi kerak!"

        existing = Country.objects.using(cls.USING).in_bulk(field_name="ctrana")

        # CountryGroup code’lari ro‘yxati (FK tekshirish uchun)
        groups_by_code = set(CountryGroup.objects.using(cls.USING).values_list("code", flat=True))

        to_create: List[Country] = []
        to_update: List[Country] = []
        fk_missing = 0
        seen_new = set()  # to_create ichida takror bo‘lmasin

        for _, row in df.iterrows():
            ctr = row["ctrana"]

            # FK code normalizatsiya + mavjudligini tekshirish
            fk_code = _norm_code(row["country_group_code"])
            if fk_code and fk_code in groups_by_code:
                cg_value = fk_code
            else:
                cg_value = None
                if fk_code:
                    fk_missing += 1

            base = dict(
                ctrana=ctr,
                zar0=row["zar0"],
                zar1=row["zar1"],
                zar=row["zar"],
                name=row["name"],
                name_en=row["name_en"],
                name_uz_cyr=row["name_uz_cyr"],
                name_uz_lat=row["name_uz_lat"],
                name_ru=row["name_ru"],
                kod_kont=row["kod_kont"],
                country_group_id=cg_value,  # to_field='code' — mavjud bo'lsa code, aks holda None
            )

            if ctr in existing:
                obj = existing[ctr]
                obj.zar0 = base["zar0"]
                obj.zar1 = base["zar1"]
                obj.zar = base["zar"]
                obj.name = base["name"]
                obj.name_en = base["name_en"]
                obj.name_uz_cyr = base["name_uz_cyr"]
                obj.name_uz_lat = base["name_uz_lat"]
                obj.name_ru = base["name_ru"]
                obj.kod_kont = base["kod_kont"]
                obj.country_group_id = base["country_group_id"]
                to_update.append(obj)
            else:
                if ctr in seen_new:
                    continue
                to_create.append(Country(**base))
                seen_new.add(ctr)

        ins = upd = 0
        if to_create:
            # xavfsizlik uchun, tasodifiy kolliziyalarda xato bermaydi
            Country.objects.using(cls.USING).bulk_create(to_create, ignore_conflicts=True)
            ins = len(to_create)

        if to_update:
            Country.objects.using(cls.USING).bulk_update(
                to_update,
                [
                    "zar0", "zar1", "zar", "name", "name_en",
                    "name_uz_cyr", "name_uz_lat", "name_ru",
                    "kod_kont", "country_group_id",
                ],
            )
            upd = len(to_update)

        return ins, upd, fk_missing
