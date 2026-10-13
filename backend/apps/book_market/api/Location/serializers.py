from rest_framework import serializers

from ...models import PostalLocation, OrderBook

class PostalLocationSerializer(serializers.ModelSerializer):
    class Meta:
        model = PostalLocation
        fields = '__all__'


class AttachPostalToOrderSerializer(serializers.Serializer):
    postal_status = serializers.ChoiceField(choices=OrderBook.PostalStatus.choices)
    tracking_number = serializers.CharField(max_length=255)
    order_id = serializers.IntegerField()