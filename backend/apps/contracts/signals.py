"""K-08: shartnoma holati yoki imzo belgilari o'zgarganda ContractStatusLog yozuvi."""
from django.db.models.signals import post_save, pre_save
from django.dispatch import receiver

from .models import Contract, ContractStatusLog

TRACKED = ("status", "signed_by_client", "signed_by_admin")


@receiver(pre_save, sender=Contract)
def remember_previous_state(sender, instance, **kwargs):
    previous = None
    if instance.pk:
        previous = Contract._base_manager.filter(pk=instance.pk).values(*TRACKED).first()
    instance._previous_state = previous


@receiver(post_save, sender=Contract)
def log_status_change(sender, instance, created, raw=False, **kwargs):
    if raw:
        return
    current = {f: getattr(instance, f) for f in TRACKED}
    previous = getattr(instance, "_previous_state", None)
    if created or previous is None or previous != current:
        ContractStatusLog.objects.create(contract=instance, **current)
