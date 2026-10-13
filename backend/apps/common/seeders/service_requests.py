"""S-04: xizmat so'rovlari va javoblari.

Ilova `ServiceRequestResponse` ni ishlatadi (kabinet, `services/service-request/`);
`ServiceRequests` + `ServiceDeliverables` admin uchun to'ldiriladi.
Natija fayllari faqat `media/demo/` ga yoziladi.
"""
from datetime import timedelta
from pathlib import Path

from django.conf import settings

from apps.contracts.models import Contract
from apps.services.models import (
    PackageService,
    PackageServiceItem,
    Service,
    ServiceDeliverables,
    ServiceRequestResponse,
    ServiceRequests,
)
from apps.common.synthetic import registered_ids

from . import DEMO_PREFIX, Seeder, days_ago
from .demo_users import demo_users

DEMO_MEDIA = Path("demo") / "service_responses"

CLIENT_TEXTS = [
    "2024–2025 yillar bo'yicha tarmoq ko'rsatkichlari kerak.",
    "Viloyat kesimida eksport hajmi bo'yicha ma'lumot so'raymiz.",
    "Korxonamiz uchun raqobatchilar tahlilini tayyorlab bering.",
    "Hisobot shakllari bo'yicha tushuntirish kerak.",
    "Iste'mol narxlari indeksi bo'yicha choraklik ma'lumot.",
    "Tuman bo'yicha aholi soni dinamikasi kerak.",
]
ADMIN_TEXTS = [
    "So'rovingiz bo'yicha ma'lumot tayyorlandi, ilovadagi faylni ko'ring.",
    "Tahlil yakunlandi. Qo'shimcha savollar bo'lsa, murojaat qiling.",
    "Ma'lumotlar 2025-yil yakuniy hisobotlari asosida berildi.",
]
STATUSES = ["created", "pending", "completed", "completed", "cancelled", "completed", "pending"]


class ServiceRequestsSeeder(Seeder):
    name = "service_requests"
    depends_on = ("demo_users",)

    def _demo_file(self, key, text):
        rel = DEMO_MEDIA / f"{key}.txt"
        path = Path(settings.MEDIA_ROOT) / rel
        path.parent.mkdir(parents=True, exist_ok=True)
        if not path.exists():
            path.write_text(f"{DEMO_PREFIX} Sintetik natija fayli\n\n{text}\n", encoding="utf-8")
        return rel.as_posix()

    def seed(self):
        users = demo_users()
        employee = users.get("demo_employee")
        contracts = list(Contract.objects.filter(pk__in=registered_ids(Contract)).order_by("id"))
        if not contracts or employee is None:
            self.log("  ! Demo shartnomalar yo'q — avval demo_users seeder'i kerak")
            return

        services = list(Service.objects.filter(is_active=True).order_by("id"))
        n = 0
        for contract in contracts:
            package_services = list(
                PackageService.objects.filter(
                    id__in=PackageServiceItem.objects.filter(package=contract.package).values("package_service")
                ).order_by("id")
            )
            if not package_services:
                continue
            for k in range(8):
                n += 1
                status = STATUSES[n % len(STATUSES)]
                ps = package_services[k % len(package_services)]
                key = f"{contract.contract_number}:{k}"
                fields = dict(
                    contract=contract, package_item=ps, status=status,
                    client_input_text=f"{DEMO_PREFIX} {CLIENT_TEXTS[n % len(CLIENT_TEXTS)]}",
                )
                if status == "completed":
                    fields["admin_input_text"] = ADMIN_TEXTS[n % len(ADMIN_TEXTS)]
                    fields["admin_file"] = self._demo_file(f"response-{n}", fields["admin_input_text"])
                resp = self.make(ServiceRequestResponse, f"response:{key}", **fields)
                self.backdate(resp, "created_at", days_ago(170 - n * 4))

                if not services:
                    continue
                created = days_ago(170 - n * 4).date()
                req = self.make(
                    ServiceRequests, f"request:{key}",
                    contract=contract, service=services[n % len(services)], status=status,
                    deadline_date=created + timedelta(days=7),
                    completed_date=created + timedelta(days=3) if status == "completed" else None,
                    assigned_to_user=employee, notes=f"{DEMO_PREFIX} sintetik so'rov",
                )
                self.backdate(req, "requested_date", created)
                if status == "completed":
                    self.make(
                        ServiceDeliverables, f"deliverable:{key}",
                        service_request=req, created_by_user=employee, content_type="text/plain",
                        file_path=self._demo_file(f"deliverable-{n}", "Natija hujjati"),
                        description=f"{DEMO_PREFIX} natija hujjati",
                    )
