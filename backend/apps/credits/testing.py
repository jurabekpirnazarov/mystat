"""Testlar uchun yordamchi."""
from .models import CreditPrice


def use_package_limits():
    """Xizmat narxlarini nofaol qiladi: `limits.consume` eski paket limiti tartibida ishlaydi (StatCoin yechilmaydi)."""
    CreditPrice.objects.filter(action_code__in=["benchmark", "market_report", "partners_export", "consultation"]
                               ).update(is_active=False)


UNIT_PRICES = {"profile_basis": 1, "profile_deep": 3, "benchmark": 1, "market_report": 3, "partners_export": 2,
               "consultation": 5}


def use_unit_prices():
    """Hisob-kitob mantiqini kichik sonlar bilan tekshirish uchun narxlarni 1/3/... ga tushiradi (haqiqiy narxlar so'mda,
    migratsiya `0005_som_amounts` — alohida test)."""
    for code, price in UNIT_PRICES.items():
        CreditPrice.objects.filter(action_code=code).update(credits=price)
