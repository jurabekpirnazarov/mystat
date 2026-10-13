from rest_framework.generics import ListAPIView, ListCreateAPIView, RetrieveAPIView, RetrieveUpdateAPIView, \
    RetrieveUpdateDestroyAPIView, CreateAPIView
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from apps.services.models import ServiceCategory, ServiceItem, ServicePackage, PackageService, ServiceRating, PackageServiceItem
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter
from apps.services.models import Service
from .serializers import (
    ServiceCategorySerializer, ServiceSerializer,
    ServiceItemSerializer, ServicePackageSerializer, ServiceRatingPostSerializer
)
from django.db.models import Avg, Count, Prefetch


class ServiceCategoryAPIView(ListAPIView):
    serializer_class = ServiceCategorySerializer
    permission_classes = [IsAuthenticated]
    queryset = ServiceCategory.objects.filter(is_active=True)


class ServiceListCreateAPIView(ListCreateAPIView):
    serializer_class = ServiceSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = Service.objects.filter(is_active=True)
    filter_backends = (SearchFilter, OrderingFilter, DjangoFilterBackend)
    filterset_fields = ["is_free", "is_active", "is_popular", "duration", 'category__name']
    search_fields = ["name", "description"]
    ordering_fields = ["price", "orders", "name"]
    ordering = ["orders"]

    def get_queryset(self):
        qs = super().get_queryset()
        if not (self.request.user and self.request.user.is_staff):
            qs = qs.filter(is_active=True)
        return qs


class ServiceDetailAPIView(RetrieveAPIView):
    queryset = Service.objects.all()
    serializer_class = ServiceSerializer

    def get_queryset(self):

        qs = super().get_queryset()
        qs = qs.select_related('organization', 'in_package') \
               .prefetch_related('items') \
               .annotate(_avg=Avg('service_ratings__value'), _total=Count('service_ratings'))
        return qs


class ServiceItemAPIView(ListAPIView):
    serializer_class = ServiceItemSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    queryset = ServiceItem.objects.all()


class ServicePackageAPIView(ListAPIView):
    serializer_class = ServicePackageSerializer
    permission_classes = [IsAuthenticatedOrReadOnly]
    
    def get_queryset(self):
        package_items = PackageServiceItem.objects.select_related('package_service').prefetch_related('package_service')
        
        qs = ServicePackage.objects.filter(is_active=True).prefetch_related(
            'prices__sector',
            Prefetch(
                'package_service_items',
                queryset=package_items
            )
        )
        return qs

    def get_serializer_context(self):
        context = super().get_serializer_context()
        context['user'] = self.request.user
        from apps.common.models import SiteSettings
        settings = SiteSettings.load()
        context['bhm_value'] = settings.bhm_value if settings else 0
        return context


class ServiceRatingCreateView(CreateAPIView):
    serializer_class = ServiceRatingPostSerializer
    permission_classes = [IsAuthenticated]
    queryset = ServiceRating.objects.all()