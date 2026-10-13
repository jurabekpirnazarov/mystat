from rest_framework import generics, permissions, response
from apps.payment.models import Order
from .serializers import OrderListSerializer


class OrderListAPIView(generics.ListAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderListSerializer
    permission_classes = [permissions.IsAuthenticated]
    pagination_class = None

    def get(self, request, *args, **kwargs):
        service_orders = Order.objects.filter(user=request.user, is_paid=True).order_by('-created_at')

        data = {
            "service_orders": OrderListSerializer(service_orders, many=True).data,
        }
        return response.Response(data)
