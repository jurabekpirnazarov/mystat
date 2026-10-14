"""FQ-03: inflyatsiya kalkulyatori uchun ochiq agregat CPI qatori (OS-15: mehmonga ochiq).

Bazadagi PriceIndex.values — oylik indeks, o'tgan oyga nisbatan (masalan 100.66 = +0.66%).
Davr bo'yicha inflyatsiya oylik indekslar ko'paytmasi bilan hisoblanadi (zanjirli indeks), ikki oyning
oylik indeksini bir-biridan ayirish noto'g'ri.
"""
from django.core.cache import cache
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models.priceindex_model import PriceIndex


def cpi_chain():
    """[{month: 'YYYY-MM', mom: 100.66, index: zanjirli indeks (birinchi oydan oldingi oy = 100)}]"""
    rows = PriceIndex.objects.filter(year__isnull=False, values__isnull=False).order_by("year")
    chain, level = [], 100.0
    for r in rows:
        level *= float(r.values) / 100
        chain.append({"month": r.year.strftime("%Y-%m"), "mom": float(r.values), "index": round(level, 4)})
    return chain


class CpiSeriesAPIView(APIView):
    """GET /api/additional-services/cpi/series/"""
    permission_classes = [AllowAny]

    def get(self, request):
        data = cache.get("cpi:series:v1")
        if data is None:
            data = {"base": "Zanjirli indeks: qator boshlanishidan oldingi oy = 100", "source": "real",
                    "series": cpi_chain()}
            cache.set("cpi:series:v1", data, 3600)
        return Response(data)
