from django.urls import path

from . import views

app_name = "citizens"

urlpatterns = [
    path("salary/", views.SalaryView.as_view(), name="salary"),
    path("prices/", views.PriceProductsView.as_view(), name="prices"),
    path("prices/regions/", views.PriceRegionsView.as_view(), name="prices-regions"),
    path("prices/basket/", views.BasketView.as_view(), name="prices-basket"),
    path("articles/", views.ArticleListView.as_view(), name="articles"),
    path("articles/<slug:slug>/", views.ArticleDetailView.as_view(), name="article-detail"),
    path("glossary/", views.GlossaryView.as_view(), name="glossary"),
    path("surveys/", views.SurveyListView.as_view(), name="surveys"),
    path("surveys/<slug:slug>/", views.SurveyDetailView.as_view(), name="survey-detail"),
    path("surveys/<slug:slug>/answer/", views.SurveyAnswerView.as_view(), name="survey-answer"),
    path("surveys/<slug:slug>/results/", views.SurveyResultsView.as_view(), name="survey-results"),
    path("names/", views.NameStatsView.as_view(), name="names"),
    path("names/top/", views.TopNamesView.as_view(), name="names-top"),
    path("questions/", views.QuestionListView.as_view(), name="questions"),
    path("questions/<int:pk>/", views.QuestionAnswerView.as_view(), name="question-answer"),
    path("answers/", views.PublicAnswersView.as_view(), name="public-answers"),
    path("favorites/", views.FavoriteListView.as_view(), name="favorites"),
    path("favorites/<int:pk>/", views.FavoriteDetailView.as_view(), name="favorite-detail"),
    path("me/summary/", views.CitizenSummaryView.as_view(), name="summary"),
]
