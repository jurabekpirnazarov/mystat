from django.urls import path, include

from apps.accounts.cabinet_views import CabinetSummaryAPIView, MyPaymentsAPIView, PreferencesAPIView
from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView, TokenBlacklistView
from apps.accounts.views import (
    LogoutAPIView,
    RequestPasswordResetEmail,
    CheckTwoFactorAuthView,
    PasswordTokenCheckAPI,
    SetNewPasswordAPIView,
    AccountRegisterView,
    SubscribeView,
    UserRetrieveUpdate,
    TwoFactorAuthView,
    UpdatePassword,
    UserUpdateView,
    LoginAPIView,
    UserProfileView,
    YearlyUserStatAPIView, UserPackageItemsGroupedView
)
from apps.accounts.api_endpoints.one_id.views import OneIdAccessTokenView, OneIdLoginView, OneIdView
from .api_endpoints import TokenGenerationView
from ..services.models import PackageServiceItem

app_name = "user"

urlpatterns = [
    path("register/", AccountRegisterView.as_view(), name="register"),
    path("login/", LoginAPIView.as_view(), name="login"),
    path("logout/", LogoutAPIView.as_view(), name="logout"),
    path('update-password/', UpdatePassword.as_view()),
    path('request-reset-email/', RequestPasswordResetEmail.as_view(),
         name="request-reset-email"),
    path('password-reset/<uidb64>/<token>/',
         PasswordTokenCheckAPI.as_view(), name='password-reset-confirm'),
    path('password-reset-complete/', SetNewPasswordAPIView.as_view(),
         name='password-reset-complete'),
    path("Token", TokenGenerationView.as_view(), name="Token"),
    path("TokenRefresh", TokenRefreshView.as_view(), name="token_refresh"),
    path("TokenVerify", TokenVerifyView.as_view(), name="token_verify"),
    #     path("UserList", UserList.as_view(), name="user-list"),
    path("update/email/<str:email>/", UserUpdateView.as_view(), name="update"),
    path('me/', UserRetrieveUpdate.as_view(), name="me"),
    path('me/package-items/', UserPackageItemsGroupedView.as_view(), name="me_package_items"),
    path("me/summary/", CabinetSummaryAPIView.as_view(), name="me_summary"),
    path("me/payments/", MyPaymentsAPIView.as_view(), name="me_payments"),
    path("me/preferences/", PreferencesAPIView.as_view(), name="me_preferences"),
    path('2fa/send/', TwoFactorAuthView.as_view()),
    path('2fa/check/', CheckTwoFactorAuthView.as_view()),
    path('subscribe/', SubscribeView.as_view(), name='subscribers'),
    path('social_auth/', include('apps.accounts.social_auth.urls')),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('month-user-stat', YearlyUserStatAPIView.as_view(), name='user-stats'),
    path("oneid/", OneIdView.as_view(), name="oneid"),
    path("login/oneid/", OneIdLoginView.as_view(), name="oneid-login"),
    path("login/oneid/access_token/<str:access_token>/", OneIdAccessTokenView.as_view(), name="oneid-access_token"),
]
