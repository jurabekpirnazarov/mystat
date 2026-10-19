from collections import defaultdict
from datetime import datetime
from django.db.models import Count
from django.db.models.functions import ExtractMonth
import random
from django.http import HttpResponseRedirect
from rest_framework.response import Response
from django.urls import reverse
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.encoding import (
    smart_str,
    force_str,
    smart_bytes,
    DjangoUnicodeDecodeError,
)
from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiTypes

from django.utils.http import urlsafe_base64_decode, urlsafe_base64_encode
from django.contrib.sites.shortcuts import get_current_site
from rest_framework import generics, status, views, permissions
from apps.accounts.models import Subscribe, User
from apps.accounts.serializers import (
    ResetPasswordEmailRequestSerializer,
    SubscribeSerializer,
    TwoFactorCheckSerializer,
    PasswordUpdateSerializer,
    SetNewPasswordSerializer,
    UserUpdateEmailSerializer,
    UserUpdateSerializer,
    RegisterSerializer,
    UserListSerializer,
    LogoutSerializer,
    LoginSerializer,
    YearlyUserStatSerializer, PackageServiceShortSerializer, PackageServiceGroupSerializer
)
from .permissions import IsOwnUserOrReadOnly
from django.core.mail import send_mail
from django.conf import settings
from django.shortcuts import get_object_or_404
from rest_framework.permissions import  AllowAny, IsAuthenticated
from rest_framework.views import APIView
from django.core.cache import cache

from ..common.models import InformationModel
from ..contracts.models import Contract
from ..services.api.ServiceView.serializers import PackageServiceItemSerializer
from ..services.models import PackageServiceItem, UserServicePackage


# from .permissions import IsAuthenticated


class AccountRegisterView(generics.GenericAPIView):
    serializer_class = RegisterSerializer

    def post(self, request):
        user = request.data
        user['auth_provider'] = 'username'
        serializer = self.serializer_class(data=user)
        serializer.is_valid(raise_exception=True)
        user = User.objects.create_user(**serializer.validated_data)
        tokens = user.tokens
        user_data = serializer.data
        user_data["tokens"] = tokens
        return Response(
            {"success": True, "data": user_data}, status=status.HTTP_201_CREATED
        )


class LoginAPIView(generics.GenericAPIView):
    serializer_class = LoginSerializer
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        if serializer.is_valid():
            return Response(
                {"success": True, "data": serializer.data}, status=status.HTTP_200_OK
            )
        return Response(
            {"success": False, "error": "Invalid credentials"},
            status=status.HTTP_400_BAD_REQUEST,
        )


class UpdatePassword(generics.UpdateAPIView):
    serializer_class = PasswordUpdateSerializer
    permission_classes = (IsAuthenticated,)

    def update(self, request, *args, **kwargs):
        user = request.user
        sz = PasswordUpdateSerializer(
            data=request.data, context={"user": user}, many=False
        )
        sz.is_valid(raise_exception=True)
        password = request.data.get("password")
        user.set_password(password)
        user.save()
        return Response({"status": True})


class RequestPasswordResetEmail(generics.GenericAPIView):
    serializer_class = ResetPasswordEmailRequestSerializer

    def post(self, request):
        email = request.data.get("email", "")
        user = get_object_or_404(User, email=email)
        uidb64 = urlsafe_base64_encode(smart_bytes(user.id))
        token = PasswordResetTokenGenerator().make_token(user)
        current_site = get_current_site(request=request).domain
        relativeLink = reverse(
            "user:password-reset-confirm", kwargs={"uidb64": uidb64, "token": token}
        )
        absurl = "http://" + current_site + relativeLink
        email_body = f"Привет! Используйте ссылку ниже, чтобы сбросить пароль: {absurl}"

        send_mail(
            "Сбросить пароль",
            email_body,
            settings.EMAIL_HOST_USER,
            [user.email],
            fail_silently=False,
        )
        return Response(
            {"success": "Мы отправили вам ссылку для сброса пароля"},
            status=status.HTTP_200_OK,
        )


class PasswordTokenCheckAPI(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer

    def get(self, request, uidb64, token):
        id = smart_str(urlsafe_base64_decode(uidb64))
        user = User.objects.get(id=id)

        redirect_url = f"{settings.FRONTED_URL}/resetend"

        try:
            id = smart_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)

            if not PasswordResetTokenGenerator().check_token(user, token):
                if len(redirect_url) > 3:
                    return HttpResponseRedirect(
                        f"{settings.FRONTED_URL}/404" + "?token_valid=False"
                    )
                else:
                    return HttpResponseRedirect(
                        settings.FRONTED_URL + "?token_valid=False"
                    )

            if redirect_url and len(redirect_url) > 3:
                return HttpResponseRedirect(
                    redirect_url + "?token_valid=True&message=Credentials Valid&uidb64=" + uidb64 + "&token=" + token
                )
            else:
                return HttpResponseRedirect(settings.FRONTED_URL + "?token_valid=False")

        except DjangoUnicodeDecodeError as identifier:
            try:
                if not PasswordResetTokenGenerator().check_token(user):
                    return HttpResponseRedirect(
                        f"{settings.FRONTED_URL}/404" + "?token_valid=False"
                    )

            except UnboundLocalError as e:
                return Response(
                    {"error": "Token is not valid, please request a new one"},
                    status=status.HTTP_400_BAD_REQUEST,
                )


class SetNewPasswordAPIView(generics.GenericAPIView):
    serializer_class = SetNewPasswordSerializer
    permission_classes = (permissions.AllowAny,)

    def put(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        return Response(
            {"success": True, "message": "Пароль успешно изменен"},
            status=status.HTTP_200_OK,
        )


class LogoutAPIView(generics.GenericAPIView):
    serializer_class = LogoutSerializer
    permission_classes = (IsAuthenticated,)



    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()

        return Response(status=status.HTTP_204_NO_CONTENT)


class UserList(generics.ListAPIView):
    queryset = User.objects.all()
    serializer_class = UserListSerializer

    def list(self, request, *args, **kwargs):
        queryset = self.get_queryset()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)


class UserUpdateView(generics.RetrieveUpdateDestroyAPIView):
    queryset = User.objects.all()
    serializer_class = UserUpdateEmailSerializer
    permission_classes = (IsAuthenticated,)

    lookup_field = "username"

    def update(self, request, *args, **kwargs):
        if request.user.username != kwargs.get("username"):
            return Response(
                f"Вы не можете изменить почту пользователя {request.user.username}",
                status=status.HTTP_400_BAD_REQUEST,
            )
        instance = self.get_object()
        username = instance.username
        serializer = self.get_serializer(instance, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        if status.HTTP_200_OK:
            return Response(
                f"Почта пользователя {username} изменен на {request.data['username']}",
                status=status.HTTP_200_OK,
            )
        else:
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserRetrieveUpdate(generics.RetrieveUpdateAPIView):
    serializer_class = UserUpdateSerializer
    permission_classes = (IsAuthenticated, IsOwnUserOrReadOnly)

    def get_object(self):
        return self.request.user

    def update(self, request, *args, **kwargs):
        user = self.get_object()
        sz = UserUpdateSerializer(data=request.data, instance=user, many=False)
        sz.is_valid(raise_exception=True)
        sz.save()
        return Response(sz.data, status=status.HTTP_200_OK)


class TwoFactorAuthView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request, *args, **kwargs):
        code = "".join([str(random.randint(0, 9)) for _ in range(6)])
        email = request.user.email

        cache.set(email, code, timeout=300)
        send_mail(
            "2FA code",
            f"Your 2FA code is: {code}",
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )
        return Response({"message": "Код отправлен"}, status=status.HTTP_200_OK)


class CheckTwoFactorAuthView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)
    serializer_class = TwoFactorCheckSerializer

    def post(self, request, *args, **kwargs):
        data = request.data
        user = request.user
        email = user.email
        sz = TwoFactorCheckSerializer(data=data, many=False)
        sz.is_valid(raise_exception=True)
        code = sz.validated_data.get("code", 0)
        saved_code = cache.get(email)
        if saved_code is not None and int(saved_code) == int(code):
            user.is_verify = True
            user.save()
            cache.delete(email)
            return Response({"email": email, "verify": True}, status=status.HTTP_200_OK)
        return Response(status=status.HTTP_400_BAD_REQUEST)


class SubscribeView(generics.CreateAPIView):
    permission_classes = (AllowAny,)
    serializer_class = SubscribeSerializer

    def send_message(self, email):
        send_mail(
            "Subscription to News",
            'You have successfully subscribed to news updates.<img src="https://tourmad.uz/static/media/logo2.a39c56e04e60300859dc.png" alt="Image" />',
            settings.EMAIL_HOST_USER,
            [email],
            fail_silently=False,
        )

    def post(self, request):
        email = request.data.get("email")
        if Subscribe.objects.filter(email=email).exists():
            return Response(
                {"message": "You are already subscribed to news updates"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        self.send_message(email)
        return Response(
            {"message": "You have successfully subscribed to news updates"},
            status=status.HTTP_201_CREATED,
        )


class UserProfileView(generics.RetrieveAPIView):
    serializer_class = UserListSerializer
    permission_classes = (IsAuthenticated,)

    def get_object(self):
        return self.request.user


UZ_MONTHS = {
    1: "yanvar",
    2: "fevral",
    3: "mart",
    4: "aprel",
    5: "may",
    6: "iyun",
    7: "iyul",
    8: "avgust",
    9: "sentyabr",
    10: "oktyabr",
    11: "noyabr",
    12: "dekabr",
}

class YearlyUserStatAPIView(APIView):
    @extend_schema(
        parameters=[
            OpenApiParameter(
                name="year",
                type=OpenApiTypes.INT,
                location=OpenApiParameter.QUERY,
                required=True,
                description="Statistika olinadigan yil"
            )
        ],
        responses=YearlyUserStatSerializer
    )
    def get(self, request, *args, **kwargs):
        current_year = datetime.now().year
        # Bosh sahifadagi ommaviy grafik: faqat oylik agregat sonlar, shaxsiy ma'lumot yo'q
        try:
            year = int(request.query_params.get("year", current_year))
        except (TypeError, ValueError):
            year = current_year

        q = (
            User.objects
            .filter(date_joined__year=year)
            .annotate(month=ExtractMonth("date_joined"))
            .values("month")
            .annotate(count=Count("id"))
            .order_by("month")
        )
        months = {UZ_MONTHS[i]: 0 for i in range(1, 13)}
        for row in q:
            month_num = row["month"]
            months[UZ_MONTHS[month_num]] = row["count"]

        payload = {"year": year, "months": months}
        serializer = YearlyUserStatSerializer(payload)
        return Response(serializer.data)



class UserPackageItemsGroupedView(generics.GenericAPIView):
    permission_classes = (IsAuthenticated,)

    def get(self, request, *args, **kwargs):
        user = request.user

        contract = Contract.objects.filter(user=user, status='processing').order_by('-created_at').first()

        if not contract:
            return Response({"error": "Contract not found"}, status=status.HTTP_404_NOT_FOUND)
        usp = contract.package

        if not usp:
            return Response([], status=status.HTTP_200_OK)

        qs = PackageServiceItem.objects.filter(
            package=usp
        ).select_related("package_service").order_by("package_service_id", "id")

        groups = defaultdict(list)
        ps_instances = {}

        for item in qs:
            ps = item.package_service
            ps_instances[ps.id] = ps
            groups[ps.id].append(item)

        out = []
        # Har bir service bo‘yicha
        for ps_id, items in groups.items():
            ps_inst = ps_instances.get(ps_id)
            ps_data = PackageServiceShortSerializer(
                ps_inst,
                context={"request": request}
            ).data

            items_data = []

            for item in items:
                item_data = PackageServiceItemSerializer(
                    item,
                    context={"request": request}
                ).data

                # DEFAULT file = None
                item_data["file"] = None

                # Faqat package_service.id == 3 uchun logika
                if ps_id == 3:
                    info = None

                    if item.name_uz == "O‘zbekiston Respublikasining ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi":
                        info = InformationModel.objects.filter(is_main=True).first()

                    elif item.name_uz == "Viloyatning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi":
                        info = InformationModel.objects.filter(region=user.location.region).first()
                    elif item.name_uz == "Tuman va shaharlarning ijtimoiy-iqtisodiy holati bo‘yicha axborotnomasi":
                        info = InformationModel.objects.filter(district=user.location).first()

                    if info and info.file:
                        item_data["file"] = request.build_absolute_uri(info.file.url)

                items_data.append(item_data)

            out.append({
                "package_service": ps_data,
                "items": items_data
            })

        # Contract ma’lumotlarini oxiriga qo‘shish
        out.append({
            "contract_id": contract.id,
            "contract_number": contract.contract_number,
        })

        return Response(out, status=status.HTTP_200_OK)
