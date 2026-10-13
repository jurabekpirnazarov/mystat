from django.urls import path

from apps.organizations.api.OrganizationView.views import OrganizationListView

app_name = "organizations"

urlpatterns = [
    path('organizations/', OrganizationListView.as_view(), name='organization-list'),
]