"""Lokal/dev uchun sintetik (demo) ma'lumot. ISH_REJASI.md S-02.

    python manage.py seed_demo                      # hamma bo'limlar
    python manage.py seed_demo --only classifications,notifications
    python manage.py seed_demo --flush              # faqat sintetik yozuvlarni o'chiradi
    python manage.py seed_demo --dry-run            # yozmaydi, nima bo'lishini ko'rsatadi
    python manage.py seed_demo --demographics       # sintetik demografiya parquet (B-08)

DEBUG=False bo'lsa ishlamaydi (atayin, production uchun bayroq yo'q).
"""
import shutil
from collections import Counter, defaultdict
from pathlib import Path

from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.core.management.base import BaseCommand, CommandError
from django.db import router, transaction
from django.db.models.deletion import Collector

from apps.common.models import SyntheticRecord
from apps.common.seeders import registry


class DryRunRollback(Exception):
    pass


# Sintetik obyekt o'chirilganda kaskad orqali o'chishi mumkin bo'lgan "foydalanuvchi faolligi" jadvallari.
# Ular faqat demo akkaunt ilovadan foydalanganda paydo bo'ladi (token, limit ishlatilishi, buyurtma...).
ALLOWED_CASCADE = {
    "token_blacklist.OutstandingToken",
    "token_blacklist.BlacklistedToken",
    "services.UserServicePackageItemUse",
    "services.ServiceRating",
    "services.ServiceRequestResponse",
    "notifications.Notification",
    "book_market.OrderBook",
    "book_market.OrderItem",
    "common.AdminTOTPDevice",
    "common.ContactReply",
    "contracts.ContractStatusLog",
    "services.CustomDataRequest",
    "additional_services.SavedQuery",
    "citizens.SurveyResponse",
    "citizens.SurveyAnswer",
    "citizens.CitizenQuestion",
    "citizens.FavoriteIndicator",
    "open_api.ApiKey",
    "open_api.ApiUsage",
    "notifications.IndicatorSubscription",
}


class Command(BaseCommand):
    help = "Lokal/dev uchun sintetik ma'lumot yaratadi yoki o'chiradi (faqat DEBUG=True)."

    def add_arguments(self, parser):
        parser.add_argument("--only", help="Vergul bilan seeder nomlari: " + ", ".join(registry()))
        parser.add_argument("--flush", action="store_true", help="Faqat sintetik yozuvlarni o'chirish")
        parser.add_argument("--dry-run", action="store_true", help="Bazaga yozmasdan natijani ko'rsatish")
        parser.add_argument("--demographics", action="store_true", help="Sintetik demografiya parquet faylini yaratish")

    def handle(self, *args, **options):
        if not settings.DEBUG:
            raise CommandError("seed_demo faqat DEBUG=True muhitida ishlaydi.")

        seeders = registry()
        only = [s.strip() for s in (options["only"] or "").split(",") if s.strip()]
        unknown = set(only) - set(seeders)
        if unknown:
            raise CommandError(f"Noma'lum seeder: {', '.join(sorted(unknown))}")

        if options["demographics"]:
            from apps.common.seeders.demographics import write_synthetic_parquet
            path, rows = write_synthetic_parquet()
            self.stdout.write(self.style.SUCCESS(f"Sintetik demografiya: {rows} qator → {path}"))
            if not only and not options["flush"]:
                return

        if options["flush"]:
            self._flush(only, options["dry_run"])
            return

        names = self._ordered(only or list(seeders), seeders)
        totals = Counter()
        try:
            with transaction.atomic():
                for name in names:
                    self.stdout.write(f"→ {name}")
                    seeder = seeders[name](stdout=self.stdout)
                    with transaction.atomic():
                        seeder.seed()
                    totals.update(seeder.stats)
                    if getattr(seeder, "generated_password", None):
                        self.stdout.write(self.style.WARNING(
                            f"  Demo parol (bir marta ko'rsatiladi): {seeder.generated_password}\n"
                            "  Doimiy parol uchun .env ga DEMO_USER_PASSWORD qo'shing."
                        ))
                if options["dry_run"]:
                    raise DryRunRollback
        except DryRunRollback:
            self.stdout.write(self.style.WARNING("--dry-run: o'zgarishlar bekor qilindi"))

        self._report(totals)

    def _ordered(self, names, seeders):
        """Bog'liqlik tartibida; --only da ko'rsatilmagan bog'liqliklar ham qo'shiladi."""
        result, seen = [], set()

        def visit(name):
            if name in seen:
                return
            seen.add(name)
            for dep in seeders[name].depends_on:
                visit(dep)
            result.append(name)

        for name in names:
            visit(name)
        return result

    def _flush(self, only, dry_run):
        records = SyntheticRecord.objects.all()
        if only:
            from django.db.models import Q
            q = Q()
            for name in only:
                q |= Q(seed_key__startswith=f"{name}:")
            records = records.filter(q)

        groups, synthetic = [], defaultdict(set)
        for ct_id, ids in self._group(records).items():
            model = ContentType.objects.get_for_id(ct_id).model_class()
            synthetic[model._meta.label].update(ids)
            groups.append((model, ids))

        # PROTECT FK sababli bitta Collector yetmaydi: model bo'yicha ketma-ket o'chiramiz,
        # lekin hammasi bitta tranzaksiyada — real yozuv topilsa yoki --dry-run bo'lsa, hammasi qaytariladi.
        to_delete, foreign = Counter(), Counter()
        try:
            with transaction.atomic():
                for model, ids in groups:
                    objs = list(model._base_manager.filter(pk__in=ids))  # oldingi kaskaddan keyin qolganlari
                    if not objs:
                        continue
                    collector = Collector(using=router.db_for_write(model))
                    collector.collect(objs)
                    step_foreign = Counter()
                    for m, instances in collector.data.items():
                        for obj in instances:
                            self._classify(m, obj.pk, synthetic, to_delete, step_foreign)
                    for qs in collector.fast_deletes:
                        for pk in qs.values_list("pk", flat=True):
                            self._classify(qs.model, pk, synthetic, to_delete, step_foreign)
                    blocked = {label: n for label, n in step_foreign.items() if label not in ALLOWED_CASCADE}
                    if blocked:
                        details = ", ".join(f"{label}: {n}" for label, n in sorted(blocked.items()))
                        raise CommandError(
                            "To'xtatildi: sintetik yozuvlarni o'chirish real yozuvlarni ham o'chiradi → " + details
                        )
                    foreign.update(step_foreign)
                    collector.delete()
                records.delete()
                if dry_run:
                    raise DryRunRollback
        except DryRunRollback:
            pass

        for label, n in sorted(to_delete.items()):
            self.stdout.write(f"  {label:45} o'chiriladi: {n}")
        for label, n in sorted(foreign.items()):
            self.stdout.write(f"  {label:45} demo akkaunt faolligi (kaskad): {n}")

        if dry_run:
            self.stdout.write(self.style.WARNING("--dry-run: hech narsa o'chirilmadi"))
            return
        if not only:
            shutil.rmtree(Path(settings.MEDIA_ROOT) / "demo", ignore_errors=True)
        self.stdout.write(self.style.SUCCESS(f"O'chirildi: {sum(to_delete.values())} sintetik yozuv"))

    @staticmethod
    def _group(records):
        """content_type -> id'lar; keyin yaratilgan modellar oldin (PROTECT FK'lar uchun)."""
        grouped = defaultdict(list)
        for ct_id, object_id in records.order_by("-id").values_list("content_type_id", "object_id"):
            grouped[ct_id].append(object_id)
        return grouped

    @staticmethod
    def _classify(model, pk, synthetic, to_delete, foreign):
        label = model._meta.label
        if model is SyntheticRecord:
            return
        if str(pk) in synthetic.get(label, ()):
            to_delete[label] += 1
        else:
            foreign[label] += 1

    def _report(self, totals):
        by_model = defaultdict(Counter)
        for (label, kind), n in totals.items():
            by_model[label][kind] += n
        self.stdout.write("")
        self.stdout.write(f"{'Model':45} {'yaratildi':>10} {'mavjud edi':>11}")
        for label in sorted(by_model):
            c = by_model[label]
            self.stdout.write(f"{label:45} {c['created']:>10} {c['existed']:>11}")
