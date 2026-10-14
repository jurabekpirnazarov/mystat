from django.urls import path
from drf_spectacular.views import SpectacularAPIView, SpectacularSwaggerView

from . import views

app_name = "open_api"

public = [
    path("v1/cpi/", views.CpiView.as_view(), name="cpi"),
    path("v1/trade/summary/", views.TradeSummaryView.as_view(), name="trade-summary"),
    path("v1/regions/indicators/", views.RegionIndicatorsView.as_view(), name="region-indicators"),
    path("v1/classifications/", views.ClassificationsView.as_view(), name="classifications"),
    path("v1/reports/forms/", views.ReportFormsView.as_view(), name="report-forms"),
    path("v1/demographics/<slug:slug>/", views.DemographicsView.as_view(), name="demographics"),
]

urlpatterns = public + [
    # Faqat ochiq API uchun alohida hujjat (asosiy /api/docs/ dan mustaqil)
    path("schema/", SpectacularAPIView.as_view(urlconf="apps.open_api.public_urls",
                                               custom_settings={"TITLE": "my.stat.uz ochiq ma'lumotlar API", "VERSION": "1.0",
                                                                "DESCRIPTION": "Kalit: kabinetda yarating, `X-API-Key` sarlavhasida yuboring. Kunlik limit — 1000 so'rov."}),
         name="schema"),
    path("docs/", SpectacularSwaggerView.as_view(url_name="open_api:schema"), name="docs"),
    path("keys/", views.MyKeysView.as_view(), name="my-keys"),
    path("keys/<int:pk>/", views.MyKeyDetailView.as_view(), name="my-key-detail"),
]
