"""S-06: demo foydalanuvchilar uchun xabarnomalar. Real foydalanuvchilarga yaratilmaydi."""
from django.contrib.contenttypes.models import ContentType

from apps.contracts.models import Contract
from apps.notifications.models import Notification

from . import Seeder, days_ago
from .demo_users import demo_users

TEMPLATES = [
    ("contract_created", "Shartnoma yaratildi", "{contract} raqamli shartnoma yaratildi va imzolashga yuborildi."),
    ("document_pending", "Hujjat imzolash kutilmoqda", "{contract} shartnomasini DIDOX'da imzolang."),
    ("contract_signed", "Shartnoma imzolandi", "{contract} shartnomasi ikki tomonlama imzolandi. Paket faollashtirildi."),
    ("warning", "Paket limiti 80% ga yetdi", "Paketingizdagi xizmatlardan biri limitining 80% i ishlatildi."),
    ("info", "Yangi byulleten", "Statistik byulletenning yangi soni chiqdi. Kabinetdan yuklab olishingiz mumkin."),
    ("warning", "Hisobot muddati yaqinlashmoqda", "12-narx shakli bo'yicha hisobot topshirish muddatiga 3 kun qoldi."),
    ("success", "So'rovingizga javob keldi", "Xizmat so'rovingiz bo'yicha natija tayyor."),
    ("info", "Tizim yangilandi", "Shaxsiy kabinetga yangi bo'limlar qo'shildi."),
    ("payment_received", "To'lov qabul qilindi", "{contract} shartnomasi bo'yicha to'lov qabul qilindi."),
    ("info", "Ma'lumotlar yangilandi", "Tashqi savdo ma'lumotlari 2025-yil uchun yangilandi."),
]


class NotificationsSeeder(Seeder):
    name = "notifications"
    depends_on = ("demo_users",)

    def seed(self):
        users = demo_users()
        if not users:
            self.log("  ! Demo foydalanuvchilar yo'q — o'tkazib yuborildi")
            return
        user_ct = ContentType.objects.get_for_model(users[next(iter(users))].__class__)
        contract_ct = ContentType.objects.get_for_model(Contract)

        for username, user in sorted(users.items()):
            contract = Contract.objects.filter(user=user).order_by("id").first()
            count = 14 if contract else 6
            for i in range(count):
                n_type, title, message = TEMPLATES[i % len(TEMPLATES)]
                if "{contract}" in message and contract is None:
                    n_type, title, message = TEMPLATES[4]
                obj_ct, obj_id = (contract_ct, contract.id) if contract else (user_ct, user.id)
                notification = self.make(
                    Notification, f"{username}:{i}",
                    recipient=user, notification_type=n_type, title=title,
                    message=message.format(contract=contract.contract_number if contract else ""),
                    is_read=i % 2 == 1, telegram_status="sent",
                    content_type=obj_ct, object_id=obj_id,
                    extra_data={"demo": True},
                )
                self.backdate(notification, "created_at", days_ago(i * 2 + 1, hour=9 + i % 8))
