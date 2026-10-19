"""KORXONA_SCORING.md 11.1, 13.5: standart narxlar (admin'da o'zgaradi). Faqat yo'q bo'lsa qo'shiladi."""
from django.db import migrations

PRICES = [
    ("profile_basis", "Profil: ball nimaga asoslangan (1-daraja, 30 kun)", 1),
    ("profile_deep", "Profil: chuqur tahlil (2-daraja, 30 kun; 1-daraja ochilgan bo'lsa farqi)", 3),
    ("profile_pdf", "Profil: PDF (chuqur tahlil ochilgan bo'lsa)", 0),
]


def add(apps, schema_editor):
    CreditPrice = apps.get_model("credits", "CreditPrice")
    for code, name, credits in PRICES:
        CreditPrice.objects.get_or_create(action_code=code, defaults={"name": name, "credits": credits})


class Migration(migrations.Migration):
    dependencies = [("credits", "0001_initial")]

    operations = [migrations.RunPython(add, migrations.RunPython.noop)]
