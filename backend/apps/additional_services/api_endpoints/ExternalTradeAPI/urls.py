from django.urls import path, include
from rest_framework.routers import DefaultRouter

from apps.additional_services.api_endpoints.ExternalTradeAPI.newviews import TradeDataGetView
from apps.additional_services.api_endpoints.ExternalTradeAPI.flows import (
    TradeFlowDynamicsAPIView, TradeFlowsAPIView, TradeFlowsExportAPIView,
)

from .views import (
    CountryGroupViewSet, CountryViewSet, TradeDataExportView, TradeDataGetDataView, UnitViewSet, RegionViewSet,
    SITCViewSet, YearViewSet, ProductViewSet, TradeDataViewSet
)

# Router yaratish
router = DefaultRouter()
router.register(r'country-groups', CountryGroupViewSet)
router.register(r'countries', CountryViewSet)
router.register(r'units', UnitViewSet)
router.register(r'regions', RegionViewSet)
router.register(r'sitc', SITCViewSet)
router.register(r'years', YearViewSet)
router.register(r'products', ProductViewSet)
# router.register(r'trade-data', TradeDataViewSet)

urlpatterns = [
    path('', include(router.urls)),
    path('trade-data/', TradeDataGetView.as_view(), name='trade-data-list'),
    path('trade-flows/', TradeFlowsAPIView.as_view(), name='trade-flows'),
    path('trade-flows/dynamics/', TradeFlowDynamicsAPIView.as_view(), name='trade-flows-dynamics'),
    path('trade-flows/export/', TradeFlowsExportAPIView.as_view(), name='trade-flows-export'),
    
]
