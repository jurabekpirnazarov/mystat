"""S-16: API kalitlar va foydalanish statistikasi, ko'rsatkichlarga obunalar va "yangilandi" hodisalari."""
from datetime import timedelta

from django.utils import timezone

from apps.common.models import SyntheticRecord
from apps.common.synthetic import register_synthetic
from apps.notifications.models import IndicatorSubscription, IndicatorUpdateEvent
from apps.notifications.subscriptions import dispatch_event
from apps.open_api.models import ApiKey, ApiUsage

from . import Seeder
from .demo_users import demo_users

ENDPOINTS = ["cpi", "trade/summary", "regions/indicators", "reports/forms", "classifications"]
EVENTS = [
    ("cpi", "Iste'mol narxlari indeksi yangilandi", "/cpi-calculator"),
    ("trade", "Tashqi savdo: yanvar–sentabr ma'lumotlari e'lon qilindi", "/trade-flows"),
    ("demography", "Aholi soni bo'yicha yangi ma'lumot", "/demographics"),
    ("region", "Hududiy ko'rsatkichlar yangilandi", "/regions"),
    ("cpi", "Inflyatsiya: oylik ISN e'lon qilindi", "/cpi-calculator"),
    ("trade", "Eksport tarkibi bo'yicha choraklik yangilanish", "/market-report"),
    ("report", "Hisobot shakllari ro'yxati yangilandi", "/report-calendar"),
    ("region", "Ish haqi bo'yicha hududiy ma'lumotlar", "/my-salary"),
    ("demography", "Tug'ilish va o'lim bo'yicha choraklik ma'lumot", "/demographics"),
    ("cpi", "Narxlar monitoringi: yangi oy", "/prices"),
]


class ApiSubscriptionsSeeder(Seeder):
    name = "api_subscriptions"
    depends_on = ("demo_users",)

    def __init__(self, stdout=None):
        super().__init__(stdout)
        self.generated_keys = []

    def _key(self, user, name, seed):
        key_seed = f"{self.name}:key:{seed}"
        record = SyntheticRecord.objects.filter(seed_key=key_seed).first()
        if record:
            key = ApiKey.objects.filter(pk=record.object_id).first()
            if key:
                self.stats[(ApiKey._meta.label, "existed")] += 1
                return key
            record.delete()
        key, raw = ApiKey.generate(user, name)
        register_synthetic(key, key_seed)
        self.generated_keys.append(f"{name}: {raw}")
        self.stats[(ApiKey._meta.label, "created")] += 1
        return key

    def seed(self):
        users = demo_users()
        researcher = users.get("demo_tadqiqotchi")
        today = timezone.localdate()
        if researcher:
            for k, name in enumerate(("Tadqiqot loyihasi", "Jurnalistik dashboard")):
                key = self._key(researcher, name, k)
                usage = []
                for d in range(30):
                    for e in ENDPOINTS[: 3 + k]:
                        n = max(0, int(self.rnd.gauss(40 if k == 0 else 15, 12)))
                        if n:
                            usage.append((f"usage:{k}:{d}:{e}", dict(api_key=key, date=today - timedelta(days=d), endpoint=e, requests=n)))
                self.bulk(ApiUsage, usage)
            if self.generated_keys:
                self.log("  Demo API kalitlar (bir marta ko'rsatiladi):\n    " + "\n    ".join(self.generated_keys))

        plans = {
            "demo_jismoniy_1": [("cpi", "in_app"), ("region", "in_app"), ("demography", "email")],
            "demo_jismoniy_2": [("cpi", "telegram"), ("cpi", "in_app"), ("region", "in_app"), ("trade", "in_app")],
            "demo_jismoniy_3": [("demography", "in_app"), ("cpi", "email"), ("region", "in_app")],
            "demo_yuridik_1": [("trade", "in_app"), ("report", "in_app"), ("cpi", "email"), ("trade", "telegram"), ("region", "in_app")],
            "demo_yuridik_2": [("trade", "in_app"), ("report", "in_app"), ("cpi", "in_app")],
            "demo_tadqiqotchi": [("cpi", "in_app"), ("trade", "in_app"), ("demography", "in_app"), ("region", "email")],
        }
        names = dict(IndicatorSubscription.BASE_INDICATORS)
        for username, subs in plans.items():
            user = users.get(username)
            if not user:
                continue
            for indicator, channel in subs:
                if IndicatorSubscription.objects.filter(user=user, indicator=indicator, channel=channel).exists():
                    continue
                self.make(IndicatorSubscription, f"sub:{username}:{indicator}:{channel}", user=user, indicator=indicator,
                          channel=channel, title=str(names[indicator]))

        for i, (indicator, title, link) in enumerate(EVENTS):
            event = self.make(IndicatorUpdateEvent, f"event:{i}", indicator=indicator, title=title, link=link,
                              date=today - timedelta(days=3 * i + 1))
            if event.dispatched_at is None:
                dispatch_event(event)
