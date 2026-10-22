from .views import (
    HomeStatsAPIView,
    GoodsignPasswordAuthView, GoodsignCompanyLoginView,
    QuestionAnswerAPIView, BranchListAPIView, SiteStatAPIView,
    PlatFormStatAPIView, ContactCreateAPIView,
    InformationListCreateView, InformationDetailView, ByulletenAPIView, ByulletenDownloadAPIView, MyDownloadedByulletens,
    AboutPortalListView

)

from django.urls import path

from .support_views import AssistantAPIView, GlobalSearchAPIView, SupportStartAPIView, SupportThreadAPIView
from .weather import WeatherAPIView
from apps.analytics.region_profile import DistrictProfileView, RegionMapView, RegionProfileView

app_name = 'common'

urlpatterns = [
    path('didox/password/', GoodsignPasswordAuthView.as_view(), name='goodsign-password-auth'),
    path('didox/company-login/', GoodsignCompanyLoginView.as_view(), name='goodsign-company-login'),
    path('question-answer/', QuestionAnswerAPIView.as_view(), name='question-answer'),
    path('branches/', BranchListAPIView.as_view(), name='branch-list'),
    path('site-stat/', SiteStatAPIView.as_view(), name='site-stat'),
    path('platform-stat/', PlatFormStatAPIView.as_view(), name='platform-stat'),
    path('home-stats/', HomeStatsAPIView.as_view(), name='home-stats'),
    path('regions/map/', RegionMapView.as_view(), name='regions-map'),
    path('regions/<int:pk>/profile/', RegionProfileView.as_view(), name='region-profile'),
    path('districts/<int:pk>/profile/', DistrictProfileView.as_view(), name='district-profile'),
    path('weather/', WeatherAPIView.as_view(), name='weather'),
    path('search/', GlobalSearchAPIView.as_view(), name='search'),
    path('assistant/', AssistantAPIView.as_view(), name='assistant'),
    path('support/', SupportStartAPIView.as_view(), name='support-start'),
    path('support/<int:pk>/', SupportThreadAPIView.as_view(), name='support-thread'),
    path('contact-create/', ContactCreateAPIView.as_view(), name='contact-create'),
    path('information/', InformationListCreateView.as_view(), name='information-list-create'),
    path('information/<int:pk>/', InformationDetailView.as_view(), name='information-detail'),
    path('byulleten/', ByulletenAPIView.as_view(), name='byulleten'),
    path('byulleten/download/<int:byulleten_id>', ByulletenDownloadAPIView.as_view(), name='byulleten-download'),
    path('my/byulletens/', MyDownloadedByulletens.as_view(), name='byulleten-download'),
    path('about-portal/', AboutPortalListView.as_view(), name='about-portal'),
]