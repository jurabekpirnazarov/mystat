# apps/additional_services/widgets.py
from import_export.widgets import ForeignKeyWidget

class CachedFKWidget(ForeignKeyWidget):
    def __init__(self, model, field='pk'):
        super().__init__(model, field)
        self._cache = None

    def _build_cache(self):
        if self._cache is None:
            self._cache = {str(getattr(o, self.field)): o for o in self.model.objects.only(self.field)}

    def clean(self, value, row=None, *args, **kwargs):
        if value in (None, ''):
            return None
        self._build_cache()
        return self._cache.get(str(value))
