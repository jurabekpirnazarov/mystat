from rest_framework import serializers
from .providers import Google, Facebook
from .register import register_social_user
import urllib.parse


class GoogleSocialAuthSerializer(serializers.Serializer):
    data = serializers.CharField(write_only=True, required=True)

    def validate_data(self, data):
        data = urllib.parse.unquote(data)
        google_instance = Google()
        try:
            user_data = google_instance.validate(data)
            email = user_data.get("email")
            first_name = user_data.get("given_name")
            last_name = user_data.get("family_name", None)
            return register_social_user(
                provider="google",
                first_name=first_name,
                email=email,
                last_name=last_name,
            )
        except Exception as e:
            raise serializers.ValidationError({"message": str(e)})


class FacebookSocialAuthSerializer(serializers.Serializer):
    data = serializers.CharField(write_only=True, required=True)

    def validate_data(self, data):
        data = urllib.parse.unquote(data)
        facebook_instance = Facebook()
        try:
            user_data = facebook_instance.validate(data)
            email = user_data.get("email")
            first_name = user_data.get("first_name")
            last_name = user_data.get("last_name")
            return register_social_user(
                provider="facebook",
                first_name=first_name,
                email=email,
                last_name=last_name,
            )
        except Exception as e:
            raise serializers.ValidationError({"message": str(e)})
