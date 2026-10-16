from django.urls import path

from . import views
from .company_scoring import api as scores

app_name = "analytics"

urlpatterns = [
    path("benchmark/", views.BenchmarkView.as_view(), name="benchmark"),
    path("benchmark/status/", views.BenchmarkStatusView.as_view(), name="benchmark-status"),
    # KORXONA_SCORING.md KR-33
    path("company-scores/", scores.CompanyScoresView.as_view(), name="company-scores"),
    path("company-scores/me/", scores.MyCompanyScoreView.as_view(), name="company-scores-me"),
    path("company-scores/distribution/", scores.CompanyScoreDistributionView.as_view(), name="company-scores-distribution"),
    path("company-scores/methodology/", scores.CompanyScoreMethodologyView.as_view(), name="company-scores-methodology"),
    path("company-scores/<str:stir>/", scores.CompanyScoreDetailView.as_view(), name="company-scores-detail"),
]
