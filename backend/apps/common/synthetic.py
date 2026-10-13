"""Sintetik (demo) yozuvlar bilan ishlash uchun yordamchilar. ISH_REJASI.md S-01."""
from django.conf import settings
from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from rest_framework import serializers

from .models import SyntheticRecord


def get_or_create_synthetic(model, seed_key, defaults=None):
    """`seed_key` bo'yicha sintetik obyektni qaytaradi yoki yaratadi. -> (obj, created)"""
    record = SyntheticRecord.objects.filter(seed_key=seed_key).first()
    if record is not None:
        obj = model._base_manager.filter(pk=record.object_id).first()
        if obj is not None:
            return obj, False
        record.delete()  # obyekt qo'lda o'chirilgan — qayta yaratamiz

    with transaction.atomic():
        obj = model._base_manager.create(**(defaults or {}))
        register_synthetic(obj, seed_key)
    return obj, True


def register_synthetic(obj, seed_key):
    return SyntheticRecord.objects.create(
        content_type=ContentType.objects.get_for_model(obj.__class__),
        object_id=str(obj.pk),
        seed_key=seed_key,
    )


def registered_ids(model):
    """Reyestrdagi PK'lar (DEBUG'dan qat'i nazar) — seeder'lar uchun."""
    ct = ContentType.objects.get_for_model(model)
    return set(SyntheticRecord.objects.filter(content_type=ct).values_list("object_id", flat=True))


def synthetic_ids(model):
    """Model bo'yicha sintetik obyektlar PK to'plami (str ko'rinishida). DEBUG=False da doim bo'sh."""
    if not settings.DEBUG:
        return set()
    return registered_ids(model)


def is_synthetic(obj):
    if not settings.DEBUG:
        return False
    ct = ContentType.objects.get_for_model(obj.__class__)
    return SyntheticRecord.objects.filter(content_type=ct, object_id=str(obj.pk)).exists()


class SyntheticFlagField(serializers.Field):
    """`is_synthetic` — serializer ichida model bo'yicha bitta so'rov bilan (N+1 siz). S-09."""

    def __init__(self, **kwargs):
        kwargs.setdefault("source", "*")
        kwargs["read_only"] = True
        super().__init__(**kwargs)

    def to_representation(self, obj):
        cache = self.root.__dict__.setdefault("_synthetic_ids_cache", {})
        model = obj.__class__
        if model not in cache:
            cache[model] = synthetic_ids(model)
        return str(obj.pk) in cache[model]
