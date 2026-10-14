"""Yangi pullik xizmatlar (benchmark, bozor tahlili PDF, hamkor eksporti, konsultatsiya) uchun paket limiti.

OS-14 default: xizmat admin'da `PackageService` (slug bilan) sifatida qo'shiladi va paketlarga limit beriladi.
Slug hali sozlanmagan bo'lsa xizmat limitsiz ishlaydi (javobda `configured: False`), shunda
admin sozlamaguncha funksiya yopilib qolmaydi.
"""
from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.exceptions import APIException

from .models import PackageService, PackageServiceItem, UserServicePackage, UserServicePackageItemUse

UPGRADE_URL = "/services"


class LimitExceeded(APIException):
    status_code = status.HTTP_403_FORBIDDEN
    default_code = "limit_exceeded"

    def __init__(self, detail, **extra):
        super().__init__({"detail": detail, "upgrade_url": UPGRADE_URL, **extra})


def active_package(user):
    """Foydalanuvchining muddati o'tmagan eng oxirgi paketi (yoki None)."""
    for usp in UserServicePackage.objects.filter(created_by_user=user).select_related("service").order_by("-id"):
        if not usp.is_expired:
            return usp
    return None


def limit_status(user, slug):
    """{configured, limit, used} — limitni sarflamasdan."""
    ps = PackageService.objects.filter(slug=slug).first()
    if ps is None:
        return {"configured": False, "limit": None, "used": 0}
    usp = active_package(user)
    psi = PackageServiceItem.objects.filter(package=usp.service, package_service=ps).first() if usp else None
    used = UserServicePackageItemUse.objects.filter(usp=usp, psi=psi).count() if psi else 0
    return {"configured": True, "limit": psi.limit if psi else 0, "used": used}


def consume(user, slug, request_data=None, once_per_day=False):
    """Bitta foydalanishni yozadi yoki `LimitExceeded` (403) ko'taradi. -> limit_status.

    `once_per_day=True`: bugun xuddi shu `request_data` bilan yozilgan bo'lsa qayta sarflanmaydi
    (sahifani yangilash limitni yemasligi uchun).
    """
    ps = PackageService.objects.filter(slug=slug).first()
    if ps is None:
        return {"configured": False, "limit": None, "used": 0}
    usp = active_package(user)
    if usp is None:
        raise LimitExceeded("Bu xizmat uchun faol paket yo'q.")
    with transaction.atomic():
        psi = PackageServiceItem.objects.select_for_update().filter(package=usp.service, package_service=ps).first()
        used = UserServicePackageItemUse.objects.filter(usp=usp, psi=psi).count() if psi else 0
        if psi is not None and once_per_day and UserServicePackageItemUse.objects.filter(
                usp=usp, psi=psi, request_data=request_data or {}, created_at__date=timezone.localdate()).exists():
            return {"configured": True, "limit": psi.limit, "used": used}
        if psi is None or psi.limit <= 0 or used >= psi.limit:
            raise LimitExceeded("Sizning limitingiz tugagan!", limit=psi.limit if psi else 0, used_count=used)
        UserServicePackageItemUse.objects.create(usp=usp, psi=psi, is_success=True,
                                                 request_data=request_data or {}, response_data=None)
    return {"configured": True, "limit": psi.limit, "used": used + 1}
