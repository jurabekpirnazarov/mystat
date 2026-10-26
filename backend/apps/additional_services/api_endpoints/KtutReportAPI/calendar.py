"""Hisobot kalendari: oy ko'rinishi va eslatmalar (U-13).

Muddatlar `deadlines.deadlines_for` dan: `ReportList.deadline_rule` (masalan `Q+25d`), qoida bo'lmasa eski
`deadline` sanasi `report_type` bo'yicha takrorlanadi.
"""
from datetime import date

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

# HT-01: nom eski importlar uchun shu yerda qoladi
from apps.additional_services.deadlines import next_occurrence, occurrences_in_month, shift_enabled  # noqa: F401
from apps.additional_services.models import ReportList, ReportReminder
from apps.common.text import clean_excel_text


class ReportCalendarAPIView(APIView):
    """GET reportlist/calendar/?year=2026&month=10 -> [{report_id, date, type_uz, formsname_uz, report_type, reminded}]"""
    permission_classes = [AllowAny]

    def get(self, request):
        today = date.today()
        try:
            year = int(request.query_params.get("year") or today.year)
            month = int(request.query_params.get("month") or today.month)
            if not 1 <= month <= 12:
                raise ValueError
        except ValueError:
            return Response({"detail": "year/month noto'g'ri"}, status=status.HTTP_400_BAD_REQUEST)

        reminded = set()
        if request.user.is_authenticated:
            reminded = set(ReportReminder.objects.filter(user=request.user).values_list("report_id", flat=True))

        items = []
        shift = shift_enabled()
        for report in ReportList.objects.filter(is_active=True).prefetch_related("deadline_overrides"):
            for day in occurrences_in_month(report, year, month, shift=shift):
                items.append({
                    "report_id": report.id,
                    "date": day.isoformat(),
                    "type_uz": clean_excel_text(report.type_uz or report.type),
                    "formsname_uz": clean_excel_text(report.formsname_uz or report.formsname),
                    "srok_uz": clean_excel_text(report.srok_uz),
                    "report_type": report.report_type,
                    "reminded": report.id in reminded,
                })
        items.sort(key=lambda x: (x["date"], x["type_uz"]))
        return Response({"year": year, "month": month, "items": items})


class ReportReminderAPIView(APIView):
    """POST/DELETE reportlist/<id>/remind/ — eslatmani yoqish/o'chirish."""
    permission_classes = [IsAuthenticated]

    def post(self, request, report_id):
        report = ReportList.objects.filter(pk=report_id, is_active=True).first()
        if report is None:
            return Response({"detail": "Hisobot topilmadi"}, status=status.HTTP_404_NOT_FOUND)
        reminder, _ = ReportReminder.objects.get_or_create(user=request.user, report=report)
        days_before = request.data.get("days_before") if hasattr(request, "data") else None
        if days_before is not None:  # K-05: muddatdan necha kun oldin eslatish (1..30)
            try:
                reminder.days_before = max(1, min(30, int(days_before)))
            except (TypeError, ValueError):
                return Response({"detail": "days_before 1..30 oralig'ida bo'lishi kerak"}, status=status.HTTP_400_BAD_REQUEST)
            reminder.save(update_fields=["days_before"])
        nxt = next_occurrence(report, date.today())
        return Response({"report_id": report.id, "reminded": True, "next_deadline": nxt.isoformat() if nxt else None,
                         "days_before": reminder.days_before}, status=status.HTTP_201_CREATED)

    def delete(self, request, report_id):
        ReportReminder.objects.filter(user=request.user, report_id=report_id).delete()
        return Response({"report_id": report_id, "reminded": False})
