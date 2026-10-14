"""Hisobot kalendari: oy ko'rinishi va eslatmalar (U-13).

Bazadagi `ReportList.deadline` bitta aniq sana (masalan 2025-yil). Kalendar uchun u `report_type`
bo'yicha takrorlanadi: oylik — har oy shu kuni, choraklik — har 3 oyda, yillik — har yili shu sanada.
"""
import calendar
from datetime import date

from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models import ReportList, ReportReminder


def _safe_date(year, month, day):
    return date(year, month, min(day, calendar.monthrange(year, month)[1]))


def occurrences_in_month(report, year, month):
    d = report.deadline
    if d is None:
        return []
    kind = report.report_type
    if kind == "monthly":
        return [_safe_date(year, month, d.day)]
    if kind == "quarterly":
        return [_safe_date(year, month, d.day)] if (month - d.month) % 3 == 0 else []
    if kind == "yearly":
        return [_safe_date(year, month, d.day)] if month == d.month else []
    return [d] if (d.year, d.month) == (year, month) else []


def next_occurrence(report, today):
    """Bugundan boshlab eng yaqin muddat (24 oy ichida)."""
    year, month = today.year, today.month
    for _ in range(24):
        for day in occurrences_in_month(report, year, month):
            if day >= today:
                return day
        month += 1
        if month > 12:
            year, month = year + 1, 1
    return None


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
        for report in ReportList.objects.filter(is_active=True, deadline__isnull=False):
            for day in occurrences_in_month(report, year, month):
                items.append({
                    "report_id": report.id,
                    "date": day.isoformat(),
                    "type_uz": report.type_uz or report.type,
                    "formsname_uz": report.formsname_uz or report.formsname,
                    "srok_uz": report.srok_uz,
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
        nxt = next_occurrence(report, date.today())
        return Response({"report_id": report.id, "reminded": True, "next_deadline": nxt.isoformat() if nxt else None,
                         "days_before": reminder.days_before}, status=status.HTTP_201_CREATED)

    def delete(self, request, report_id):
        ReportReminder.objects.filter(user=request.user, report_id=report_id).delete()
        return Response({"report_id": report_id, "reminded": False})
