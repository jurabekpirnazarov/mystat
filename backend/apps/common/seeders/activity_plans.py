"""S-05: faoliyat rejalari — tuman/yil/oy kesimida xizmat ko'rsatish rejasi."""
from django.utils import timezone

from apps.common.models import District
from apps.services.models import ActivityPlans, Service

from . import Seeder
from .demo_users import demo_users


class ActivityPlansSeeder(Seeder):
    name = "activity_plans"
    depends_on = ("demo_users",)

    def seed(self):
        employee = demo_users().get("demo_employee")
        districts = list(District.objects.select_related("region").order_by("id")[:3])
        services = list(Service.objects.filter(is_active=True).order_by("id")[:5])
        if employee is None or not districts or not services:
            self.log("  ! demo_employee, tuman yoki xizmat yo'q — o'tkazib yuborildi")
            return

        year = timezone.now().year
        for district in districts:
            for month in range(1, 13):
                for service in services[:3]:
                    self.make(
                        ActivityPlans, f"{district.id}:{year}:{month}:{service.id}",
                        region=district.region, district=district, year=year, month=month,
                        service=service, plan_count=self.rnd.randint(2, 12), created_by_user=employee,
                    )
