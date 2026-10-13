from django.urls import path

from .views import GoogleSocialAuthView, FacebookSocialAuthView, GoogleCallBackView, AppleSocialAuthView, AppleCallBackView, FacebookCallBackView

urlpatterns = [
    path('oneid/', GoogleSocialAuthView.as_view()),
    path('eri/', FacebookSocialAuthView.as_view()),
    # path('apple/', AppleSocialAuthView.as_view()),
    path('oneid_callback', GoogleCallBackView.as_view()),
    path('eri_callback', FacebookCallBackView.as_view()),
    # path('apple_callback', AppleCallBackView.as_view()),
]
