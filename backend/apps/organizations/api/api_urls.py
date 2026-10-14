from django.urls import path

from apps.organizations.api.OrganizationView.views import OrganizationListView
from apps.organizations.api.prefill import PrefillView, RegistryDiffView

app_name = "organizations"

urlpatterns = [
    path('organizations/', OrganizationListView.as_view(), name='organization-list'),
    path('me/prefill/', PrefillView.as_view(), name='prefill'),
    path('me/registry-diff/', RegistryDiffView.as_view(), name='registry-diff'),
]