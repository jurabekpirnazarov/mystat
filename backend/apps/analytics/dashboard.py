"""A-01: admin analitika paneli — bitta ko'rinishdagi asosiy ko'rsatkichlar.

Sintetik (seed_demo) yozuvlar default holatda hisobdan chiqariladi; "Demo ma'lumotni ko'rsatish" bilan qo'shiladi.
Voronkada "tarif ko'rdi" bosqichi yo'q: sahifa ko'rishlari saqlanmaydi, o'rniga "korxona profili to'ldirilgan" bosqichi.
"""
import io
from datetime import date, timedelta

from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import Avg, Count, DurationField, ExpressionWrapper, F, Sum
from django.db.models.functions import TruncMonth
from django.http import HttpResponse
from django.shortcuts import render
from django.utils import timezone

from apps.accounts.models import User
from apps.book_market.models import OrderBook
from apps.common.synthetic import registered_ids
from apps.contracts.models import Contract
from apps.organizations.models import Organization
from apps.services.models import (CustomDataRequest, ServiceRating, ServiceRequestResponse, UserServicePackage,
                                  UserServicePackageItemUse)


def _exclude_synthetic(qs, include_demo):
    if include_demo:
        return qs
    ids = registered_ids(qs.model)
    return qs.exclude(pk__in=ids) if ids else qs


def _months(qs, field, value=None):
    rows = qs.annotate(m=TruncMonth(field)).values("m").annotate(n=Count("pk"), **({"s": Sum(value)} if value else {})).order_by("m")
    return [{"month": r["m"].strftime("%Y-%m"), "count": r["n"], **({"sum": float(r["s"] or 0)} if value else {})} for r in rows if r["m"]]


def build_dashboard(date_from, date_to, include_demo=False):
    users = _exclude_synthetic(User.objects.all(), include_demo)
    contracts = _exclude_synthetic(Contract.objects.all(), include_demo)
    packages = _exclude_synthetic(UserServicePackage.objects.all(), include_demo)
    uses = _exclude_synthetic(UserServicePackageItemUse.objects.all(), include_demo)
    orders = _exclude_synthetic(OrderBook.objects.all(), include_demo)
    requests_ = _exclude_synthetic(ServiceRequestResponse.objects.all(), include_demo)
    custom = _exclude_synthetic(CustomDataRequest.objects.all(), include_demo)
    ratings = _exclude_synthetic(ServiceRating.objects.all(), include_demo)
    orgs = _exclude_synthetic(Organization.objects.all(), include_demo)

    in_period = lambda qs, field: qs.filter(**{f"{field}__date__gte": date_from, f"{field}__date__lte": date_to})  # noqa: E731
    new_users = in_period(users, "date_joined")
    period_contracts = in_period(contracts, "created_at")

    today = timezone.localdate()
    active_packages = [p for p in packages.select_related("service") if not p.is_expired]

    by_region = (period_contracts.values("user__organization__district__region__name")
                 .annotate(n=Count("id"), s=Sum("total_amount")).order_by("-n"))
    limit_usage = (in_period(uses, "created_at").values("psi__package_service__name_uz")
                   .annotate(n=Count("id")).order_by("-n")[:15])
    done = custom.filter(status="completed").annotate(
        took=ExpressionWrapper(F("updated_at") - F("created_at"), output_field=DurationField()))
    avg_took = done.aggregate(a=Avg("took"))["a"]

    # Voronka (barcha vaqt bo'yicha, davr ichida ro'yxatdan o'tganlar uchun)
    cohort = new_users
    funnel = [
        ("Ro'yxatdan o'tdi", cohort.count()),
        ("Korxona profili to'ldirildi", cohort.filter(organization__in=orgs).count()),
        ("Shartnoma yaratdi", cohort.filter(pk__in=contracts.values("user_id")).count()),
        ("Shartnomani imzoladi", cohort.filter(pk__in=contracts.filter(signed_by_client=True).values("user_id")).count()),
        ("Paket faol", cohort.filter(pk__in=packages.values("created_by_user_id")).count()),
    ]

    return {
        "period": {"from": date_from, "to": date_to},
        "include_demo": include_demo,
        "totals": {
            "users": users.count(),
            "new_users": new_users.count(),
            "contracts": period_contracts.count(),
            "contracts_sum": float(period_contracts.aggregate(s=Sum("total_amount"))["s"] or 0),
            "active_packages": len(active_packages),
            "limit_uses": in_period(uses, "created_at").count(),
            "book_orders": in_period(orders, "created_at").count(),
            "book_orders_sum": float(in_period(orders, "created_at").aggregate(s=Sum("total_amount"))["s"] or 0),
        },
        "users_by_month": _months(new_users, "date_joined"),
        "contracts_by_month": _months(period_contracts, "created_at", "total_amount"),
        "contracts_by_region": [{"region": r["user__organization__district__region__name"] or "Ko'rsatilmagan",
                                 "count": r["n"], "sum": float(r["s"] or 0)} for r in by_region],
        "limit_usage": [{"service": (r["psi__package_service__name_uz"] or "—")[:80], "count": r["n"]} for r in limit_usage],
        "requests": {
            "service_requests": dict(requests_.values_list("status").annotate(n=Count("id"))),
            "custom_requests": dict(custom.values_list("status").annotate(n=Count("id"))),
            "custom_avg_days": round(avg_took.total_seconds() / 86400, 1) if avg_took else None,
        },
        "ratings": list(ratings.values("service__name_uz").annotate(avg=Avg("value"), n=Count("id")).order_by("-n")[:10]),
        "funnel": [{"step": s, "count": n, "pct": round(n / funnel[0][1] * 100, 1) if funnel[0][1] else 0} for s, n in funnel],
        "company_scores": company_scores(include_demo),
        "catalog_usage": catalog_usage(date_from, date_to, include_demo),
        "generated_at": today,
    }


def catalog_usage(date_from, date_to, include_demo):
    """MYGOV_DIZAYN MG-10: katalog xizmatlari (raqam bo'yicha) — davrdagi foydalanish soni va o'rtacha baho, top-15."""
    from apps.portal.models import ServiceReview, ServiceUsage

    usage = ServiceUsage.objects.filter(created_at__date__gte=date_from, created_at__date__lte=date_to)
    reviews = ServiceReview.objects.all()
    if not include_demo:
        usage, reviews = usage.filter(is_synthetic=False), reviews.filter(is_synthetic=False)
    rating = {r["service_number"]: r for r in reviews.values("service_number").annotate(a=Avg("score"), n=Count("id"))}
    rows = usage.values("service_number").annotate(n=Count("id")).order_by("-n")[:15]
    return [{"service": f"#{r['service_number']}", "count": r["n"],
             "rating": round(rating[r["service_number"]]["a"], 2) if r["service_number"] in rating else None,
             "ratings": rating.get(r["service_number"], {}).get("n", 0)} for r in rows]


def company_scores(include_demo):
    """KORXONA_SCORING.md KR-37, 13-band: sinflar taqsimoti; demo o'chirilgan bo'lsa faqat real manbali ballar."""
    from .company_scoring import api, config
    from .models import EnterpriseScore

    cfg = config.get()
    year = api.latest_year(cfg)
    if year is None:
        return None
    qs = EnterpriseScore.objects.filter(model_version=cfg["version"], year=year, preset=cfg["default_preset"])
    if not include_demo:
        qs = qs.filter(data_source="real")
    total = qs.count()
    counts = dict(qs.values_list("klass").annotate(n=Count("id")))
    sources = dict(EnterpriseScore.objects.filter(model_version=cfg["version"], year=year, preset=cfg["default_preset"])
                   .values_list("data_source").annotate(n=Count("id")))
    return {
        "year": year, "total": total, "mean": round(qs.exclude(klass="").aggregate(a=Avg("overall"))["a"] or 0, 1),
        "classes": [{"klass": c["key"], "name": config.tr(c["name"], "uz"), "count": counts.get(c["key"], 0),
                     "pct": round(counts.get(c["key"], 0) / total * 100, 1) if total else 0} for c in cfg["classes"]]
        + [{"klass": "—", "name": "Ma'lumot yetarli emas", "count": counts.get("", 0),
            "pct": round(counts.get("", 0) / total * 100, 1) if total else 0}],
        "sources": sources,
    }


def _parse_period(request):
    today = timezone.localdate()
    try:
        date_from = date.fromisoformat(request.GET.get("from")) if request.GET.get("from") else today - timedelta(days=365)
        date_to = date.fromisoformat(request.GET.get("to")) if request.GET.get("to") else today
    except ValueError:
        date_from, date_to = today - timedelta(days=365), today
    return date_from, date_to


def _xlsx(data):
    from openpyxl import Workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Umumiy"
    ws.append(["Davr", f"{data['period']['from']} — {data['period']['to']}", "Demo ma'lumot", "ha" if data["include_demo"] else "yo'q"])
    for k, v in data["totals"].items():
        ws.append([k, v])
    for title, rows, cols in (("Foydalanuvchilar (oy)", data["users_by_month"], ["month", "count"]),
                              ("Shartnomalar (oy)", data["contracts_by_month"], ["month", "count", "sum"]),
                              ("Shartnomalar (hudud)", data["contracts_by_region"], ["region", "count", "sum"]),
                              ("Limit ishlatilishi", data["limit_usage"], ["service", "count"]),
                              ("Katalog xizmatlari", data["catalog_usage"], ["service", "count", "rating", "ratings"]),
                              ("Voronka", data["funnel"], ["step", "count", "pct"])):
        sheet = wb.create_sheet(title[:31])
        sheet.append(cols)
        for r in rows:
            sheet.append([r.get(c) for c in cols])
    buf = io.BytesIO()
    wb.save(buf)
    return buf.getvalue()


@staff_member_required
def analytics_dashboard(request):
    date_from, date_to = _parse_period(request)
    include_demo = request.GET.get("demo") == "1"
    data = build_dashboard(date_from, date_to, include_demo)
    if request.GET.get("export") == "xlsx":
        response = HttpResponse(_xlsx(data), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
        response["Content-Disposition"] = f'attachment; filename="analitika-{date_from}-{date_to}.xlsx"'
        return response
    max_month = max([m["count"] for m in data["users_by_month"]] + [1])
    max_region = max([r["count"] for r in data["contracts_by_region"]] + [1])
    return render(request, "admin/analytics/dashboard.html", {
        "title": "Analitika paneli", "data": data, "max_month": max_month, "max_region": max_region,
        "query": request.GET.urlencode(),
    })
