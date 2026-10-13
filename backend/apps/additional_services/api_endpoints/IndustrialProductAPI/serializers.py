from rest_framework import serializers
from apps.additional_services.models import IndustrialProduct, IndustrialProductCategory, Skp


class IndustrialProductCategorySerializer(serializers.ModelSerializer):
    children = serializers.SerializerMethodField()

    class Meta:
        model = IndustrialProductCategory
        fields = '__all__'

    def get_children(self, obj):
        children = obj.children.all()
        return IndustrialProductCategorySerializer(children, many=True).data


class SkpSerializer(serializers.ModelSerializer):
    class Meta:
        model = Skp
        fields = '__all__'


class IndustrialProductSerializer(serializers.ModelSerializer):
    category = IndustrialProductCategorySerializer(read_only=True)
    skp = SkpSerializer(read_only=True)
    class Meta:
        model = IndustrialProduct
        fields = '__all__'


