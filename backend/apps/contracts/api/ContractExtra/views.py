"""K-08: shartnoma vaqt chizig'i va yaratishdan oldin oldindan ko'rish."""
from django.shortcuts import get_object_or_404
from rest_framework import serializers
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.contracts.api.ContractCreate.serializers import ContractCreateSerializer, build_template_context
from apps.contracts.models import Contract
from apps.services.models import ServicePackage, UserServicePackage
from apps.services.pricing import package_price
from apps.common.text import sector_label

PREVIEW_NUMBER = "(raqam shartnoma yaratilganda beriladi)"


def _step(key, label, done, date=None, note=None):
    return {"key": key, "label": label, "done": bool(done), "date": date, "note": note}


def contract_timeline(contract):
    """yaratildi → DIDOX'ga yuborildi → mijoz imzoladi → agentlik imzoladi → to'lov → paket faol."""
    logs = list(contract.status_logs.all())
    first = lambda pred: next((log.created_at for log in logs if pred(log)), None)  # noqa: E731
    sent = bool(contract.didx_contract_id or contract.didox_contract_data)
    payed = contract.payed_amount  # faqat o'qish (payment kodi o'zgarmaydi)
    total = contract.total_amount or 0
    active = UserServicePackage.objects.filter(created_by_user=contract.user, service=contract.package).exists()
    cancelled = contract.status == "cancelled"
    steps = [
        _step("created", "Shartnoma yaratildi", True, contract.start_date),
        _step("sent", "DIDOX'ga yuborildi", sent, first(lambda log: log.status != "created")),
        _step("client_signed", "Mijoz imzoladi", contract.signed_by_client,
              contract.client_signature_date or first(lambda log: log.signed_by_client)),
        _step("admin_signed", "Agentlik imzoladi", contract.signed_by_admin,
              contract.admin_signature_date or first(lambda log: log.signed_by_admin)),
        _step("paid", "To'lov", total and payed >= total, None, f"{payed:,.0f} / {total:,.0f} so'm".replace(",", " ")),
        _step("active", "Paket faol", active or contract.status == "completed"),
    ]
    current = next((s["key"] for s in steps if not s["done"]), None)
    return {
        "status": contract.status,
        "cancelled": cancelled,
        "current": None if cancelled else current,
        "steps": steps,
        "history": [{"status": log.status, "date": log.created_at} for log in logs],
    }


class ContractTimelineView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        contract = get_object_or_404(Contract, pk=pk, user=request.user)
        return Response(contract_timeline(contract))


class PreviewInput(serializers.Serializer):
    service_package_id = serializers.IntegerField()


class ContractPreviewView(APIView):
    """POST: shartnoma matni va rekvizitlar. Bazaga yozmaydi, DIDOX/Telegram chaqirilmaydi."""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        data = PreviewInput(data=request.data)
        data.is_valid(raise_exception=True)
        package = get_object_or_404(ServicePackage, pk=data.validated_data["service_package_id"])
        org = getattr(request.user, "organization", None)
        if org is None:
            return Response({"detail": "Avval profilda korxona ma'lumotlarini to'ldiring.", "code": "no_organization"},
                            status=400)
        pricing = package_price(package, org.sector)
        helper = ContractCreateSerializer(context={"request": request})
        context = build_template_context(request.user, org, package, PREVIEW_NUMBER, pricing["price"])
        parts = helper._render_template_parts(helper._load_contract_template_parts(), context)
        template_found = bool(parts)
        if not parts:
            # Shablon fayli (datas/contractContentTemplate.json) bu muhitda yo'q — asosiy shartlar qisqacha
            parts = [
                {"title": "Tomonlar", "body": f"Ijrochi: {context['region']} statistika boshqarmasi. "
                                              f"Buyurtmachi: {context['orgName']}, rahbar {context['directorName']}."},
                {"title": "Shartnoma predmeti", "body": f"\"{context['serviceName']}\" tarif paketi bo'yicha "
                                                        "konsalting va statistik axborot xizmatlari."},
                {"title": "Narx va to'lov", "body": f"Xizmat qiymati {context['serviceValue']} so'm, QQS 12% — "
                                                    f"{context['serviceAmount']} so'm, jami {context['serviceOverallScore']} so'm. "
                                                    "To'lov shartnoma imzolangandan keyin bank o'tkazmasi orqali."},
                {"title": "Muddat", "body": "Shartnoma imzolangan kundan boshlab paket muddati davomida amal qiladi."},
            ]
        return Response({
            "template_found": template_found,
            "package": {"id": package.id, "name": package.name},
            "pricing": {k: str(v) if not isinstance(v, int) else v for k, v in pricing.items()},
            "requisites": {
                "name": org.name, "tin": org.tin, "address": org.address,
                "district": org.district.name if org.district_id else None,
                "sector": sector_label(org.sector),
                "director": request.user.full_name,
                "seller": org.branch.name if org.branch_id else None,
            },
            "parts": parts,
        })
