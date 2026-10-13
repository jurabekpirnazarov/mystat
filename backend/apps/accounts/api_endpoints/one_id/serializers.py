from rest_framework import serializers

from apps.accounts.models import User


class OneIdTokenSerializer(serializers.Serializer):
    """
    **OneID** orqali kirishda **token** yaratib berish uchun serializer
    """

    access_token = serializers.CharField(required=False)


class UserSerializer(serializers.Serializer):
    """
    **OneID** orqali kirishda user ma'lumotlarini olish uchun serializer
    """

    class Meta:
        model = User
        fields = [
            "id",
            "role",
            "first_name",
            "last_name",
            "middle_name",
            "pinfl",
            "avatar",
            "username",
            "email",
            "updated_at",
            "date_joined",
            "is_active",
        ]
