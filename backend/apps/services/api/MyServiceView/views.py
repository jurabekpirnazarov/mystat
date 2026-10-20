from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsAuthenticated
from .permissions import IsAssignedEmployee, IsAttachedUser
from .serializers import ServiceRequestSerializer, ServiceResponseSerializer
from ...models import ServiceRequestResponse
from django.db.models import Q
from django.shortcuts import get_object_or_404


class ServiceRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        # ISH_REJASI 2.1: filtrlar faqat o'z (yoki biriktirilgan) so'rovlar ichida; ilgari `OR` bilan begona
        # foydalanuvchilarning so'rovlari ham qaytardi
        serivces = ServiceRequestResponse.objects.filter(
            Q(contract__user=request.user) | Q(contract__attached_user=request.user)
        )
        package_item = request.GET.get('package_item')
        contract = request.GET.get('contract')
        if package_item:
            serivces = serivces.filter(package_item=package_item)
        if contract:
            serivces = serivces.filter(contract=contract)
        serializer = ServiceRequestSerializer(serivces, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    def post(self, request):
        serializer = ServiceRequestSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)


class ServiceRequestDetailAPIView(RetrieveAPIView):
    permission_classes = [IsAuthenticated, IsAttachedUser]
    serializer_class = ServiceRequestSerializer

    def get_object(self):
        user = self.request.user
        pk = self.kwargs.get("pk")

        obj = ServiceRequestResponse.objects.filter(pk=pk).filter(Q(contract__user=user) | Q(contract__attached_user=user)).first()
        if obj is None:
            raise NotFound("Bunday service request sizga tegishli emas yoki mavjud emas.")
        return obj


class ServiceResponseAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAssignedEmployee]

    def patch(self, request, pk):
        instance = get_object_or_404(ServiceRequestResponse, pk=pk)
        serializer = ServiceResponseSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


