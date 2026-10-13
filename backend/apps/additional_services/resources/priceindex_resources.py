from import_export import resources, fields, widgets
import datetime

from apps.additional_services.models.priceindex_model import PriceIndex


class MultiDateWidget(widgets.Widget):
    def __init__(self, formats=None):
        self.formats = formats or ['%Y-%m-%d', '%d.%m.%Y', '%d/%m/%Y']

    def clean(self, value, row=None, *args, **kwargs):
        if value in (None, ''):
            return None
        if isinstance(value, datetime.date):
            return value
        try:
            v = float(value)
            epoch = datetime.date(1899, 12, 30)
            return epoch + datetime.timedelta(days=int(v))
        except Exception:
            pass
        for fmt in self.formats:
            try:
                return datetime.datetime.strptime(str(value).strip(), fmt).date()
            except Exception:
                continue
        raise ValueError(f"Unrecognized date format: {value}")

class PriceIndexResource(resources.ModelResource):
    year = fields.Field(
        column_name='year', attribute='year',
        widget=MultiDateWidget(['%Y-%m-%d','%d.%m.%Y','%d/%m/%Y'])
    )

    class Meta:
        model = PriceIndex
        fields = ('id','year', 'values',)
