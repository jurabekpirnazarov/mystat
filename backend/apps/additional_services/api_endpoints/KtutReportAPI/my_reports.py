"""K-05: hisobot topshirish yordamchisi — korxona o'z STIR'i bo'yicha qaysi hisobotlarni qachon topshiradi.

Topshirilgan/topshirilmagan holati manbasi yo'q (`submitted-report` qattiq yozilgan stub, OS-11),
shuning uchun faqat muddatlar ko'rsatiladi.
"""
from datetime import date

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models import KtutReportList, ReportGuide, ReportList, ReportReminder
from apps.common.synthetic import synthetic_ids

from .calendar import next_occurrence, occurrences_in_month


def previous_occurrence(report, today):
    """Bugungacha bo'lgan eng so'nggi muddat (12 oy ichida)."""
    year, month = today.year, today.month
    for _ in range(13):
        days = [d for d in occurrences_in_month(report, year, month) if d < today]
        if days:
            return max(days)
        month -= 1
        if month < 1:
            year, month = year - 1, 12
    return None


class MyReportsAPIView(APIView):
    """GET /api/additional-services/my-reports/?year=2026"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        org = getattr(request.user, "organization", None)
        if org is None:
            return Response({"detail": "Korxona profili topilmadi.", "code": "no_organization"}, status=404)
        links = KtutReportList.objects.filter(ktut__inn=org.tin).select_related("reportlist")
        reports = [link.reportlist for link in links if link.reportlist.is_active]
        if not reports:
            return Response({"detail": "STIR'ingiz bo'yicha KTUT'da biriktirilgan hisobotlar topilmadi.",
                             "code": "no_ktut"}, status=404)

        today = date.today()
        try:
            year = int(request.query_params.get("year") or today.year)
        except ValueError:
            year = today.year
        reminders = {r.report_id: r.days_before for r in ReportReminder.objects.filter(user=request.user)}
        guides = set(ReportGuide.objects.filter(report__in=reports).values_list("report_id", flat=True))
        synthetic_links = synthetic_ids(KtutReportList)

        items = []
        for report in sorted(reports, key=lambda r: r.id):
            nxt = next_occurrence(report, today)
            prev = previous_occurrence(report, today)
            items.append({
                "report_id": report.id,
                "type_uz": report.type_uz or report.type,
                "formsname_uz": (report.formsname_uz or report.formsname).strip(),
                "srok_uz": (report.srok_uz or "").replace("_x000D_", " ").strip(),
                "report_type": report.report_type,
                "next_deadline": nxt.isoformat() if nxt else None,
                "days_left": (nxt - today).days if nxt else None,
                "last_deadline": prev.isoformat() if prev else None,
                "reminded": report.id in reminders,
                "days_before": reminders.get(report.id),
                "has_guide": report.id in guides,
                "year_deadlines": [d.isoformat() for m in range(1, 13) for d in occurrences_in_month(report, year, m)],
            })
        items.sort(key=lambda i: (i["next_deadline"] or "9999", i["type_uz"]))
        is_synthetic = bool(synthetic_links) and all(str(link.pk) in synthetic_links for link in links)
        return Response({
            "organization": {"name": org.name, "tin": org.tin},
            "year": year,
            "today": today.isoformat(),
            "submission_status_available": False,
            "is_synthetic": is_synthetic,
            "items": items,
        })


class ReportGuideAPIView(APIView):
    """GET /api/additional-services/report-guide/<report_id>/"""
    permission_classes = [AllowAny]

    def get(self, request, report_id):
        report = ReportList.objects.filter(pk=report_id).first()
        if report is None:
            return Response({"detail": "Hisobot shakli topilmadi."}, status=404)
        guide = ReportGuide.objects.filter(report=report).first()
        base = {"report_id": report.id, "type_uz": report.type_uz, "formsname_uz": report.formsname_uz.strip(),
                "srok_uz": (report.srok_uz or "").replace("_x000D_", " ").strip(), "report_type": report.report_type}
        if guide is None:
            return Response({**base, "guide": None})
        return Response({**base, "guide": {
            "summary": guide.summary_uz,
            "steps": guide.steps_uz,
            "common_errors": guide.common_errors_uz,
            "legal_basis": guide.legal_basis,
            "sample_file": request.build_absolute_uri(guide.sample_file.url) if guide.sample_file else None,
            "is_synthetic": str(guide.pk) in synthetic_ids(ReportGuide),
        }})
