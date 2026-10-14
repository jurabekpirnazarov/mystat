"""A-02: yangi CPI davri qo'shilganda "ko'rsatkich yangilandi" hodisasi (kuniga bittadan ko'p emas)."""
from django.db.models.signals import post_save
from django.dispatch import receiver
from django.utils import timezone

from apps.additional_services.models.priceindex_model import PriceIndex

from .models import IndicatorUpdateEvent


@receiver(post_save, sender=PriceIndex)
def cpi_updated(sender, instance, created, raw=False, **kwargs):
    if raw or not created or instance.year is None:
        return
    today = timezone.localdate()
    if IndicatorUpdateEvent.objects.filter(indicator="cpi", date=today).exists():
        return
    IndicatorUpdateEvent.objects.create(indicator="cpi", date=today, link="/cpi-calculator",
                                        title=f"Iste'mol narxlari indeksi yangilandi: {instance.year:%Y-%m}")
