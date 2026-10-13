# apps/additional_services/resources_mixins.py
from import_export.instance_loaders import BaseInstanceLoader

class CachedInstanceLoader(BaseInstanceLoader):
    """
    import_id_fields bo'yicha oldindan barcha mavjud instanslarni RAMga olib, get() o'rniga dict lookup qiladi.
    """
    def __init__(self, resource, dry_run):
        super().__init__(resource, dry_run)
        self._cache = None

    def _build_cache(self):
        if self._cache is not None:
            return
        qs = self.resource._meta.model.objects.all()
        keys = tuple(self.resource.get_import_id_fields())
        cache = {}
        for obj in qs.only(*keys):
            key = tuple(getattr(obj, k) for k in keys)
            cache[key] = obj
        self._cache = cache

    def get_instance(self, row):
        self._build_cache()
        keys = tuple(self.resource.get_import_id_fields())
        key = tuple(self.resource.export_field(f, obj=row) if hasattr(row, "__getitem__") else getattr(row, f)
                    for f in keys)
        return self._cache.get(key)
