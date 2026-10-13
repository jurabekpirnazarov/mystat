from rest_framework import filters, generics
from rest_framework.permissions import IsAuthenticated
from django_filters.rest_framework import DjangoFilterBackend

from apps.additional_services.api_endpoints.StaticClassificationAPI.serializers import (
    StatisticClassificationCategorySerializer,
    StatisticClassificationSerializer,
)
from apps.additional_services.models.staticclassification_model import (
    StatisticClassification,
    StatisticClassificationCategory,
)


class StatisticClassificationAPIView(generics.ListAPIView):
    """?category=<id>, ?search=<nom/analog/hujjat — 3 tilda>"""
    queryset = StatisticClassification.objects.filter(is_active=True).select_related("category").order_by("category_id", "id")
    serializer_class = StatisticClassificationSerializer
    permission_classes = (IsAuthenticated,)
    filter_backends = [DjangoFilterBackend, filters.SearchFilter]
    filterset_fields = ["category"]
    search_fields = ["name_uz", "name_ru", "name_cry", "analog_uz", "confirm_document", "slug"]


class StatisticClassificationCategoryAPIView(generics.ListAPIView):
    queryset = StatisticClassificationCategory.objects.filter(is_active=True).order_by("id")
    serializer_class = StatisticClassificationCategorySerializer
    permission_classes = (IsAuthenticated,)
    pagination_class = None
