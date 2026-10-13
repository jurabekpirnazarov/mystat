from rest_framework.serializers import ModelSerializer
from rest_framework import serializers
from apps.additional_services.models import ReportList, Ktut


class ReportListSerializer(ModelSerializer):
    class Meta:
        model = ReportList
        fields = '__all__'


class KtutSerializer(serializers.ModelSerializer):
    reportlist = ReportListSerializer(many=True, read_only=True)

    class Meta:
        model = Ktut
        fields = ['okpo', 'inn', 'name', 'reportlist']