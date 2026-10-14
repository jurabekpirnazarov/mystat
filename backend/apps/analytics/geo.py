"""Viloyat kodlari (SOATO) va boshqa jadvallardagi hudud yozuvlari o'rtasidagi moslik."""

# common.Region.code -> IndustrialProduct.adress_uz boshlanishi (manzil "Viloyat, tuman, ..." ko'rinishida)
ADDRESS_PREFIX = {
    "1703": "Andijon", "1706": "Buxoro", "1708": "Jizzax", "1710": "Qashqadaryo", "1712": "Navoiy",
    "1714": "Namangan", "1718": "Samarqand", "1722": "Surxondaryo", "1724": "Sirdaryo",
    "1726": "Toshkent sh", "1727": "Toshkent v", "1730": "Farg", "1733": "Xorazm", "1735": "Qoraqalpog",
}

# Lotin yozuvidagi nomlar (common.Region.name kirillcha)
REGION_NAME_UZ = {
    "1703": "Andijon viloyati", "1706": "Buxoro viloyati", "1708": "Jizzax viloyati", "1710": "Qashqadaryo viloyati",
    "1712": "Navoiy viloyati", "1714": "Namangan viloyati", "1718": "Samarqand viloyati",
    "1722": "Surxondaryo viloyati", "1724": "Sirdaryo viloyati", "1726": "Toshkent shahri",
    "1727": "Toshkent viloyati", "1730": "Farg'ona viloyati", "1733": "Xorazm viloyati",
    "1735": "Qoraqalpog'iston Respublikasi",
}


def region_name_uz(region):
    return REGION_NAME_UZ.get(region.code, region.name)
