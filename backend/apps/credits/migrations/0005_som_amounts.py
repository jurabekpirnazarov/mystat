"""StatCoin bekor qilindi: hamyon so'mda yuritiladi (1 so'm = 1 so'm).

Eski birlik 1 StatCoin ≈ 16 500 so'm (Scoring 50: 50 birlik = 824 000 so'm). Mavjud narxlar va hamyon yozuvlari shu
kurs bilan so'mga o'tkaziladi, shuning uchun foydalanuvchi qiymati o'zgarmaydi."""
from decimal import Decimal

from django.db import migrations

RATE = Decimal("16500")


def to_som(apps, schema_editor):
    for model in ("CreditPrice", "CreditLedger"):
        M = apps.get_model("credits", model)
        field = "credits" if model == "CreditPrice" else "amount"
        for row in M.objects.all():
            setattr(row, field, (getattr(row, field) * RATE).quantize(Decimal("1")))
            row.save(update_fields=[field])


def to_coin(apps, schema_editor):
    for model in ("CreditPrice", "CreditLedger"):
        M = apps.get_model("credits", model)
        field = "credits" if model == "CreditPrice" else "amount"
        for row in M.objects.all():
            setattr(row, field, (getattr(row, field) / RATE).quantize(Decimal("0.1")))
            row.save(update_fields=[field])


class Migration(migrations.Migration):
    dependencies = [("credits", "0004_service_prices")]
    operations = [migrations.RunPython(to_som, to_coin)]
