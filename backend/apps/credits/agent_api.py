"""`/api/credits/agent/...`: AI agent — ma'lumot topish, taklif, qabul/rad, tarix va yuklash."""
from django.http import HttpResponse
from rest_framework import serializers
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from . import agent, service


class QuoteAnonThrottle(AnonRateThrottle):
    scope = "agent_quote"
    THROTTLE_RATES = {"agent_quote": "20/min"}


class QuoteUserThrottle(UserRateThrottle):
    scope = "agent_quote_user"
    THROTTLE_RATES = {"agent_quote_user": "60/min"}


class QuoteSerializer(serializers.Serializer):
    query = serializers.CharField(max_length=300, min_length=2)
    hs = serializers.RegexField(r"^\d{4,6}$", required=False, allow_blank=True)
    flows = serializers.ListField(child=serializers.ChoiceField(choices=[1, 2]), required=False, max_length=2)
    years = serializers.ListField(child=serializers.IntegerField(min_value=2000, max_value=2100), required=False, max_length=15)


def _error(exc):
    return Response(exc.as_dict(), status=exc.status)


class AgentQuoteView(APIView):
    """POST {query, hs?, flows?, years?} -> topilgan ma'lumot to'plamlari va narxi. Kirganga taklif (offer_id) saqlanadi."""
    permission_classes = [AllowAny]
    throttle_classes = [QuoteAnonThrottle, QuoteUserThrottle]

    def post(self, request):
        ser = QuoteSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        d = ser.validated_data
        return Response(agent.quote(request.user, d["query"], d.get("hs", ""), d.get("flows"), d.get("years")))


class AcceptSerializer(serializers.Serializer):
    offer_id = serializers.IntegerField()
    items = serializers.ListField(child=serializers.CharField(max_length=20), required=False, max_length=10)


class AgentAcceptView(APIView):
    """POST {offer_id, items?} — foydalanuvchi qabul qildi: hamyondan yechiladi, to'plamlar tarixga yoziladi."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = AcceptSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        try:
            return Response(agent.accept(request.user, ser.validated_data["offer_id"], set(ser.validated_data.get("items") or [])))
        except service.CreditError as exc:
            return _error(exc)


class AgentDeclineView(APIView):
    """POST {offer_id} — rad etildi: taklif o'chiriladi, pul yechilmaydi."""
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            offer_id = int(request.data.get("offer_id"))
        except (TypeError, ValueError):
            return Response({"detail": "offer_id kerak"}, status=400)
        return Response({"removed": agent.decline(request.user, offer_id)})


class AgentHistoryView(APIView):
    """GET — hamyon bo'yicha sotib olingan ma'lumotlar tarixi."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        return Response({"results": agent.history(request.user)})


class AgentPreviewView(APIView):
    """GET purchases/<id>/preview/?offset=0&limit=25 — sotib olingan to'plamni sahifada ko'rish (jadval va diagramma)."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        purchase = agent.purchase_of(request.user, pk)
        if purchase is None:
            return Response({"detail": "Topilmadi"}, status=404)
        try:
            offset, limit = int(request.query_params.get("offset", 0)), int(request.query_params.get("limit", 25))
        except ValueError:
            return Response({"detail": "offset/limit son bo'lishi kerak"}, status=400)
        return Response(agent.preview(purchase, offset, limit))


class AgentDownloadView(APIView):
    """GET purchases/<id>/download/?file=xlsx|csv — sotib olingan to'plam, qayta to'lovsiz."""
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        purchase = agent.purchase_of(request.user, pk)
        if purchase is None:
            return Response({"detail": "Topilmadi"}, status=404)
        fmt = "csv" if request.query_params.get("file") == "csv" else "xlsx"
        body, ctype, name = agent.build_file(purchase, fmt)
        resp = HttpResponse(body, content_type=ctype)
        resp["Content-Disposition"] = f'attachment; filename="{name}"'
        return resp
