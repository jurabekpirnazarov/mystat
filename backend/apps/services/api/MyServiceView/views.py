from rest_framework import status
from rest_framework.exceptions import NotFound
from rest_framework.generics import RetrieveAPIView
from rest_framework.views import APIView
from rest_framework.response import Response
from apps.accounts.permissions import IsAuthenticated
from .permissions import IsAttachedUser
from .serializers import ServiceRequestSerializer, ServiceResponseSerializer
from ...models import ServiceRequestResponse
from django.db.models import Q


class ServiceRequestAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        package_item = request.GET.get('package_item')
        contract = request.GET.get('contract')
        serivces = ServiceRequestResponse.objects.filter(
            Q(contract__user=request.user) | Q(contract__attached_user=request.user) | Q(package_item=package_item) | Q(contract=contract)
        )
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

        try:
            return ServiceRequestResponse.objects.filter(pk=pk).filter(Q(contract__user=user) | Q(contract__attached_user=user)).first()
        except ServiceRequestResponse.DoesNotExist:
            raise NotFound("Bunday service request sizga tegishli emas yoki mavjud emas.")


class ServiceResponseAPIView(APIView):
    permission_classes = [IsAuthenticated, IsAttachedUser]

    def patch(self, request, pk):
        instance = ServiceRequestResponse.objects.get(pk=pk)
        serializer = ServiceResponseSerializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_OK)


