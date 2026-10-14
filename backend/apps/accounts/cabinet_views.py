"""Shaxsiy kabinet uchun faqat-o'qish agregat endpoint'lari (U-02, U-04).

To'lov kodi (`apps.payment`) o'zgartirilmaydi — bu yerda faqat mavjud yozuvlar o'qiladi.
"""
from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.db.models import Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.book_market.models import OrderBook
from apps.contracts.models import Contract
from apps.notifications.models import Notification
from apps.payment.models import Order, Transaction
from apps.services.models import (
    PackageServiceItem,
    ServiceRequestResponse,
    UserServicePackage,
    UserServicePackageItemUse,
)

OPEN_REQUEST_STATUSES = ("created", "pending")


def _iso(dt):
    return dt.isoformat() if dt else None


class CabinetSummaryAPIView(APIView):
    """GET /api/accounts/me/summary/ — kabinet bosh paneli uchun bitta so'rovda hamma narsa."""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        usp = (
            UserServicePackage.objects.filter(created_by_user=user)
            .select_related("service")
            .order_by("-created_at", "-id")
            .first()
        )
        return Response({
            "package": self._package(usp),
            "limits": self._limits(usp),
            "contracts": self._contracts(user),
            "open_requests": ServiceRequestResponse.objects.filter(
                contract__user=user, status__in=OPEN_REQUEST_STATUSES
            ).count(),
            "unread_notifications": Notification.objects.filter(recipient=user, is_read=False).count(),
            "usage_by_month": self._usage_by_month(usp),
            "recent_activity": self._recent_activity(user, usp),
        })

    @staticmethod
    def _package(usp):
        if usp is None:
            return None
        package = usp.service
        expires_at = getattr(usp, "expires_at", None)
        return {
            "id": package.id,
            "name_uz": package.name_uz,
            "name_ru": package.name_ru,
            "started_at": _iso(usp.created_at),
            "duration_days": package.duration_days,
            "expires_at": expires_at.isoformat() if expires_at else None,
        }

    @staticmethod
    def _limits(usp):
        if usp is None:
            return []
        used = dict(
            UserServicePackageItemUse.objects.filter(usp=usp)
            .values_list("psi")
            .annotate(n=Count("id"))
        )
        items = PackageServiceItem.objects.filter(package=usp.service, limit__gt=0).select_related("package_service")
        return [
            {
                "id": item.id,
                "name_uz": item.name_uz,
                "package_service_id": item.package_service_id,
                "limit": item.limit,
                "used": used.get(item.id, 0),
            }
            for item in items.order_by("package_service_id", "id")
        ]

    @staticmethod
    def _contracts(user):
        rows = Contract.objects.filter(user=user).values("status").annotate(n=Count("id"))
        by_status = {row["status"]: row["n"] for row in rows}
        return {"total": sum(by_status.values()), "by_status": by_status}

    @staticmethod
    def _usage_by_month(usp):
        now = timezone.now()
        months = []
        cursor = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        for _ in range(6):
            months.append(cursor)
            cursor = (cursor - timedelta(days=1)).replace(day=1)
        months.reverse()
        counts = {}
        if usp is not None:
            rows = (
                UserServicePackageItemUse.objects.filter(usp=usp, created_at__gte=months[0])
                .annotate(month=TruncMonth("created_at"))
                .values("month")
                .annotate(n=Count("id"))
            )
            counts = {row["month"].strftime("%Y-%m"): row["n"] for row in rows}
        return [{"month": m.strftime("%Y-%m"), "count": counts.get(m.strftime("%Y-%m"), 0)} for m in months]

    @staticmethod
    def _recent_activity(user, usp, limit=6):
        events = []
        if usp is not None:
            for use in UserServicePackageItemUse.objects.filter(usp=usp).select_related("psi").order_by("-created_at")[:limit]:
                events.append({"type": "usage", "title": use.psi.name_uz, "date": _iso(use.created_at)})
        for order in OrderBook.objects.filter(user=user).order_by("-created_at")[:limit]:
            events.append({"type": "book_order", "title": f"Kitob buyurtmasi #{order.id}", "date": _iso(order.created_at)})
        for req in ServiceRequestResponse.objects.filter(contract__user=user).select_related("package_item").order_by("-created_at")[:limit]:
            events.append({"type": "request", "title": _plain(req.package_item.name_uz), "status": req.status,
                           "date": _iso(req.created_at)})
        for contract in Contract.objects.filter(user=user).order_by("-created_at")[:limit]:
            events.append({"type": "contract", "title": f"Shartnoma {contract.contract_number}", "status": contract.status,
                           "date": _iso(contract.created_at)})
        events.sort(key=lambda e: e["date"] or "", reverse=True)
        return events[:limit]


def _plain(html):
    """PackageService.name_uz — RichTextField; ro'yxatda teglarsiz ko'rsatamiz."""
    import html as html_lib
    from django.utils.html import strip_tags
    return " ".join(html_lib.unescape(strip_tags(html or "")).split())


class MyPaymentsAPIView(APIView):
    """GET /api/accounts/me/payments/ — foydalanuvchining tranzaksiyalari (faqat o'qish). U-04."""
    permission_classes = [IsAuthenticated]

    PURPOSES = (
        (OrderBook, "book", "Kitob buyurtmasi #{id}"),
        (Contract, "contract", "Shartnoma {contract_number}"),
        (Order, "service", "Xizmat buyurtmasi #{id}"),
    )

    def get(self, request):
        user = request.user
        owned = {}
        query = Q()
        for model, kind, title in self.PURPOSES:
            ct = ContentType.objects.get_for_model(model)
            objects = {obj.id: obj for obj in model.objects.filter(user=user)}
            if objects:
                owned[ct.id] = (kind, title, objects)
                query |= Q(content_type=ct, object_id__in=list(objects))

        if not owned:
            return Response([])

        status_filter = request.query_params.get("status")
        transactions = Transaction.objects.filter(query).order_by("-created_at")
        if status_filter:
            transactions = transactions.filter(status=status_filter)

        result = []
        for txn in transactions:
            kind, title, objects = owned[txn.content_type_id]
            payable = objects.get(txn.object_id)
            result.append({
                "id": txn.id,
                "date": _iso(txn.paid_at or txn.created_at),
                "amount": str(txn.amount),
                "status": txn.status,
                "purpose": kind,
                "title": title.format(id=payable.id, contract_number=getattr(payable, "contract_number", "")),
                "provider": getattr(payable, "provider", None) or "click",
            })
        return Response(result)
