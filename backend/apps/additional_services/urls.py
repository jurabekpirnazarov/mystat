from django.urls import path, include
from apps.additional_services.api_endpoints import KtutReportListAPIView, StatisticClassificationAPIView, \
    PriceIndexYearAndMonthView, KtutDetailAPIView, ReportListAPIView
from apps.additional_services.api_endpoints.IndustrialProductAPI import IndustrialProductListAPIView, IndustrialProductCategoryAPIView
from apps.additional_services.api_endpoints.PriceIndexAPI import PriceIndexAPIView
from apps.additional_services.views.service_views import SubmittedReportAPIView
from apps.additional_services.views.trade_data_views import TradeDataAPIView
from apps.additional_services.api_endpoints.StaticClassificationAPI.views import StatisticClassificationCategoryAPIView
from apps.additional_services.api_endpoints.KtutReportAPI.calendar import ReportCalendarAPIView, ReportReminderAPIView
from apps.additional_services.api_endpoints.KtutReportAPI.my_reports import MyReportsAPIView, ReportGuideAPIView

app_name = "additional_services"


urlpatterns = [
    path('external-trade/', include('apps.additional_services.api_endpoints.ExternalTradeAPI.urls')),
    path('demographics/', include('apps.additional_services.api_endpoints.DemographicsAPI.urls')),
    path('submitted-report', SubmittedReportAPIView.as_view()),
    path('price-index', PriceIndexAPIView.as_view()),
    path('statistic-classification', StatisticClassificationAPIView.as_view()),
    path('statistic-classification/categories/', StatisticClassificationCategoryAPIView.as_view(), name='statistic-classification-categories'),
    path('reportlist/calendar/', ReportCalendarAPIView.as_view(), name='reportlist-calendar'),
    path('my-reports/', MyReportsAPIView.as_view(), name='my-reports'),
    path('report-guide/<str:report_id>/', ReportGuideAPIView.as_view(), name='report-guide'),
    path('reportlist/<str:report_id>/remind/', ReportReminderAPIView.as_view(), name='reportlist-remind'),
    path('reportlist/<int:stir_number>', KtutReportListAPIView.as_view()),
    path('reportlist/', ReportListAPIView.as_view()),
    path("priceindex-year-month", PriceIndexYearAndMonthView.as_view()),
    path('ktut/<int:stir_number>', KtutDetailAPIView.as_view()),
    path('industrial-product-categories/', IndustrialProductCategoryAPIView.as_view(), name='industrial-product-categories'),
    path('industrial-products/<int:category_id>/', IndustrialProductListAPIView.as_view(), name='industrial-products-by-category'),
    path('trade-data/upload', TradeDataAPIView.as_view(), name='trade-data'),

]