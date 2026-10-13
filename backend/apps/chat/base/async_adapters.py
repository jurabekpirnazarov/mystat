from channels.db import database_sync_to_async
from django.contrib.auth import authenticate as _authenticate
from django.core.exceptions import ObjectDoesNotExist
from django.db import models
from rest_framework.serializers import ValidationError as _ValidationError

from apps.chat.base.exceptions import ValidationError


class ModelSerializerAsyncMixin:
    async def is_valid_async(self, raise_exception=False):
        try:
            await database_sync_to_async(super(self.__class__, self).is_valid)(raise_exception=raise_exception)
        except _ValidationError:
            raise ValidationError(self.errors) if raise_exception else None

    async def save_async(self, *args, **kwargs):
        return await database_sync_to_async(super(self.__class__, self).save)(*args, **kwargs)


async def authenticate_async(**kwargs):
    return await database_sync_to_async(_authenticate)(**kwargs)


class AsyncModelManager(models.Manager):
    async def async_get(self, select_related=None, **kwargs):
        if select_related:
            return await database_sync_to_async(super(AsyncModelManager, self).select_related(*select_related).get)(
                **kwargs
            )
        else:
            return await database_sync_to_async(super(AsyncModelManager, self).get)(**kwargs)

    async def async_get_or_none(self, select_related=None, **kwargs):
        try:
            return await self.async_get(select_related, **kwargs)
        except ObjectDoesNotExist:
            return None


class ModelAsyncMixin:
    async def delete_async(self, **kwargs):
        return await database_sync_to_async(super(self.__class__, self).delete)(**kwargs)

    async def save_async(self, **kwargs):
        return await database_sync_to_async(super(self.__class__, self).save)(**kwargs)

    @classmethod
    async def create_async(cls, **kwargs):
        return await database_sync_to_async(cls.objects.create)(**kwargs)
