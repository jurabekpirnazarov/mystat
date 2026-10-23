"""Yangi pullik xizmatlar (benchmark, bozor tahlili PDF, hamkor eksporti, konsultatsiya) uchun StatCoin yoki paket limiti.

**StatCoin (egasining qarori, 2026-10-23, KR-41):** `STATCOIN_ACTIONS` dagi xizmat uchun `CreditPrice` faol bo'lsa
`consume` StatCoin yechadi. Mavjud paket egalarining huquqi saqlanadi: paketda shu xizmat limiti qolgan bo'lsa avval
u ishlatiladi, limit tugagan yoki paketi yo'q bo'lsa StatCoin yechiladi (balans yetmasa 402). Narx nofaol qilinsa —
eski paket limiti tartibi.

Paket limiti (OS-14 default): xizmat admin'da `PackageService` (slug bilan) sifatida qo'shiladi va paketlarga limit beriladi.
Slug hali sozlanmagan bo'lsa xizmat limitsiz ishlaydi (javobda `configured: False`), shunda
admin sozlamaguncha funksiya yopilib qolmaydi.
"""
import hashlib
import json

from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException

from .models import PackageService, PackageServiceItem, UserServicePackage, UserServicePackageItemUse

UPGRADE_URL = "/services"
TARIFFS_URL = "/tariffs"
# paket slug'i -> StatCoin amal kodi (`credits.CreditPrice.action_code`)
STATCOIN_ACTIONS = {"benchmark": "benchmark", "market-report": "market_report",
                    "partners-export": "partners_export", "consultation": "consultation"}


class LimitExceeded(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "limit_exceeded"

    def __init__(self, detail, **extra):
        super().__init__({"detail": detail, "upgrade_url": UPGRADE_URL, **extra})


class StatCoinRequired(APIException):
    """StatCoin yetarli emas (402): frontend `/tariffs` ga yo'naltiradi."""
    status_code = status.HTTP_402_PAYMENT_REQUIRED
    default_code = "insufficient"

    def __init__(self, detail, **extra):
        super().__init__({"detail": detail, "upgrade_url": TARIFFS_URL, "code": "insufficient", **extra})


def statcoin_price(slug):
    """Xizmatning StatCoin narxi (Decimal) yoki None: narx yo'q/nofaol (eski paket limiti)."""
    from apps.credits import service as credits

    code = STATCOIN_ACTIONS.get(slug)
    return credits.price_of(code) if code else None


def statcoin_ref(request_data):
    """Yechish obyekti: bir xil so'rov (`request_data`) bir xil kalit. `CreditLedger.object_ref` <= 80 belgi."""
    raw = json.dumps(request_data or {}, sort_keys=True, default=str)
    return hashlib.md5(raw.encode()).hexdigest()[:16]


def active_package(user):
    """Foydalanuvchining muddati o'tmagan eng oxirgi paketi (yoki None)."""
    for usp in UserServicePackage.objects.filter(created_by_user=user).select_related("service").order_by("-id"):
        if not usp.is_expired:
            return usp
    return None


def limit_status(user, slug):
    """{configured, limit, used[, statcoin]} — limitni sarflamasdan. `statcoin` — xizmat StatCoin bilan to'lanadi."""
    from apps.credits import service as credits

    price = statcoin_price(slug)
    ps = PackageService.objects.filter(slug=slug).first()
    if ps is None:
        out = {"configured": False, "limit": None, "used": 0}
    else:
        usp = active_package(user)
        psi = PackageServiceItem.objects.filter(package=usp.service, package_service=ps).first() if usp else None
        used = UserServicePackageItemUse.objects.filter(usp=usp, psi=psi).count() if psi else 0
        out = {"configured": True, "limit": psi.limit if psi else 0, "used": used}
    if price is not None:
        out["configured"] = True
        out["statcoin"] = {"price": float(price), "balance": float(credits.balance(credits.wallet_of(user)))}
    return out


def public_usage(usage):
    """API javobi uchun (ichki `use_id` siz)."""
    return {k: v for k, v in usage.items() if k != "use_id"} if usage else usage


def has_package_entitlement(user, slug):
    """Faol paketda shu xizmat limiti qolganmi (mavjud paket egalarining huquqi)."""
    ps = PackageService.objects.filter(slug=slug).first()
    usp = active_package(user) if ps else None
    psi = PackageServiceItem.objects.filter(package=usp.service, package_service=ps).first() if usp else None
    if psi is None:
        return False
    return not psi.is_exhausted(UserServicePackageItemUse.objects.filter(usp=usp, psi=psi).count())


def _charge_statcoin(user, slug, price, request_data, once_per_day):
    from apps.credits import service as credits

    code, ref = STATCOIN_ACTIONS[slug], statcoin_ref(request_data)
    wallet = credits.wallet_of(user, create=True)
    if once_per_day and credits.CreditLedger.objects.filter(
            wallet=wallet, kind="spend", action_code=code, object_ref=ref,
            created_at__date=timezone.localdate()).exists():
        return {"configured": True, "limit": None, "used": 0,
                "statcoin": {"charged": 0.0, "balance": float(credits.balance(wallet))}}
    try:
        left = credits.spend(wallet, price, action_code=code, object_ref=ref, user=user)
    except credits.CreditError as e:
        if e.code == "insufficient":
            raise StatCoinRequired("StatCoin yetarli emas. Hamyonni to'ldiring yoki tarif tanlang.",
                                   balance=e.extra.get("balance"), required=float(price))
        raise LimitExceeded(e.message)
    return {"configured": True, "limit": None, "used": 0,
            "statcoin": {"charged": float(price), "balance": float(left)}}


def refund_statcoin(user, slug, request_data):
    """StatCoin bilan to'langan xizmat bekor qilinsa yechilganini qaytaradi (idempotent). -> qaytarildimi"""
    from apps.credits import service as credits

    wallet = credits.wallet_of(user)
    if wallet is None or slug not in STATCOIN_ACTIONS:
        return False
    before = credits.balance(wallet)
    after = credits.refund(wallet, action_code=STATCOIN_ACTIONS[slug], object_ref=statcoin_ref(request_data),
                           user=user, reason="bekor qilindi")
    return after > before


def consume(user, slug, request_data=None, once_per_day=False):
    """Bitta foydalanishni yozadi yoki `LimitExceeded` (403) / `StatCoinRequired` (402) ko'taradi. -> limit_status.

    `once_per_day=True`: bugun xuddi shu `request_data` bilan yozilgan bo'lsa qayta sarflanmaydi
    (sahifani yangilash limitni yemasligi uchun).
    """
    price = statcoin_price(slug)
    if price is not None and not has_package_entitlement(user, slug):
        return _charge_statcoin(user, slug, price, request_data, once_per_day)
    return _consume_package(user, slug, request_data, once_per_day)


def _consume_package(user, slug, request_data=None, once_per_day=False):
    ps = PackageService.objects.filter(slug=slug).first()
    if ps is None:
        return {"configured": False, "limit": None, "used": 0}
    usp = active_package(user)
    if usp is None:
        raise LimitExceeded("Bu xizmat uchun faol paket yo'q.")
    with transaction.atomic():
        psi = PackageServiceItem.objects.select_for_update().filter(package=usp.service, package_service=ps).first()
        used = UserServicePackageItemUse.objects.filter(usp=usp, psi=psi).count() if psi else 0
        if psi is not None and once_per_day and UserServicePackageItemUse.objects.filter(
                usp=usp, psi=psi, request_data=request_data or {}, created_at__date=timezone.localdate()).exists():
            return {"configured": True, "limit": psi.limit, "used": used}
        if psi is None or psi.is_exhausted(used):
            raise LimitExceeded("Sizning limitingiz tugagan!", limit=psi.limit if psi else 0, used_count=used)
        use = UserServicePackageItemUse.objects.create(usp=usp, psi=psi, is_success=True,
                                                       request_data=request_data or {}, response_data=None)
    return {"configured": True, "limit": psi.limit, "used": used + 1, "use_id": use.id}
