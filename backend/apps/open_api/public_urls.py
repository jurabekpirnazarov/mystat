"""Ochiq API hujjati uchun alohida urlconf (faqat /api/open/v1/ endpoint'lari)."""
from django.urls import include, path

urlpatterns = [path("api/open/", include(("apps.open_api.urls_public_only", "open_api_public")))]
