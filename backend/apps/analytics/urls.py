from django.urls import path

from . import views, views_card
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
    # KR-45: korxona profili
    path("company-profile/<str:stir>/", scores.CompanyProfileView.as_view(), name="company-profile"),
    # IHAMKOR_MUQOBIL.md IH-08: kontragent kartasi
    path("company-card/search/", views_card.CompanyCardSearchView.as_view(), name="company-card-search"),
    path("company-card/<str:stir>/", views_card.CompanyCardView.as_view(), name="company-card"),
]
