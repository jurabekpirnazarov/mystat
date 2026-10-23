"""KORXONA_SCORING.md 11.2, KR-41: Scoring tarif paketlari va StatCoin to'ldirish paketlari. FAQAT YANGI yozuvlar:
mavjud paketlarga tegilmaydi. Paketlar NOFAOL (`is_active=False`) yaratiladi — narx (BHM) egasining qarori (OS-19,
StatCoin narxi) bo'lguncha mijozlarga ko'rinmasin. Admin'da narxni tasdiqlab "Aktivmi" belgilanadi.
Korporativ tarif paketsiz: individual shartnoma, `/tariffs` dagi forma orqali."""
from django.db import migrations

# (nomi, kod, tur, StatCoin, tarif, BHM (vaqtinchalik), muddat kun)
PACKAGES = [
    ("Scoring 50", "monthly", 50, "s50", 2, 365),
    ("Scoring 60", "monthly", 60, "s60", 3, 365),
    ("Scoring 90", "monthly", 90, "s90", 4, 365),
    ("StatCoin +20", "topup", 20, "", 1, 365),
    ("StatCoin +50", "topup", 50, "", 2, 365),
    ("StatCoin +100", "topup", 100, "", 4, 365),
]


def add(apps, schema_editor):
    Package = apps.get_model("services", "ServicePackage")
    for name, kind, amount, plan, bhm, days in PACKAGES:
        if Package.objects.filter(name_uz=name, statcoin_kind=kind).exists():
            continue
        Package.objects.create(name_uz=name, name_ru=name, name_cry=name, base_bhm_count=bhm, duration_days=days,
                               is_active=False, statcoin_kind=kind, statcoin_amount=amount, statcoin_plan=plan)


def remove(apps, schema_editor):
    apps.get_model("services", "ServicePackage").objects.filter(
        name_uz__in=[p[0] for p in PACKAGES], user_service_packages__isnull=True).delete()


class Migration(migrations.Migration):
    dependencies = [("services", "0047_package_statcoin")]
    operations = [migrations.RunPython(add, remove)]
