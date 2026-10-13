# apps/book_market/resources.py
from import_export import resources, fields
from apps.additional_services.models import Unit


class UnitResource(resources.ModelResource):
    code = fields.Field(column_name='EDIZM', attribute='code')
    name = fields.Field(column_name='NAIM', attribute='name')
    short_name = fields.Field(column_name='KRAT_NAIM', attribute='short_name')

    class Meta:
        model = Unit
        import_id_fields = ['code']
        fields = ('code', 'name', 'short_name')
        skip_unchanged = True
        report_skipped = True
        use_bulk = True
