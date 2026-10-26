"""JAHON_TAJRIBASI JT-04: statistik kodlar va hisobotlar ro'yxati haqida ma'lumotnoma (Rosstat'dagi xizmat kabi).

GET /api/additional-services/ktut/<stir>/certificate/   — ma'lumotnoma (login bilan, OS-JT-1 default: bepul)
GET /api/additional-services/certificate/verify/?code=   — haqiqiyligini tekshirish (ochiq)

Real ma'lumot: KTUT (STIR, OKPO, nom) va korxona↔hisobot bog'lanishi. KTUT'da OKED, SOATO va mulkchilik shakli yo'q
(JAHON_TAJRIBASI 0-bo'lim), shuning uchun ular faqat korxona portalda ro'yxatdan o'tgan bo'lsa (`Organization`)
chiqadi; aks holda "KTUT'da mavjud emas" deb ko'rsatiladi — hech qachon sintetik qiymat emas.

Tekshiruv kodi — `django.core.signing` imzosi: STIR, berilgan vaqt va hisobotlar ro'yxatining xeshi. Bazaga hech
narsa yozilmaydi; kod soxtalashtirilsa imzo buziladi. Ro'yxat keyin o'zgargan bo'lsa, tekshiruv buni aytadi.
"""
import hashlib
import re

from django.core import signing
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle
from rest_framework.views import APIView

from apps.additional_services.models import Ktut, ReportList

SALT = "mystat.jt04.certificate"
PERIOD_LABELS = {"monthly": "Oylik", "quarterly": "Choraklik", "yearly": "Yillik"}


def _clean(text):
    """Excel'dan kelgan qoldiqlar: `_x000D_`, ortiqcha bo'shliq."""
    return re.sub(r"\s+", " ", (text or "").replace("_x000D_", " ")).strip()


def _clean_okpo(value):
    from apps.analytics.company_card import clean_okpo

    return clean_okpo(value)


def _reports(ktut):
    ids = ktut.reportlists.values_list("reportlist_id", flat=True)
    return list(ReportList.objects.filter(id__in=ids, is_active=True).order_by("report_type", "id"))


def _reports_hash(reports):
    return hashlib.sha256(",".join(sorted(r.id for r in reports)).encode()).hexdigest()[:12]


def _organization_codes(stir):
    """Portalda ro'yxatdan o'tgan korxona uchun qo'shimcha kodlar (bo'lmasa bo'sh)."""
    from apps.organizations.models import Organization

    org = Organization.objects.select_related("district__region", "sector").filter(tin=stir).first()
    if not org:
        return {}
    district = org.district
    return {
        "soato": f"{district.region.code}{district.code}" if district else None,
        "region": district.region.name if district else None,
        "district": district.name if district else None,
        "sector": (org.sector.name_uz or org.sector.name) if org.sector else None,
        "legal_form": org.organization_type or None,
        "ktyadr": org.ktyadr_code or None,
        "address": org.address or None,
    }


from apps.additional_services.deadlines import next_occurrence  # noqa: E402


def build_certificate(ktut, issued_at=None):
    issued_at = issued_at or timezone.now()
    today = timezone.localdate()
    reports = _reports(ktut)
    code = signing.dumps({"s": ktut.inn, "t": int(issued_at.timestamp()), "h": _reports_hash(reports)},
                         salt=SALT, compress=True)
    return {
        "stir": ktut.inn, "okpo": _clean_okpo(ktut.okpo), "name": ktut.name,
        "codes": _organization_codes(ktut.inn),
        "reports": [{
            "id": r.id, "form": _clean(r.type_uz or r.type), "title": _clean(r.formsname_uz or r.formsname),
            "periodicity": r.report_type, "periodicity_label": PERIOD_LABELS.get(r.report_type, ""),
            "deadline_rule": _clean(r.srok_uz or r.srok),
            "next_deadline": next_occurrence(r, today),
        } for r in reports],
        "issued_at": issued_at, "verify_code": code, "verify_path": f"/stat-codes/verify?code={code}",
        "source": "KTUT (Korxona va tashkilotlarning yagona davlat registri), my.stat.uz",
    }


class KtutCertificateAPIView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, stir_number: str):
        stir = str(stir_number)
        if len(stir) != 9 or not stir.isdigit():
            return Response({"detail": "STIR 9 ta raqamdan iborat bo'lishi kerak"}, status=status.HTTP_400_BAD_REQUEST)
        ktut = Ktut.objects.filter(inn=stir).first()
        if ktut is None:
            return Response({"detail": "Ushbu STIR raqamiga ega korxona KTUT'da topilmadi"},
                            status=status.HTTP_404_NOT_FOUND)
        return Response(build_certificate(ktut))


class CertificateVerifyThrottle(AnonRateThrottle):
    rate = "60/hour"


class CertificateVerifyAPIView(APIView):
    """Bank, tender komissiyasi yoki boshqa tashkilot ma'lumotnomani tekshiradi — login kerak emas."""
    permission_classes = (AllowAny,)
    throttle_classes = (CertificateVerifyThrottle,)

    def get(self, request):
        code = request.query_params.get("code", "").strip()
        try:
            payload = signing.loads(code, salt=SALT)
        except signing.BadSignature:
            return Response({"valid": False, "detail": "Kod noto'g'ri yoki ma'lumotnoma my.stat.uz'da berilmagan"},
                            status=status.HTTP_200_OK)
        ktut = Ktut.objects.filter(inn=payload.get("s")).first()
        if ktut is None:
            return Response({"valid": False, "detail": "Korxona KTUT'da endi mavjud emas"})
        issued_at = timezone.datetime.fromtimestamp(payload.get("t", 0), tz=timezone.get_current_timezone())
        current = _reports(ktut)
        return Response({
            "valid": True, "stir": ktut.inn, "okpo": _clean_okpo(ktut.okpo), "name": ktut.name, "issued_at": issued_at,
            "reports_count": len(current), "changed": _reports_hash(current) != payload.get("h"),
        })
