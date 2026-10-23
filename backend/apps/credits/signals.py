"""KR-41: admin paketni faollashtirganda (`UserServicePackage` yaratilganda) StatCoin hamyonga tushadi."""
from django.db.models.signals import post_save
from django.dispatch import receiver

from apps.services.models import UserServicePackage

from .packages import grant_for_package


@receiver(post_save, sender=UserServicePackage, dispatch_uid="credits_grant_on_package")
def grant_on_package(sender, instance, created, raw=False, **kwargs):
    if created and not raw:
        grant_for_package(instance, 0)
