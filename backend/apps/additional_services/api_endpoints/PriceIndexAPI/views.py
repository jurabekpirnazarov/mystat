from rest_framework import generics, permissions
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.additional_services.api_endpoints.PriceIndexAPI.filters import PriceIndexFilter
from apps.additional_services.models.priceindex_model import PriceIndex
from apps.additional_services.api_endpoints.PriceIndexAPI.serializers import PriceIndexSerializer
import datetime


class PriceIndexAPIView(generics.ListAPIView):
    queryset = PriceIndex.objects.all().order_by('year')
    serializer_class = PriceIndexSerializer
    filter_backends = (DjangoFilterBackend,)
    filterset_class = PriceIndexFilter
    pagination_class = None
    permission_classes = (IsAuthenticated,)

    def list(self, request, *args, **kwargs):
        queryset = self.filter_queryset(self.get_queryset())
        serializer = self.get_serializer(queryset, many=True)
        return Response({"result": serializer.data})


class PriceIndexYearAndMonthView(APIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        years = [y for y in range(1999, datetime.date.today().year+1)]
        months = [
            "Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", 'Iyul', "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"
        ]

        return Response(data={'years': years, 'months': months})