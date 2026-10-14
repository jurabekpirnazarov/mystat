"""Paket narxi: shartnoma yaratish (contracts) va tarif kalkulyatori (K-09) uchun yagona formula.

narx = paket.base_bhm_count × BHM qiymati (SiteSettings) × sektor koeffitsienti (ServicePackagePrice.bhm_count)
Sektor uchun alohida narx yozilmagan bo'lsa koeffitsient 1.
"""
from decimal import Decimal

from apps.common.models import SiteSettings

VAT_PERCENT = 12


def sector_multiplier(package, sector):
    if sector is None:
        return 1
    while sector.parent_id:  # narxlar OKED bo'limi (yuqori daraja) bo'yicha yozilgan
        sector = sector.parent
    price = package.prices.filter(sector=sector).first()
    return price.bhm_count if price else 1


def package_price(package, sector=None):
    """-> dict: base (sektorsiz), multiplier, price (QQSsiz), vat, total (QQS bilan)."""
    settings_obj = SiteSettings.load()
    bhm = Decimal(settings_obj.bhm_value or 0) if settings_obj else Decimal(0)
    base = Decimal(package.base_bhm_count) * bhm
    multiplier = sector_multiplier(package, sector)
    price = base * multiplier
    vat = price * VAT_PERCENT / 100
    return {
        "bhm_value": bhm,
        "base_bhm_count": package.base_bhm_count,
        "multiplier": multiplier,
        "base": base,
        "price": price,
        "vat_percent": VAT_PERCENT,
        "vat": vat,
        "total": price + vat,
    }
