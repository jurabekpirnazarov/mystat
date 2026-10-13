from rest_framework import serializers

from apps.additional_services.models.staticclassification_model import StatisticClassificationCategory, \
    StatisticClassification
from apps.common.synthetic import SyntheticFlagField


class StatisticClassificationCategorySerializer(serializers.ModelSerializer):
    items_count = serializers.SerializerMethodField()
    is_synthetic = SyntheticFlagField()

    class Meta:
        model = StatisticClassificationCategory
        fields = '__all__'

    def get_items_count(self, obj):
        return obj.statisticclassification_set.filter(is_active=True).count()


class StatisticClassificationSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source="category.name", read_only=True)
    is_synthetic = SyntheticFlagField()

    class Meta:
        model = StatisticClassification
        fields = '__all__'
