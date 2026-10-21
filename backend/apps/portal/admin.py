from django.contrib import admin
from django.db.models import Count, Q

from .models import PageFeedback, ServiceReview, ServiceReviewVote, ServiceUsage, TypoReport


@admin.register(ServiceReview)
class ServiceReviewAdmin(admin.ModelAdmin):
    list_display = ("service_number", "score", "author_name", "user", "short_comment", "is_published", "is_synthetic", "created_at")
    list_filter = ("is_published", "score", "is_synthetic")
    list_editable = ("is_published",)
    search_fields = ("comment", "author_name", "user__username")
    raw_id_fields = ("user",)

    @admin.display(description="Sharh")
    def short_comment(self, obj):
        return (obj.comment[:80] + "…") if len(obj.comment) > 80 else obj.comment


@admin.register(ServiceUsage)
class ServiceUsageAdmin(admin.ModelAdmin):
    list_display = ("service_number", "user", "created_at", "is_synthetic")
    list_filter = ("is_synthetic",)
    raw_id_fields = ("user",)
    date_hierarchy = "created_at"


@admin.register(PageFeedback)
class PageFeedbackAdmin(admin.ModelAdmin):
    """Ro'yxat ustida sahifalar bo'yicha "Ha" foizi (MG-11: admin'da sahifalar bo'yicha Ha/Yo'q foizi)."""
    list_display = ("path", "liked", "comment", "lang", "created_at")
    list_filter = ("liked", "lang")
    search_fields = ("path", "comment")
    change_list_template = "admin/portal/pagefeedback/change_list.html"

    def changelist_view(self, request, extra_context=None):
        rows = (PageFeedback.objects.values("path")
                .annotate(total=Count("id"), likes=Count("id", filter=Q(liked=True)))
                .order_by("-total")[:30])
        summary = [{**r, "percent": round(100 * r["likes"] / r["total"])} for r in rows]
        return super().changelist_view(request, extra_context={**(extra_context or {}), "summary": summary})


@admin.register(TypoReport)
class TypoReportAdmin(admin.ModelAdmin):
    list_display = ("path", "selected_text", "comment", "is_resolved", "created_at")
    list_filter = ("is_resolved",)
    list_editable = ("is_resolved",)
    search_fields = ("path", "selected_text", "comment")


@admin.register(ServiceReviewVote)
class ServiceReviewVoteAdmin(admin.ModelAdmin):
    list_display = ("review", "user", "helpful", "created_at")
    list_filter = ("helpful",)
    raw_id_fields = ("review", "user")
