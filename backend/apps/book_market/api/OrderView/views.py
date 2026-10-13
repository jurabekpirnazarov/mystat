from rest_framework import generics
from rest_framework.permissions import IsAuthenticated
from .filters import OrderBookFilter
from .serializers import UserOrderListSerializer
from apps.book_market.models import OrderBook


class OrderDetailView(generics.RetrieveAPIView):
    serializer_class = UserOrderListSerializer
    permission_classes = [IsAuthenticated]
    lookup_field = 'id'

    def get_queryset(self):
        return (OrderBook.objects
                .filter(user=self.request.user)
                .prefetch_related("items__book"))
    

class OrderListView(generics.ListAPIView):
    serializer_class = UserOrderListSerializer
    permission_classes = [IsAuthenticated]
    filterset_class = OrderBookFilter

    def get_queryset(self):
        return (OrderBook.objects
                .filter(user=self.request.user)
                .prefetch_related("items__book")
                .order_by('-created_at'))