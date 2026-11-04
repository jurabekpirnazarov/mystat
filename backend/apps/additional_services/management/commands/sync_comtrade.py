"""O'zbekiston tashqi savdo ma'lumotini UN Comtrade+ dan yuklaydi.

Misollar:
  manage.py sync_comtrade --hs 1701,1702 --years 2019-2024          # kalitsiz (ochiq API, bitta HS = bitta so'rov, 500 qatorgacha)
  manage.py sync_comtrade --years 2022-2024                         # kalit bilan: butun HS6 x hamkor
  manage.py sync_comtrade --freq M --years 2024 --months 1-6        # oylik
"""
from django.core.management.base import BaseCommand, CommandError

from apps.additional_services.services import comtrade


def _span(text):
    a, _, b = text.partition("-")
    return list(range(int(a), int(b or a) + 1))


class Command(BaseCommand):
    help = "UN Comtrade+: O'zbekiston (860) eksport/import ma'lumotini bazaga yuklash"

    def add_arguments(self, parser):
        parser.add_argument("--years", default="", help="2022 yoki 2019-2024 (standart: oxirgi 4 yil)")
        parser.add_argument("--flows", default="X,M", help="X=eksport, M=import")
        parser.add_argument("--freq", default="A", choices=["A", "M"])
        parser.add_argument("--months", default="", help="oylik rejimda, masalan 1-6")
        parser.add_argument("--hs", default="", help="vergul bilan HS kodlari (kalitsiz majburiy)")

    def handle(self, *args, **o):
        try:
            entry = comtrade.sync(years=_span(o["years"]) if o["years"] else None, flows=[f for f in o["flows"].split(",") if f],
                                  freq=o["freq"], months=_span(o["months"]) if o["months"] else None,
                                  hs=[h for h in o["hs"].split(",") if h])
        except comtrade.ComtradeError as exc:
            raise CommandError(str(exc))
        self.stdout.write(f"{entry.status}: {entry.calls} so'rov, {entry.rows} qator saqlandi")
        if entry.error:
            self.stdout.write(self.style.WARNING(entry.error))
