from import_export import resources
from import_export.fields import Field
from import_export.widgets import IntegerWidget
from .models import Sector

class SectorResource(resources.ModelResource):
    parent_code = Field(attribute='parent_code', column_name='parent_code')

    class Meta:
        model = Sector
        import_id_fields = ('code',)   # use code as unique identifier
        fields = ('code', 'name', 'name_uz', 'name_cry', 'name_en', 'name_ru', 'name_qr',
                  'stat_classifier', 'code2', 'code3', 'code4', 'order', 'parent_code')
        skip_unchanged = True
        report_skipped = True

    def before_import_row(self, row, **kwargs):
        """
        Map Excel column 'name_k' to 'name_cry' field
        """
        if 'name_k' in row:
            row['name_cry'] = row.pop('name_k')
        return row

    def after_import(self, dataset, result, using_transactions, dry_run, **kwargs):
        """
        After rows are imported/updated, link parent FK by parent_code.
        Doing it after import avoids ordering problems when parent rows come later.
        """
        if dry_run:
            return

        code_map = {o.code: o for o in Sector.objects.all()}

        for row in dataset.dict:
            code = str(row.get('code') or '').strip()
            parent_code = row.get('parent_code')
            if not code:
                continue
            obj = code_map.get(code) or Sector.objects.filter(code=code).first()
            if not obj:
                continue
            if parent_code:
                pc = str(parent_code).strip()
                parent_obj = code_map.get(pc) or Sector.objects.filter(code=pc).first()
                if parent_obj:
                    if obj.parent_id != parent_obj.id:
                        obj.parent = parent_obj
                        obj.parent_code = pc
                        obj.save(update_fields=['parent', 'parent_code'])
                else:
                    if obj.parent_code != pc:
                        obj.parent_code = pc
                        obj.save(update_fields=['parent_code'])
            else:
                if obj.parent is not None:
                    obj.parent = None
                    obj.parent_code = None
                    obj.save(update_fields=['parent', 'parent_code'])