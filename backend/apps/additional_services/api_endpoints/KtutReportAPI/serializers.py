from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from apps.additional_services.models import ReportList, Ktut
from apps.common.text import clean_excel_text


class ReportListSerializer(ModelSerializer):
    class Meta:
        model = ReportList
        fields = '__all__'

    def to_representation(self, instance):
        data = super().to_representation(instance)
        return {key: clean_excel_text(value) for key, value in data.items()}


class KtutSerializer(serializers.ModelSerializer):
    reportlist = ReportListSerializer(many=True, read_only=True)

    class Meta:
        model = Ktut
        fields = ['okpo', 'inn', 'name', 'reportlist']