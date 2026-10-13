from rest_framework import serializers

from apps.payment.models import Order


class OrderCreateSerializer(serializers.ModelSerializer):
    payment_url = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = ["id", "service", 'provider', "payment_url"]

    def get_payment_url(self, obj: Order):
        return obj.get_payment_url()