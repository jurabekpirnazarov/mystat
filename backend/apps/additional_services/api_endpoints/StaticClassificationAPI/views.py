from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.additional_services.api_endpoints.StaticClassificationAPI.serializers import StatisticClassificationSerializer
from apps.additional_services.models.staticclassification_model import StatisticClassification


class StatisticClassificationAPIView(generics.ListAPIView):
    queryset = StatisticClassification.objects.all()
    serializer_class = StatisticClassificationSerializer
    permission_classes = (IsAuthenticated,)

