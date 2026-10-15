"""KR-01/KR-02: SIAT ko'rsatkichlarini bazaga sinxronlash.

    python manage.py sync_siat                  # faol va boshlang'ich ro'yxatdagi ko'rsatkichlar
    python manage.py sync_siat --ids 246 1875   # faqat shular
    python manage.py sync_siat --force          # updated_at o'zgarmagan bo'lsa ham qayta yuklash
    python manage.py sync_siat --file 246 sdmx_data_246.json   # tarmoq yopiq bo'lsa: qo'lda yuklangan fayl
    python manage.py sync_siat --catalog        # sitemap.xml dagi barcha ID'lar (uzoq: ~3 200 ta)
"""
import json

from django.core.management.base import BaseCommand, CommandError

from apps.siat import client
from apps.siat.sync import _indicator_for, bump_cache, load_payload, rebuild_derived, rebuild_groups, run_sync


class Command(BaseCommand):
    help = "SIAT (siat.stat.uz) ko'rsatkichlarini bazaga sinxronlaydi"

    def add_arguments(self, parser):
        parser.add_argument("--ids", nargs="+", type=int, help="SIAT ID'lari")
        parser.add_argument("--force", action="store_true", help="O'zgarmagan bo'lsa ham qayta yuklash")
        parser.add_argument("--catalog", action="store_true", help="sitemap.xml dagi barcha ko'rsatkichlar")
        parser.add_argument("--file", nargs=2, metavar=("ID", "PATH"), help="Lokal JSON fayldan yuklash")

    def handle(self, *args, ids=None, force=False, catalog=False, file=None, **options):
        if file:
            siat_id, path = int(file[0]), file[1]
            try:
                with open(path, encoding="utf-8") as fh:
                    payload = json.load(fh)
                indicator = load_payload(_indicator_for(siat_id), payload)
            except (OSError, ValueError, client.SiatError) as exc:
                raise CommandError(str(exc)) from exc
            rebuild_groups()
            rebuild_derived()
            bump_cache()
            self.stdout.write(self.style.SUCCESS(f"{siat_id}: {indicator.name_uz} — {indicator.values.count()} qiymat"))
            return
        if catalog:
            try:
                ids = client.catalog_ids()
            except client.SiatError as exc:
                raise CommandError(f"sitemap.xml olinmadi: {exc}") from exc
            self.stdout.write(f"Katalogda {len(ids)} ta ko'rsatkich")
        log = run_sync(ids=ids, force=force, trigger="command", catalog=catalog)
        self.stdout.write(self.style.SUCCESS(
            f"Yangilandi: {log.updated}, o'zgarmagan: {log.unchanged}, xato: {log.failed}"))
        if log.details:
            self.stdout.write(log.details)
