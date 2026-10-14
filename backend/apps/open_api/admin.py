from django.contrib import admin

from .models import ApiKey, ApiUsage


@admin.register(ApiKey)
class ApiKeyAdmin(admin.ModelAdmin):
    list_display = ("prefix", "name", "user", "daily_limit", "is_active", "created_at", "last_used_at")
    list_filter = ("is_active",)
    raw_id_fields = ("user",)
    readonly_fields = ("prefix", "key_hash")


@admin.register(ApiUsage)
class ApiUsageAdmin(admin.ModelAdmin):
    list_display = ("api_key", "date", "endpoint", "requests")
    list_filter = ("date",)
