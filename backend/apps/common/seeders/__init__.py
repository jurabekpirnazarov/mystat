"""`seed_demo` uchun seeder'lar. ISH_REJASI.md 2-bosqich.

Qoidalar:
- faqat yangi yozuv yaratiladi, real yozuvlar o'zgartirilmaydi va o'chirilmaydi;
- har bir yozuv `SyntheticRecord` ga barqaror `seed_key` bilan yoziladi (idempotent);
- real ma'lumotnomalar (Service, ServicePackage, District...) faqat o'qiladi.
"""
import random
from collections import Counter
from datetime import datetime, timedelta

from django.utils import timezone

from apps.common.synthetic import get_or_create_synthetic

SEED = 20261013
DEMO_PREFIX = "[DEMO]"


class Seeder:
    name = ""
    depends_on: tuple[str, ...] = ()

    def __init__(self, stdout=None):
        self.stdout = stdout
        self.stats = Counter()
        self.rnd = random.Random(f"{SEED}:{self.name}")

    def make(self, model, seed_key, **fields):
        obj, created = get_or_create_synthetic(model, f"{self.name}:{seed_key}", fields)
        self.stats[(model._meta.label, "created" if created else "existed")] += 1
        return obj

    def bulk(self, model, items):
        """[(seed_key, fields), ...] — ko'p qatorli jadvallar uchun (bitta-bitta emas)."""
        from apps.common.synthetic import bulk_create_synthetic
        items = [(f"{self.name}:{k}", f) for k, f in items]
        created = bulk_create_synthetic(model, items)
        self.stats[(model._meta.label, "created")] += created
        self.stats[(model._meta.label, "existed")] += len(items) - created
        return created

    def backdate(self, obj, field, value):
        """auto_now_add maydonlarini o'tmish sanaga o'tkazish (faqat sintetik obyekt uchun)."""
        type(obj)._base_manager.filter(pk=obj.pk).update(**{field: value})

    def log(self, message):
        if self.stdout:
            self.stdout.write(message)

    def seed(self):  # pragma: no cover - interfeys
        raise NotImplementedError


def days_ago(days, hour=10):
    base = timezone.now() - timedelta(days=days)
    return base.replace(hour=hour, minute=0, second=0, microsecond=0)


def aware(dt: datetime):
    return timezone.make_aware(dt) if timezone.is_naive(dt) else dt


def registry():
    from .activity_plans import ActivityPlansSeeder
    from .analytics import EnterpriseIndicatorsSeeder, RegionIndicatorsSeeder
    from .api_subscriptions import ApiSubscriptionsSeeder
    from .citizens import CitizensSeeder
    from .classifications import ClassificationsSeeder
    from .consultations import ConsultationsSeeder
    from .custom_requests import CustomRequestsSeeder
    from .demo_users import DemoUsersSeeder
    from .enterprise_scoring import EnterpriseScoringSeeder
    from .misc import MiscSeeder
    from .notifications import NotificationsSeeder
    from .report_guides import ReportGuidesSeeder
    from .service_requests import ServiceRequestsSeeder

    seeders = [
        DemoUsersSeeder,
        ClassificationsSeeder,
        ServiceRequestsSeeder,
        ActivityPlansSeeder,
        NotificationsSeeder,
        MiscSeeder,
        EnterpriseIndicatorsSeeder,
        EnterpriseScoringSeeder,
        RegionIndicatorsSeeder,
        ReportGuidesSeeder,
        CustomRequestsSeeder,
        CitizensSeeder,
        ApiSubscriptionsSeeder,
        ConsultationsSeeder,
    ]
    return {s.name: s for s in seeders}
