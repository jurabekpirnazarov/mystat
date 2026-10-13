# Register your models here.

from django.contrib import admin
from django.utils.safestring import mark_safe

from apps.payment.models import (
    Order,
    PaymentMerchantRequestLog,
    Transaction,
    TransactionStatus,
)


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ("id", "user", "service", "amount", "provider", "is_paid", "is_canceled")
    list_display_links = ("id", "user")
    list_filter = ("provider", "is_paid", "is_canceled")
    search_fields = (
        "id",
        "user__username",
        "user__email",
        "user__full_name",
        "user__phone",
        "amount",
    )


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("id", "transaction_id", "amount", "colored_status", "paid_at", "cancel_time")
    list_display_links = ("id",)
    list_filter = ("status",)
    search_fields = (
        "id",
        "transaction_id",
        "amount",
        "paid_at",
        "cancel_time",
    )

    # readonly_fields = ("id", "order", "transaction_id", "amount", "status", "paid_at", "cancel_time")

    def colored_status(self, obj):
        colors = {
            TransactionStatus.WAITING: "gray",
            TransactionStatus.PAID: "green",
            TransactionStatus.FAILED: "red",
            TransactionStatus.CANCELED: "black",
        }
        if obj.status:
            return mark_safe(f'<span style="color:{colors[obj.status]}"><b>{obj.get_status_display()}</b></span>')
        return f"{obj.status} --- null"

    colored_status.short_description = "Status"  

    def has_module_permission(self, request):
        """
        Buxgalter va superuser uchun modulni ko'rsatish
        """
        if request.user.is_superuser:
            return True

        elif hasattr(request.user, 'role') and request.user.role == "bugalter":
            return True

        return False


@admin.register(PaymentMerchantRequestLog)
class PaymentMerchantRequestLogAdmin(admin.ModelAdmin):
    list_display = ["id", "provider", "type", "response_status_code", "created_at"]
    search_fields = ["id", "body", "header", "response", "method"]
    list_filter = ["provider"]
