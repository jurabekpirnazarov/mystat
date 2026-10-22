from unittest import mock

from django.core.cache import cache
from django.test import TestCase

from apps.common import weather

RAW = {
    "current": {"time": "2026-10-22T10:30", "temperature_2m": 14.24, "apparent_temperature": 12.8, "relative_humidity_2m": 48,
                "weather_code": 2, "wind_speed_10m": 4.1},
    "daily": {"time": ["2026-10-22", "2026-10-23", "2026-10-24", "2026-10-25"], "weather_code": [0, 61, 3, 71],
              "temperature_2m_max": [18, 12.4, 15, 3], "temperature_2m_min": [8, 5, 6, -2]},
}


class WeatherTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_maps_provider_to_own_codes(self):
        with mock.patch.object(weather, "fetch_from_provider", return_value=RAW):
            data = self.client.get("/api/common/weather/?region=1735").json()
        self.assertEqual(data["city"], "Nukus")
        self.assertEqual(data["current"]["code"], "partly_cloudy")
        self.assertEqual([d["code"] for d in data["daily"]], ["rain", "cloudy", "snow"])
        self.assertNotIn("weather_code", data["current"])
        self.assertFalse(data["stale"])

    def test_second_request_uses_cache(self):
        with mock.patch.object(weather, "fetch_from_provider", return_value=RAW) as m:
            self.client.get("/api/common/weather/?region=1700")
            self.client.get("/api/common/weather/?region=1700")
        self.assertEqual(m.call_count, 1)

    def test_stale_then_503(self):
        with mock.patch.object(weather, "fetch_from_provider", side_effect=RuntimeError("down")):
            self.assertEqual(self.client.get("/api/common/weather/?region=1703").status_code, 503)
        with mock.patch.object(weather, "fetch_from_provider", return_value=RAW):
            self.client.get("/api/common/weather/?region=1703")
        cache.delete("weather:1703")  # yangi kesh tugadi, "oxirgi" qoldi
        with mock.patch.object(weather, "fetch_from_provider", side_effect=RuntimeError("down")):
            data = self.client.get("/api/common/weather/?region=1703").json()
        self.assertTrue(data["stale"])

    def test_unknown_region(self):
        self.assertEqual(self.client.get("/api/common/weather/?region=9999").status_code, 400)
