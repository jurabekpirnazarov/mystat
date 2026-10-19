from django.db import transaction
from rest_framework import permissions
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response
from rest_framework import status
from .services import RegisterService, ServiceError, ServiceNotFound
from drf_spectacular.utils import extend_schema, OpenApiParameter
from apps.services.models import UserServicePackage, PackageServiceItem, UserServicePackageItemUse


class RegisterOrganizationDetailAPIView(GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        parameters=[
            OpenApiParameter(name="package_service_id", required=True, location=OpenApiParameter.QUERY, type=int,
                             description="Package service item id"),
        ],
        responses={200: None}
    )
    def get(self, request, stir_number: int, *args, **kwargs):
        if len(str(stir_number)) != 9 or not str(stir_number).isdigit():
            return Response({"detail": "Invalid STIR number"}, status=status.HTTP_400_BAD_REQUEST)

        psi_id = request.query_params.get("package_service_id")
        if not psi_id:
            return Response({"detail": "psi query param  required"}, status=status.HTTP_400_BAD_REQUEST)
        psi_id = int(psi_id)

        user_package = UserServicePackage.objects.filter(
            created_by_user=request.user,


        ).select_related("service").first()

        if not user_package or not user_package.service:
            return Response({"detail": "UserServicePackage topilmadi"}, status=status.HTTP_404_NOT_FOUND)

        if user_package.is_expired:
            return Response(
                {"detail": "Paket muddati tugagan", "expires_at": user_package.expires_at},
                status=status.HTTP_403_FORBIDDEN,
            )

        try:
            with transaction.atomic():
                try:
                    psi = PackageServiceItem.objects.select_for_update().get(
                        package_service__id=psi_id,
                        package=user_package.service
                    )
                except PackageServiceItem.DoesNotExist:
                    return Response({"detail": "Berilgan psi id topilmadi yoki user paketiga tegishli emas."},
                                    status=status.HTTP_404_NOT_FOUND)

                uses_count = UserServicePackageItemUse.objects.filter(
                    usp=user_package,
                    psi=psi
                ).count()

                if psi.is_exhausted(uses_count):
                    return Response({
                        "detail": "Sizning limitingiz tugagan!",
                        "limit": psi.limit,
                        "used_count": uses_count
                    }, status=status.HTTP_403_FORBIDDEN)

                request_data = request.query_params.dict()
                reserved_use = UserServicePackageItemUse.objects.create(
                    usp=user_package,
                    psi=psi,
                    is_success=False,
                    request_data=request_data,
                    response_data=None
                )
        except Exception as e:
            return Response({"detail": "Ichki xato (reservation)", "error": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        service = RegisterService()
        try:
            service_response = service.get_organization_detail(stir_number=stir_number)
            service_ok = True
        except Exception as e:
            service_response = {"error": str(e)}
            service_ok = False

        try:
            reserved_use.response_data = service_response
            reserved_use.is_success = bool(service_ok)
            reserved_use.save(update_fields=["response_data", "is_success"])
        except Exception as e:

            return Response({"detail": "Ichki xato (update reservation)", "error": str(e)},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        used_count_after = UserServicePackageItemUse.objects.filter(
            usp=user_package,
            psi=psi
        ).count()

        return Response({
            "detail": "So'rov qabul qilindi va paketdan foydalanish rezerv qilindi.",
            "use_id": reserved_use.id,
            "psi_id": psi.id,
            "limit": psi.limit,
            "used_count_after": used_count_after,
            "service_response": service_response
        }, status=status.HTTP_201_CREATED)


class ClassifyItemListAPIView(GenericAPIView):
    permission_classes = (permissions.IsAuthenticated,)

    @extend_schema(
        parameters=[
            OpenApiParameter(name="stat_classifier__type", required=True, location=OpenApiParameter.QUERY, type=str,
                             description="Stat classifier ID"),
            OpenApiParameter(name="code", required=True, location=OpenApiParameter.QUERY, type=str, description="Code"),
        ],
        responses={200: None}
    )

    def get(self, request):
        stat_classifier__type = request.query_params.get('stat_classifier__type')
        code = request.query_params.get('code')

        if not stat_classifier__type or not code:
            return Response(
                {"detail": "stat_classifier__type va code query paramlari majburiy"},
                status=status.HTTP_400_BAD_REQUEST
            )

        service = RegisterService()

        try:
            data = service.get_classify_item_list(stat_classifier__type=stat_classifier__type, code=code)
        except ServiceNotFound as e:
            return Response({"detail": str(e)}, status=status.HTTP_404_NOT_FOUND)

        except ServiceError as e:
            return Response({"detail": str(e)}, status=status.HTTP_502_BAD_GATEWAY)

        except Exception as e:
            return Response({"detail": "Ichki xato"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({"data": data}, status=status.HTTP_200_OK)