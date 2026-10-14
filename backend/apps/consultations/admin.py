from django.contrib import admin

from .models import Consultant, ConsultationBooking, ConsultationSlot


@admin.register(Consultant)
class ConsultantAdmin(admin.ModelAdmin):
    list_display = ("user", "title", "is_active")
    raw_id_fields = ("user",)
    filter_horizontal = ("topics",)


@admin.register(ConsultationSlot)
class ConsultationSlotAdmin(admin.ModelAdmin):
    list_display = ("consultant", "starts_at", "duration_min", "format", "is_booked")
    list_filter = ("consultant", "is_booked", "format")


@admin.register(ConsultationBooking)
class ConsultationBookingAdmin(admin.ModelAdmin):
    list_display = ("slot", "user", "topic", "status", "rating", "created_at")
    list_filter = ("status",)
    raw_id_fields = ("user", "slot", "limit_use")
