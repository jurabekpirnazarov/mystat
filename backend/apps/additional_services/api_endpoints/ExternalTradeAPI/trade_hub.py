"""TRADEINT_DIZAYN.md TI-01 (umumiy qidiruv), TI-03 (raqamlar qatori), TI-06 (namuna hisobot kodi) va ma'lumot sifati.

Hamma raqam bazadan hisoblanadi va 24 soat keshlanadi (qattiq yozilgan raqam yo'q).
"""
from statistics import median

from django.core.cache import cache
from django.db.models import Count, Sum
from django.db.models.functions import Substr
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models.ex_trade import Country, Product, TradeData
from apps.common.search import ci_contains

from .flows import MONTH_LABELS, _month_num, latest_periods, period_label

CACHE_SECONDS = 24 * 60 * 60
SEARCH_LIMIT = 8


def data_quality():
    """{yil: ogohlantirish matni}. Avtomatik aniqlanadi, qo'lda yozilmaydi:

    - joriy (eng oxirgi) yildan boshqa yil to'liq emas (oxirgi davr M12 emas) — masalan faqat M1 saqlangan;
    - to'liq yillar orasida eksport jami boshqa yillar medianasidan 4 baravardan ko'p farq qiladi.

    Bunday yillar bilan taqqoslangan "o'zgarish" foizlari ishonchsiz, interfeysda ogohlantirish chiqadi.
    """
    def compute():
        periods = latest_periods()
        if not periods:
            return {}
        latest_year = max(periods)
        notes = {}
        totals = {}
        for year, month in periods.items():
            value = float(TradeData.objects.filter(year_id=year, month=month, trade_type=1).aggregate(v=Sum("value"))["v"] or 0)
            totals[year] = value
            if year != latest_year and month != "M12":
                notes[year] = f"{year}-yil uchun faqat {period_label(month)} davri bazada bor"
        full = {y: v for y, v in totals.items() if periods[y] == "M12" and v}
        for year, value in full.items():
            others = [v for y, v in full.items() if y != year]
            if len(others) >= 2:
                ref = median(others)
                if ref and (value < ref / 4 or value > ref * 4):
                    notes[year] = f"{year}-yil qiymatlari boshqa yillardan keskin farq qiladi (ma'lumot to'liq bo'lmasligi mumkin)"
        return notes
    return cache.get_or_set("trade_hub:quality", compute, CACHE_SECONDS)


def countries_with_data():
    return cache.get_or_set(
        "trade_hub:countries",
        lambda: set(TradeData.objects.values_list("country_id", flat=True).distinct()),
        CACHE_SECONDS,
    )


def sample_hs():
    """Namuna hisobot uchun HS kodi: oxirgi to'liq yildagi eng katta qiymatli 4 xonali eksport kodi (TI-06, default)."""
    def compute():
        periods = latest_periods()
        quality = data_quality()
        years = [y for y, m in periods.items() if m == "M12" and y not in quality] or [max(periods)]
        year = max(years)
        row = (TradeData.objects.filter(year_id=year, month=periods[year], trade_type=1)
               .annotate(hs4=Substr("product__code", 1, 4)).values("hs4")
               .annotate(v=Sum("value")).order_by("-v").first())
        return row["hs4"] if row else None
    return cache.get_or_set("trade_hub:sample_hs", compute, CACHE_SECONDS)


class TradeSummaryAPIView(APIView):
    """GET external-trade/summary/ — TI-03: yozuvlar, mahsulot kodlari, davlatlar, davr, oxirgi yangilanish."""
    permission_classes = [AllowAny]

    def get(self, request):
        def compute():
            periods = latest_periods()
            if not periods:
                return {}
            agg = TradeData.objects.aggregate(records=Count("id"), products=Count("product", distinct=True),
                                              countries=Count("country", distinct=True))
            years = sorted(periods)
            last_year = years[-1]
            return {
                "records": agg["records"],
                "products": agg["products"],
                "countries": agg["countries"],
                "years": years,
                "years_count": len(years),
                "year_from": years[0],
                "year_to": last_year,
                "latest": {"year": last_year, "period": periods[last_year], "period_label": period_label(periods[last_year])},
                "quality": {str(y): n for y, n in data_quality().items()},
                "source": "Milliy statistika qo'mitasi, bojxona ma'lumotlari asosida",
            }
        return Response(cache.get_or_set("trade_hub:summary", compute, CACHE_SECONDS))


class TradeSearchAPIView(APIView):
    """GET external-trade/search/?q= — TI-01: bitta maydon, ikki guruh: mahsulotlar (HS) va davlatlar."""
    permission_classes = [AllowAny]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response({"products": [], "countries": []})
        if q.isdigit():
            products = Product.objects.filter(code__startswith=q)
        else:
            products = Product.objects.filter(ci_contains(("name_uz", "name_ru", "name_cry"), q))
        products = products.order_by("level", "code").values("code", "name_uz", "level")[:SEARCH_LIMIT]
        countries = []
        if not q.isdigit():
            ids = countries_with_data()
            rows = (Country.objects.filter(id__in=ids).filter(ci_contains(("name_uz", "name_ru", "name_cry", "name_en"), q))
                    .order_by("name_uz").values("id", "name_uz", "ctrana")[:SEARCH_LIMIT])
            countries = [{"id": r["id"], "name": r["name_uz"], "iso": r["ctrana"]} for r in rows]
        return Response({
            "products": [{"code": r["code"], "name": r["name_uz"], "level": r["level"]} for r in products],
            "countries": countries,
        })
