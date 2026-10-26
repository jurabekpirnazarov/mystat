"""YF-02: kalendarga doimiy obuna (maxfiy `.ics` havola) va HT-06: eslatma sozlamasi."""
import datetime as dt
import secrets

from django.http import HttpResponse
from django.utils import timezone
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.deadlines import deadlines_for
from apps.additional_services.models import CalendarFeedToken, KtutReportList, ReportReminderPreference
from apps.common.text import clean_excel_text


def _esc(text):
    return (text or "").replace("\\", "\\\\").replace(";", "\;").replace(",", "\,").replace("\n", "\n")


def feed_ics(user, today=None):
    """Foydalanuvchi korxonasi shakllarining muddatlari (joriy va keyingi yil). Ichida faqat shakl kodi, nomi,
    davr va muddat; korxona nomi yo'q."""
    today = today or timezone.localdate()
    org = getattr(user, "organization", None)
    stamp = timezone.now().strftime("%Y%m%dT%H%M%SZ")
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//my.stat.uz//Hisobot muddatlari//UZ", "CALSCALE:GREGORIAN",
             "X-WR-CALNAME:my.stat.uz — hisobot muddatlari", "X-WR-TIMEZONE:Asia/Tashkent"]
    if org is not None:
        links = KtutReportList.objects.filter(ktut__inn=org.tin).select_related("reportlist")
        for link in links:
            report = link.reportlist
            if not report.is_active:
                continue
            name = clean_excel_text(report.type_uz or report.type)
            for year in (today.year, today.year + 1):
                for row in deadlines_for(report, year):
                    day = row["due"].strftime("%Y%m%d")
                    nxt = (row["due"] + dt.timedelta(days=1)).strftime("%Y%m%d")
                    summary = f"Hisobot muddati: {name}" + (f" ({row['period_label']})" if row["period_label"] else "")
                    lines += ["BEGIN:VEVENT", f"UID:{report.id}-{row['period'] or day}-{day}@my.stat.uz", f"DTSTAMP:{stamp}",
                              f"DTSTART;VALUE=DATE:{day}", f"DTEND;VALUE=DATE:{nxt}", f"SUMMARY:{_esc(summary)}",
                              f"DESCRIPTION:{_esc(clean_excel_text(report.formsname_uz or report.formsname))}",
                              "END:VEVENT"]
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


def _url(request, token):
    return request.build_absolute_uri(f"/api/additional-services/calendar/{token}.ics")


class CalendarFeedAPIView(APIView):
    """GET holat · POST yaratish/qayta yaratish · DELETE o'chirish."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        obj = CalendarFeedToken.objects.filter(user=request.user).first()
        return Response({"enabled": obj is not None, "url": _url(request, obj.token) if obj else None})

    def post(self, request):
        obj, _ = CalendarFeedToken.objects.get_or_create(user=request.user, defaults={"token": secrets.token_urlsafe(32)})
        if request.data.get("regenerate"):
            obj.token = secrets.token_urlsafe(32)
            obj.save(update_fields=["token"])
        return Response({"enabled": True, "url": _url(request, obj.token)})

    def delete(self, request):
        CalendarFeedToken.objects.filter(user=request.user).delete()
        return Response({"enabled": False, "url": None})


class CalendarFeedIcsView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def get(self, request, token):
        obj = CalendarFeedToken.objects.select_related("user").filter(token=token).first()
        if obj is None:
            return HttpResponse(status=404)
        resp = HttpResponse(feed_ics(obj.user), content_type="text/calendar; charset=utf-8")
        resp["Cache-Control"] = "private, max-age=3600"
        return resp


class ReminderPreferenceAPIView(APIView):
    """HT-06: standart eslatmalarni yoqish/o'chirish."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        pref = ReportReminderPreference.objects.filter(user=request.user).first()
        return Response({"enabled": pref.enabled if pref else True})

    def put(self, request):
        pref, _ = ReportReminderPreference.objects.get_or_create(user=request.user)
        pref.enabled = bool(request.data.get("enabled", True))
        pref.save(update_fields=["enabled"])
        return Response({"enabled": pref.enabled})
