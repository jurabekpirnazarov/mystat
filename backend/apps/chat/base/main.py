import inspect
from typing import Optional, Tuple, Union

from channels.db import database_sync_to_async
from channels.generic.websocket import AsyncJsonWebsocketConsumer
from django.core.exceptions import ObjectDoesNotExist
from rest_framework_simplejwt import exceptions
from rest_framework_simplejwt.settings import api_settings
from rest_framework_simplejwt.tokens import Token
from rest_framework_simplejwt.utils import get_md5_hash_password

from apps.chat.base import status as _status
from apps.chat.models import ClientSession

from ...users.models import User
from .exceptions import NotFound, PermissionDenied
from .utils import catch_exception


class BaseConsumer(AsyncJsonWebsocketConsumer):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.room_name = "unauthorized"
        self.room_group_name = "unauthorized_group"
        self.client_session: Union[ClientSession, None] = None

    def __getattribute__(self, name):
        value = object.__getattribute__(self, name)
        if inspect.ismethod(value):
            return catch_exception(value)
        return value


class BaseHandler:
    queryset = None
    """
        You should specify select_related and prefetch_related if you want use the relational fields.
        If you dont do it, then it makes a synchronous call to the db.
    """
    lookup_field = "id"
    lookup_kwarg = "id"
    internal = False
    authentication_required = True

    def __init__(self, request, consumer):
        self._model_object = None
        self.request = request
        self.consumer = consumer

    async def handle(self):
        await self.check_authentication()
        await self._check_permissions()
        await self.main(self.request)

    async def main(self, request):
        assert True, "main() must be implemented"

    async def _check_permissions(self):
        permission = await self.check_permissions()
        if not permission:
            raise PermissionDenied()

    async def check_permissions(self):
        """should be implemented"""
        return True

    async def check_authentication(self):
        if self.authentication_required:
            if not self.consumer.scope["user"].is_authenticated:
                raise PermissionDenied("Authentication required!")

    async def get_object(self, cached=True):
        try:
            if cached and self._model_object:
                return self._model_object
            else:
                search_lookup = {self.lookup_field: self.request.data.get(self.lookup_kwarg)}
                self._model_object = await database_sync_to_async(self.queryset.get)(**search_lookup)
                return self._model_object
        except ObjectDoesNotExist as e:
            raise NotFound(e)

    async def respond(self, data=None, status=_status.SUCCESS_RESPONSE):
        if data is None:
            data = {}

        result_data = {"action": self.request.action}
        if status == _status.SUCCESS_RESPONSE:
            result_data["type"] = "response"
            result_data["status"] = "success"
        elif status == _status.FAIL_RESPONSE:
            result_data["type"] = "response"
            result_data["status"] = "fail"
        elif status == _status.NOTIFY:
            result_data["type"] = "notify"
            result_data["status"] = "success"

        result_data["data"] = data
        await self.consumer.send_json(result_data)

    async def send(self, user_id, data, exclude=None, exclude_current=False):
        if exclude is None:
            exclude = []

        if exclude_current:
            exclude += [self.consumer.client_session.id]

        content = {"action": self.request.action, "type": _status.NOTIFY, "data": data}
        await self.consumer.channel_layer.group_send(
            f"user_{user_id}", {"type": "group.receive", "content": content, "exclude_clients": exclude}
        )

    def get_validated_token(self, raw_token: bytes) -> Tuple[Optional[Token], dict]:
        """
        Validates an encoded JSON web token and returns a validated token
        wrapper object.
        """
        # messages = []
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
