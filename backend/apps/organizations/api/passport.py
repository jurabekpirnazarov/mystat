"""K-07: korxona pasporti — foydalanuvchining o'z korxonasi haqida bir sahifa.

Ma'lumoti yo'q blok `None` qaytadi (frontend yashiradi). Tashqi savdo ma'lumotida korxona kesimi yo'q,
shuning uchun bu blok yo'q. Boshqa korxonalar uchun mavjud ochiq sahifalar o'zgarishsiz.
"""
from datetime import date

from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.api_endpoints.KtutReportAPI.calendar import next_occurrence
from apps.additional_services.models import IndustrialProduct, Ktut, KtutReportList
from apps.analytics.models import EnterpriseIndicator
from apps.common.synthetic import synthetic_ids
from apps.contracts.models import Contract
from apps.services.limits import active_package
from apps.common.text import sector_label


class PassportView(APIView):
    """GET /api/organizations/me/passport/"""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        org = getattr(request.user, "organization", None)
        if org is None:
            return Response({"detail": "Korxona profili topilmadi.", "code": "no_organization"}, status=404)

        ktut = Ktut.objects.filter(inn=org.tin).first()
        basic = {
            "name": org.name, "tin": org.tin, "address": org.address, "phone": org.phone, "email": org.email,
            "organization_type": org.organization_type,
            "region": org.district.region.name if org.district_id else None,
            "district": org.district.name if org.district_id else None,
            "sector": sector_label(org.sector),
            "ktut_name": ktut.name if ktut else None,
        }

        products = list(IndustrialProduct.objects.filter(inn=org.tin).select_related("category", "skp")
                        .values("skp__code", "skp__name_uz", "category__name_uz")[:50])

        today = date.today()
        reports = []
        for link in KtutReportList.objects.filter(ktut__inn=org.tin).select_related("reportlist"):
            nxt = next_occurrence(link.reportlist, today)
            reports.append({"report_id": link.reportlist_id, "type_uz": link.reportlist.type_uz,
                            "next_deadline": nxt.isoformat() if nxt else None})
        reports.sort(key=lambda r: r["next_deadline"] or "9999")

        indicators_qs = EnterpriseIndicator.objects.filter(stir=org.tin).order_by("year")
        syn = synthetic_ids(EnterpriseIndicator)
        indicators = [{"year": i.year, "revenue": float(i.revenue), "employees": i.employees,
                       "output_value": float(i.output_value),
                       "export_value": float(i.export_value) if i.export_value is not None else None}
                      for i in indicators_qs]
        ind_source = None
        if indicators:
            pks = {str(pk) for pk in indicators_qs.values_list("pk", flat=True)}
            ind_source = "synthetic" if pks <= syn else "mixed" if pks & syn else "real"

        contracts = list(Contract.objects.filter(user=request.user).order_by("-id")
                         .values("id", "contract_number", "status", "total_amount", "start_date")[:10])
        usp = active_package(request.user)
        return Response({
            "basic": basic,
            "products": [{"code": p["skp__code"], "name": p["skp__name_uz"], "category": p["category__name_uz"]}
                         for p in products] or None,
            "reports": reports or None,
            "indicators": indicators or None,
            "indicators_source": ind_source,
            "contracts": contracts or None,
            "package": {"name": usp.service.name, "expires_at": usp.expires_at} if usp else None,
            "trade": None,  # tashqi savdo ma'lumotida korxona kesimi yo'q
        })
