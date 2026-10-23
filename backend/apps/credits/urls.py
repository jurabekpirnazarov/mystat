from django.urls import path

from . import api

app_name = "credits"

urlpatterns = [
    path("me/", api.CreditsMeView.as_view(), name="me"),
    path("unlock/", api.UnlockView.as_view(), name="unlock"),
    path("activation/", api.ActivationView.as_view(), name="activation"),
]
