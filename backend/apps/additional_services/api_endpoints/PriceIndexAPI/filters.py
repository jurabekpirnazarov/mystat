import calendar
import datetime
from django_filters import rest_framework as filters

from apps.additional_services.models.priceindex_model import PriceIndex


class PriceIndexFilter(filters.FilterSet):
    start_year = filters.NumberFilter(method='filter_start')
    start_month = filters.NumberFilter(method='filter_start')
    end_year = filters.NumberFilter(method='filter_end')
    end_month = filters.NumberFilter(method='filter_end')

    class Meta:
        model = PriceIndex
        fields = []

    def _to_int(self, v, default=None):
        try:
            return int(v)
        except (TypeError, ValueError):
            return default

    def filter_start(self, queryset, name, value):
        sy = self._to_int(self.data.get('start_year'))
        if not sy:
            return queryset
        sm = self._to_int(self.data.get('start_month')) or 1
        if not (1 <= sm <= 12):
            sm = 1
        try:
            start_date = datetime.date(sy, sm, 1)
        except Exception:
            return queryset
        return queryset.filter(year__gte=start_date)

    def filter_end(self, queryset, name, value):
        ey = self._to_int(self.data.get('end_year'))
        if not ey:
            return queryset
        em = self._to_int(self.data.get('end_month')) or 12
        if not (1 <= em <= 12):
            em = 12
        try:
            last_day = calendar.monthrange(ey, em)[1]
            end_date = datetime.date(ey, em, last_day)
        except Exception:
            return queryset
        return queryset.filter(year__lte=end_date)