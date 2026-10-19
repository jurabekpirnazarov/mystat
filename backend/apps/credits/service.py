"""KORXONA_SCORING.md KR-40: hamyon servisi — `grant`, `spend` (FIFO, `select_for_update`, kunlik limit), `refund`,
`expire_due`; KR-39/KR-45: korxona profili bo'limlarini ochish (`unlock`) va ruxsat (`can_view`).

Qoidalar (11.1, 11.3, 13.5):
- balans hech qachon manfiy emas: yechish hamyon qatorini qulflab, mavjud grant qoldiqlaridan bajariladi;
- avval muddati eng yaqin tugaydigan grant'dan yechiladi (muddatsizlari oxirida);
- ochilgan bo'lim `UNLOCK_DAYS` kun ochiq, shu vaqt ichida qayta kirish kredit yechmaydi;
- "Ma'lumot yetarli emas" (ball yo'q) korxonani ochib bo'lmaydi va kredit yechilmaydi;
- o'z korxonasi va qo'mita xodimlari uchun hammasi bepul ochiq.
"""
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.db import transaction
from django.db.models import Q, Sum
from django.utils import timezone

from .models import CreditLedger, CreditPrice, CreditUnlock, CreditWallet

UNLOCK_DAYS = getattr(settings, "CREDIT_UNLOCK_DAYS", 30)
DAILY_UNLOCK_LIMIT = getattr(settings, "CREDIT_DAILY_UNLOCK_LIMIT", 200)
LEVELS = ("basis", "deep")
PRICE_CODE = {"basis": "profile_basis", "deep": "profile_deep"}
# Darajaga kerakli eng past tarif (CreditWallet.PLAN_RANK): 1-daraja — har qanday scoring tarifi, 2-daraja — Tarif 60+
LEVEL_MIN_PLAN = {"basis": 1, "deep": 2}
ZERO = Decimal("0")


class CreditError(Exception):
    def __init__(self, code, message, status=400, **extra):
        super().__init__(message)
        self.code, self.message, self.status, self.extra = code, message, status, extra

    def as_dict(self):
        return {"code": self.code, "detail": self.message, **self.extra}


# --- Hamyon -------------------------------------------------------------------------------------------------------

def organization_of(user):
    if not user or not user.is_authenticated:
        return None
    return getattr(user, "organization", None)


def wallet_of(user, create=False):
    """Korxonasi bor foydalanuvchida korxona hamyoni, aks holda shaxsiy hamyon."""
    if not user or not user.is_authenticated:
        return None
    org = organization_of(user)
    owner = {"organization": org} if org else {"user": user}
    if create:
        return CreditWallet.objects.get_or_create(**owner)[0]
    return CreditWallet.objects.filter(**owner).first()


def _sources(wallet, now=None):
    """Musbat yozuvlar (grant va musbat adjust) va ularning qoldig'i. -> [(row, qoldiq), ...] FIFO tartibida."""
    now = now or timezone.now()
    rows = (CreditLedger.objects.filter(wallet=wallet, amount__gt=0, grant__isnull=True)
            .filter(Q(expires_at__isnull=True) | Q(expires_at__gt=now))
            .annotate(used=Sum("uses__amount")).order_by("expires_at", "id"))
    # PostgreSQL'da NULL ASC tartibida oxirida keladi — muddatsizlar oxirgi navbatda yechiladi
    return [(r, r.amount + (r.used or ZERO)) for r in rows if r.amount + (r.used or ZERO) > 0]


def balance(wallet):
    if wallet is None:
        return ZERO
    return sum((left for _, left in _sources(wallet)), ZERO)


def price_of(code):
    p = CreditPrice.objects.filter(action_code=code, is_active=True).values_list("credits", flat=True).first()
    return Decimal(p) if p is not None else None


def grant(wallet, amount, *, kind="grant", expires_at=None, source_package_id=None, reason="", user=None,
          action_code=""):
    amount = Decimal(amount)
    if amount <= 0:
        raise ValueError("grant miqdori musbat bo'lishi kerak")
    return CreditLedger.objects.create(wallet=wallet, kind=kind, amount=amount, expires_at=expires_at,
                                       source_package_id=source_package_id, reason=reason, created_by=user,
                                       action_code=action_code)


def _expire_wallet(wallet, now):
    rows = (CreditLedger.objects.filter(wallet=wallet, amount__gt=0, grant__isnull=True, expires_at__lte=now)
            .annotate(used=Sum("uses__amount")))
    n = 0
    for r in rows:
        left = r.amount + (r.used or ZERO)
        if left > 0:
            CreditLedger.objects.create(wallet=wallet, kind="expire", amount=-left, grant=r, reason="muddati o'tdi")
            n += 1
    return n


def expire_due(now=None):
    """Muddati o'tgan grant qoldiqlarini `expire` bilan yopadi (Celery Beat, har kecha). -> yopilgan grant'lar soni."""
    now = now or timezone.now()
    ids = (CreditLedger.objects.filter(amount__gt=0, grant__isnull=True, expires_at__lte=now)
           .values_list("wallet_id", flat=True).distinct())
    n = 0
    for wid in list(ids):
        with transaction.atomic():
            wallet = CreditWallet.objects.select_for_update().get(pk=wid)
            n += _expire_wallet(wallet, now)
    return n


def spend(wallet, credits, *, action_code, object_ref="", user=None, kind="spend", reason=""):
    """Kredit yechish. -> yangi balans. `CreditError('insufficient')` — yetmasa, `('daily_limit')` — kunlik limit."""
    credits = Decimal(credits)
    if credits <= 0:
        return balance(wallet)
    with transaction.atomic():
        wallet = CreditWallet.objects.select_for_update().get(pk=wallet.pk)
        now = timezone.now()
        _expire_wallet(wallet, now)
        if user is not None and kind == "spend":
            today = CreditLedger.objects.filter(kind="spend", created_by=user, created_at__date=timezone.localdate(),
                                                grant__isnull=False).values("object_ref", "action_code").distinct()
            if today.count() >= DAILY_UNLOCK_LIMIT:
                raise CreditError("daily_limit", f"Kunlik ochish limiti ({DAILY_UNLOCK_LIMIT}) tugadi.", status=429)
        sources = _sources(wallet, now)
        have = sum((left for _, left in sources), ZERO)
        if have < credits:
            raise CreditError("insufficient", "Kredit yetarli emas.", status=402, balance=float(have),
                              required=float(credits))
        need = credits
        for row, left in sources:
            take = min(left, need)
            CreditLedger.objects.create(wallet=wallet, kind=kind, amount=-take, grant=row, action_code=action_code,
                                        object_ref=object_ref, created_by=user, reason=reason)
            need -= take
            if need <= 0:
                break
        return have - credits


def refund(wallet, *, action_code, object_ref, user=None, reason=""):
    """Oxirgi shu amal/obyekt bo'yicha yechilgan kreditni o'sha grant'larga qaytaradi."""
    with transaction.atomic():
        wallet = CreditWallet.objects.select_for_update().get(pk=wallet.pk)
        spent = CreditLedger.objects.filter(wallet=wallet, kind="spend", action_code=action_code, object_ref=object_ref)
        for row in spent:
            CreditLedger.objects.create(wallet=wallet, kind="refund", amount=-row.amount, grant=row.grant,
                                        action_code=action_code, object_ref=object_ref, created_by=user, reason=reason)
    return balance(wallet)


# --- Ruxsat va ochish ----------------------------------------------------------------------------------------------

def is_owner(user, stir):
    org = organization_of(user)
    return bool(org and org.tin == stir)


def is_privileged(user, stir):
    """O'z korxonasi yoki qo'mita xodimi/admin — hamma bo'lim bepul."""
    return bool(user and user.is_authenticated and (user.is_staff or is_owner(user, stir)))


def active_unlocks(wallet, stir, now=None):
    if wallet is None:
        return {}
    now = now or timezone.now()
    return {u.level: u for u in CreditUnlock.objects.filter(wallet=wallet, stir=stir, expires_at__gt=now)}


def can_view(user, stir, level, wallet=None, unlocks=None):
    """KR-39: bitta joyda ruxsat. level: general | basis | deep."""
    if level == "general":
        return True
    if is_privileged(user, stir):
        return True
    if unlocks is None:
        wallet = wallet if wallet is not None else wallet_of(user)
        unlocks = active_unlocks(wallet, stir)
    if level == "basis":
        return "basis" in unlocks or "deep" in unlocks
    return level in unlocks


def level_price(level, unlocks):
    """13.5: chuqur tahlil — `profile_deep`; kengaytirilgan ochilgan bo'lsa farqi (3 − 1 = 2)."""
    full = price_of(PRICE_CODE[level])
    if full is None:
        return None
    if level == "deep" and "basis" in unlocks:
        basis = price_of(PRICE_CODE["basis"]) or ZERO
        return max(ZERO, full - basis)
    return full


def unlock_options(user, stir, scored, wallet=None, unlocks=None):
    """Qulflangan bo'limlar uchun: narx va nega ochib bo'lmasligi (frontend tugma matni uchun)."""
    if not (user and user.is_authenticated):
        wallet, unlocks = None, {}
    else:
        wallet = wallet if wallet is not None else wallet_of(user)
        unlocks = unlocks if unlocks is not None else active_unlocks(wallet, stir)
    bal = balance(wallet)
    out = {}
    for level in LEVELS:
        credits = level_price(level, unlocks)
        if not (user and user.is_authenticated):
            reason = "login"
        elif not scored:
            reason = "insufficient_data"
        elif credits is None:
            reason = "unavailable"
        elif wallet is None or wallet.plan_rank < LEVEL_MIN_PLAN[level]:
            reason = "plan_required"
        elif bal < credits:
            reason = "insufficient"
        else:
            reason = None
        out[level] = {"level": level, "credits": float(credits) if credits is not None else None,
                      "available": reason is None, "reason": reason,
                      "min_plan": {1: "s50", 2: "s60"}[LEVEL_MIN_PLAN[level]]}
    return {"balance": float(bal), "plan": wallet.plan if wallet else "", "options": out}


def unlock(user, stir, level, scored):
    """Bo'limni ochadi. -> {"unlocked": True, "charged": Decimal, "balance": ..., "expires_at": ...}.
    `scored` — korxonaning bali bormi (to'liqlik ≥ 0.6); yo'q bo'lsa ochilmaydi."""
    if level not in LEVELS:
        raise CreditError("bad_level", "Daraja noma'lum.")
    if is_privileged(user, stir):
        return {"unlocked": True, "charged": 0.0, "free": "owner", "balance": float(balance(wallet_of(user)))}
    if not scored:
        raise CreditError("insufficient_data", "Ma'lumot yetarli emas: bu korxonani ochib bo'lmaydi.", status=409)
    wallet = wallet_of(user)
    if wallet is None or wallet.plan_rank < LEVEL_MIN_PLAN[level]:
        raise CreditError("plan_required", "Bu bo'lim uchun scoring tarifi kerak.", status=403,
                          min_plan={1: "s50", 2: "s60"}[LEVEL_MIN_PLAN[level]])
    with transaction.atomic():
        CreditWallet.objects.select_for_update().get(pk=wallet.pk)   # parallel ochishlar ketma-ket bo'lsin
        unlocks = active_unlocks(wallet, stir)
        if level in unlocks:
            return {"unlocked": True, "charged": 0.0, "free": "active", "balance": float(balance(wallet)),
                    "expires_at": unlocks[level].expires_at}
        credits = level_price(level, unlocks)
        if credits is None:
            raise CreditError("unavailable", "Bu amal hozir mavjud emas.", status=409)
        left = spend(wallet, credits, action_code=PRICE_CODE[level], object_ref=stir, user=user)
        expires = timezone.now() + timedelta(days=UNLOCK_DAYS)
        CreditUnlock.objects.update_or_create(wallet=wallet, stir=stir, level=level,
                                              defaults={"expires_at": expires, "unlocked_by": user})
    return {"unlocked": True, "charged": float(credits), "balance": float(left), "expires_at": expires}
