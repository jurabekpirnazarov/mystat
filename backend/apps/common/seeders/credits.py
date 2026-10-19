"""KORXONA_SCORING.md KR-40: demo kredit hamyonlari (turli balans va tarif).

Hamyon va grant yozuvlari S-01 reyestriga tushadi; `--flush` hamyonni o'chiradi, ledger va ochilgan korxonalar
kaskad bilan ketadi. `Transaction`/`Order` (to'lov) jadvallariga tegilmaydi.
"""
from datetime import timedelta

from django.utils import timezone

from apps.credits.models import CreditLedger, CreditWallet

from . import Seeder
from .demo_users import demo_users

# (username, tarif, kredit) — 13.2 qabul mezonidagi "3 kreditli demo foydalanuvchi" birinchisi
WALLETS = [
    ("demo_yuridik_1", "s50", 3),
    ("demo_yuridik_2", "s90", 85),
    ("demo_yuridik_3", "corp", 500),
    ("demo_yuridik_4", "s60", 37),
]


class CreditsSeeder(Seeder):
    name = "credits"
    depends_on = ("demo_users",)

    def seed(self):
        users = demo_users()
        expires = timezone.now() + timedelta(days=30)
        for username, plan, amount in WALLETS:
            user = users.get(username)
            org = getattr(user, "organization", None) if user else None
            if org is None:
                self.log(f"  ! {username}: korxona yo'q — hamyon o'tkazib yuborildi")
                continue
            wallet = self.make(CreditWallet, f"wallet:{username}", organization=org, plan=plan)
            self.make(CreditLedger, f"grant:{username}", wallet=wallet, kind="grant", amount=amount,
                      expires_at=expires, reason=f"Demo: {wallet.get_plan_display()} tarifi")
