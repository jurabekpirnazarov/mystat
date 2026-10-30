"""StatCoin bekor qilindi: paket hamyonga to'langan summani so'mda qo'shadi (1 so'm = 1 so'm)."""
from django.db import migrations

AMOUNTS = {("monthly", "s50"): 824000, ("monthly", "s60"): 1236000, ("monthly", "s90"): 1648000}
TOPUP = {20: 412000, 50: 824000, 100: 1648000}


def to_som(apps, schema_editor):
    P = apps.get_model("services", "ServicePackage")
    for p in P.objects.exclude(statcoin_kind=""):
        if p.statcoin_kind == "monthly":
            som = AMOUNTS.get(("monthly", p.statcoin_plan))
        else:
            som = TOPUP.get(int(p.statcoin_amount))
        if not som:
            continue
        p.statcoin_amount = som
        if p.statcoin_kind == "topup":
            label = f"{som:,}".replace(",", " ")
            p.name_uz = p.name_ru = p.name_cry = f"Hamyonni to'ldirish +{label} so'm"
        p.save()


class Migration(migrations.Migration):
    dependencies = [("services", "0049_statcoin_activation")]
    operations = [migrations.RunPython(to_som, migrations.RunPython.noop)]
