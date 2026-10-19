import requests
from rest_framework.generics import ListAPIView, CreateAPIView
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView
from apps.accounts.models import User
from apps.common.models import Branch, QuestionAnswer, Contact, Byulleten, AboutPortal
from apps.common.serializers import BranchSerializer, QuestionAnswerSerializer, ContactSerializer, ByulletenSerializer, \
    AboutPortalSerializer
from apps.services.models import Service, ServiceRequests, UserServicePackage, PackageServiceItem, \
    UserServicePackageItemUse
from django.utils.timezone import now
from django.core.cache import cache
from rest_framework.generics import ListCreateAPIView
from rest_framework.parsers import MultiPartParser, FormParser
from .models import InformationModel
from .serializers import InformationSerializer
from rest_framework.generics import RetrieveUpdateDestroyAPIView
from django.db import transaction
from django.conf import settings
from rest_framework.permissions import IsAdminUser, IsAuthenticated
from django.shortcuts import get_object_or_404



class GoodsignPasswordAuthView(APIView):
	# Qo'mitaning o'z GoodSign akkauntidan foydalanadi — ommaga ochiq bo'lmasligi kerak
	permission_classes = (IsAdminUser,)

	def post(self, request):
		tax_id = settings.GOODSIGN_TAX_ID
		password = settings.GOODSIGN_PASSWORD
		if not tax_id or not password:
			return Response({
				'success': False,
				'message': "tax_id va password majburiy"
			}, status=status.HTTP_400_BAD_REQUEST)

		url = f"https://stage.goodsign.biz/v1/auth/{tax_id}/password/ru"
		payload = {"password": password}
		try:
			res = requests.post(url, json=payload, timeout=20)
			if res.status_code == 200:
				return Response({
					'success': True,
					'status': res.status_code
				}, status=status.HTTP_200_OK)
			else:
				return Response({
					'success': False,
					'status': res.status_code,
					'message': res.text
				}, status=res.status_code)
		except Exception as e:
			return Response({
				'success': False,
				'message': str(e)
			}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class GoodsignCompanyLoginView(APIView):
	permission_classes = (IsAdminUser,)

	def post(self, request):
		company_id = settings.GOODSIGN_COMPANY_ID
		token = request.data.get('token')
		tax_id = settings.GOODSIGN_TAX_ID
		password = settings.GOODSIGN_PASSWORD

		# Avval tokenni tax_id va password orqali olish
		if not token:
			if not tax_id or not password:
				return Response({
					'success': False,
					'message': "token yo'q bo'lsa, tax_id va password majburiy"
				}, status=status.HTTP_400_BAD_REQUEST)

			url_token = f"https://stage.goodsign.biz/v1/auth/{tax_id}/password/ru"
			payload = {"password": password}
			try:
				res_token = requests.post(url_token, json=payload, timeout=20)
				if res_token.status_code == 200:
					data_token = res_token.json()
					token = data_token.get('token')
					if not token:
						return Response({
							'success': False,
							'message': "Token olinmadi"
						}, status=status.HTTP_400_BAD_REQUEST)
				else:
					return Response({
						'success': False,
						'status': res_token.status_code,
						'message': res_token.text
					}, status=res_token.status_code)
			except Exception as e:
				return Response({
					'success': False,
					'message': str(e)
				}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

		# Endi company login
		if not company_id or not token:
			return Response({
				'success': False,
				'message': "company_id va token majburiy"
			}, status=status.HTTP_400_BAD_REQUEST)

		url = f"https://stage.goodsign.biz/v1/auth/company/{company_id}/login/ru"
		headers = {"user-key": token}
		try:
			res = requests.post(url, headers=headers, timeout=20)
			if res.status_code == 200:
				return Response({
					'success': True,
					'status': res.status_code
				}, status=status.HTTP_200_OK)
			else:
				return Response({
					'success': False,
					'status': res.status_code,
					'message': res.text
				}, status=res.status_code)
		except Exception as e:
			return Response({
				'success': False,
				'message': str(e)
			}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class QuestionAnswerAPIView(ListAPIView):
    queryset = QuestionAnswer.objects.all()
    serializer_class = QuestionAnswerSerializer


class BranchListAPIView(ListAPIView):
	queryset = Branch.objects.all()
	serializer_class = BranchSerializer
	pagination_class = None


class SiteStatAPIView(APIView):
    def get(self, request):
        today = now().date()
        year_start = today.replace(month=1, day=1)

        cache_key = "site_stats"
        data = cache.get(cache_key)

        if not data:
            users_count = User.objects.count()
            service_count = Service.objects.count()
            # Haqiqiy foydalanish — paket limitidan foydalanishlar (ServiceRequests modeli ilovada ishlatilmaydi)
            todays_services = UserServicePackageItemUse.objects.filter(created_at__date=today).count()
            current_year_services = UserServicePackageItemUse.objects.filter(created_at__gte=year_start).count()

            data = {
                "users_count": users_count,
                "service_count": service_count,
                "todays_services": todays_services,
                "current_year_services": current_year_services,
            }
            cache.set(cache_key, data, timeout=86400)
        return Response(data)


class PlatFormStatAPIView(APIView):
    """?stat_type=daily|weekly|monthly|yearly — xizmatlardan foydalanish davri. Real ma'lumot, 10 daqiqa kesh."""

    def get(self, request):
        from apps.common.platform_stats import service_stats, user_stats

        stat_type = request.query_params.get("stat_type", "monthly")
        cache_key = f"platform_stats:{stat_type}"
        data = cache.get(cache_key)
        if data is None:
            data = {"success": True, "service_stats": service_stats(stat_type), "user_stats": user_stats()}
            cache.set(cache_key, data, timeout=600)
        return Response(data, status=status.HTTP_200_OK)


class ContactCreateAPIView(CreateAPIView):
    queryset = Contact.objects.all()
    serializer_class = ContactSerializer


class InformationListCreateView(ListCreateAPIView):
    queryset = InformationModel.objects.all()
    serializer_class = InformationSerializer
    parser_classes = (MultiPartParser, FormParser)


class InformationDetailView(RetrieveUpdateDestroyAPIView):
    queryset = InformationModel.objects.all()
    serializer_class = InformationSerializer
    parser_classes = (MultiPartParser, FormParser)





class ByulletenAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        psi_id = request.query_params.get("package_service_id")
        user_package = UserServicePackage.objects.filter(
            created_by_user=request.user,
        ).select_related("service").first()

        if not psi_id:
            return Response({"detail": "psi query param  required"}, status=status.HTTP_400_BAD_REQUEST)
        if user_package is None:
            return Response({"detail": "Foydalanuvchida faol xizmat paketi yo'q."},
                            status=status.HTTP_403_FORBIDDEN)
        psi_id = int(psi_id)
        try:
            psi = PackageServiceItem.objects.get(
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

        byulletens = Byulleten.objects.all()

        serializer = ByulletenSerializer(byulletens, many=True, context={'request': request})
        data = {
            "byulletens": serializer.data,
            "limit": psi.limit,
            "used_count_after": uses_count,
        }
        return Response(data)


class ByulletenDownloadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, byulleten_id):

        byulleten = get_object_or_404(Byulleten, id=byulleten_id)

        psi_id = request.query_params.get("package_service_id")
        if not psi_id:
            return Response(
                {"detail": "psi query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        psi_id = int(psi_id)


        # 2️⃣ User paketi
        user_package = UserServicePackage.objects.filter(
            created_by_user=request.user
        ).select_related("service").first()

        if not user_package or not user_package.service:
            return Response(
                {"detail": "UserServicePackage topilmadi"},
                status=status.HTTP_404_NOT_FOUND
            )

        if user_package.is_expired:
            return Response(
                {"detail": "Paket muddati tugagan", "expires_at": user_package.expires_at},
                status=status.HTTP_403_FORBIDDEN,
            )

        # 3️⃣ 🔥 JSONField ichidan book_id bo‘yicha DUBLIKAT TEKSHIRUV
        already_used = UserServicePackageItemUse.objects.filter(
            usp=user_package,
            psi__package_service__id=psi_id,
            is_success=True,
            response_data__byulleten_id=byulleten.id
        ).exists()

        if already_used:
            return Response(
                {
                    "detail": "Bu byulleten allaqachon yuklab olingan",
                    "byulleten_id": byulleten.id
                },
                status=status.HTTP_400_BAD_REQUEST
            )

        # 4️⃣ Limit + reservation
        try:
            with transaction.atomic():

                psi = PackageServiceItem.objects.select_for_update().get(
                    package_service__id=psi_id,
                    package=user_package.service
                )

                used_count = UserServicePackageItemUse.objects.filter(
                    usp=user_package,
                    psi=psi,
                    is_success=True
                ).count()

                if psi.is_exhausted(used_count):
                    return Response(
                        {
                            "detail": "Sizning limitingiz tugagan!",
                            "limit": psi.limit,
                            "used_count": used_count
                        },
                        status=status.HTTP_400_BAD_REQUEST
                    )

                reserved_use = UserServicePackageItemUse.objects.create(
                    usp=user_package,
                    psi=psi,
                    is_success=False,
                    request_data=request.query_params.dict(),
                    response_data=None
                )

        except PackageServiceItem.DoesNotExist:
            return Response(
                {"detail": "Berilgan psi id user paketiga tegishli emas"},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            return Response(
                {"detail": "Ichki xato (reservation)", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 5️⃣ Response data yozish
        try:
            reserved_use.response_data = {
                "byulleten_id": byulleten.id,
                "byulleten_name": byulleten.name_uz,
                "byulleten_file": request.build_absolute_uri(byulleten.file.url) if byulleten.file else None,
            }
            reserved_use.is_success = True
            reserved_use.save(update_fields=["response_data", "is_success"])

        except Exception as e:
            return Response(
                {"detail": "Ichki xato (update reservation)", "error": str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        used_count_after = UserServicePackageItemUse.objects.filter(
            usp=user_package,
            psi=psi,
            is_success=True
        ).count()

        return Response(
            {
                "detail": "Byulleten muvaffaqiyatli yuklandi",
                "limit": psi.limit,
                "used_count_after": used_count_after,
                "service_response": reserved_use.response_data
            },
            status=status.HTTP_201_CREATED
        )


class MyDownloadedByulletens(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        psi_id = request.query_params.get("package_service_id")
        if not psi_id:
            return Response(
                {"detail": "psi query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        psi_id = int(psi_id)

        user_package = UserServicePackage.objects.filter(
            created_by_user=request.user,
        ).select_related("service").first()

        if not user_package:
            return Response(
                {"detail": "UserServicePackage topilmadi"},
                status=status.HTTP_404_NOT_FOUND
            )

        used_items = UserServicePackageItemUse.objects.filter(
            usp=user_package,
            psi__package_service__id=psi_id,
        ).order_by('-created_at')


        response_data = []
        for item in used_items:
            response_data.append({
                "response_data": item.response_data,
                "used_at": item.created_at
            })

        return Response({
            "detail": "Foydalanuvchi yuklab olgan byulletenlar",
            "byulletens": response_data
        }, status=status.HTTP_200_OK)



class AboutPortalListView(ListAPIView):
    queryset = AboutPortal.objects.all()
    serializer_class = AboutPortalSerializer


class HomeStatsAPIView(APIView):
    """GET /api/common/home-stats/ — bosh sahifadagi "Raqamlarda platforma" bloki (U-08). 1 soat kesh."""

    def get(self, request):
        data = cache.get("home_stats")
        if data is None:
            from django.db import connection
            from apps.additional_services.models import IndustrialProduct, Ktut
            from apps.book_market.models import Book

            # 3,5 mln qatorli jadval uchun COUNT(*) o'rniga PostgreSQL statistikasi (taxminiy, tez)
            trade_records = None
            if connection.vendor == "postgresql":
                with connection.cursor() as cursor:
                    cursor.execute("SELECT reltuples::bigint FROM pg_class WHERE relname = 'additional_services_tradedata'")
                    row = cursor.fetchone()
                    trade_records = int(row[0]) if row and row[0] and row[0] > 0 else None
            if trade_records is None:
                from apps.additional_services.models import TradeData
                trade_records = TradeData.objects.count()

            data = {
                "enterprises": Ktut.objects.count(),
                "trade_records": trade_records,
                "industrial_products": IndustrialProduct.objects.count(),
                "books": Book.objects.filter(is_active=True).count(),
                "services": Service.objects.filter(is_active=True).count(),
                "users": User.objects.count(),
            }
            cache.set("home_stats", data, timeout=3600)
        return Response(data)
