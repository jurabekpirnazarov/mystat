"""IHAMKOR_MUQOBIL.md IH-08: kontragent kartasi API'si (company_card.py). Ochiq, faqat real manbalar."""
from django.core.cache import cache
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import extend_schema
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from . import company_card

TAG = ["Kontragent kartasi"]
CACHE_SECONDS = 60 * 60


class CardThrottle(AnonRateThrottle):
    """Mehmon uchun: ommaviy yuklab olishga (skreyping) to'siq; ro'yxatdan o'tganlarga cheklov yo'q."""
    rate = "120/hour"


class CompanyCardView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (CardThrottle,)

    @extend_schema(tags=TAG, operation_id="company_card", summary="Kontragent kartasi (bepul, real manbalar)",
                   responses={200: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT})
    def get(self, request, stir):
        stir = stir.strip()
        key = f"company-card:v2:{stir}"
        data = cache.get(key)
        if data is None:
            data = company_card.build_card(request, stir)
            data.pop("score", None)          # ball foydalanuvchiga bog'liq (OS-18) — keshga kirmaydi
            cache.set(key, data, CACHE_SECONDS)
        return Response({**data, "score": company_card.score_block(request, stir)})


class CompanyCardSearchView(APIView):
    permission_classes = (AllowAny,)
    throttle_classes = (CardThrottle,)

    @extend_schema(tags=TAG, operation_id="company_card_search", summary="Korxona qidiruvi: STIR yoki nom",
                   responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        return Response({"results": company_card.search(request.query_params.get("q", ""))})
