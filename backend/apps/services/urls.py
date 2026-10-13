from django.urls import include, path

urlpatterns = [
    path('', include('apps.services.api.api_urls', namespace='services')),
]