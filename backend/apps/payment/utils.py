from django.utils import timezone


def extend_object_datetime_field(obj, days, field):
    if not getattr(obj, field):
        setattr(obj, field, timezone.now() + timezone.timedelta(days=days))
    elif getattr(obj, field) > timezone.now():
        setattr(obj, field, getattr(obj, field) + timezone.timedelta(days=days))
    else:
        setattr(obj, field, timezone.now() + timezone.timedelta(days=days))
    obj.save(update_fields=[field])
