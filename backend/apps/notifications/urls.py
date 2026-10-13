from django.urls import path
from .views import NotificationListAPIView, NotificationDetailAPIView

app_name = 'notifications'


urlpatterns = [
    path('me', NotificationListAPIView.as_view(), name='notification-list'),
    path('me/<int:pk>', NotificationDetailAPIView.as_view(), name='notification-detail'),
]