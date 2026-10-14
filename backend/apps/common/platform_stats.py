"""`common/platform-stat/` uchun real statistika (avval random.randint bilan soxta raqamlar qaytarilardi).

Javob shakli frontend (`pages/Statistics.tsx`) kutganidek saqlangan.
"""
from datetime import timedelta

from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from django.utils.html import strip_tags

from apps.accounts.models import User
from apps.services.models import UserServicePackageItemUse

PERIOD_DAYS = {"daily": 1, "weekly": 7, "monthly": 30, "yearly": 365}
MONTHS = ["Yan", "Fev", "Mart", "Apr", "May", "Iyun", "Iyul", "Avg", "Sen", "Okt", "Noy", "Dek"]


def service_stats(stat_type, top=5):
    since = timezone.now() - timedelta(days=PERIOD_DAYS.get(stat_type, 30))
    rows = (
        UserServicePackageItemUse.objects.filter(created_at__gte=since, is_success=True)
        .values("psi__package_service__name_uz")
        .annotate(
            physical=Count("id", filter=Q(usp__created_by_user__user_type="individual")),
            legal=Count("id", filter=Q(usp__created_by_user__user_type="legal_entity")),
            all=Count("id"),
        )
        .order_by("-all")[:top]
    )
    return [
        {
            "label": strip_tags(row["psi__package_service__name_uz"] or "").strip() or "—",
            "info": {"physical": row["physical"], "legal": row["legal"], "all": row["all"]},
        }
        for row in rows
    ]


def user_stats():
    now = timezone.now()
    users = User.objects.all()
    last_30 = users.filter(date_joined__gte=now - timedelta(days=30)).count()
    prev_30 = users.filter(date_joined__gte=now - timedelta(days=60), date_joined__lt=now - timedelta(days=30)).count()
    last_84 = users.filter(date_joined__gte=now - timedelta(weeks=12)).count()
    last_365 = users.filter(date_joined__gte=now - timedelta(days=365)).count()
    this_year = users.filter(date_joined__year=now.year).count()
    growth = ((last_30 - prev_30) / prev_30 * 100) if prev_30 else (100.0 if last_30 else 0.0)

    start = (now.replace(day=1) - timedelta(days=150)).replace(day=1, hour=0, minute=0, second=0, microsecond=0)
    by_month = {
        row["m"].strftime("%Y-%m"): row["n"]
        for row in users.filter(date_joined__gte=start).annotate(m=TruncMonth("date_joined")).values("m").annotate(n=Count("id"))
    }
    labels, values, cursor = [], [], start
    for _ in range(6):
        labels.append(MONTHS[cursor.month - 1])
        values.append(by_month.get(cursor.strftime("%Y-%m"), 0))
        cursor = (cursor + timedelta(days=32)).replace(day=1)

    return {
        "daily": {"label": "Kunlik", "value": round(last_30 / 30), "desc": "o'rtacha yangi (30 kun)"},
        "weekly": {"label": "Haftalik", "value": round(last_84 / 12), "desc": "o'rtacha yangi (12 hafta)"},
        "monthly": {"label": "Oylik", "value": round(last_365 / 12), "desc": "o'rtacha yangi (12 oy)"},
        "yearly": {"label": "Yillik", "value": this_year, "desc": "joriy yil"},
        "main": {
            "total": users.count(),
            "active": users.filter(last_login__gte=now - timedelta(days=30)).count(),
            "new": last_30,
            "growth": f"{growth:+.1f}%",
        },
        "chart_data": {"labels": labels, "values": values},
    }
