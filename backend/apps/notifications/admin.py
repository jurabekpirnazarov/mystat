from django.contrib import admin

from apps.notifications.models import Notification

# Register your models here.

admin.site.register(Notification)

from apps.notifications.models import IndicatorSubscription, IndicatorUpdateEvent  # noqa: E402  (A-02)


@admin.register(IndicatorSubscription)
class IndicatorSubscriptionAdmin(admin.ModelAdmin):
    list_display = ("user", "indicator", "channel", "is_active", "created_at")
    list_filter = ("channel", "is_active")
    raw_id_fields = ("user",)


@admin.action(description="Obunachilarga hozir yuborish")
def send_now(modeladmin, request, queryset):
    from apps.notifications.subscriptions import dispatch_event
    total = sum(dispatch_event(event) for event in queryset)
    modeladmin.message_user(request, f"{total} ta xabar yuborildi")


@admin.register(IndicatorUpdateEvent)
class IndicatorUpdateEventAdmin(admin.ModelAdmin):
    list_display = ("indicator", "title", "date", "dispatched_at", "recipients")
    list_filter = ("indicator",)
    actions = [send_now]
