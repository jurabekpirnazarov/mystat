"""JT-02: `python manage.py sync_population_clock [--dry-run] [--file sahifa.html]`

stat.uz "Doimiy aholi soni" hisoblagichini o'qiydi, oxirgi `PopulationAnchor` bilan solishtiradi va o'zgargan bo'lsa
(yangi oy boshi, yangi raqam yoki tezliklar) yangi nuqta qo'shadi. Celery Beat har kuni ishga tushiradi.
"""
from django.core.management.base import BaseCommand, CommandError

from apps.siat import population_sync


class Command(BaseCommand):
    help = "stat.uz aholi hisoblagichi bilan aholi soatini sinxronlash"

    def add_arguments(self, parser):
        parser.add_argument("--dry-run", action="store_true", help="Bazaga yozmasdan faqat solishtirish")
        parser.add_argument("--file", help="stat.uz sahifasining saqlangan HTML'i (internetsiz tekshirish uchun)")

    def handle(self, *args, **opts):
        html = None
        if opts.get("file"):
            with open(opts["file"], encoding="utf-8") as f:
                html = f.read()
        try:
            r = population_sync.sync(html=html, dry_run=opts["dry_run"])
        except population_sync.ParseError as exc:
            raise CommandError(str(exc)) from exc
        except Exception as exc:  # tarmoq xatosi va h.k. — eski nuqta saqlanadi
            raise CommandError(f"stat.uz dan o'qib bo'lmadi: {exc}") from exc
        fmt = lambda n: f"{n:,}".replace(",", " ") if n is not None else "—"  # noqa: E731
        self.stdout.write(f"stat.uz boshlang'ich nuqta: {r['as_of']:%Y-%m-%d %H:%M} — {fmt(r['population'])}")
        self.stdout.write(f"Parametrlar: tug'ilish har {r['birth']} s, o'lim {r['death']} s, "
                          f"kelish {r['arrive']} s, ketish {r['depart']} s")
        self.stdout.write(f"stat.uz hozir ({r['page_time']:%Y-%m-%d %H:%M}): {fmt(r['current'])}")
        self.stdout.write(f"Bizning soat shu paytda (yangilashdan oldin): {fmt(r['ours_before'])}; "
                          f"farq: {fmt(r['diff_before'])}")
        style = self.style.SUCCESS if r["action"] != "would_create" else self.style.WARNING
        self.stdout.write(style({"unchanged": "O'zgarish yo'q — nuqta allaqachon mos.",
                                 "created": "Yangi nuqta qo'shildi.",
                                 "would_create": "Yangi nuqta kerak (--dry-run: yozilmadi)."}[r["action"]]))
