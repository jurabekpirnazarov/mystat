"""S-13: individual buyurtma tariflari va 15 ta namunaviy buyurtma (bajarilganlariga XLSX natija)."""
import io
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from openpyxl import Workbook

from apps.common.models import Region
from apps.services.api.CustomRequestView import INDICATORS, quote
from apps.services.models import CustomDataRequest, CustomRequestTariff

from . import Seeder, days_ago
from .demo_users import demo_users

TARIFFS = {  # data_type: (asos, ko'rsatkich, yil, hudud) BHM'da
    "trade": ("2", "0.5", "0.3", "0.2"),
    "enterprise": ("3", "0.5", "0.3", "0.3"),
    "industry": ("2", "0.4", "0.3", "0.2"),
    "demography": ("1.5", "0.3", "0.2", "0.2"),
    "prices": ("1", "0.3", "0.2", "0.2"),
    "other": ("4", "0.5", "0.5", "0.3"),
}
STATUSES = ["created", "created", "priced", "priced", "in_progress", "in_progress", "completed", "completed",
            "completed", "completed", "cancelled", "created", "priced", "completed", "in_progress"]
RESULT_DIR = "demo/custom_requests"


def _result_xlsx(req, region_names):
    wb = Workbook()
    ws = wb.active
    ws.title = "Natija (NAMUNA)"
    ws.append(["NAMUNA — raqamlar o'ylab topilgan, haqiqiy statistika emas"])
    ws.append(["Hudud", "Ko'rsatkich", *range(req.year_from, req.year_to + 1)])
    for region in region_names or ["Respublika"]:
        for n, indicator in enumerate(req.indicators):
            ws.append([region, indicator, *[1000 + 37 * n + 11 * (y - req.year_from) for y in range(req.year_from, req.year_to + 1)]])
    buf = io.BytesIO()
    wb.save(buf)
    rel = f"{RESULT_DIR}/buyurtma-{req.pk}.xlsx"
    path = Path(settings.MEDIA_ROOT) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(buf.getvalue())
    return rel


class CustomRequestsSeeder(Seeder):
    name = "custom_requests"
    depends_on = ("demo_users",)

    def seed(self):
        tariffs = {}
        for data_type, (base, ind, year, region) in TARIFFS.items():
            existing = CustomRequestTariff.objects.filter(data_type=data_type).first()
            tariffs[data_type] = existing or self.make(
                CustomRequestTariff, f"tariff:{data_type}", data_type=data_type, base_bhm=Decimal(base),
                per_indicator_bhm=Decimal(ind), per_year_bhm=Decimal(year), per_region_bhm=Decimal(region))

        users = demo_users()
        clients = [users[n] for n in sorted(users) if n.startswith("demo_yuridik")]
        employee = users.get("demo_employee")
        regions = list(Region.objects.order_by("code"))
        types = list(TARIFFS)
        for i, status in enumerate(STATUSES):
            data_type = types[i % len(types)]
            indicators = INDICATORS[data_type][: 1 + i % 3]
            year_to = 2025 - i % 3
            year_from = year_to - (2 + i % 5)
            region_ids = [r.id for r in regions[i % 5: i % 5 + i % 4]]
            q = quote(tariffs[data_type], indicators, year_from, year_to, region_ids, i % 4 == 0)
            req = self.make(
                CustomDataRequest, f"request:{i}", user=clients[i % len(clients)], data_type=data_type,
                indicators=indicators, year_from=year_from, year_to=year_to, regions=region_ids, urgent=i % 4 == 0,
                comment="Namunaviy buyurtma: hisobot uchun ma'lumot kerak.", price_bhm=q["price_bhm"],
                price_sum=q["price_sum"], status=status, assigned_to=employee if status != "created" else None,
                approved_price_sum=q["price_sum"] if status in ("priced", "in_progress", "completed") else None,
                staff_comment="Ma'lumot tayyorlandi." if status == "completed" else "",
            )
            self.backdate(req, "created_at", days_ago(3 + i * 4))
            if status == "completed" and not req.result_file:
                names = [r.name for r in regions if r.id in region_ids]
                req.result_file.name = _result_xlsx(req, names)
                req.save(update_fields=["result_file"])
