from django.apps import AppConfig


class ChatConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    name = "apps.chat"

    def ready(self):
        pass
        # from apps.chat.models import ClientSession
        # from apps.users.models import User

        # User.objects.update(online=False)
        # ClientSession.objects.update(online=False)
