"""KR-40: `GET /api/credits/me/` (balans, muddatlar, ledger sahifalab, ochilgan korxonalar) va
`POST /api/credits/unlock/` `{stir, level}` (KR-45: `level=basis|deep`, eski nomlar `profile_basis|profile_deep` ham)."""
from django.utils import timezone
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import service
from .models import CreditLedger, CreditPrice, CreditUnlock

TAG = ["StatCoin"]
PAGE = 20
LEVEL_ALIASES = {"profile_basis": "basis", "profile_deep": "deep"}


class UnlockSerializer(serializers.Serializer):
    stir = serializers.RegexField(r"^\d{9,14}$")
    level = serializers.CharField(max_length=20)

    def validate_level(self, value):
        value = LEVEL_ALIASES.get(value, value)
        if value not in service.LEVELS:
            raise serializers.ValidationError("level: basis | deep")
        return value


def _names(stirs):
    from apps.additional_services.models import Ktut

    return dict(Ktut.objects.filter(inn__in=stirs).values_list("inn", "name"))


class CreditsMeView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(tags=TAG, summary="StatCoin hamyonim: balans, muddati yaqinlar, ledger, ochilgan korxonalar",
                   parameters=[OpenApiParameter("page", int)], responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        wallet = service.wallet_of(request.user)
        raw = request.query_params.get("page") or "1"
        page = max(1, int(raw)) if raw.isdigit() else 1
        prices = {p.action_code: float(p.credits) for p in CreditPrice.objects.filter(is_active=True)}
        if wallet is None:
            return Response({"wallet": None, "balance": 0, "plan": "", "plan_name": "Tarifsiz", "expiring": [],
                             "ledger": {"count": 0, "page": 1, "page_size": PAGE, "results": []}, "unlocks": [],
                             "prices": prices})
        now = timezone.now()
        expiring = [{"id": r.id, "left": float(left), "expires_at": r.expires_at, "kind": r.kind, "reason": r.reason}
                    for r, left in service._sources(wallet, now) if r.expires_at]
        ledger = CreditLedger.objects.filter(wallet=wallet).select_related("created_by")
        total = ledger.count()
        rows = ledger[(page - 1) * PAGE: page * PAGE]
        unlocks = list(CreditUnlock.objects.filter(wallet=wallet, expires_at__gt=now).order_by("expires_at"))
        names = _names({u.stir for u in unlocks} | {r.object_ref for r in rows if r.object_ref})
        return Response({
            "wallet": wallet.pk, "balance": float(service.balance(wallet)), "plan": wallet.plan,
            "plan_name": wallet.get_plan_display(), "expiring": expiring, "prices": prices,
            "ledger": {"count": total, "page": page, "page_size": PAGE, "results": [
                {"id": r.id, "kind": r.kind, "kind_name": r.get_kind_display(), "amount": float(r.amount),
                 "action_code": r.action_code, "object_ref": r.object_ref, "object_name": names.get(r.object_ref),
                 "reason": r.reason, "expires_at": r.expires_at, "created_at": r.created_at,
                 "by": r.created_by.full_name if r.created_by else None} for r in rows]},
            "unlocks": [{"stir": u.stir, "name": names.get(u.stir), "level": u.level, "level_name": u.get_level_display(),
                         "expires_at": u.expires_at, "days_left": max(0, (u.expires_at - now).days)} for u in unlocks],
        })


class UnlockView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(tags=TAG, summary="Korxona profili bo'limini StatCoin bilan ochish (30 kun)",
                   request=UnlockSerializer, responses={200: OpenApiTypes.OBJECT, 402: OpenApiTypes.OBJECT,
                                                        403: OpenApiTypes.OBJECT, 409: OpenApiTypes.OBJECT})
    def post(self, request):
        ser = UnlockSerializer(data=request.data)
        ser.is_valid(raise_exception=True)
        stir, level = ser.validated_data["stir"], ser.validated_data["level"]
        from apps.analytics.company_scoring.profile import is_scored

        try:
            result = service.unlock(request.user, stir, level, scored=is_scored(stir))
        except service.CreditError as exc:
            return Response(exc.as_dict(), status=exc.status)
        return Response({"stir": stir, "level": level, **result})


class ActivationView(APIView):
    """KR-41/OS-20: StatCoin paketini faollashtirish holati.
    GET ?package=<id> — shu paket bo'yicha foydalanuvchi shartnomalari (to'lov holati) va paket faolmi;
    POST {package} — to'lovni tekshirib, to'liq to'langan shartnomalarni hoziroq faollashtiradi (Celery'ni kutmasdan)."""
    permission_classes = (IsAuthenticated,)

    @staticmethod
    def _state(user, package_id):
        from apps.contracts.models import Contract
        from apps.services.models import UserServicePackage

        contracts = [{"id": c.id, "number": c.contract_number, "status": c.status, "total": float(c.total_amount),
                      "paid": float(c.payed_amount), "signed_by_client": c.signed_by_client,
                      "activated": c.activated_packages.exists()}
                     for c in Contract.objects.filter(user=user, package_id=package_id).order_by("-id")[:5]]
        wallet = service.wallet_of(user)
        return {"contracts": contracts,
                "active": UserServicePackage.objects.filter(created_by_user=user, service_id=package_id).exists(),
                "balance": float(service.balance(wallet)), "plan": wallet.plan if wallet else ""}

    def get(self, request):
        return Response(self._state(request.user, int(request.query_params.get("package") or 0)))

    def post(self, request):
        from . import packages

        package_id = int(request.data.get("package") or 0)
        activated = packages.activate_paid_contracts(request.user)
        out = self._state(request.user, package_id)
        out["activated_now"] = [u.service.name for u in activated]
        return Response(out)
