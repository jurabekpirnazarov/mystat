import django_filters
from django_filters import rest_framework as filters
from apps.book_market.models import OrderBook

class CharInFilter(django_filters.BaseInFilter, django_filters.CharFilter):
    pass

class OrderBookFilter(filters.FilterSet):
    status = CharInFilter(field_name="status", lookup_expr="in")


    class Meta:
        model = OrderBook
        fields = ["status"]
