"""A-03: konsultatsiya — konsultantlar, bo'sh slotlar, band qilish, bekor qilish, baholash, konsultant jadvali.

OS-17 default: faqat korxonalar (yuridik shaxs) band qiladi; 24 soatdan oldin bekor qilinsa limit qaytariladi.
Onlayn to'lov yo'q: paket limiti (slug "consultation", OS-14) bo'lsa sarflanadi.
"""
from datetime import datetime, time, timedelta

from django.contrib.contenttypes.models import ContentType
from django.db import IntegrityError, transaction
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.notifications.models import Notification
from apps.services.limits import consume

from .models import Consultant, ConsultationBooking, ConsultationSlot

CONSULTATION_SLUG = "consultation"
FREE_CANCEL_HOURS = 24


def _notify(user, title, message, obj):
    Notification.objects.create(recipient=user, title=title, message=message, notification_type="info",
                                content_type=ContentType.objects.get_for_model(obj), object_id=obj.pk)


def _consultant_json(c):
    return {"id": c.id, "name": c.user.full_name, "title": c.title, "bio": c.bio_uz,
            "photo": c.photo.url if c.photo else None,
            "topics": [{"id": s.id, "name": s.name_uz} for s in c.topics.all()]}


class ConsultantListView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        now = timezone.now()
        qs = Consultant.objects.filter(is_active=True).select_related("user").prefetch_related("topics")
        result = []
        for c in qs:
            item = _consultant_json(c)
            item["free_slots"] = c.slots.filter(is_booked=False, starts_at__gt=now).count()
            result.append(item)
        return Response(result)


class SlotListView(APIView):
    """GET /api/consultations/<id>/slots/?days=14 — bo'sh slotlar kunlar bo'yicha."""
    permission_classes = (AllowAny,)

    def get(self, request, pk):
        consultant = get_object_or_404(Consultant, pk=pk, is_active=True)
        days = max(1, min(int(request.query_params.get("days") or 14), 60))
        now = timezone.now()
        slots = consultant.slots.filter(is_booked=False, starts_at__gt=now, starts_at__lt=now + timedelta(days=days))
        return Response({"consultant": _consultant_json(consultant), "slots": [
            {"id": s.id, "starts_at": s.starts_at, "duration_min": s.duration_min, "format": s.format} for s in slots]})


class BookingSerializer(serializers.ModelSerializer):
    consultant = serializers.CharField(source="slot.consultant.user.full_name", read_only=True)
    starts_at = serializers.DateTimeField(source="slot.starts_at", read_only=True)
    duration_min = serializers.IntegerField(source="slot.duration_min", read_only=True)
    format = serializers.CharField(source="slot.format", read_only=True)
    client = serializers.CharField(source="user.full_name", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = ConsultationBooking
        fields = ("id", "consultant", "client", "starts_at", "duration_min", "format", "topic", "question", "status",
                  "status_label", "meeting_url", "note", "rating", "rating_comment", "created_at")


class BookView(APIView):
    """POST /api/consultations/book/ {slot, topic, question}"""
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        if request.user.user_type != "legal_entity" and not request.user.is_staff:
            return Response({"detail": "Konsultatsiya hozircha faqat korxonalar uchun (OS-17).", "code": "legal_only"}, status=403)
        topic = (request.data.get("topic") or "").strip()[:200]
        if not topic:
            return Response({"detail": "Mavzuni kiriting"}, status=400)
        try:
            with transaction.atomic():
                slot = ConsultationSlot.objects.select_for_update().filter(pk=request.data.get("slot")).first()
                if slot is None or slot.starts_at <= timezone.now():
                    return Response({"detail": "Slot topilmadi yoki o'tib ketgan"}, status=404)
                if slot.is_booked:
                    return Response({"detail": "Bu vaqt band qilingan. Boshqa vaqtni tanlang."}, status=409)
                usage = consume(request.user, CONSULTATION_SLUG, {"slot": slot.id})
                limit_use_id = usage.get("use_id")
                booking = ConsultationBooking.objects.create(slot=slot, user=request.user, topic=topic,
                                                             question=(request.data.get("question") or "")[:4000],
                                                             limit_use_id=limit_use_id)
                slot.is_booked = True
                slot.save(update_fields=["is_booked"])
        except IntegrityError:
            return Response({"detail": "Bu vaqt band qilingan. Boshqa vaqtni tanlang."}, status=409)
        _notify(slot.consultant.user, "Yangi konsultatsiya", f"{slot.starts_at:%d.%m %H:%M} — {topic}", booking)
        return Response(BookingSerializer(booking).data, status=status.HTTP_201_CREATED)


class MyBookingsView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        qs = ConsultationBooking.objects.filter(user=request.user).select_related("slot__consultant__user", "user")
        return Response(BookingSerializer(qs, many=True).data)


class BookingDetailView(APIView):
    """DELETE — bekor qilish (24 soatdan oldin limit qaytadi); PATCH {rating, rating_comment} — o'tgan konsultatsiyani baholash."""
    permission_classes = (IsAuthenticated,)

    def delete(self, request, pk):
        with transaction.atomic():
            booking = get_object_or_404(ConsultationBooking.objects.select_for_update().select_related("slot"),
                                        pk=pk, user=request.user, status="booked")
            refunded = booking.slot.starts_at - timezone.now() >= timedelta(hours=FREE_CANCEL_HOURS)
            if refunded and booking.limit_use_id:
                use = booking.limit_use
                booking.limit_use = None
                # BaseModel.delete() yumshoq (is_active=False), limit esa barcha yozuvlarni sanaydi — shuning uchun hard_delete
                use.hard_delete()
            booking.status, booking.cancelled_at = "cancelled", timezone.now()
            booking.save(update_fields=["status", "cancelled_at", "limit_use"])
            booking.slot.is_booked = False
            booking.slot.save(update_fields=["is_booked"])
        _notify(booking.slot.consultant.user, "Konsultatsiya bekor qilindi", f"{booking.slot.starts_at:%d.%m %H:%M}", booking)
        return Response({"cancelled": True, "limit_refunded": refunded})

    def patch(self, request, pk):
        booking = get_object_or_404(ConsultationBooking, pk=pk, user=request.user)
        if booking.status != "done":
            return Response({"detail": "Faqat o'tgan konsultatsiya baholanadi."}, status=400)
        try:
            rating = int(request.data.get("rating"))
        except (TypeError, ValueError):
            return Response({"detail": "Baho 1..5"}, status=400)
        if not 1 <= rating <= 5:
            return Response({"detail": "Baho 1..5"}, status=400)
        booking.rating, booking.rating_comment = rating, (request.data.get("rating_comment") or "")[:2000]
        booking.save(update_fields=["rating", "rating_comment"])
        return Response(BookingSerializer(booking).data)


class ScheduleView(APIView):
    """Konsultant: GET — mening jadvalim (slotlar va band qilishlar); POST — takrorlanuvchi slotlar qo'shish.

    POST {weekdays: [0..6], start: "10:00", end: "17:00", duration_min: 45, weeks: 4, format: "online"}
    """
    permission_classes = (IsAuthenticated,)

    def _consultant(self, request):
        return Consultant.objects.filter(user=request.user).first()

    def get(self, request):
        c = self._consultant(request)
        if c is None:
            return Response({"detail": "Siz konsultant emassiz."}, status=403)
        now = timezone.now()
        slots = c.slots.filter(starts_at__gte=now - timedelta(days=7))[:300]
        bookings = ConsultationBooking.objects.filter(slot__consultant=c).select_related("slot", "user").order_by("slot__starts_at")
        return Response({"consultant": _consultant_json(c),
                         "slots": [{"id": s.id, "starts_at": s.starts_at, "duration_min": s.duration_min, "format": s.format,
                                    "is_booked": s.is_booked} for s in slots],
                         "bookings": BookingSerializer(bookings, many=True).data})

    def post(self, request):
        c = self._consultant(request)
        if c is None:
            return Response({"detail": "Siz konsultant emassiz."}, status=403)
        try:
            weekdays = {int(d) for d in request.data.get("weekdays", [0, 1, 2, 3, 4]) if 0 <= int(d) <= 6}
            start = time.fromisoformat(request.data.get("start", "10:00"))
            end = time.fromisoformat(request.data.get("end", "17:00"))
            duration = max(15, min(int(request.data.get("duration_min", 45)), 180))
            weeks = max(1, min(int(request.data.get("weeks", 4)), 12))
        except (TypeError, ValueError):
            return Response({"detail": "Parametrlar noto'g'ri"}, status=400)
        fmt = request.data.get("format") if request.data.get("format") in ("online", "office") else "online"
        tz = timezone.get_current_timezone()
        today = timezone.localdate()
        created = 0
        for d in range(weeks * 7):
            day = today + timedelta(days=d + 1)
            if day.weekday() not in weekdays:
                continue
            t = datetime.combine(day, start)
            while (t + timedelta(minutes=duration)).time() <= end and t.date() == day:
                _, made = ConsultationSlot.objects.get_or_create(consultant=c, starts_at=timezone.make_aware(t, tz),
                                                                 defaults={"duration_min": duration, "format": fmt})
                created += made
                t += timedelta(minutes=duration + 15)
        return Response({"created": created}, status=201)


class ScheduleBookingView(APIView):
    """Konsultant: PATCH /api/consultations/schedule/bookings/<id>/ {meeting_url, note, status: done}"""
    permission_classes = (IsAuthenticated,)

    def patch(self, request, pk):
        booking = get_object_or_404(ConsultationBooking.objects.select_related("slot__consultant"), pk=pk,
                                    slot__consultant__user=request.user)
        changed = []
        if "meeting_url" in request.data:
            booking.meeting_url = (request.data.get("meeting_url") or "")[:200]
            changed.append("meeting_url")
        if "note" in request.data:
            booking.note = (request.data.get("note") or "")[:4000]
            changed.append("note")
        if request.data.get("status") == "done" and booking.status == "booked":
            booking.status = "done"
            changed.append("status")
        booking.save(update_fields=changed or None)
        if "meeting_url" in changed and booking.meeting_url:
            _notify(booking.user, "Konsultatsiya havolasi", f"{booking.slot.starts_at:%d.%m %H:%M}: {booking.meeting_url}", booking)
        return Response(BookingSerializer(booking).data)
