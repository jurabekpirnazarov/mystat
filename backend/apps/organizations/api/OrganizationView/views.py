from rest_framework.generics import ListAPIView

from apps.organizations.models import Organization

from .serializers import OrganizationSerializer


class OrganizationListView(ListAPIView):
    serializer_class = OrganizationSerializer

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return Organization.objects.none()
        if user.is_staff:
            return Organization.objects.order_by("id")
        return Organization.objects.filter(user=user)
