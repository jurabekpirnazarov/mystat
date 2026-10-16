"""KORXONA_SCORING.md KR-31: korxona ballarini hisoblash (barcha presetlar) va `EnterpriseScore` ga yozish.

    python manage.py compute_company_scores
    python manage.py compute_company_scores --async     # Celery orqali

`seed_demo --only enterprise_scoring` va real import tugaganda avtomatik chaqiriladi.
"""
import time

from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Korxona ballarini hisoblaydi (company_scoring.yaml)"

    def add_arguments(self, parser):
        parser.add_argument("--async", action="store_true", dest="run_async", help="Celery vazifasi sifatida")

    def handle(self, *args, run_async=False, **options):
        if run_async:
            from apps.analytics.tasks import compute_company_scores_task

            compute_company_scores_task.delay()
            self.stdout.write("Celery'ga yuborildi")
            return
        from apps.analytics.company_scoring.service import compute_all

        t0 = time.monotonic()
        n = compute_all(stdout=self.stdout)
        self.stdout.write(self.style.SUCCESS(f"Korxona ballari: {n} qator, {time.monotonic() - t0:.1f} s"))
