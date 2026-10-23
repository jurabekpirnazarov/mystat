"""KORXONA_SCORING.md 11.5, KR-41: tarif paketidan StatCoin berish.

`UserServicePackage` yaratilganda (admin paketni faollashtirganda) paketning `statcoin_*` maydonlari bo'yicha hamyonga
`grant` yoziladi. Idempotent: bitta paket-oy uchun bitta grant (`CreditLedger.source_package_id` unique).
Kalit: `usp.id * 100 + k`, `k` — paket boshlanganidan beri o'tgan oy (0 = birinchi grant); paket muddati ≤ 99 oy.
Oylik paketda ishlatilmagan StatCoin keyingi oyga o'tmaydi (OS-19 default): grant shu oy ichida (`MONTH_DAYS`) amal
qiladi va paket muddatidan oshmaydi. Qo'shimcha (top-up) — bir marta, paket muddati (standart 365 kun).
`payment` app'iga tegilmaydi.
"""
from datetime import datetime, time, timedelta
from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone

from . import service
from .models import CreditLedger, CreditWallet

MONTH_DAYS = 31
KEY_STEP = 100
MAX_MONTHS = KEY_STEP - 1


def _add_months(day, n):
    month = day.month - 1 + n
    year, month = day.year + month // 12, month % 12 + 1
    # oy kunlari kam bo'lsa (31 → 30/28) oxirgi kuniga tushadi
    for d in range(day.day, 27, -1):
        try:
            return day.replace(year=year, month=month, day=d)
        except ValueError:
            continue
    return day.replace(year=year, month=month, day=28)


def months_elapsed(starts_at, today):
    n = (today.year - starts_at.year) * 12 + today.month - starts_at.month
    if today.day < starts_at.day and n > 0:
        n -= 1
    return max(0, min(n, MAX_MONTHS))


def _aware_end(day):
    return timezone.make_aware(datetime.combine(day, time(23, 59, 59)))


def _grant_expiry(usp, kind, k):
    if kind == "topup":
        return _aware_end(usp.expires_at) if usp.expires_at else None
    end = _add_months(usp.starts_at, k + 1) - timedelta(days=1)   # shu oy davri oxirgi kuni
    if usp.expires_at:
        end = min(end, usp.expires_at)
    return _aware_end(end)


def _notify(user, wallet, ledger, usp, package, amount):
    from apps.notifications.models import Notification

    plan = f"{package.name} faollashdi" if package.statcoin_kind == "monthly" else f"{package.name} qo'shildi"
    Notification.objects.create(
        recipient=user, title="StatCoin hamyoningiz to'ldirildi",
        message=f"{plan}: hamyonga {amount.normalize():f} StatCoin qo'shildi.",
        notification_type="success", content_type=ContentType.objects.get_for_model(CreditLedger),
        object_id=ledger.pk, extra_data={"package_id": package.pk, "user_package_id": usp.pk,
                                         "statcoin": float(amount)})


def active_plan(wallet, today=None):
    """Hamyon egasining faol oylik paketlaridagi eng yuqori tarif ('' — faol paket yo'q). None — hech qachon
    tarifli paket bo'lmagan: hamyon tarifiga tegilmaydi (admin yoki demo qo'ygan bo'lishi mumkin)."""
    from apps.services.models import UserServicePackage

    today = today or timezone.localdate()
    owner = wallet.organization.user if wallet.organization_id else wallet.user   # Organization.user — OneToOne
    qs = (UserServicePackage.objects.filter(created_by_user=owner, service__statcoin_kind="monthly")
          .exclude(service__statcoin_plan="").select_related("service"))
    rows = list(qs)
    if not rows:
        return None
    live = [r.service.statcoin_plan for r in rows if r.expires_at is None or r.expires_at >= today]
    return max(live, key=lambda p: CreditWallet.PLAN_RANK.get(p, 0), default="")


def sync_plan(wallet):
    plan = active_plan(wallet)
    if plan is not None and wallet.plan != plan:
        wallet.plan = plan
        wallet.save(update_fields=["plan"])


def grant_for_package(usp, k=0, notify=True):
    """Paket-oy uchun StatCoin beradi. -> CreditLedger yoki None (paket StatCoin bermaydi / allaqachon berilgan)."""
    package = usp.service
    amount = Decimal(package.statcoin_amount or 0)
    if package.statcoin_kind not in ("monthly", "topup") or amount <= 0:
        return None
    k = 0 if package.statcoin_kind == "topup" else k
    key = usp.pk * KEY_STEP + k
    with transaction.atomic():
        wallet = service.wallet_of(usp.created_by_user, create=True)
        wallet = CreditWallet.objects.select_for_update().get(pk=wallet.pk)
        if CreditLedger.objects.filter(source_package_id=key).exists():
            return None
        row = service.grant(wallet, amount, expires_at=_grant_expiry(usp, package.statcoin_kind, k),
                            source_package_id=key, action_code=f"package_{package.statcoin_kind}",
                            reason=f"{package.name}" + (f" · {k + 1}-oy" if package.statcoin_kind == "monthly" else ""))
        if package.statcoin_kind == "monthly":
            sync_plan(wallet)
    if notify:
        _notify(usp.created_by_user, wallet, row, usp, package, amount)
    return row


def grant_due_monthly(today=None):
    """Celery Beat (har kuni): faol oylik paketlar uchun joriy oyning grant'i yo'q bo'lsa beradi; hamyon tariflarini
    paket muddatiga moslaydi. -> berilgan grant'lar soni."""
    from apps.services.models import UserServicePackage

    today = today or timezone.localdate()
    n = 0
    usps = (UserServicePackage.objects.filter(service__statcoin_kind="monthly", service__statcoin_amount__gt=0)
            .select_related("service", "created_by_user"))
    for usp in usps:
        if usp.starts_at is None or usp.starts_at > today or (usp.expires_at and usp.expires_at < today):
            continue
        k = months_elapsed(usp.starts_at, today)
        if k and grant_for_package(usp, k):
            n += 1
    for wallet in CreditWallet.objects.exclude(plan="").select_related("organization", "user"):
        sync_plan(wallet)
    return n


# --- To'langan shartnomadan avtomatik faollashtirish (OS-20, egasining qarori 2026-10-23) --------------------------

def _district_for(user):
    """`UserServicePackage.district` majburiy: korxona tumani, bo'lmasa birinchi tuman (hisobot uchun ahamiyatsiz)."""
    from apps.common.models import District

    org = getattr(user, "organization", None)
    return (org.district if org and org.district_id else None) or District.objects.order_by("id").first()


def paid_contracts(user=None):
    """StatCoin paketining to'liq to'langan, hali faollashtirilmagan shartnomalari (faqat o'qiydi)."""
    from apps.contracts.models import Contract
    from apps.services.models import UserServicePackage

    qs = (Contract.objects.filter(package__statcoin_kind__in=("monthly", "topup"), total_amount__gt=0)
          .exclude(status="cancelled").exclude(pk__in=UserServicePackage.objects.filter(contract__isnull=False)
                                               .values("contract_id")).select_related("package", "user"))
    if user is not None:
        qs = qs.filter(user=user)
    return [c for c in qs if c.payed_amount >= c.total_amount]


def activate_paid_contracts(user=None):
    """To'liq to'langan StatCoin shartnomalari uchun `UserServicePackage` yaratadi (signal StatCoin'ni beradi).
    Idempotent: `UserServicePackage.contract`. -> faollashgan paketlar. `SiteSettings.statcoin_auto_activate=False` bo'lsa
    hech narsa qilmaydi (admin qo'lda faollashtiradi)."""
    from apps.common.models import SiteSettings
    from apps.services.models import UserServicePackage

    site = SiteSettings.load()
    if site is not None and not site.statcoin_auto_activate:
        return []
    today = timezone.localdate()
    done = []
    for contract in paid_contracts(user):
        district = _district_for(contract.user)
        if district is None:
            continue
        with transaction.atomic():
            if UserServicePackage.objects.filter(contract=contract).exists():
                continue
            done.append(UserServicePackage.objects.create(
                created_by_user=contract.user, service=contract.package, contract=contract, district=district,
                region=district.region, year=today.year, month=today.month))
    return done
