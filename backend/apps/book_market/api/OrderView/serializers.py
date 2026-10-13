from rest_framework import serializers
from apps.book_market.api.Location.serializers import PostalLocationSerializer
from apps.book_market.models import OrderBook, OrderItem

from rest_framework import serializers
from apps.book_market.models import OrderBook, OrderItem
from apps.book_market.api.Location.serializers import PostalLocationSerializer


class UserOrderItemSerializer(serializers.ModelSerializer):
    book_name = serializers.CharField(source="book.name", read_only=True)
    image_url = serializers.SerializerMethodField()
    subtotal = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()
    base_file = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            "id",
            "book",
            "book_name",
            "quantity",
            "price_snapshot",
            "subtotal",
            "image_url",
            "order_type",
            'file_url',
            'base_file',
        ]

    def get_image_url(self, obj):
        return obj.book.image_url.url if obj.book.image_url else None

    def get_subtotal(self, obj):
        return obj.subtotal

    def get_file_url(self, obj):
        if obj.order.status == "paid" and obj.order_type == 'electron':
            return obj.book.file.url
        return None

    def get_base_file(self, obj):
        if obj.book.base_file:
            return obj.book.base_file.url
        return None


class UserOrderListSerializer(serializers.ModelSerializer):
    items = UserOrderItemSerializer(many=True, read_only=True)
    postal_location = PostalLocationSerializer(read_only=True)

    class Meta:
        model = OrderBook
        fields = [
            "id",
            "status",
            "postal_status",
            "total_amount",
            "created_at",
            "postal_location",
            "items",
        ]
