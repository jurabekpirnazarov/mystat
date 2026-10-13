from django.urls import path, include

urlpatterns = [
    path('', include('apps.organizations.api.api_urls')),
]