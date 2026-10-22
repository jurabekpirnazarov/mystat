"""
BOSH_SAHIFA_VIDJETLAR 5.2: ob-havo. Brauzer provayderga murojaat qilmaydi — backend hudud markazi koordinatasi bilan
Open-Meteo'dan oladi (kalitsiz, CC BY 4.0), o'z `code` lug'atiga moslaydi va 30 daqiqa keshlaydi.
Provayder ishlamasa oxirgi keshdagi qiymat `stale: true` bilan qaytadi; umuman yo'q bo'lsa 503.
"""
import logging

import requests
from django.core.cache import cache
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

logger = logging.getLogger(__name__)

CACHE_SECONDS = 30 * 60
STALE_SECONDS = 24 * 60 * 60
TIMEOUT = 5
PROVIDER_URL = "https://api.open-meteo.com/v1/forecast"

# SOATO -> (shahar, kenglik, uzunlik). 1700 — Respublika (Toshkent)
CITIES = {
    "1700": ("Toshkent", 41.31, 69.28),
    "1735": ("Nukus", 42.46, 59.60),
    "1703": ("Andijon", 40.78, 72.34),
    "1706": ("Buxoro", 39.77, 64.42),
    "1708": ("Jizzax", 40.12, 67.84),
    "1710": ("Qarshi", 38.86, 65.79),
    "1712": ("Navoiy", 40.10, 65.38),
    "1714": ("Namangan", 41.00, 71.67),
    "1718": ("Samarqand", 39.65, 66.96),
    "1722": ("Termiz", 37.22, 67.28),
    "1724": ("Guliston", 40.49, 68.78),
    "1726": ("Toshkent", 41.31, 69.28),
    "1727": ("Nurafshon", 41.04, 69.36),
    "1730": ("Farg'ona", 40.39, 71.78),
    "1733": ("Urganch", 41.55, 60.63),
}


def wmo_to_code(wmo):
    """WMO kodi -> o'z lug'atimiz (frontend provayderni bilmaydi)."""
    if wmo is None:
        return "cloudy"
    if wmo == 0:
        return "clear"
    if wmo in (1, 2):
        return "partly_cloudy"
    if wmo == 3:
        return "cloudy"
    if wmo in (45, 48):
        return "fog"
    if wmo in (51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82):
        return "rain"
    if wmo in (71, 73, 75, 77, 85, 86):
        return "snow"
    if wmo in (95, 96, 99):
        return "thunderstorm"
    return "cloudy"


def fetch_from_provider(lat, lon):
    r = requests.get(
        PROVIDER_URL,
        params={
            "latitude": lat, "longitude": lon, "timezone": "Asia/Tashkent", "wind_speed_unit": "ms", "forecast_days": 4,
            "current": "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m",
            "daily": "weather_code,temperature_2m_max,temperature_2m_min",
        },
        timeout=TIMEOUT,
    )
    r.raise_for_status()
    return r.json()


def build_payload(soato, raw):
    city = CITIES[soato][0]
    cur, daily = raw["current"], raw["daily"]
    return {
        "city": city,
        "soato": soato,
        "observed_at": cur["time"],
        "current": {
            "temp": round(cur["temperature_2m"], 1),
            "feels_like": round(cur["apparent_temperature"], 1),
            "code": wmo_to_code(cur.get("weather_code")),
            "wind_ms": round(cur["wind_speed_10m"], 1),
            "humidity": round(cur["relative_humidity_2m"]),
        },
        # bugundan keyingi 3 kun
        "daily": [
            {"date": d, "code": wmo_to_code(c), "t_max": round(mx), "t_min": round(mn)}
            for d, c, mx, mn in list(zip(daily["time"], daily["weather_code"], daily["temperature_2m_max"], daily["temperature_2m_min"]))[1:4]
        ],
        "source": {"name": "Open-Meteo", "url": "https://open-meteo.com/", "license": "CC BY 4.0"},
        "stale": False,
    }


class WeatherAPIView(APIView):
    """GET /api/common/weather/?region=1735 — tanlangan hudud markazi ob-havosi (ochiq)."""

    authentication_classes: list = []
    permission_classes: list = []

    def get(self, request):
        soato = request.query_params.get("region", "1700")
        if soato not in CITIES:
            return Response({"detail": "Noma'lum hudud"}, status=status.HTTP_400_BAD_REQUEST)
        key = f"weather:{soato}"
        fresh = cache.get(key)
        if fresh:
            return Response(fresh)
        _, lat, lon = CITIES[soato]
        try:
            payload = build_payload(soato, fetch_from_provider(lat, lon))
        except Exception:  # provayder, tarmoq yoki javob tuzilishi — bitta vidjet xatosi sahifani to'xtatmasin
            logger.warning("Ob-havo provayderi javob bermadi: %s", soato, exc_info=True)
            stale = cache.get(f"{key}:last")
            if stale:
                return Response({**stale, "stale": True})
            return Response({"detail": "Ob-havo hozircha mavjud emas"}, status=status.HTTP_503_SERVICE_UNAVAILABLE)
        cache.set(key, payload, CACHE_SECONDS)
        cache.set(f"{key}:last", payload, STALE_SECONDS)
        return Response(payload)
