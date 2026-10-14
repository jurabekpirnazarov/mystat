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


def bulk_create_synthetic(model, items, batch_size=2000):
    """Ko'p qatorli seeder'lar uchun: `items` — [(seed_key, fields), ...].

    Reyestrda bor seed_key'lar o'tkazib yuboriladi (idempotent). -> yaratilganlar soni.
    """
    keys = [k for k, _ in items]
    existing = set()
    for i in range(0, len(keys), 5000):
        existing.update(SyntheticRecord.objects.filter(seed_key__in=keys[i:i + 5000]).values_list("seed_key", flat=True))
    todo = [(k, f) for k, f in items if k not in existing]
    if not todo:
        return 0
    ct = ContentType.objects.get_for_model(model)
    created = 0
    with transaction.atomic():
        for i in range(0, len(todo), batch_size):
            chunk = todo[i:i + batch_size]
            objs = model._base_manager.bulk_create([model(**f) for _, f in chunk], batch_size=batch_size)
            SyntheticRecord.objects.bulk_create(
                [SyntheticRecord(content_type=ct, object_id=str(o.pk), seed_key=k) for o, (k, _) in zip(objs, chunk)],
                batch_size=batch_size,
            )
            created += len(objs)
    return created


def data_source(model, queryset):
    """S-09: agregat javoblar uchun "real" | "synthetic" | "mixed" (DEBUG=False da doim "real")."""
    ids = synthetic_ids(model)
    if not ids:
        return "real"
    pks = {str(pk) for pk in queryset.values_list("pk", flat=True)}
    if not pks:
        return "real"
    syn = len(pks & ids)
    return "synthetic" if syn == len(pks) else "mixed" if syn else "real"
