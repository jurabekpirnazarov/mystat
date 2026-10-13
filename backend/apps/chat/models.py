from channels.db import database_sync_to_async
from django.db import models
from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.utils import timezone
from django.utils.translation import gettext_lazy as _

from apps.chat.base.async_adapters import AsyncModelManager

from .base.utils import create_expires_at, generate_session_secret


def id_getter(f):
    async def wrapper(self, *args, **kwargs):
        id_list = []
        for arg in args:
            if isinstance(arg, int):
                id_list.append(arg)
            else:
                id_list.append(getattr(arg, "id"))
        return await f(self, *id_list, **kwargs)

    return wrapper


class ClientSession(models.Model):
    user = models.ForeignKey("accounts.User", related_name="client_session", on_delete=models.CASCADE)
    secret = models.CharField(max_length=64, default=generate_session_secret)
    expires_at = models.DateTimeField(default=create_expires_at)
    online = models.BooleanField(default=True)

    objects = AsyncModelManager()

    def is_not_expired(self):
        return self.expires_at >= timezone.now()


class Participation(models.Model):
    user = models.ForeignKey("accounts.User", related_name="user_participation", on_delete=models.SET_NULL, null=True)
    chat = models.ForeignKey("chat.Chat", related_name="chat_participation", on_delete=models.CASCADE)


class ChatType(models.TextChoices):
    PRIVATE = "private"
    GROUP = "group"


class Chat(models.Model):
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)
    users = models.ManyToManyField("accounts.User", related_name="user_chat", through=Participation)
    type = models.CharField(max_length=10, choices=ChatType.choices, default=ChatType.PRIVATE)

    def __str__(self):
        return " | ".join(list(self.users.values_list("username", flat=True)))

    @id_getter
    async def has_user(self, user_id):
        return await database_sync_to_async(self.users.filter(id=user_id).exists)()

    @classmethod
    async def has_chat(cls, user1_id, user2_id):
        chats = Chat.objects.all()
        for user in (user1_id, user2_id):
            chats = chats.filter(users__in=[user])
        return await database_sync_to_async(chats.exists)()

    async def other_user(self, this_user_id):
        return await database_sync_to_async(self.users.exclude(id=this_user_id).first)()


class Ban(models.Model):
    chat = models.ForeignKey("chat.Chat", related_name="chat_ban", on_delete=models.CASCADE)
    user = models.ForeignKey("accounts.User", related_name="user_ban", on_delete=models.SET_NULL, null=True)
    reason = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, null=True, blank=True)


class Message(models.Model):
    sender = models.ForeignKey("accounts.User", related_name="sent_message", on_delete=models.SET_NULL, null=True)
    receiver = models.ForeignKey("accounts.User", related_name="received_message", on_delete=models.SET_NULL, null=True)
    chat = models.ForeignKey("chat.Chat", related_name="chat_message", on_delete=models.CASCADE)
    text = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True, editable=False)
    edited = models.BooleanField(default=False, blank=True)
    seen = models.BooleanField(default=False, blank=True)


@receiver(pre_save, sender=Message)
def set_message_edited(sender: Message, instance: Message, **kwargs):
    if instance.pk is not None:
        message = Message.objects.get(id=instance.id)
        if message.text != instance.text:
            instance.edited = True
