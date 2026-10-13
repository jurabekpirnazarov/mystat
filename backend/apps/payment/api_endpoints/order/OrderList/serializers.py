from rest_framework import serializers

from apps.payment.models import Order
from apps.services.models import Service


class ServiceSerializer(serializers.ModelSerializer):
    class Meta:
        model = Service
        fields = ['name_uz', 'name_ru', 'name_cry']


class OrderListSerializer(serializers.ModelSerializer):
    payment_url = serializers.SerializerMethodField()
    service = ServiceSerializer()

    class Meta:
        model = Order
        fields = ["id", "service", 'amount', 'provider', "payment_url"]

    def get_payment_url(self, obj: Order):
        return obj.get_payment_url()
