"""Demografik xizmat uchun Service yozuvini yaratadi/yangilaydi.

Ushbu yozuv AllServices ('/services') sahifasida kartochka sifatida ko'rinadi
va bosilganda /demographics route'iga olib boradi.

Foydalanish:
    python manage.py create_demographics_service

Idempotent — qayta ishga tushirsangiz mavjud yozuvni yangilaydi.
"""
from django.core.management.base import BaseCommand

from apps.services.models import Service, ServiceCategory
from apps.organizations.models import Organization


class Command(BaseCommand):
    help = "Demografik xizmat uchun Service yozuvini yaratish/yangilash"

    def handle(self, *args, **options):
        # 1. "interactive" kategoriyasini topish yoki yaratish
        category, cat_created = ServiceCategory.objects.get_or_create(name="interactive")
        if cat_created:
            self.stdout.write(self.style.SUCCESS("✓ ServiceCategory 'interactive' yaratildi"))
        else:
            self.stdout.write(f"→ Mavjud ServiceCategory 'interactive' ishlatilyapti (id={category.pk})")

        # 2. Organization (Service.organization majburiy FK)
        organization = Organization.objects.first()
        if not organization:
            self.stdout.write(self.style.ERROR(
                "Xato: hech qanday Organization topilmadi.\n"
                "Avval admin'da kamida bitta Organization yarating, keyin bu komandani qayta chaqiring."
            ))
            return
        self.stdout.write(f"→ Organization ishlatilyapti: {organization}")

        # 3. Service'ni yaratish yoki yangilash
        defaults = {
            "category": category,
            "name_uz": "Demografik ma'lumotlardan foydalanish",
            "name_ru": "Использование демографических данных",
            "name_cry": "Демографик маълумотлардан фойдаланиш",
            "description_uz": (
                "Aholi soni, tug'ilish, o'lim, nikoh, ajrim va migratsiya bo'yicha "
                "rasmiy statistik ma'lumotlar (1989-yildan beri). 14 viloyat va "
                "200+ tuman/shaharlar kesimida."
            ),
            "description_ru": (
                "Официальная статистика по населению, рождаемости, смертности, бракам, "
                "разводам и миграции (с 1989 года)."
            ),
            "description_cry": (
                "Аҳоли сони, туғилиш, ўлим, никоҳ, ажрим ва миграция бўйича расмий "
                "статистик маълумотлар (1989-йилдан бери)."
            ),
            "is_free": True,  # sahifa va CSV eksport ochiq
            "duration": "now",
            "is_active": True,
            "is_popular": True,
            "contact": "+998712030700",
            "organization": organization,
            "icon": "users",
        }

        service, created = Service.objects.update_or_create(
            slug="demographics",
            defaults=defaults,
        )

        if created:
            self.stdout.write(self.style.SUCCESS(
                f"✓ Service yaratildi: id={service.pk}, slug='demographics'"
            ))
        else:
            self.stdout.write(self.style.SUCCESS(
                f"✓ Mavjud Service yangilandi: id={service.pk}, slug='demographics'"
            ))

        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS(
            "Tayyor! Frontend'da /services sahifani qayta yuklang — endi "
            "'Demografik ma'lumotlardan foydalanish' kartochkasi ko'rinadi."
        ))
