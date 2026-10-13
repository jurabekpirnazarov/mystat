# filters.py
import django_filters
from apps.contracts.models import Contract


class ContractFilter(django_filters.FilterSet):
    status = django_filters.CharFilter(field_name="status", lookup_expr="exact")
    user = django_filters.NumberFilter(field_name="user", lookup_expr="exact")
    package = django_filters.NumberFilter(field_name="package", lookup_expr="exact")

    class Meta:
        model = Contract
        fields = ['status', 'user', 'package']
