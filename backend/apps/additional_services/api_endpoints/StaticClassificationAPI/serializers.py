from rest_framework import serializers

from apps.additional_services.models.staticclassification_model import StatisticClassificationCategory, \
    StatisticClassification


class StatisticClassificationCategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = StatisticClassificationCategory
        fields = '__all__'


class StatisticClassificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = StatisticClassification
        fields = '__all__'

