from django.apps import AppConfig


class ContractsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.contracts'

    def ready(self):
        from . import signals  # noqa: F401  (K-08 holat tarixi)
