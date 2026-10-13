"""S-08: email obunalar, murojaatlar, xizmat reytinglari."""
import random

from apps.accounts.models import Subscribe
from apps.common.models import Contact, SyntheticRecord
from apps.services.models import Service, ServiceRating

from . import DEMO_PREFIX, SEED, Seeder, days_ago
from .demo_users import demo_users

CONTACT_TEXTS = [
    "Tarif paketini qanday tanlash mumkin?",
    "Shartnomani DIDOX'da imzolay olmayapman.",
    "Byulletenning bosma nusxasini olish mumkinmi?",
    "Korxona ma'lumotlarida xatolik bor, qanday tuzatiladi?",
    "Hisobot topshirish muddatini uzaytirish mumkinmi?",
]
COMMENTS = ["Juda qulay xizmat", "Ma'lumot tez keldi", "Yaxshi, lekin interfeysni soddalashtirish kerak", "", "Tavsiya qilaman"]


class MiscSeeder(Seeder):
    name = "misc"
    depends_on = ("demo_users",)

    def seed(self):
        for i in range(20):
            self.make(Subscribe, f"subscribe:{i}", email=f"obunachi{i + 1}@demo.invalid")

        for i in range(15):
            contact = self.make(
                Contact, f"contact:{i}",
                name=f"{DEMO_PREFIX} Murojaatchi", surname=f"{i + 1}", phone_number=f"998000001{i:03d}",
                email=f"murojaat{i + 1}@demo.invalid", text=f"<p>{CONTACT_TEXTS[i % len(CONTACT_TEXTS)]}</p>",
            )
            self.backdate(contact, "created_at", days_ago(i * 3 + 1))

        users = [u for name, u in sorted(demo_users().items()) if name.startswith("demo_yuridik") or name.startswith("demo_jismoniy")]
        services = list(Service.objects.filter(is_active=True).order_by("id"))
        for user in users:
            for service in services:
                # Juftlik bo'yicha alohida generator — qayta ishga tushirishda natija o'zgarmaydi
                rnd = random.Random(f"{SEED}:rating:{user.username}:{service.id}")
                if rnd.random() < 0.4:
                    continue
                key = f"rating:{user.username}:{service.id}"
                own = SyntheticRecord.objects.filter(seed_key=f"{self.name}:{key}").exists()
                if not own and ServiceRating.objects.filter(service=service, user=user).exists():
                    continue  # unique(service, user): demo akkaunt ilovada o'zi baholagan
                self.make(
                    ServiceRating, key,
                    service=service, user=user, value=rnd.choice([3, 4, 4, 5, 5, 5]),
                    comment=rnd.choice(COMMENTS),
                )
