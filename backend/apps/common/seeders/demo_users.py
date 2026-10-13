"""S-07: demo foydalanuvchilar, korxonalar, shartnomalar va paketlar."""
import secrets
from decimal import Decimal

from decouple import config
from django.utils import timezone

from apps.accounts.models import User
from apps.common.models import District
from apps.common.synthetic import registered_ids
from apps.contracts.models import Contract
from apps.organizations.models import Organization
from apps.services.models import PackageServiceItem, ServicePackage, UserServicePackage, UserServicePackageItemUse

from . import DEMO_PREFIX, Seeder, days_ago

LEGAL = [
    ("demo_yuridik_1", "Aziz", "Karimov", "Toshkent Agro Eksport MChJ", 0.20),
    ("demo_yuridik_2", "Dilnoza", "Rahimova", "Samarqand Tekstil Invest MChJ", 0.85),
    ("demo_yuridik_3", "Bobur", "Yusupov", "Farg'ona Qurilish Servis AJ", 0.50),
    ("demo_yuridik_4", "Malika", "Tursunova", "Buxoro Logistika XK", 1.00),
    ("demo_yuridik_5", "Jasur", "Alimov", "Navoiy Start Tech MChJ", None),  # paketsiz
]
INDIVIDUAL = [
    ("demo_jismoniy_1", "Sardor", "Qodirov"),
    ("demo_jismoniy_2", "Nilufar", "Ergasheva"),
    ("demo_jismoniy_3", "Otabek", "Saidov"),
]
MAX_USES_PER_ITEM = 120

STAFF = [
    ("demo_bugalter", "Gulnora", "Hasanova", "bugalter"),
    ("demo_employee", "Rustam", "Nazarov", "employee"),
]


def demo_users():
    """Sintetik demo foydalanuvchilar (username bo'yicha lug'at)."""
    ids = registered_ids(User)
    return {u.username: u for u in User.objects.filter(pk__in=ids)}


class DemoUsersSeeder(Seeder):
    name = "demo_users"

    def __init__(self, stdout=None):
        super().__init__(stdout)
        self.password = config("DEMO_USER_PASSWORD", default="")
        self.generated_password = None

    def _user(self, username, first, last, **extra):
        user = self.make(
            User, f"user:{username}",
            username=username, first_name=first, last_name=last,
            email=f"{username}@demo.invalid", password="!", **extra,
        )
        # DEMO_USER_PASSWORD berilgan bo'lsa har safar shu parol o'rnatiladi;
        # bo'lmasa faqat yangi akkauntga tasodifiy parol (konsolga bir marta chiqadi).
        if self.password and not user.check_password(self.password):
            user.set_password(self.password)
            user.save(update_fields=["password"])
        elif not self.password and not user.has_usable_password():
            self.generated_password = self.generated_password or secrets.token_urlsafe(9)
            user.set_password(self.generated_password)
            user.save(update_fields=["password"])
        return user

    def seed(self):
        districts = list(District.objects.order_by("id")[:20])
        packages = list(ServicePackage.objects.filter(is_active=True).order_by("id"))

        staff = {}
        for username, first, last, role in STAFF:
            staff[role] = self._user(username, first, last, role=role, user_type="individual")

        for i, (username, first, last) in enumerate(INDIVIDUAL):
            self._user(username, first, last, user_type="individual",
                       location=districts[i % len(districts)] if districts else None)

        if not districts or not packages:
            self.log("  ! District yoki ServicePackage yo'q — korxona, shartnoma va paketlar o'tkazib yuborildi")
            return

        for i, (username, first, last, org_name, usage) in enumerate(LEGAL):
            district = districts[(i * 3) % len(districts)]
            user = self._user(username, first, last, user_type="legal_entity", location=district,
                              phone_number=f"998000000{i + 1:03d}")
            self.make(
                Organization, f"org:{username}",
                user=user, name=f"{DEMO_PREFIX} {org_name}", tin=f"000000{i + 101:03d}",
                address=f"{district.name}, demo ko'chasi {i + 1}-uy", district=district,
                organization_type="LLC",
            )
            if usage is None:
                continue

            package = packages[i % len(packages)]
            contract = self.make(
                Contract, f"contract:{username}",
                contract_number=f"DEMO-2026-{i + 1:04d}", user=user, package=package,
                total_amount=Decimal(package.price or 0), status="processing" if i != 3 else "completed",
                signed_by_client=True, signed_by_admin=True,
                client_signature_date=days_ago(60 - i * 5), admin_signature_date=days_ago(59 - i * 5),
                created_by=staff["employee"], attached_user=staff["employee"],
                notes=f"{DEMO_PREFIX} sintetik shartnoma", didox_contract_data={"_id": f"demo-{i + 1}"},
            )
            self.backdate(contract, "start_date", days_ago(60 - i * 5))

            now = timezone.now()
            usp = self.make(
                UserServicePackage, f"usp:{username}",
                region=district.region, district=district, year=now.year, month=now.month,
                service=package, created_by_user=user,
            )
            self.backdate(usp, "created_at", days_ago(58 - i * 5))
            self._uses(usp, package, usage, username)

    def _uses(self, usp, package, ratio, username):
        for psi in PackageServiceItem.objects.filter(package=package).order_by("id"):
            # 1000+ limitlar amalda "cheksiz" — qatorlar sonini cheklaymiz
            count = min(int(round(psi.limit * ratio)), MAX_USES_PER_ITEM) if psi.limit else 0
            for n in range(count):
                use = self.make(
                    UserServicePackageItemUse, f"use:{username}:{psi.id}:{n}",
                    usp=usp, psi=psi, is_success=True,
                    request_data={"demo": True}, response_data={"demo": True},
                )
                # So'nggi 6 oyga tarqatamiz — kabinet grafigi uchun
                self.backdate(use, "created_at", days_ago(self.rnd.randint(1, 175), hour=self.rnd.randint(9, 18)))
