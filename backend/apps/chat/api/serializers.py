from rest_framework import serializers

from apps.chat.base.async_adapters import ModelSerializerAsyncMixin
from apps.chat.models import Chat, ClientSession, Message
from apps.users.models import User


class ClientSessionSerializer(serializers.ModelSerializer, ModelSerializerAsyncMixin):
    class Meta:
        model = ClientSession
        fields = [
            "user",
            "secret",
            "expires_at",
            "online",
        ]


class MessageSerializer(serializers.ModelSerializer, ModelSerializerAsyncMixin):
    class Meta:
        model = Message
        fields = ("id", "sender", "receiver", "chat", "text", "created_at", "edited", "seen")
        extra_kwargs = {"sender": {"required": False, "allow_null": True}}
        read_only_fields = ["created_at", "edited", "seen"]


class ChatUserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "username", "avatar", "online"]


class ChatListSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    message_infos = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ("id", "user", "message_infos")

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self._final_link = None

    @staticmethod
    def get_user(chat):
        user_fields = {field: getattr(chat, f"user_{field}") for field in ["id", "username", "avatar"]}
        return user_fields

    @staticmethod
    def get_message_infos(chat):
        return {
            "last_message": {
                "text": chat.last_message_text,
                "sender": chat.last_message_sender,
                "seen": chat.last_message_seen,
                "receiver": chat.last_message_receiver,
            },
            "unseen_messages_count": chat.unseen_messages_count,
        }


class ChatCreateDetailSerializer(serializers.ModelSerializer):
    user = serializers.SerializerMethodField()
    messages = serializers.SerializerMethodField()
    next_messages_link = serializers.SerializerMethodField()

    class Meta:
        model = Chat
        fields = ("id", "user", "messages", "next_messages_link")

    def get_user(self, chat):
        user = self.context.get("user")
        return ChatUserSerializer(user).data

    @staticmethod
    def get_messages(chat):
        return []

    @staticmethod
    def get_next_messages_link(chat):
        return None


class NotificationListSerializer(serializers.Serializer):
    id = serializers.IntegerField()
    data = serializers.JSONField()

    class Meta:
        fields = ["id", "data"]
