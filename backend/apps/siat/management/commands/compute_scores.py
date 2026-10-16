"""SCORING_MODEL.md KR-16, KR-22: salohiyat indeksini hisoblash va TerritoryScore'ga yozish.

    python manage.py compute_scores              # barcha yillar × standart presetlar × darajalar (+ prognoz yillari)
    python manage.py compute_scores --report     # qo'shimcha: tekshiruv hisoboti (korrelyatsiya, barqarorlik, orqaga sinov)
    python manage.py compute_scores --no-forecast
"""
import json

from django.core.management.base import BaseCommand

from apps.siat.scoring import store


class Command(BaseCommand):
    help = "Hududlar salohiyati indeksini hisoblaydi (scoring.yaml)"

    def add_arguments(self, parser):
        parser.add_argument("--report", action="store_true", help="Tekshiruv hisoboti")
        parser.add_argument("--no-forecast", action="store_true", help="Prognoz yillarisiz")
        parser.add_argument("--samples", type=int, default=100, help="Prognoz yili o'rin oralig'i uchun namuna soni")

    def handle(self, *args, report=False, no_forecast=False, samples=100, **options):
        count = store.compute_all(with_forecast=not no_forecast, mc_samples=samples)
        self.stdout.write(self.style.SUCCESS(f"Salohiyat indeksi: {count} qator yozildi"))
        if report:
            self.stdout.write(json.dumps(store.report(), ensure_ascii=False, indent=2))
