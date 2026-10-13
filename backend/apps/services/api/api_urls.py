from django.urls import path
from apps.services.api.ServiceView.views import (
    ServiceCategoryAPIView, ServiceListCreateAPIView, ServiceDetailAPIView,
    ServiceItemAPIView, ServicePackageAPIView, ServiceRatingCreateView,
)
from apps.services.api.MyServiceView.views import (
    ServiceRequestAPIView, ServiceRequestDetailAPIView, ServiceResponseAPIView
)
from apps.services.api.views import RegisterOrganizationDetailAPIView, ClassifyItemListAPIView
from apps.services.api.ActivityPlanView.views import ActivityPlanListAPIView

app_name = "services"


urlpatterns = [
    path('category/', ServiceCategoryAPIView.as_view(), name='service-category'),
    path('service/', ServiceListCreateAPIView.as_view(), name='service'),
    path('<int:pk>/', ServiceDetailAPIView.as_view(), name='service-detail'),
    path('item/', ServiceItemAPIView.as_view(), name='service-item'),
    path('package/', ServicePackageAPIView.as_view(), name='service-package'),
    path('register-organization-detail/<int:stir_number>/', RegisterOrganizationDetailAPIView.as_view(), name='register-organization'),
    path('classify-item/', ClassifyItemListAPIView.as_view(), name='classify-item'),
    path("rating-create", ServiceRatingCreateView.as_view(), name='service-rating-create'),
    path('service-request/', ServiceRequestAPIView.as_view(), name='service-request-list'),
    path('service-request/<int:pk>/', ServiceRequestDetailAPIView.as_view(), name='service-request-detail'),
    path('activity-plans/', ActivityPlanListAPIView.as_view(), name='activity-plans'),
    path('service-response/<int:pk>/', ServiceResponseAPIView.as_view(), name='service-response-list'),
]