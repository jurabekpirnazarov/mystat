from django.db import models
from django.db import models as db_models
from drf_yasg.utils import swagger_auto_schema
from rest_framework import generics
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated

from apps.chat.api import serializers
from apps.chat.base.pagination import CursorSetPagination
from apps.chat.base.setup import CHAT_USER_FIELDS
from apps.chat.models import Chat, Message, Participation


class ChatListView(generics.ListAPIView):
    queryset = Chat.objects.prefetch_related("users")

    serializer_class = serializers.ChatListSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        last_message = Message.objects.filter(models.Q(chat_id=models.OuterRef("id"))).order_by("-id")[:1]
        user = Participation.objects.filter(~models.Q(chat=models.OuterRef("id")) & ~models.Q(user=self.request.user))[
            :1
        ]

        user_annotation = {
            f"user_{field}": models.Subquery(user.values(f"user__{field}"), output_field=field_type())
            for field, field_type in CHAT_USER_FIELDS.items()
        }

        return self.queryset.annotate(
            last_message_text=models.Subquery(last_message.values("text"), output_field=db_models.CharField()),
            last_message_sender=models.Subquery(last_message.values("sender"), output_field=db_models.IntegerField()),
            last_message_receiver=models.Subquery(
                last_message.values("receiver"), output_field=db_models.IntegerField()
            ),
            last_message_seen=models.Subquery(last_message.values("seen"), output_field=db_models.BooleanField()),
            unseen_messages_count=models.Count(
                "chat_message__text",
                filter=models.Q(chat_message__seen=False) & ~models.Q(chat_message__sender=self.request.user),
            ),
            **user_annotation,
        )

    def filter_queryset(self, queryset):
        return queryset.filter(users__in=[self.request.user])


class MessageListView(generics.ListAPIView):
    queryset = Message.objects.all()
    serializer_class = serializers.MessageSerializer
    permission_classes = [IsAuthenticated]
    pagination_class = CursorSetPagination

    def filter_queryset(self, queryset):
        chat = generics.get_object_or_404(Chat, id=self.kwargs.get("pk"))
        if chat.has_user(self.request.user):
            return queryset.filter(chat=chat)
        else:
            raise PermissionDenied()

    @swagger_auto_schema(
        operation_description="""

        # ws authorize
        ## request
        ```
        {
            "action":"session__authorize",
            "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCO2..."
        }
        ```
        ## response
        ```
        {
            "action": "session__authorize",
            "type": "response",
            "status": "success",
            "data": {
                "user": 1,
                "secret": "LCESjlD175iq9ry--aJ_327IjZoFIHlrvhq8hvh-0GM",
                "expires_at": "2024-04-08T14:34:15.938999+05:00",
                "online": true
            }
        }
        ```
        ### keep "secret" for future requests

        # ws chat__create

        # ws message__create
        ## request
        ```
        {
            "action":"session__authorize",
            "data": {
                "chat": 1,
                "secret": "ladMPPjmwXzJb7m7I-HP7Ik1fpC6sELhNAs8_Qv_zb0",
                "text": "hello"
            }
        }
        ```

        """,
    )
    def get(self, request, *args, **kwargs):
        return super().get(request, *args, **kwargs)
