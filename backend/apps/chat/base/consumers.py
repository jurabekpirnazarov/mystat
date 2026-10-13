from typing import Optional, Set, Tuple

from channels.db import database_sync_to_async
from channels.exceptions import StopConsumer
from rest_framework import HTTP_HEADER_ENCODING
from rest_framework_simplejwt import exceptions
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import Token
from rest_framework_simplejwt.utils import get_md5_hash_password

from apps.chat.base.setup import CHAT_DEBUG
from apps.chat.models import ClientSession, Participation

from ...users.models import User
from .dispatch import RequestHandler
from .main import BaseConsumer
from .utils import count_query, debug_request

AUTH_HEADER_TYPES = api_settings.AUTH_HEADER_TYPES

if not isinstance(api_settings.AUTH_HEADER_TYPES, (list, tuple)):
    AUTH_HEADER_TYPES = (AUTH_HEADER_TYPES,)

AUTH_HEADER_TYPE_BYTES: Set[bytes] = {h.encode(HTTP_HEADER_ENCODING) for h in AUTH_HEADER_TYPES}


class ChatConsumer(BaseConsumer):
    @count_query
    async def connect(self):
        if CHAT_DEBUG:
            client_id = dict(self.scope["headers"])[b"client"].decode("utf8")
            client_session = await database_sync_to_async(
                ClientSession.objects.select_related("user").filter(id=client_id).first
            )()
            await self.perform_authentication(client_session)
        await self.accept()

    @count_query
    async def disconnect(self, close_code):
        if self.scope["user"].is_authenticated:
            self.client_session.online = False
            await self.client_session.asave()

            online_clients = await database_sync_to_async(
                ClientSession.objects.filter(user=self.scope["user"], online=True).exists
            )()
            if not online_clients:
                await self.change_online(False)

        raise StopConsumer()

    @debug_request
    @count_query
    async def receive_json(self, content, **kwargs):
        try:
            handler = RequestHandler(content, self)
            await handler.handle(internal_request=False)
        except Exception as e:
            await self.disconnect(500)
            raise e

    async def group_receive(self, event):
        if not (self.client_session.id in event.get("exclude_clients")):
            content = event["content"]
            await self.send_json(content)

    async def perform_authentication(self, client_session) -> None:
        self.scope["user"] = client_session.user
        self.client_session: ClientSession = client_session
        self.room_name = client_session.user.id
        self.room_group_name = "user_%s" % self.room_name

        await self.channel_layer.group_add(self.room_group_name, self.channel_name)

        online_clients = await ClientSession.objects.filter(user=self.scope["user"], online=True).aexists()

        if not online_clients:
            await self.change_online(True)

    async def change_online(self, is_online):
        self.scope["user"].online = is_online
        await database_sync_to_async(self.scope["user"].save)()

        clients_datas = await database_sync_to_async(
            Participation.objects.filter(chat__users__in=[self.scope["user"]]).distinct("user").values_list
        )(
            "user",
            "chat__id",
        )
        await database_sync_to_async(clients_datas._fetch_all)()

        sent_users = []
        for client_data in clients_datas:
            user_id, chat_id = client_data[0], client_data[1]
            data = {"action": "chat__change_online", "type": "notify", "data": {"id": chat_id, "online": is_online}}
            if user_id not in sent_users and user_id != self.scope["user"].id:
                await self.channel_layer.group_send(
                    f"user_{user_id}",
                    {"type": "group.receive", "content": data, "exclude_clients": [self.client_session.id]},
                )
                sent_users.append(user_id)

    def get_raw_token(self, header: bytes) -> Optional[bytes]:
        """
        Extracts an unvalidated JSON web token from the given "Authorization"
        header value.
        """
        parts = header.split()

        if len(parts) == 0:
            # Empty AUTHORIZATION header sent
            return None

        if parts[0] not in AUTH_HEADER_TYPE_BYTES:
            # Assume the header does not contain a JSON web token
            return None

        if len(parts) != 2:
            self.close(
                code="bad_authorization_header",
            )
            return None

        return parts[1]

    def get_validated_token(self, raw_token: bytes) -> Tuple[Optional[Token], dict]:
        """
        Validates an encoded JSON web token and returns a validated token
        wrapper object.
        """
        for AuthToken in api_settings.AUTH_TOKEN_CLASSES:
            try:
                return AuthToken(raw_token), {}
            except exceptions.TokenError as e:
                return None, {
                    "token_class": AuthToken.__name__,
                    "token_type": AuthToken.token_type,
                    "message": e.args[0],
                }

        return None, {}

    def get_user(self, validated_token: Token) -> Tuple[Optional[User], str]:
        """
        Attempts to find and return a user using the given validated token.
        """
        try:
            user_id = validated_token[api_settings.USER_ID_CLAIM]
        except KeyError:
            return None, "user_not_found"

        try:
            user = User.objects.get(**{api_settings.USER_ID_FIELD: user_id})
        except User.DoesNotExist:
            return None, "user_not_found"
        if not user.is_active:
            return None, "user_inactive"

        if api_settings.CHECK_REVOKE_TOKEN:
            if validated_token.get(api_settings.REVOKE_TOKEN_CLAIM) != get_md5_hash_password(user.password):
                return None, "password_changed"
        return user, "found"
