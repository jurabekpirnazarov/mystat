"""KR-14: sinxronlashdan keyin ma'lumot sifati tekshiruvi. Natija admin'da va yangi muammo bo'lsa xabarnoma."""
import logging
from datetime import timedelta

from django.utils import timezone

from .models import SiatIndicator, SiatValue, Territory
from .normalize import is_rate_unit

logger = logging.getLogger(__name__)
JUMP_LIMIT = 0.5  # yildan yilga ±50%
STALE_DAYS = 365
# Sinxronlashda paydo bo'ladigan (tozalash) ogohlantirishlari shu prefikslar bilan saqlanadi
CHECK_PREFIXES = ("Yetishmayotgan hudud", "Keskin o'zgarish", "12 oydan beri", "Oxirgi davr")


def _fmt(value):
    return f"{value:,.1f}".replace(",", " ")


def _expected(level):
    return set(Territory.objects.filter(level=level).values_list("soato", flat=True))


def check_indicator(indicator, now=None):
    now = now or timezone.now()
    issues = []
    if indicator.kind == "source" and indicator.source_updated_at and now - indicator.source_updated_at > timedelta(days=STALE_DAYS):
        issues.append(f"12 oydan beri yangilanmagan (SIAT: {indicator.source_updated_at:%Y-%m-%d}) — "
                      "o'rniga yangi ko'rsatkich chiqarilgan bo'lishi mumkin (N11)")
    if indicator.geo_level not in ("region", "district") or not indicator.show_on_map:
        return issues
    values = SiatValue.objects.filter(indicator=indicator, breakdown=indicator.breakdowns.values_list("code", flat=True)[:1].first() or "") \
        if indicator.breakdowns.exists() else SiatValue.objects.filter(indicator=indicator, breakdown="")
    periods = sorted(set(values.values_list("period", flat=True)))
    if not periods:
        return issues + ["Qiymatlar yo'q"]
    last = periods[-1]
    present = set(values.filter(period=last, value__isnull=False).values_list("territory_code", flat=True))
    ever = set(values.filter(value__isnull=False).values_list("territory_code", flat=True))
    expected = _expected(indicator.geo_level)
    dropped = sorted((expected & ever) - present)  # oldin bor edi, oxirgi davrda yo'q — haqiqiy muammo
    never = sorted(expected - ever)  # umuman yo'q (masalan shaharlarda qishloq aholisi) — ma'lumot uchun
    names = dict(Territory.objects.filter(soato__in=(dropped + never)[:20]).values_list("soato", "name_uz"))
    for label, codes in ((f"Yetishmayotgan hudud ({last})", dropped), ("Yetishmayotgan hudud (hech bir davrda)", never)):
        if codes:
            sample = ", ".join(names.get(c, c) for c in codes[:10])
            issues.append(f"{label}: {len(codes)} ta — {sample}{' …' if len(codes) > 10 else ''}")
    if not is_rate_unit(indicator.unit_uz) and indicator.periodicity == "Y" and len(periods) >= 2:
        prev = periods[-2]
        before = dict(values.filter(period=prev, value__isnull=False).values_list("territory_code", "value"))
        jumps = []
        for code, value in values.filter(period=last, value__isnull=False).values_list("territory_code", "value"):
            old = before.get(code)
            if old and abs(value / old - 1) > JUMP_LIMIT:
                jumps.append(f"{code} ({_fmt(old)} → {_fmt(value)})")
        if jumps:
            issues.append(f"Keskin o'zgarish {prev}→{last} (±50% dan ko'p): " + ", ".join(jumps[:8])
                          + (" …" if len(jumps) > 8 else ""))
    year = timezone.localdate().year
    if indicator.periodicity == "Y" and int(last[:4]) < year - 2:
        issues.append(f"Oxirgi davr {last} — eskirgan bo'lishi mumkin")
    return issues


def check_all(notify=True):
    """Barcha faol ko'rsatkichlar. Yangi muammo paydo bo'lsa staff'ga in-app xabar (A-02 Notification)."""
    fresh = []
    for indicator in SiatIndicator.objects.filter(is_active=True):
        keep = [i for i in indicator.quality_issues if not i.startswith(CHECK_PREFIXES)]
        found = check_indicator(indicator)
        old = {i for i in indicator.quality_issues if i.startswith(CHECK_PREFIXES)}
        new = [i for i in found if i not in old]
        if new and indicator.show_on_map:
            fresh.append((indicator, new))
        indicator.quality_issues = keep + found
        SiatIndicator.objects.filter(pk=indicator.pk).update(quality_issues=indicator.quality_issues)
    if notify and fresh:
        _notify_admins(fresh)
    return fresh


def _notify_admins(fresh):
    from django.contrib.contenttypes.models import ContentType

    from apps.accounts.models import User
    from apps.notifications.models import Notification

    ct = ContentType.objects.get_for_model(SiatIndicator)
    admins = User.objects.filter(is_active=True, is_staff=True)
    lines = [f"• {ind.key} {ind.name_uz[:60]}: {issues[0][:160]}" for ind, issues in fresh[:10]]
    message = "SIAT sinxronlashdan keyin yangi sifat ogohlantirishlari:\n" + "\n".join(lines)
    for admin in admins:
        try:
            Notification.objects.create(recipient=admin, title="SIAT: ma'lumot sifati", message=message[:4000],
                                        notification_type="warning", content_type=ct, object_id=fresh[0][0].pk)
        except Exception as exc:  # noqa: BLE001 — xabarnoma sinxronlashni to'xtatmasin
            logger.warning("SIAT sifat xabari yuborilmadi: %s", exc)

