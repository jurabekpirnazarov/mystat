from django.urls import path

from . import views

app_name = "portal"

urlpatterns = [
    path("services/stats/", views.ServicesStatsView.as_view(), name="services-stats"),
    path("services/<int:number>/stats/", views.ServiceStatsView.as_view(), name="service-stats"),
    path("services/<int:number>/use/", views.ServiceUseView.as_view(), name="service-use"),
    path("services/<int:number>/reviews/", views.ServiceReviewsView.as_view(), name="service-reviews"),
    path("reviews/<int:review_id>/vote/", views.ReviewVoteView.as_view(), name="review-vote"),
    path("page-feedback/", views.PageFeedbackView.as_view(), name="page-feedback"),
    path("typo-report/", views.TypoReportView.as_view(), name="typo-report"),
]
