"""KR-41/OS-21 (egasining qarori, 2026-10-23): benchmark, bozor tahlili, hamkor eksporti va konsultatsiya paket limiti
o'rniga StatCoin bilan to'lanadi. Standart narxlar vaqtinchalik — admin'da (StatCoin narxlari) o'zgaradi. Faqat yo'q
bo'lsa qo'shiladi. Narxni o'chirib (nofaol qilib) xizmatni eski paket limitiga qaytarish mumkin."""
from django.db import migrations

PRICES = [
    ("benchmark", "Tarmoq benchmarki (bir hisobot, bir kunda qayta sanalmaydi)", 1),
    ("market_report", "Bozor tahlili (to'liq versiya)", 3),
    ("partners_export", "Hamkorlar ro'yxatini eksport (XLSX)", 2),
    ("consultation", "Konsultatsiya (bir seans; 24 soatdan oldin bekor qilinsa qaytadi)", 5),
]


def add(apps, schema_editor):
    CreditPrice = apps.get_model("credits", "CreditPrice")
    for code, name, credits in PRICES:
        CreditPrice.objects.get_or_create(action_code=code, defaults={"name": name, "credits": credits})


class Migration(migrations.Migration):
    dependencies = [("credits", "0003_statcoin_labels")]
    operations = [migrations.RunPython(add, migrations.RunPython.noop)]
