"""FQ-01 ochiq API (401/429, CSV BOM, kalit faqat bir marta) va A-02 obunalar."""
from datetime import date
from decimal import Decimal
from unittest.mock import patch

from django.test import override_settings
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.additional_services.models.priceindex_model import PriceIndex
from apps.notifications.models import IndicatorSubscription, IndicatorUpdateEvent, Notification
from apps.notifications.subscriptions import dispatch_event
from apps.notifications.tasks import dispatch_indicator_updates

from .models import ApiKey, ApiUsage, hash_key


class OpenApiTests(APITestCase):
    url = "/api/open/v1/cpi/"

    def setUp(self):
        self.user = User.objects.create_user(username="researcher", password="x")
        PriceIndex.objects.create(id="1", year=date(2025, 1, 1), values=Decimal("101"))
        self.key, self.raw = ApiKey.generate(self.user, "t", daily_limit=3)

    def test_no_key_and_bad_key_401(self):
        self.assertEqual(self.client.get(self.url).status_code, 401)
        self.assertEqual(self.client.get(self.url, HTTP_X_API_KEY="ms_wrong").status_code, 401)
        self.key.is_active = False
        self.key.save()
        self.assertEqual(self.client.get(self.url, HTTP_X_API_KEY=self.raw).status_code, 401)

    def test_daily_limit_429_and_usage_counted(self):
        for _ in range(3):
            self.assertEqual(self.client.get(self.url, HTTP_X_API_KEY=self.raw).status_code, 200)
        self.assertEqual(self.client.get(self.url, HTTP_X_API_KEY=self.raw).status_code, 429)
        self.assertEqual(ApiUsage.objects.get(api_key=self.key).requests, 3)

    def test_csv_has_bom_and_source(self):
        r = self.client.get(self.url, {"format": "csv"}, HTTP_X_API_KEY=self.raw)
        self.assertEqual(r.status_code, 200)
        self.assertTrue(r.content.startswith("﻿".encode()))
        self.assertIn(b"month,mom,index", r.content)
        self.assertIn("attachment", r["Content-Disposition"])

    def test_key_stored_only_as_hash_and_shown_once(self):
        self.assertNotIn(self.raw, str(ApiKey.objects.values_list()))
        self.assertEqual(self.key.key_hash, hash_key(self.raw))
        self.client.force_authenticate(self.user)
        created = self.client.post("/api/open/keys/", {"name": "yangi"}, format="json").data
        self.assertTrue(created["key"].startswith("ms_"))
        listed = self.client.get("/api/open/keys/").data
        self.assertNotIn(created["key"], str(listed))
        self.assertEqual(self.client.delete(f"/api/open/keys/{created['id']}/").status_code, 204)
        other = User.objects.create_user(username="other_r", password="x")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.delete(f"/api/open/keys/{self.key.id}/").status_code, 404)

    def test_usage_chart_30_days(self):
        self.client.get(self.url, HTTP_X_API_KEY=self.raw)
        self.client.force_authenticate(self.user)
        data = self.client.get(f"/api/open/keys/{self.key.id}/").data
        self.assertEqual(len(data["usage"]), 30)
        self.assertEqual(data["usage"][-1]["requests"], 1)


class SubscriptionTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="sub_user", password="x", email="sub@example.com")

    def test_subscribe_unsubscribe_and_inapp_dispatch(self):
        self.client.force_authenticate(self.user)
        r = self.client.post("/api/notifications/subscriptions/", {"indicator": "cpi", "channel": "in_app"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(self.client.post("/api/notifications/subscriptions/", {"indicator": "bad"}, format="json").status_code, 400)
        PriceIndex.objects.create(id="9", year=date(2025, 10, 1), values=Decimal("100.5"))  # signal -> hodisa
        self.assertEqual(IndicatorUpdateEvent.objects.filter(indicator="cpi").count(), 1)
        self.assertEqual(dispatch_indicator_updates(), 1)
        self.assertEqual(dispatch_indicator_updates(), 0)  # qayta yuborilmaydi
        self.assertEqual(Notification.objects.filter(recipient=self.user).count(), 1)
        self.assertEqual(self.client.delete(f"/api/notifications/subscriptions/{r.data['id']}/").status_code, 204)

    @override_settings(TELEGRAM_BOT_TOKEN="", EMAIL_HOST="", EMAIL_BACKEND="django.core.mail.backends.smtp.EmailBackend")
    def test_unconfigured_channels_are_skipped_silently(self):
        IndicatorSubscription.objects.create(user=self.user, indicator="trade", channel="telegram")
        IndicatorSubscription.objects.create(user=self.user, indicator="trade", channel="email")
        event = IndicatorUpdateEvent.objects.create(indicator="trade", title="T", date=date(2026, 1, 1))
        with patch("apps.common.utils.send_message") as tg, patch("apps.notifications.subscriptions.send_mail") as mail:
            self.assertEqual(dispatch_event(event), 0)
        tg.assert_not_called()
        mail.assert_not_called()
        self.assertIsNotNone(event.dispatched_at)

    def test_region_event_reaches_general_and_specific_subscribers(self):
        other = User.objects.create_user(username="sub2", password="x")
        IndicatorSubscription.objects.create(user=self.user, indicator="region", channel="in_app")
        IndicatorSubscription.objects.create(user=other, indicator="region:5", channel="in_app")
        IndicatorSubscription.objects.create(user=other, indicator="region:7", channel="in_app")
        self.assertEqual(dispatch_event(IndicatorUpdateEvent.objects.create(indicator="region:5", title="R", date=date(2026, 1, 1))), 2)
