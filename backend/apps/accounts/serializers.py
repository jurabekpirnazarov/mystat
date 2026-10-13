from rest_framework_simplejwt.tokens import RefreshToken, TokenError
from rest_framework.exceptions import AuthenticationFailed
from rest_framework import serializers
from collections import OrderedDict

from django.utils.encoding import smart_str, force_str, DjangoUnicodeDecodeError
from django.contrib.auth.tokens import PasswordResetTokenGenerator
from django.utils.http import urlsafe_base64_decode
from django.contrib.auth import authenticate
from django.conf import settings

from apps.accounts.models import Subscribe, User
from apps.common.utils import TelegramTokenManager
from apps.services.models import UserServicePackage, ServicePackage, PackageServiceItem, PackageService


class JSONSerializerField(serializers.Field):
    """ Serializer for JSONField -- required to make field writable"""

    def to_internal_value(self, data):
        return data

    def to_representation(self, value):
        return value


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(
        min_length=6, max_length=68, write_only=True)
    password_confirmation = serializers.CharField(
        min_length=6, max_length=68, write_only=True)
    first_name = serializers.CharField(max_length=255, required=True)

    class Meta:
        model = User
        fields = ("first_name", "last_name", "phone_number", "username",
                  'role', "password", "password_confirmation")

    def validate(self, attrs):
        password = attrs.get("password")
        password_confirmation = attrs.pop("password_confirmation")
        if password != password_confirmation:
            raise serializers.ValidationError(
                {"password": "Password fields didn't match"})
        return attrs


class LoginSerializer(serializers.ModelSerializer):
    username = serializers.CharField()
    password = serializers.CharField(
        max_length=68, min_length=6, write_only=True)
    tokens = serializers.SerializerMethodField(read_only=True)

    @staticmethod
    def get_tokens(obj):
        user = User.objects.get(username=obj["username"])
        return {
            "refresh": user.tokens["refresh"],
            "access": user.tokens["access"]
        }

    class Meta:
        model = User
        fields = ("id", "username", "password", "tokens")

    def validate(self, data):
        username = data.get('username')
        password = data.get('password')
        request = self.context.get("request")
        user = authenticate(request=request, username=username, password=password)
        if not user:
            raise AuthenticationFailed(
                {"success": False, "message": "Неверный логин или пароль"})
        return data


class EmailVerificationSerializer(serializers.ModelSerializer):
    token = serializers.CharField(max_length=555)

    class Meta:
        model = User
        fields = ["token"]


class ResetPasswordEmailRequestSerializer(serializers.Serializer):
    email = serializers.EmailField(min_length=2)

    redirect_url = serializers.CharField(max_length=500, required=False)

    class Meta:
        fields = ["email"]


class PasswordUpdateSerializer(serializers.Serializer):
    password_true = serializers.CharField(
        min_length=6, max_length=68, write_only=True)
    password = serializers.CharField(
        min_length=6, max_length=68, write_only=True)
    password2 = serializers.CharField(
        min_length=6, max_length=68, write_only=True)

    def validate(self, attrs):
        password = attrs.get("password")
        password_true = attrs.get("password_true")
        password2 = attrs.get("password")
        user = self.context.get("user")
        user = authenticate(email=user.email, password=password_true)
        if not user:
            raise AuthenticationFailed(
                {"success": False, "message": "Password is incorrect"})
        if password != password2:
            raise AuthenticationFailed(
                {"success": False, "message": "Passwords do not match"})
        attrs["user"] = user
        return attrs


class SetNewPasswordSerializer(serializers.Serializer):
    password = serializers.CharField(
        min_length=6, max_length=68, write_only=True)
    token = serializers.CharField(
        min_length=1, write_only=True)
    uidb64 = serializers.CharField(
        min_length=1, write_only=True)

    class Meta:
        fields = ["password", "token", "uidb64"]

    def validate(self, attrs):
        try:
            password = attrs.get("password")
            token = attrs.get("token")
            uidb64 = attrs.get("uidb64")
            id = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(id=id)
            if not PasswordResetTokenGenerator().check_token(user, token):
                raise AuthenticationFailed("The reset link is invalid", 401)
            user.set_password(password)
            user.save()

            return (user)
        except Exception as e:
            raise AuthenticationFailed("The reset link is invalid", 401)


class LogoutSerializer(serializers.Serializer):
    refresh = serializers.CharField()

    default_error_message = {
        "bad_token": ("Token is expired or invalid",)
    }

    def validate(self, attrs):
        self.token = attrs["refresh"]
        return attrs

    def save(self, **kwargs):
        try:
            RefreshToken(self.token).blacklist()
            
        except TokenError:
            pass


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("first_name", "last_name", "middle_name", "gender", "birth_date", "username", "avatar")


class UserListSerializer(serializers.ModelSerializer):
    has_service_package = serializers.SerializerMethodField()
    service_package_id = serializers.SerializerMethodField()
    service_package_name_uz = serializers.SerializerMethodField()
    service_package_name_ru = serializers.SerializerMethodField()
    service_package_name_cry = serializers.SerializerMethodField()

    class Meta:
        model = User
        exclude = ("password",)

    def _get_latest_usp(self, obj) -> UserServicePackage | None:

        qs = getattr(obj, "user_service_package_users", None)
        if qs is None:
            return None

        try:
            return qs.order_by("-created_at", "-id").first()
        except Exception:
            return qs.order_by("-id").first()

    def get_has_service_package(self, obj):
        qs = getattr(obj, "user_service_package_users", None)
        if qs is None:
            return False
        return qs.exists()

    def get_service_package_id(self, obj):
        usp = self._get_latest_usp(obj)
        if not usp:
            return None
        return getattr(usp.service, "id", None)

    def get_service_package_name_uz(self, obj):
        usp = self._get_latest_usp(obj)
        return getattr(getattr(usp, "service", None), "name_uz", None) if usp else None

    def get_service_package_name_ru(self, obj):
        usp = self._get_latest_usp(obj)
        return getattr(getattr(usp, "service", None), "name_ru", None) if usp else None

    def get_service_package_name_cry(self, obj):
        usp = self._get_latest_usp(obj)
        return getattr(getattr(usp, "service", None), "name_cry", None) if usp else None


class PackageServiceShortSerializer(serializers.ModelSerializer):
    class Meta:
        model = PackageService
        fields = ("id", "name_uz", "name_ru", "name_cry", "slug")

class PackageServiceItemSerializer(serializers.ModelSerializer):
    package_service = PackageServiceShortSerializer(read_only=True)

    class Meta:
        model = PackageServiceItem
        fields = ("id", "name_uz", "name_ru", "name_cry", "limit", "package_service")


class PackageServiceGroupSerializer(serializers.Serializer):
    package_service = PackageServiceShortSerializer()
    items = PackageServiceItemSerializer(many=True)

class UserUpdateEmailSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ("email",)


class UserUpdateSerializer(serializers.ModelSerializer):
    telegram_bot_link = serializers.SerializerMethodField(read_only=True)

    def get_telegram_bot_link(self, obj):
        reg_token = TelegramTokenManager.generate_token(obj.id)
        return f"https://t.me/{settings.TELEGRAM_BOT_USERNAME}?start={reg_token}"

    class Meta:
        model = User
        fields = ("first_name", "last_name", "middle_name",
                  "gender", "birth_date", "username", "role", "telegram_bot_link")
        read_only_fields = ("email",)


class TwoFactorCheckSerializer(serializers.Serializer):
    code = serializers.IntegerField(write_only=True, )


class SubscribeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Subscribe
        fields = ("email",)


class YearlyUserStatSerializer(serializers.Serializer):
    year = serializers.IntegerField()
    months = serializers.DictField(child=serializers.IntegerField())

