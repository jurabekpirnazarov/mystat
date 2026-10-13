from rest_framework import generics, permissions
from apps.payment.api_endpoints.order.OrderCreate.serializers import (
    OrderCreateSerializer,
)
from apps.payment.models import Order


class OrderCreateAPIView(generics.CreateAPIView):
    queryset = Order.objects.all()
    serializer_class = OrderCreateSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user)
