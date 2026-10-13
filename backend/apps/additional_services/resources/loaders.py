# apps/additional_services/resources/loaders.py
from import_export.instance_loaders import BaseInstanceLoader
from import_export.widgets import ForeignKeyWidget

class CachedInstanceLoader(BaseInstanceLoader):
    def __init__(self, resource, dry_run):
        super().__init__(resource, dry_run)
        self._cache = None

    def _build_cache(self):
        if self._cache is not None:
            return
        qs = self.resource._meta.model.objects.all()
        keys = tuple(self.resource.get_import_id_fields())
        cache = {}
        # faqat kerakli maydonlarni o‘qish ham mumkin: qs.only(*keys)
        for obj in qs:
            key = tuple(getattr(obj, k) for k in keys)
            cache[key] = obj
        self._cache = cache

    def get_instance(self, row):
        self._build_cache()
        keys = tuple(self.resource.get_import_id_fields())
        key = tuple(row.get(k) for k in keys)  # headerlar column_name bilan mos bo‘lishi kerak
        return self._cache.get(key)

class CachedFKWidget(ForeignKeyWidget):
    def __init__(self, model, field='pk'):
        super().__init__(model, field)
        self._cache = None

    def _build_cache(self):
        if self._cache is None:
            # faqat field’ni o‘qish kifoya
            self._cache = {str(getattr(o, self.field)): o for o in self.model.objects.only(self.field)}

    def clean(self, value, row=None, *args, **kwargs):
        if value in (None, ''):
            return None
        self._build_cache()
        return self._cache.get(str(value))
