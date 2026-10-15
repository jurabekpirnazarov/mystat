"""OS-14: yangi pullik xizmatlar uchun `PackageService` (slug) va tariflarga default limitlar.

    python manage.py setup_service_limits             # yo'qlarini yaratadi
    python manage.py setup_service_limits --dry-run   # faqat ko'rsatadi

Idempotent: mavjud `PackageService`/`PackageServiceItem` ga tegilmaydi, admin'da o'zgartirilgan
limit qayta yozilmaydi. Tarif darajasi nomining boshidagi raqamdan olinadi ("3 - Tarif" -> 3);
raqam topilmasa 1-daraja limiti beriladi. Limitlar default — keyin admin'da sozlanadi.
"""
import re

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.services.models import PackageService, PackageServiceItem, ServicePackage

# slug: (nom uz, nom ru, nom kirill, {daraja: limit})
SERVICES = {
    "benchmark": ("Tarmoq benchmarki", "Отраслевой бенчмарк", "Тармоқ бенчмарки",
                  {1: 1, 2: 3, 3: 10, 4: 30}),
    "market-report": ("Bozor tahlili (to'liq versiya)", "Анализ рынка (полная версия)",
                      "Бозор таҳлили (тўлиқ версия)", {1: 1, 2: 3, 3: 10, 4: 30}),
    "partners-export": ("Hamkorlar ro'yxatini eksport", "Экспорт списка партнёров",
                        "Ҳамкорлар рўйхатини экспорт", {1: 1, 2: 3, 3: 10, 4: 30}),
    "consultation": ("Konsultatsiya", "Консультация", "Консультация", {1: 1, 2: 2, 3: 5, 4: 10}),
}


def package_tier(package):
    m = re.match(r"\s*(\d+)", package.name_uz or "")
    return int(m.group(1)) if m else 1


class DryRunRollback(Exception):
    pass


class Command(BaseCommand):
    help = "Yangi pullik xizmatlar uchun PackageService va tariflarga default limit (OS-14)"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Yozmaydi, nima bo'lishini ko'rsatadi")

    def handle(self, *args, dry_run=False, **options):
        try:
            with transaction.atomic():
                self._run()
                if dry_run:
                    raise DryRunRollback
        except DryRunRollback:
            self.stdout.write(self.style.WARNING("--dry-run: hech narsa yozilmadi"))

    def _run(self):
        packages = list(ServicePackage.objects.filter(is_active=True).order_by("id"))
        for slug, (name_uz, name_ru, name_cry, limits) in SERVICES.items():
            ps, created = PackageService.objects.get_or_create(
                slug=slug, defaults={"name_uz": name_uz, "name_ru": name_ru, "name_cry": name_cry})
            self.stdout.write(f"{slug}: {'yaratildi' if created else 'bor'}")
            for package in packages:
                if PackageServiceItem.objects.filter(package=package, package_service=ps).exists():
                    continue
                tier = package_tier(package)
                limit = limits[min(max(tier, 1), max(limits))]
                PackageServiceItem.objects.create(package=package, package_service=ps, limit=limit,
                                                  name_uz=name_uz, name_ru=name_ru, name_cry=name_cry)
                self.stdout.write(f"  {package.name_uz}: limit {limit}")
