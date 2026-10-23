"""K-09: tariflarni taqqoslash, narx kalkulyatori va "menga qaysi paket mos?" yordamchisi.

Narx faqat backend'da hisoblanadi (`services.pricing.package_price`) — frontend formulani takrorlamaydi.
"""
import re

from django.utils.html import strip_tags
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.models import Sector
from apps.services.models import PackageServiceItem, ServicePackage, ServicePackagePrice
from apps.services.pricing import package_price
from apps.common.text import fix_lookalikes

# "Menga qaysi paket mos?" savollari -> PackageService.slug
NEEDS = {
    "prints": "cabinet/statistical-prints",
    "bulletins": "cabinet/statistic-byulleten",
    "companies": "orginfo",
}


def _clean(html):
    text = fix_lookalikes(strip_tags(html or "")).replace("&nbsp;", " ")
    for entity, char in (("&lsquo;", "‘"), ("&rsquo;", "’"), ("&#39;", "'"), ("&ldquo;", "“"), ("&rdquo;", "”")):
        text = text.replace(entity, char)
    return re.sub(r"\s+", " ", text).strip()


def _user_sector(request):
    org = getattr(request.user, "organization", None) if request.user.is_authenticated else None
    return org.sector if org and org.sector_id else None


def _sector_from_request(request):
    sector_id = request.query_params.get("sector")
    if sector_id and sector_id.isdigit():
        return Sector.objects.filter(pk=sector_id).first()
    return _user_sector(request)


def _money(pricing):
    return {k: (str(v) if not isinstance(v, int) else v) for k, v in pricing.items()}


def _statcoin(package):
    """KR-41: paket beradigan StatCoin (`kind`: monthly | topup | None). Miqdor admin qiymati."""
    if package.statcoin_kind not in ("monthly", "topup") or not package.statcoin_amount:
        return None
    return {"kind": package.statcoin_kind, "amount": float(package.statcoin_amount),
            "plan": package.statcoin_plan, "months": max(1, round(package.duration_days / 30))
            if package.statcoin_kind == "monthly" else None, "opens": _opens(package)}


PROFILE_LEVELS = (("basis", "profile_basis", "Korxona profili: ball nimaga asoslangan"),
                  ("deep", "profile_deep", "Korxona profili: chuqur tahlil"))


def _opens(package):
    """Paket bilan nimalar ochiladi: tarif darajasiga ko'ra korxona profili bo'limlari (narxi bilan) va barcha
    StatCoin xizmatlari. Qo'shimcha paket tarif bermaydi, shuning uchun profil bo'limlari uchun mavjud tarif kerak."""
    from apps.credits import service as credits
    from apps.credits.models import CreditWallet

    rank = CreditWallet.PLAN_RANK.get(package.statcoin_plan, 0)
    profile = []
    for level, code, name in PROFILE_LEVELS:
        price = credits.price_of(code)
        if price is not None and rank >= credits.LEVEL_MIN_PLAN[level]:
            profile.append({"level": level, "name": name, "credits": float(price)})
    return {"profile": profile, "services": _statcoin_services(),
            "needs_plan_for_profile": package.statcoin_kind == "topup"}


def _statcoin_services():
    """Paket limiti o'rniga StatCoin bilan to'lanadigan xizmatlar (faol `CreditPrice`): slug, nomi, narxi."""
    from apps.credits.models import CreditPrice
    from apps.services.limits import STATCOIN_ACTIONS

    prices = {p.action_code: p for p in CreditPrice.objects.filter(is_active=True, action_code__in=STATCOIN_ACTIONS.values())}
    return [{"slug": slug, "name": prices[code].name, "credits": float(prices[code].credits)}
            for slug, code in STATCOIN_ACTIONS.items() if code in prices]


class TariffCompareView(APIView):
    """GET /api/services/tariff-compare/?sector=<id> — paketlar × xizmatlar jadvali va narxlar."""
    permission_classes = (AllowAny,)

    def get(self, request):
        sector = _sector_from_request(request)
        packages = list(ServicePackage.objects.filter(is_active=True).order_by("id"))
        items = PackageServiceItem.objects.filter(package__in=packages).select_related("package_service")
        rows = {}
        for item in items:
            ps = item.package_service
            row = rows.setdefault(ps.id, {"id": ps.id, "slug": ps.slug, "name": _clean(ps.name_uz), "cells": {}})
            row["cells"].setdefault(str(item.package_id), []).append({
                "name": _clean(item.name_uz), "limit": item.limit, "unlimited": item.is_unlimited})
        priced = sorted(((p, package_price(p, sector)) for p in packages), key=lambda x: x[1]["price"])
        sector_ids = ServicePackagePrice.objects.values_list("sector_id", flat=True).distinct()
        return Response({
            "sector": {"id": sector.id, "code": sector.code, "name": _clean(sector.name_uz or sector.name)} if sector else None,
            "user_sector_id": getattr(_user_sector(request), "id", None),
            "sectors": [{"id": s.id, "code": s.code, "name": _clean(s.name_uz or s.name).capitalize()}
                        for s in Sector.objects.filter(pk__in=sector_ids).order_by("code")],
            "packages": [{"id": p.id, "name": p.name, "pricing": _money(pr), "statcoin": _statcoin(p)} for p, pr in priced],
            "rows": sorted(rows.values(), key=lambda r: r["id"]),
            "statcoin_services": _statcoin_services(),
        })


class TariffRecommendView(APIView):
    """GET /api/services/tariff-recommend/?prints=&bulletins=&companies=&sector= — eng arzon mos paket."""
    permission_classes = (AllowAny,)

    def get(self, request):
        need = {}
        for key in NEEDS:
            try:
                need[key] = max(0, int(request.query_params.get(key) or 0))
            except ValueError:
                need[key] = 0
        sector = _sector_from_request(request)
        candidates = []
        for package in ServicePackage.objects.filter(is_active=True):
            items = {i.package_service.slug: i for i in
                     PackageServiceItem.objects.filter(package=package, package_service__slug__in=NEEDS.values())
                     .select_related("package_service")}
            fits = True
            for key, slug in NEEDS.items():
                if not need[key]:
                    continue
                item = items.get(slug)
                if item is None or not (item.is_unlimited or item.limit >= need[key]):
                    fits = False
                    break
            if fits:
                # narx teng bo'lsa kichikroq (limitlari kamroq) paket tavsiya qilinadi
                size = sum(max(i.limit, 0) for i in items.values())
                candidates.append((package_price(package, sector)["price"], size, package))
        if not candidates:
            return Response({"package": None, "reason": "Talablaringizga mos paket topilmadi — eng katta paketni ko'ring yoki biz bilan bog'laning."})
        package = min(candidates, key=lambda c: (c[0], c[1], c[2].id))[2]
        return Response({"package": {"id": package.id, "name": package.name},
                         "pricing": _money(package_price(package, sector)), "need": need})
