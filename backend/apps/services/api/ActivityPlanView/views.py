from django.db.models import Q
from rest_framework import serializers
from rest_framework.generics import ListAPIView
from rest_framework.permissions import IsAuthenticated

from apps.common.synthetic import SyntheticFlagField
from apps.services.models import ActivityPlans


class ActivityPlanSerializer(serializers.ModelSerializer):
    service_name = serializers.CharField(source="service.name_uz", read_only=True)
    district_name = serializers.CharField(source="district.name", read_only=True)
    region_name = serializers.CharField(source="region.name", read_only=True, default=None)
    is_synthetic = SyntheticFlagField()

    class Meta:
        model = ActivityPlans
        fields = ("id", "year", "month", "plan_count", "service", "service_name",
                  "district", "district_name", "region_name", "is_synthetic")


class ActivityPlanListAPIView(ListAPIView):
    """GET /api/services/activity-plans/?year=2026 — o'zi kiritgan yoki o'z tumani rejalari. S-05."""
    serializer_class = ActivityPlanSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = None

    def get_queryset(self):
        user = self.request.user
        scope = Q(created_by_user=user)
        if user.location_id:
            scope |= Q(district_id=user.location_id)
        qs = ActivityPlans.objects.filter(scope, is_active=True).select_related("service", "district", "region")
        year = self.request.query_params.get("year")
        if year and year.isdigit():
            qs = qs.filter(year=int(year))
        return qs.order_by("year", "month", "district_id", "service_id")
