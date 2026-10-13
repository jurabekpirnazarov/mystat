import os, json
from django.shortcuts import redirect
from django.conf import settings
from rest_framework import status
from rest_framework.response import Response
from rest_framework.generics import GenericAPIView

from apps.accounts import serializers
from apps.accounts.social_auth.providers import Apple, Facebook, Google
from apps.accounts.social_auth.register import register_social_user
from .serializers import FacebookSocialAuthSerializer, GoogleSocialAuthSerializer


class GoogleSocialAuthView(GenericAPIView):
    pagination_class = None
    serializer_class = GoogleSocialAuthSerializer

    def get(self, request):
        google_cliend_id = os.environ.get("GOOGLE_CLIENT_ID")
        redirect_uri = os.environ.get("GOOGLE_REDIRECT_URI")
        scope = "email+profile"
        authorize_url = f"https://accounts.google.com/o/oauth2/auth?client_id={google_cliend_id}&response_type=code&redirect_uri={redirect_uri}&scope={scope}"
        return redirect(
            authorize_url
        )

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data["success"] = True
        return Response(data, status=status.HTTP_200_OK)


class FacebookSocialAuthView(GenericAPIView):

    serializer_class = FacebookSocialAuthSerializer

    def get(self,request):
        facebook_cliend_id = os.environ.get("FACEBOOK_CLIENT_ID")
        redirect_uri = os.environ.get("FACEBOOK_REDIRECT_URI")
        scope = "email,public_profile"
        authorize_url = f"https://www.facebook.com/v11.0/dialog/oauth?client_id={facebook_cliend_id}&redirect_uri={redirect_uri}&scope={scope}"
        return redirect(
            authorize_url
        )

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data["success"] = True
        return Response(data, status=status.HTTP_200_OK)
    
class AppleSocialAuthView(GenericAPIView):
    pagination_class = None

    def get(self, request):
        apple_client_id = os.environ.get("APPLE_CLIENT_ID")
        redirect_uri = os.environ.get("APPLE_REDIRECT_URI")
        scope = "email+name"
        authorize_url = f"https://appleid.apple.com/auth/authorize?response_type=code&client_id={apple_client_id}&redirect_uri={redirect_uri}&scope={scope}&response_mode=form_post&state=state&nonce=nonce"
        return redirect(
            authorize_url
        )

    def post(self, request):
        serializer = self.serializer_class(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        data["success"] = True
        return Response(data, status=status.HTTP_200_OK)


class GoogleCallBackView(GenericAPIView):
    pagination_class = None

    def get(self, request):
        code = request.GET.get("code")
        google_instance = Google()
        user_data = google_instance.validate(code)
        email = user_data.get("email")
        first_name = user_data.get("given_name")
        last_name = user_data.get("family_name", None)
        user_info = register_social_user(
            provider="google",
            first_name=first_name,
            email=email,
            last_name=last_name,
        )
        client_redirect_uri = os.environ.get("CLIENT_OAUTH_REDIRECT_URI") 
        redirect_uri = f"{client_redirect_uri}?email={email}&access_token={user_info['tokens']['access']}&refresh_token={user_info['tokens']['refresh']}&first_name={first_name}&last_name={last_name}"
        return redirect(redirect_uri)
    
class FacebookCallBackView(GenericAPIView):
    pagination_class = None

    def get(self, request):
        code = request.GET.get("code")
        facebook_instance = Facebook()
        user_data = facebook_instance.validate(code)
        email = user_data.get("email")
        first_name = user_data.get("first_name")
        last_name = user_data.get("last_name")
        user_info = register_social_user(
            provider="facebook",
            first_name=first_name,
            email=email,
            last_name=last_name,
        )
        client_redirect_uri = os.environ.get("CLIENT_OAUTH_REDIRECT_URI") 
        redirect_uri = f"{client_redirect_uri}?email={email}&access_token={user_info['tokens']['access']}&refresh_token={user_info['tokens']['refresh']}&first_name={first_name}&last_name={last_name}"
        return redirect(redirect_uri)
    
class AppleCallBackView(GenericAPIView):
    pagination_class = None

    def get(self, request):
        code = request.GET.get("code")
        apple_instance = Apple()
        user_data = apple_instance.validate(code)
        email = user_data.get("email")
        first_name = user_data.get("first_name")
        last_name = user_data.get("last_name")
        user_info = register_social_user(
            provider="apple",
            first_name=first_name,
            email=email,
            last_name=last_name,
        )
        client_redirect_uri = os.environ.get("CLIENT_OAUTH_REDIRECT_URI") 
        redirect_uri = f"{client_redirect_uri}?email={email}&access_token={user_info['tokens']['access']}&refresh_token={user_info['tokens']['refresh']}&first_name={first_name}&last_name={last_name}"
        return redirect(redirect_uri)