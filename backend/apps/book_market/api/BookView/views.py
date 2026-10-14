from django_filters.rest_framework import DjangoFilterBackend
from rest_framework import generics
from rest_framework.generics import RetrieveAPIView
from rest_framework.permissions import IsAuthenticated
from django.db.models import Max
from apps.services.models import UserServicePackage, UserServicePackageItemUse, PackageServiceItem
from .filters import BookFilter
from .serializers import BookListSerializer, BookDetailSerializer, ElectronBookListSerializer
from apps.book_market.models import Book, BookOption
from django.db.models import Prefetch, Q
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.db import transaction
from django.shortcuts import get_object_or_404


class BookListAPIView(generics.ListAPIView):
    serializer_class = BookListSerializer
    filter_backends = [DjangoFilterBackend]
    filterset_class = BookFilter
    permission_classes = (IsAuthenticated,)


    def get_queryset(self):
        request = self.request
        min_price = request.query_params.get('min_price')
        max_price = request.query_params.get('max_price')
        book_type = request.query_params.get('book_type')

        option_qs = BookOption.objects.all()
        option_filter_q = Q()

        if book_type:
            option_qs = option_qs.filter(book_type__iexact=book_type)
            option_filter_q &= Q(options__book_type__iexact=book_type)

        if min_price:
            try:
                min_val = float(min_price)
                option_qs = option_qs.filter(price__gte=min_val)
                option_filter_q &= Q(options__price__gte=min_val)
            except ValueError:
                pass

        if max_price:
            try:
                max_val = float(max_price)
                option_qs = option_qs.filter(price__lte=max_val)
                option_filter_q &= Q(options__price__lte=max_val)
            except ValueError:
                pass

        qs = Book.objects.all()
        if option_filter_q:
            qs = qs.filter(option_filter_q).distinct()

        qs = qs.prefetch_related(Prefetch('options', queryset=option_qs))
        return qs


class BookDetailAPIView(RetrieveAPIView):
    queryset = Book.objects.all()
    serializer_class = BookDetailSerializer
    permission_classes = (IsAuthenticated, )
    lookup_field = 'id'


class BookYearsAPIView(APIView):
    def get(self, request):
        years = (
            Book.objects
            .values_list('year', flat=True)
            .distinct()
            .order_by('year')   # o'sish tartibida
        )
        return Response(list(years))  # JSON: [1998, 2001, 2005, ...]


class ElectronBookAPIView(APIView):
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

        latest_year = Book.objects.filter(
            options__book_type=BookOption.BookType.ElECTRON
        ).aggregate(max_year=Max("year"))["max_year"]

        if not latest_year:
            return Response([], status=200)

        e_books = Book.objects.filter(
            options__book_type=BookOption.BookType.ElECTRON,
            year=latest_year
        ).distinct()

        serializer = ElectronBookListSerializer(e_books, many=True, context={'request': request})
        data = {
            "books": serializer.data,
            "limit": psi.limit,
            "used_count_after": uses_count,
        }
        return Response(data)


class BookDownloadAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, book_id):

        book = get_object_or_404(Book, id=book_id)

        psi_id = request.query_params.get("package_service_id")
        if not psi_id:
            return Response(
                {"detail": "psi query param required"},
                status=status.HTTP_400_BAD_REQUEST
            )
        psi_id = int(psi_id)

        # 1️⃣ Elektron kitob tekshiruvi
        if not book.options.filter(
            book_type=BookOption.BookType.ElECTRON
        ).exists():
            return Response(
                {"detail": "Bu kitob elektron emas"},
                status=status.HTTP_400_BAD_REQUEST
            )

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
            response_data__book_id=book.id
        ).exists()

        if already_used:
            return Response(
                {
                    "detail": "Bu kitob allaqachon yuklab olingan",
                    "book_id": book.id
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

                if psi.limit <= 0 or used_count >= psi.limit:
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
                "book_id": book.id,
                "book_name": book.name_uz,
                "book_file": request.build_absolute_uri(book.file.url) if book.file else None,
                "book_image": request.build_absolute_uri(book.image_url.url) if book.image_url else None,
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
                "detail": "Kitob muvaffaqiyatli yuklandi",
                "limit": psi.limit,
                "used_count_after": used_count_after,
                "service_response": reserved_use.response_data
            },
            status=status.HTTP_201_CREATED
        )


class MyDownloadedBooks(APIView):
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
            # ✅ MUHIM JOY
        ).order_by('-created_at')


        response_data = []
        for item in used_items:
            response_data.append({
                "response_data": item.response_data,  # book_id + book_file.url
                "used_at": item.created_at
            })

        return Response({
            "detail": "Foydalanuvchi yuklab olgan elektron kitoblar",
            "books": response_data
        }, status=status.HTTP_200_OK)
