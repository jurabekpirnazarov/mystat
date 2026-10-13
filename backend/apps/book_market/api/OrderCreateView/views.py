from rest_framework.response import Response
from rest_framework import generics, status
from rest_framework.views import APIView
from apps.book_market.models import OrderBook, OrderItem
from .serializers import OrderCreateSerializer, PaymentLinkRequestSerializer, PaymentLinkResponseSerializer
from rest_framework.permissions import IsAuthenticated


class OrderCreateAPIView(generics.CreateAPIView):
    queryset = OrderBook.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [IsAuthenticated]


class OrderPaymentLinkAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        ser = PaymentLinkRequestSerializer(data=request.data, context={"request": request})
        ser.is_valid(raise_exception=True)

        order = ser.validated_data["order"]
        provider = ser.validated_data["provider"]

        order.recalc_total()
        order.save(update_fields=["total_amount"])

        try:
            payment_url = order.get_payment_url(provider)
        except ValueError as e:
            return Response({"detail": str(e)}, status=status.HTTP_400_BAD_REQUEST)

        # out = PaymentLinkResponseSerializer({"payment_url": payment_url})
        out = PaymentLinkResponseSerializer({"payment_url": "https://my.click.uz/services/pay"})
        return Response(out.data, status=status.HTTP_200_OK)

# class OrderItemUpdateAPIView(generics.UpdateAPIView):
#     queryset = OrderItem.objects.select_related("order", "book")
#     serializer_class = OrderReplaceItemsSerializer
#     permission_classes = [IsAuthenticated]
#
#     def get_queryset(self):
#         return super().get_queryset().filter(user=self.request.user)