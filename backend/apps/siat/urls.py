from django.urls import path

from . import views, views_public, views_score

app_name = "siat"

urlpatterns = [
    path("indicators/", views.IndicatorsView.as_view(), name="indicators"),
    path("values/", views.ValuesView.as_view(), name="values"),
    path("territory/<str:soato>/", views.TerritoryView.as_view(), name="territory"),
    path("territories/", views.TerritoriesView.as_view(), name="territories"),
    # JAHON_TAJRIBASI JT-10, JT-17, JT-02
    path("releases/", views_public.ReleaseCalendarView.as_view(), name="releases"),
    path("releases.ics", views_public.ReleaseCalendarIcsView.as_view(), name="releases-ics"),
    path("dashboards/", views_public.DashboardsView.as_view(), name="dashboards"),
    path("card/<str:key>/", views_public.IndicatorCardView.as_view(), name="card"),
    # SCORING_MODEL.md KR-19, KR-26
    path("score/config/", views_score.ScoreConfigView.as_view(), name="score-config"),
    path("score/", views_score.ScoreListView.as_view(), name="score"),
    path("score/<str:soato>/", views_score.ScoreDetailView.as_view(), name="score-detail"),
    path("forecast/", views_score.ForecastListView.as_view(), name="forecast"),
    path("forecast/quality/", views_score.ForecastQualityView.as_view(), name="forecast-quality"),
    path("forecast/<str:soato>/", views_score.ForecastDetailView.as_view(), name="forecast-detail"),
    path("forecast/<str:soato>/what-if/", views_score.WhatIfView.as_view(), name="forecast-what-if"),
]
