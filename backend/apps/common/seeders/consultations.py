"""S-14: 5 ta demo konsultant, keyingi 30 kunlik ish kunlari slotlari va o'tgan/kelgusi 12 ta band qilish."""
from datetime import datetime, time, timedelta

from django.utils import timezone

from apps.consultations.models import Consultant, ConsultationBooking, ConsultationSlot
from apps.services.models import Service

from . import Seeder
from .demo_users import demo_users

CONSULTANTS = [
    ("demo_konsultant_1", "Sherzod", "Abdullayev", "Tashqi savdo statistikasi bo'yicha mutaxassis"),
    ("demo_konsultant_2", "Nodira", "Yo'ldosheva", "Korxonalar statistikasi va hisobotlar"),
    ("demo_konsultant_3", "Akmal", "Raximov", "Demografiya va mehnat statistikasi"),
    ("demo_konsultant_4", "Feruza", "Qosimova", "Narxlar va inflyatsiya"),
    ("demo_konsultant_5", "Bekzod", "Toshmatov", "Sanoat va qurilish statistikasi"),
]
TOPICS = ["Hisobot shaklini to'ldirish", "Eksport statistikasi bo'yicha maslahat", "Benchmark natijalarini tushunish",
          "Aholi soni ma'lumotlari", "Narx indekslari metodologiyasi"]


class ConsultationsSeeder(Seeder):
    name = "consultations"
    depends_on = ("demo_users",)

    def seed(self):
        from .demo_users import DemoUsersSeeder
        helper = DemoUsersSeeder(stdout=self.stdout)  # parol qoidasi demo foydalanuvchilar bilan bir xil
        helper.name = "demo_users"
        services = list(Service.objects.filter(is_active=True).order_by("id")[:8])
        tz = timezone.get_current_timezone()
        today = timezone.localdate()
        consultants = []
        for i, (username, first, last, title) in enumerate(CONSULTANTS):
            user = helper._user(username, first, last, role="employee", user_type="individual")
            c = self.make(Consultant, f"consultant:{username}", user=user, title=title,
                          bio_uz=f"{title}. Statistika organlarida {6 + i * 2} yillik tajriba (namuna profil).")
            if services and not c.topics.exists():
                c.topics.set(services[i % len(services): i % len(services) + 2])
            consultants.append(c)
        self.stats.update(helper.stats)

        slots = []
        for c_i, c in enumerate(consultants):
            for d in range(-10, 31):
                day = today + timedelta(days=d)
                if day.weekday() >= 5:
                    continue
                for h in range(10, 17):
                    if (h + c_i + d) % 3 == 0:  # har konsultantning jadvali biroz farqli
                        continue
                    starts = timezone.make_aware(datetime.combine(day, time(h, 0)), tz)
                    slots.append((f"slot:{c.id}:{starts:%Y%m%d%H}", dict(consultant=c, starts_at=starts, duration_min=45,
                                                                       format="online" if h % 2 else "office")))
        self.bulk(ConsultationSlot, slots)

        users = demo_users()
        clients = [users[n] for n in sorted(users) if n.startswith("demo_yuridik")]
        if not clients:
            return
        now = timezone.now()
        for i in range(12):
            past = i < 5
            c = consultants[i % len(consultants)]
            qs = c.slots.filter(starts_at__lt=now) if past else c.slots.filter(starts_at__gt=now + timedelta(hours=30))
            slot = qs.order_by("-starts_at" if past else "starts_at")[i // len(consultants)]
            booking = self.make(ConsultationBooking, f"booking:{i}", slot=slot, user=clients[i % len(clients)],
                                topic=TOPICS[i % len(TOPICS)], question="Namuna savol: qaysi manbadan foydalanish kerak?",
                                status="done" if past else "booked",
                                meeting_url="https://meet.example.invalid/demo" if not past or i % 2 else "",
                                rating=(5 - i % 2) if past and i % 3 != 2 else None,
                                note="Konsultatsiya o'tkazildi, materiallar yuborildi." if past else "")
            if not slot.is_booked:
                ConsultationSlot.objects.filter(pk=slot.pk).update(is_booked=True)
            self.backdate(booking, "created_at", slot.starts_at - timedelta(days=3))
