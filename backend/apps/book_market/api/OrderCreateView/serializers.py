from decimal import Decimal, ROUND_HALF_UP

from django.conf.locale import it
from django.db import transaction
from rest_framework import serializers
from apps.book_market.models import OrderBook, OrderItem, Book, PostalLocation, BookOption
from apps.payment.models import Provider


class OrderItemInputSerializer(serializers.Serializer):
    book_id = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1)
    order_type = serializers.ChoiceField(choices=OrderItem.OrderType.choices, required=False)


class SingleOrderInputSerializer(serializers.Serializer):
    items = OrderItemInputSerializer(many=True)


class OrderCreateSerializer(serializers.Serializer):
    orders = SingleOrderInputSerializer(many=True, write_only=True)
    postal_location_id = serializers.IntegerField(required=False, write_only=True)

    def to_representation(self, instance):
        return {
            "id": instance.pk,
            "total_price": str(instance.total_amount),
            "postal_location": instance.postal_location.pk if instance.postal_location else None
        }

    def _merge_items(self, orders_payload):

        merged = {}
        for o in orders_payload:
            for it in o["items"]:
                bid = int(it["book_id"])
                qty = int(it["quantity"])
                it_type = it.get("order_type")
                key = (bid, it_type)
                merged[key] = merged.get(key, 0) + qty
        return merged

    def validate(self, attrs):
        orders = attrs.get("orders") or []
        if not orders:
            raise serializers.ValidationError({"orders": "Orders list is empty."})

        all_book_ids = {int(it["book_id"]) for o in orders for it in o["items"]}
        found = set(Book.objects.filter(pk__in=all_book_ids).values_list("pk", flat=True))
        missing = [bid for bid in all_book_ids if bid not in found]
        if missing:
            raise serializers.ValidationError({"orders": f"Not found book_id(s): {missing}"})

        for o in orders:
            for it in o["items"]:
                if int(it["quantity"]) < 1:
                    raise serializers.ValidationError({"orders": "Quantity must be at least 1."})
                ot = it.get("order_type")
                if ot is not None and ot not in dict(OrderItem.OrderType.choices):
                    raise serializers.ValidationError({"orders": f"Invalid order_type: {ot}"})

        attrs["_merged_items"] = self._merge_items(orders)

        postal_id = attrs.get("postal_location_id")
        if postal_id is not None:
            try:
                location = PostalLocation.objects.get(pk=postal_id)
            except PostalLocation.DoesNotExist:
                raise serializers.ValidationError({"postal_location_id": f"{postal_id} not found"})
            attrs["_postal_location"] = location
        else:
            attrs["_postal_location"] = None

        return attrs

    @transaction.atomic
    def create(self, validated_data):
        request = self.context.get("request")
        user = getattr(request, "user", None)

        merged_items = validated_data["_merged_items"]
        postal_location = validated_data["_postal_location"]

        first_key = next(iter(merged_items.keys()))
        default_order_type = first_key[1] if first_key and len(first_key) > 1 else OrderItem.OrderType.ElECTRON

        book_ids = {bid for (bid, _ot) in merged_items.keys()}
        books = Book.objects.in_bulk(book_ids)

        all_types = {ot for (_bid, ot) in merged_items.keys()}
        options_qs = BookOption.objects.filter(book_id__in=book_ids, book_type__in=all_types)
        option_map = {(opt.book_id, opt.book_type): opt for opt in options_qs}

        missing_options = [f"{bid} (type={ot})" for (bid, ot) in merged_items.keys() if (bid, ot) not in option_map]
        if missing_options:
            raise serializers.ValidationError({
                "orders": f"No BookOption for these book_id(s) and types: {missing_options}"
            })

        order = OrderBook.objects.create(
            user=user,
            status=OrderBook.Status.PENDING,
            total_amount=Decimal("0.00"),
            postal_location=postal_location,
        )

        batch = []
        total = Decimal("0.00")
        for (bid, it_type), qty in merged_items.items():
            book = books.get(bid)
            if book is None:
                raise serializers.ValidationError({"orders": f"book_id={bid} not found"})

            opt = option_map.get((bid, it_type))
            if not opt:
                raise serializers.ValidationError({"orders": f"book_id={bid} has no option for type {it_type}"})

            price_decimal = Decimal(opt.price).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
            line_total = price_decimal * Decimal(qty)
            total += line_total

            batch.append(OrderItem(
                order=order,
                book=book,
                quantity=qty,
                price_snapshot=price_decimal,
                order_type=it_type
            ))

        OrderItem.objects.bulk_create(batch)
        order.total_amount = (total or Decimal("0.00")).quantize(Decimal("0.01"), rounding=ROUND_HALF_UP)
        order.save(update_fields=["total_amount"])

        return order


class PaymentLinkRequestSerializer(serializers.Serializer):
    order_id = serializers.IntegerField()
    provider = serializers.ChoiceField(choices=Provider.choices)

    def validate(self, attrs):
        user = self.context["request"].user
        try:
            order = OrderBook.objects.get(pk=attrs["order_id"], user=user)
        except OrderBook.DoesNotExist:
            raise serializers.ValidationError({"order_id": "Order not found."})

        if order.status == OrderBook.Status.CANCELLED:
            raise serializers.ValidationError("This order is cancelled.")
        if order.total_amount <= 0:
            raise serializers.ValidationError("Order amount must be greater than zero.")

        attrs["order"] = order
        return attrs


class PaymentLinkResponseSerializer(serializers.Serializer):
    payment_url = serializers.URLField()
