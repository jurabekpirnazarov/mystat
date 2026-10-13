from django.core.exceptions import ObjectDoesNotExist
from rest_framework.views import APIView
from rest_framework import generics, permissions
from rest_framework.response import Response

from apps.book_market.models import PostalLocation, OrderBook
from apps.accounts.permissions import IsAccountant
from .serializers import PostalLocationSerializer, AttachPostalToOrderSerializer

from django.conf import settings

import os
import json

class PostalLocationAPIView(APIView):
    def get(self, request):
        try:
            locations = PostalLocation.objects.all()
        except ObjectDoesNotExist:
            return Response({"error": "Locationlar topilmadi"}, status=404)
        serializer = PostalLocationSerializer(locations, many=True)
        return Response(serializer.data, status=200)
    
class AttachPostalToOrder(generics.CreateAPIView):
    permission_classes = (IsAccountant,)
    serializer_class = AttachPostalToOrderSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        tracking_number = serializer.validated_data['tracking_number']
        postal_status = serializer.validated_data['postal_status']
        order_id = serializer.validated_data['order_id']

        order = OrderBook.objects.filter(id=order_id).first()
        if not order:
            return Response({"error": "Bunday order mavjud emas"}, status=404)
        
        order.postal_tracking_number = tracking_number
        order.postal_status = postal_status
        order.save()
        return Response({"success": "Tracking number va postal status muvaffaqiyatli qo'shildi"}, status=200)