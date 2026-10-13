from .views import (
    GoodsignPasswordAuthView, GoodsignCompanyLoginView,
    QuestionAnswerAPIView, BranchListAPIView, SiteStatAPIView,
    PlatFormStatAPIView, ContactCreateAPIView,
    InformationListCreateView, InformationDetailView, ByulletenAPIView, ByulletenDownloadAPIView, MyDownloadedByulletens,
    AboutPortalListView

)

from django.urls import path

app_name = 'common'

urlpatterns = [
    path('didox/password/', GoodsignPasswordAuthView.as_view(), name='goodsign-password-auth'),
    path('didox/company-login/', GoodsignCompanyLoginView.as_view(), name='goodsign-company-login'),
    path('question-answer/', QuestionAnswerAPIView.as_view(), name='question-answer'),
    path('branches/', BranchListAPIView.as_view(), name='branch-list'),
    path('site-stat/', SiteStatAPIView.as_view(), name='site-stat'),
    path('platform-stat/', PlatFormStatAPIView.as_view(), name='platform-stat'),
    path('contact-create/', ContactCreateAPIView.as_view(), name='contact-create'),
    path('information/', InformationListCreateView.as_view(), name='information-list-create'),
    path('information/<int:pk>/', InformationDetailView.as_view(), name='information-detail'),
    path('byulleten/', ByulletenAPIView.as_view(), name='byulleten'),
    path('byulleten/download/<int:byulleten_id>', ByulletenDownloadAPIView.as_view(), name='byulleten-download'),
    path('my/byulletens/', MyDownloadedByulletens.as_view(), name='byulleten-download'),
    path('about-portal/', AboutPortalListView.as_view(), name='about-portal'),
]