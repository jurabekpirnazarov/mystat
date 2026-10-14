"""A-03: band qilish, ikki marta band qilish mumkin emasligi, bekor qilish qoidasi, eslatmalar, jadval."""
from datetime import timedelta

from django.utils import timezone
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.common.models import District, Region
from apps.notifications.models import Notification
from apps.services.models import (PackageService, PackageServiceItem, ServicePackage, UserServicePackage,
                                  UserServicePackageItemUse)

from .models import Consultant, ConsultationBooking, ConsultationSlot
from .tasks import consultation_reminders


class ConsultationTests(APITestCase):
    def setUp(self):
        self.c_user = User.objects.create_user(username="cons", password="x", role="employee")
        self.consultant = Consultant.objects.create(user=self.c_user, title="T")
        self.slot = ConsultationSlot.objects.create(consultant=self.consultant, starts_at=timezone.now() + timedelta(days=3))
        self.near = ConsultationSlot.objects.create(consultant=self.consultant, starts_at=timezone.now() + timedelta(hours=5))
        self.a = User.objects.create_user(username="biz_a", password="x", user_type="legal_entity")
        self.b = User.objects.create_user(username="biz_b", password="x", user_type="legal_entity")

    def _book(self, user, slot):
        self.client.force_authenticate(user)
        return self.client.post("/api/consultations/book/", {"slot": slot.id, "topic": "Hisobot"}, format="json")

    def test_slot_cannot_be_booked_twice(self):
        self.assertEqual(self._book(self.a, self.slot).status_code, 201)
        self.assertEqual(self._book(self.b, self.slot).status_code, 409)
        self.assertEqual(ConsultationBooking.objects.filter(slot=self.slot, status="booked").count(), 1)
        self.assertEqual(Notification.objects.filter(recipient=self.c_user).count(), 1)

    def test_citizen_cannot_book(self):
        citizen = User.objects.create_user(username="cit", password="x", user_type="individual")
        r = self._book(citizen, self.slot)
        self.assertEqual(r.status_code, 403)
        self.assertEqual(r.data["code"], "legal_only")

    def _with_limit(self, user, limit=2):
        region = Region.objects.create(name="R", code="9901")
        package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")
        ps = PackageService.objects.create(name_uz="K", name_ru="K", name_cry="K", slug="consultation")
        PackageServiceItem.objects.create(package=package, package_service=ps, name_uz="K", name_ru="K", name_cry="K", limit=limit)
        UserServicePackage.objects.create(district=District.objects.create(name="D", region=region, code="1"),
                                          year=2026, month=1, service=package, created_by_user=user)

    def test_cancel_more_than_24h_refunds_limit_and_frees_slot(self):
        self._with_limit(self.a)
        booking_id = self._book(self.a, self.slot).data["id"]
        self.assertEqual(UserServicePackageItemUse.objects.count(), 1)
        r = self.client.delete(f"/api/consultations/my/{booking_id}/")
        self.assertTrue(r.data["limit_refunded"])
        self.assertEqual(UserServicePackageItemUse.objects.count(), 0)
        self.slot.refresh_from_db()
        self.assertFalse(self.slot.is_booked)
        self.assertEqual(self._book(self.a, self.slot).status_code, 201)  # bo'shagan slot qayta band qilinadi

    def test_cancel_within_24h_keeps_limit(self):
        self._with_limit(self.a)
        booking_id = self._book(self.a, self.near).data["id"]
        r = self.client.delete(f"/api/consultations/my/{booking_id}/")
        self.assertFalse(r.data["limit_refunded"])
        self.assertEqual(UserServicePackageItemUse.objects.count(), 1)

    def test_limit_exhausted(self):
        self._with_limit(self.a, limit=1)
        self.assertEqual(self._book(self.a, self.slot).status_code, 201)
        r = self._book(self.a, self.near)
        self.assertEqual(r.status_code, 403)
        self.assertEqual(r.data["upgrade_url"], "/services")

    def test_reminders_and_rating(self):
        booking_id = self._book(self.a, self.near).data["id"]
        self.assertEqual(consultation_reminders(), 2)  # 24 soatlik oyna: mijoz va konsultant
        self.assertEqual(consultation_reminders(), 0)
        self.assertEqual(consultation_reminders(now=self.near.starts_at - timedelta(minutes=30)), 2)  # 1 soatlik
        self.assertEqual(self.client.patch(f"/api/consultations/my/{booking_id}/", {"rating": 5}, format="json").status_code, 400)
        self.client.force_authenticate(self.c_user)
        self.client.patch(f"/api/consultations/schedule/bookings/{booking_id}/", {"status": "done", "meeting_url": "https://meet.example.com/x"}, format="json")
        self.client.force_authenticate(self.a)
        self.assertEqual(self.client.patch(f"/api/consultations/my/{booking_id}/", {"rating": 5}, format="json").data["rating"], 5)

    def test_schedule_adds_recurring_slots(self):
        self.client.force_authenticate(self.c_user)
        r = self.client.post("/api/consultations/schedule/", {"weekdays": [0], "start": "10:00", "end": "12:00", "duration_min": 45, "weeks": 2}, format="json")
        self.assertEqual(r.data["created"], 4)  # 2 hafta × (10:00, 11:00)
        self.client.force_authenticate(self.a)
        self.assertEqual(self.client.get("/api/consultations/schedule/").status_code, 403)
