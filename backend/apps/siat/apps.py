from django.apps import AppConfig


class SiatConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.siat"
    verbose_name = "SIAT ma'lumotlari"

    def ready(self):
        from django.db.models.signals import post_delete, post_save

        from .models import PopulationAnchor, ReleaseEvent
        from .sync import bump_cache

        def _bump(**kwargs):
            bump_cache()

        # JT-10, JT-02: rasmiy sana yoki aholi soni kiritilsa kesh darhol yangilanadi
        post_save.connect(_bump, sender=ReleaseEvent, weak=False, dispatch_uid="release-event-saved")
        post_delete.connect(_bump, sender=ReleaseEvent, weak=False, dispatch_uid="release-event-deleted")
        post_save.connect(_bump, sender=PopulationAnchor, weak=False, dispatch_uid="population-anchor-saved")
        post_delete.connect(_bump, sender=PopulationAnchor, weak=False, dispatch_uid="population-anchor-deleted")
