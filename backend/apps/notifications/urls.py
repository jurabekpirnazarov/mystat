from django.urls import path
from .subscriptions import SubscriptionDetailView, SubscriptionListView
from .views import NotificationDetailAPIView, NotificationListAPIView, NotificationUnreadCountAPIView

app_name = 'notifications'


urlpatterns = [
    path('me', NotificationListAPIView.as_view(), name='notification-list'),
    path('me/unread-count/', NotificationUnreadCountAPIView.as_view(), name='notification-unread-count'),
    path('me/<int:pk>', NotificationDetailAPIView.as_view(), name='notification-detail'),
    path('subscriptions/', SubscriptionListView.as_view(), name='subscriptions'),
    path('subscriptions/<int:pk>/', SubscriptionDetailView.as_view(), name='subscription-detail'),
]