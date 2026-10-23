"""Testlar uchun yordamchi."""
from .models import CreditPrice


def use_package_limits():
    """Xizmat narxlarini nofaol qiladi: `limits.consume` eski paket limiti tartibida ishlaydi (StatCoin yechilmaydi)."""
    CreditPrice.objects.filter(action_code__in=["benchmark", "market_report", "partners_export", "consultation"]
                               ).update(is_active=False)
