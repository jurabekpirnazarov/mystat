from rest_framework.generics import ListAPIView
from apps.accounts.permissions import IsAccountant, IsAuthenticated
from apps.contracts.api.ContractView.serializers import ContractSerializer
from apps.contracts.models import Contract
from .filters import ContractFilter
from django_filters.rest_framework import DjangoFilterBackend


class ContractList(ListAPIView):
    serializer_class = ContractSerializer
    queryset = Contract.objects.all()
    permission_classes = [IsAuthenticated]
    filter_backends = [DjangoFilterBackend]
    filterset_class = ContractFilter

    def get_queryset(self):
        user = self.request.user

        if user.is_superuser:
            return Contract.objects.all().order_by('-created_at')

        if hasattr(user, 'role') and user.role == "bugalter":
            accountant_profile = user.accountant_profile

            if accountant_profile:
                branch_ids = accountant_profile.branches.values_list('id', flat=True)
                return Contract.objects.filter(user__organization__branch__in=branch_ids).distinct().order_by('-created_at')
        elif hasattr(user, 'role') and user.role == "client":
            return Contract.objects.filter(user=user).order_by('-created_at')
        return Contract.objects.none()
      

    
   