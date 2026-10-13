from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from apps.additional_services.api_endpoints.IndustrialProductAPI.serializers import IndustrialProductSerializer, IndustrialProductCategorySerializer
from apps.additional_services.models import IndustrialProduct, IndustrialProductCategory

class IndustrialProductCategoryAPIView(generics.ListAPIView):
    queryset = IndustrialProductCategory.objects.filter(parent__isnull=True)
    serializer_class = IndustrialProductCategorySerializer
    permission_classes = (IsAuthenticated,)


class IndustrialProductListAPIView(generics.ListAPIView):
    queryset = IndustrialProduct.objects.all()
    serializer_class = IndustrialProductSerializer
    permission_classes = (IsAuthenticated,)
    lookup_field = 'category_id'

    def get_queryset(self):
        category_id = self.kwargs.get(self.lookup_field)
        return self.queryset.filter(category_id=category_id)