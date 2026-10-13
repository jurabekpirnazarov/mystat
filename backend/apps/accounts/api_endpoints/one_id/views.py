import requests
from django.conf import settings
from django.contrib.auth.models import update_last_login
from django.shortcuts import redirect
from django.utils.translation import gettext_lazy as _
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics, status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import RefreshToken

from apps.accounts.api_endpoints.one_id.utils import create_organization
from apps.accounts.models import User
from apps.organizations.models import Organization

from .openapi_params import oneID_code_param
from .serializers import OneIdTokenSerializer


class OneIdView(APIView):
    """
    ``GET`` request to **OneId**

    Generate url to redirect one id login page,
    If login succeed redirects to ``http://localhost:8000/login-oneid/access_token/{access_token}``
    """

    url_path = "api/accounts/login/oneid"

    permission_classes = [AllowAny]
    url = f"https://sso.egov.uz/sso/oauth/Authorization.do?response_type=one_code&client_id={settings.ONE_ID_CLIENT_ID}&redirect_uri={settings.MAIN_URL}/{url_path}&scope=user_id&state=state"  # noqa

    def get(self, request, *args, **kwargs):
        return Response({"one_id_url": self.url})


class OneIdLoginView(generics.GenericAPIView):
    """
        get:
            **Endpoint for one id system**
    -
            The system will send code to get access token
        post:
            **Obtain token**

            Returns jwt token if log in success
    """

    queryset = User.objects.none()
    serializer_class = OneIdTokenSerializer
    permission_classes = [AllowAny]

    url = "https://sso.egov.uz/sso/oauth/Authorization.do"
    access_token = None

    def get_jwt_token(self, auth_data, request):
        pinfl = auth_data.get("pin")
        user_id = auth_data.get("user_id")
        full_name = auth_data.get("full_name", "")
        first_name = auth_data.get("first_name", "")
        last_name = auth_data.get("sur_name", "")
        mid_name = auth_data.get("mid_name", "")
        legal_info = auth_data.get("legal_info", {})

        if not pinfl:
            return None, _("JShShIR kiritilmagan.")
        try:
            user = User.objects.get(pinfl=pinfl.strip())
        except User.DoesNotExist:
            try:
                user = User.objects.get(username=user_id)
                user.pinfl = pinfl.strip()
                if not user.full_name and full_name:
                    user.full_name = full_name
                user.save()
            except User.DoesNotExist:
                # try:
                    if not full_name:
                        name_parts = [first_name, mid_name, last_name]
                        full_name = " ".join(part for part in name_parts if part)

                    user = User.objects.create(
                        username=user_id,
                        pinfl=pinfl.strip(),
                        first_name=first_name,
                        last_name=last_name,
                    )
                    if legal_info:
                        legal_info = legal_info[0]
                        org = getattr(user, 'organization', None)
                        user.user_type = "legal_entity"
                        if not org:
                            create_organization(user, legal_info)
                        user.save()
                # except Exception as e:
                    # return None, f"Foydalanuvchi yaratishda xatolik: {str(e)}"

        refresh = RefreshToken.for_user(user)
        jwt_token = {
            "refresh": str(refresh),
            "access": str(refresh.access_token),
        }
        if api_settings.UPDATE_LAST_LOGIN:
            update_last_login(None, user)
        return jwt_token, "Success"

    def poster(self, data):
        if settings.TESTING:
            if data.get("grant_type") == "one_authorization_code":
                return {
                    "access_token": "test_access_token",
                }
            else:
                return {}
        return requests.post(self.url, data=data)

    def get_access_token(self, code):
        data = {
            "grant_type": "one_authorization_code",
            "client_id": settings.ONE_ID_CLIENT_ID,
            "client_secret": settings.ONE_ID_CLIENT_SECRET,
            "redirect_uri": settings.SITE_URL,
            "code": code,
        }
        print(code,data)
        response = self.poster(data)
        print(response,response.text)
        if isinstance(response, dict):
            return response.get("access_token")
        if response.ok:
            return response.json().get("access_token")
        else:
            return None

    def get_auth_data(self, access_token):
        data = {
            "grant_type": "one_access_token_identify",
            "client_id": settings.ONE_ID_CLIENT_ID,
            "client_secret": settings.ONE_ID_CLIENT_SECRET,
            "access_token": access_token,
            "scope": "user_id",
        }
        response = self.poster(data)
        print(response,response.text)
        if isinstance(response, dict):
            return response
        if response.ok:
            return response.json()
        else:
            return None

    @swagger_auto_schema(manual_parameters=[oneID_code_param])
    def get(self, request, *args, **kwargs):
        code = request.GET.get("code", None)
        if code:
            access_token = self.get_access_token(code)
            if access_token:
                return redirect(f"{settings.MAIN_URL}/api/accounts/login/oneid/access_token/{access_token}")

            else:
                message = "Could not fetch access token"
                status_code = status.HTTP_406_NOT_ACCEPTABLE
        else:
            message = "Code is not provided"
            status_code = status.HTTP_400_BAD_REQUEST

        return Response({"message": message}, status=status_code)

    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(request.data)
        access_token = serializer.data.get("access_token")
        if access_token is None:
            return Response(
                {"message": "Access token is not provided"},
                status=status.HTTP_400_BAD_REQUEST,
            )
        auth_data = self.get_auth_data(access_token)

        print("auth_data", auth_data)
        if auth_data:
            jwt_token, message = self.get_jwt_token(auth_data, request)
            print("jwt_token", jwt_token, message)
            if jwt_token:
                return Response(jwt_token)

            return Response({"detail": message}, status=status.HTTP_403_FORBIDDEN)

        return Response({"detail": "Can't receive auth_data from server"}, status=status.HTTP_403_FORBIDDEN)


class OneIdAccessTokenView(APIView):
    """
    Endpoint to handle access token after redirect from OneId login.
    """

    permission_classes = [AllowAny]

    def get(self, request, access_token, *args, **kwargs):
        if access_token:
            url = f"{settings.BACKEND_URL}/api/accounts/login/oneid/"
            req = requests.post(
                url,
                data={
                    "access_token": access_token,
                },
            )

            if req.ok:
                res = req.json()
                return redirect(
                    f"{settings.SITE_URL}/auth/oneid/callback/?access_token={res.get('access')}&refresh_token={res.get('refresh')}"
                )
            else:
                return Response(
                    {"message": "Failed to get access token from OneId", "response": req.status_code},
                    status=status.HTTP_400_BAD_REQUEST,
                )
        return redirect(f"{settings.SITE_URL}/auth/oneid/callback/?error=Access token is not provided")
