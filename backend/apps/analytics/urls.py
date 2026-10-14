from django.urls import path

from . import views

app_name = "analytics"

urlpatterns = [
    path("benchmark/", views.BenchmarkView.as_view(), name="benchmark"),
    path("benchmark/status/", views.BenchmarkStatusView.as_view(), name="benchmark-status"),
]
