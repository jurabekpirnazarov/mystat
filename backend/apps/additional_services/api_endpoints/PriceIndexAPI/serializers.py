from rest_framework.serializers import ModelSerializer
from apps.additional_services.models.priceindex_model import PriceIndex


class PriceIndexSerializer(ModelSerializer):
    class Meta:
        model = PriceIndex
        fields = '__all__'