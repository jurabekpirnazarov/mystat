from django.apps import AppConfig


class NotificationsConfig(AppConfig):
    default_auto_field = 'django.db.models.BigAutoField'
    name = 'apps.notifications'

    def ready(self):
        from . import signals  # noqa: F401  (A-02: CPI yangilanishi hodisasi)
