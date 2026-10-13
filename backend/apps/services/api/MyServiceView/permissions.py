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
