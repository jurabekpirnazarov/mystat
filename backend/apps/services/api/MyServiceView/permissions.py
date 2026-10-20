from rest_framework.permissions import BasePermission
from apps.services.models import ServiceRequestResponse


class IsAttachedUser(BasePermission):

    def has_object_permission(self, request, view, obj):
        return obj.contract.attached_user == request.user or obj.contract.user == request.user

    def has_permission(self, request, view):
        # PATCH request uchun pk kerak bo'ladi
        pk = view.kwargs.get('pk')
        if not pk:
            return False
        try:
            instance = ServiceRequestResponse.objects.get(pk=pk)
        except ServiceRequestResponse.DoesNotExist:
            return False
        return instance.contract.attached_user == request.user or instance.contract.user == request.user


class IsAssignedEmployee(BasePermission):
    """So'rovga javob (`admin_input_text`, `admin_file`, `status`) — faqat xodim (staff yoki employee/manager/admin
    roli, loyihadagi umumiy qoida) yoki shartnomaga biriktirilgan foydalanuvchi.
    ISH_REJASI 2.1: ilgari mijozning o'zi ham (`contract.user`) o'ziga "admin javobi" yoza olardi."""

    def has_permission(self, request, view):
        pk = view.kwargs.get("pk")
        if not pk or not request.user.is_authenticated:
            return False
        if request.user.is_staff or getattr(request.user, "role", None) in ("employee", "manager", "admin"):
            return True
        return ServiceRequestResponse.objects.filter(pk=pk, contract__attached_user=request.user).exists()
