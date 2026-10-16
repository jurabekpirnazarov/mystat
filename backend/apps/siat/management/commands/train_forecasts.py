"""SCORING_MODEL.md KR-23..KR-26: prognoz modellarini orqaga sinov bilan tanlash, o'qitish va prognozni saqlash.

    python manage.py train_forecasts             # ma'lumot oxiri (data_until) o'zgargan bo'lsa
    python manage.py train_forecasts --force     # o'zgarmagan bo'lsa ham
    python manage.py train_forecasts --report    # orqaga sinov jadvali: ko'rsatkich × horizont, barcha usullar
    python manage.py train_forecasts --ids 500 1875

Usul kodlari va aniqlik o'lchovlari faqat shu hisobot va admin uchun — foydalanuvchi interfeysida ko'rsatilmaydi.
"""
from django.core.management.base import BaseCommand

from apps.siat.forecast.train import train_all


class Command(BaseCommand):
    help = "Ko'rsatkichlar prognozini o'qitadi va saqlaydi"

    def add_arguments(self, parser):
        parser.add_argument("--force", action="store_true")
        parser.add_argument("--report", action="store_true")
        parser.add_argument("--ids", nargs="+", help="Ko'rsatkich kalitlari (forecast/spec.py)")

    def handle(self, *args, force=False, report=False, ids=None, **options):
        record = train_all(force=force or bool(ids), keys=ids)
        if record is None:
            self.stdout.write("Ma'lumot o'zgarmagan — prognoz qayta o'qitilmadi (--force bilan majburlash mumkin)")
            return
        self.stdout.write(self.style.SUCCESS(f"Prognoz versiyasi {record.version} saqlandi"))
        if report:
            for key, levels in record.report.items():
                for level, horizons in levels.items():
                    for h, row in horizons.items():
                        table = ", ".join(f"{m}: MASE {v['mase']}, MAPE {v['mape']}%, yo'nalish {v['direction']}%"
                                          for m, v in sorted(row["all"].items()) if v)
                        iv = row.get("interval") or {}
                        flag = " (kichik namuna)" if iv.get("small_sample") else ""
                        self.stdout.write(f"{key:>16} {level:<8} h={h} -> {row['method']} | {table} | 80% qamrov: "
                                          f"{iv.get('coverage')}% [{iv.get('basis')}, n={iv.get('n')}]{flag}")
            for key, mon in (record.monitoring or {}).items():
                self.stdout.write(f"Monitoring {key}: MAPE {mon['mape']}%, oraliq ichida {mon['inside_pct']}% "
                                  f"({mon['count']} ta)")
