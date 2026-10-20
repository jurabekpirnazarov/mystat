"""JAHON_TAJRIBASI JT-10, JT-17, JT-02: ochiq API (public.py).

GET /api/common/map/releases/            — e'lonlar kalendari (yaqin 12 oy va oxirgi 4 oy)
GET /api/common/map/releases.ics         — shu kalendar iCal ko'rinishida (obuna uchun)
GET /api/common/map/dashboards/          — mavzuli panellar va aholi soati
GET /api/common/map/card/<key>/          — bitta ko'rsatkich (JT-15 embed)
"""
from django.conf import settings
from django.http import Http404, HttpResponse
from django.utils import timezone
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .public import build_dashboards, build_release_calendar, indicator_card, release_calendar_ics
from .views import SOURCE, _cached, _lang


def _calendar(lang):
    today = timezone.localdate()
    return _cached(f"releases:{today}:{lang}", lambda: build_release_calendar(lang, today))


class ReleaseCalendarView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        return Response({**_calendar(_lang(request)), "source": SOURCE})


class ReleaseCalendarIcsView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        body = release_calendar_ics(_calendar(_lang(request)), settings.SITE_URL.rstrip("/"))
        response = HttpResponse(body, content_type="text/calendar; charset=utf-8")
        response["Content-Disposition"] = 'attachment; filename="mystat-elonlar.ics"'
        return response


class DashboardsView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        lang = _lang(request)
        return Response({**_cached(f"dashboards:{lang}", lambda: build_dashboards(lang)), "source": SOURCE})


class IndicatorCardView(APIView):
    """GET /api/common/map/card/<key>/ — JT-15 embed: respublika darajasidagi qator."""
    permission_classes = (AllowAny,)

    def get(self, request, key):
        lang = _lang(request)
        data = _cached(f"card:{key}:{lang}", lambda: indicator_card(key, lang) or {})
        if not data:
            raise Http404("Ko'rsatkich topilmadi")
        return Response({**data, "source": SOURCE})
