from django.db import models
from apps.common.models import BaseModel
from django.utils.translation import gettext_lazy as _


class CountryGroup(BaseModel):
    name_uz = models.CharField(max_length=100)  
    name_ru = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_cry = models.CharField(max_length=100)
    code = models.CharField(max_length=10, unique=True)

    class Meta:
        verbose_name = _("Davlat Guruhi")
        verbose_name_plural = _("Davlat Guruhlari")

    def __str__(self):
        return f"{self.name_uz} ({self.code})"


class Country(BaseModel):
    ctrana = models.CharField(max_length=10, unique=True, null=True, blank=True)
    zar0 = models.CharField(max_length=100)
    zar1 = models.CharField(max_length=100)
    zar = models.CharField(max_length=100)
    name = models.CharField(max_length=100)
    name_en = models.CharField(max_length=100)
    name_cry = models.CharField(max_length=100)
    name_uz = models.CharField(max_length=100)
    name_ru = models.CharField(max_length=100)
    kod_kont = models.CharField(max_length=100)
    country_group = models.ManyToManyField(
        CountryGroup,
        related_name='countries'
    )

    class Meta:
        verbose_name = _("Davlat")
        verbose_name_plural = _("Davlatlar")

    def __str__(self):
        return self.name_uz


class Unit(BaseModel):
    code = models.CharField(max_length=10, unique=True)
    name = models.CharField(max_length=100)
    short_name = models.CharField(max_length=100)

    class Meta:
        verbose_name = _("Birlik")
        verbose_name_plural = _("Birliklar")

    def __str__(self):
        return self.name


class Region(BaseModel):
    name_uz = models.CharField(max_length=100)  
    name_ru = models.CharField(max_length=100) 
    name_en = models.CharField(max_length=100) 
    name_cry = models.CharField(max_length=100)  
    soato = models.CharField(max_length=10, unique=True)  

    class Meta:
        verbose_name = _("Tuman")
        verbose_name_plural = _("Tumanlar")

    def __str__(self):
        return self.name_uz


class SITC(BaseModel):
    code = models.CharField(max_length=10, unique=True, db_index=True)  
    name_uz = models.CharField(max_length=255) 
    name_ru = models.CharField(max_length=255) 
    name_cry = models.CharField(max_length=255, null=True, blank=True) 
    parent = models.ForeignKey('self', to_field='code', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    level = models.IntegerField(default=1)  

    class Meta:
        verbose_name = _("SITC")
        verbose_name_plural = _("SITC Klassifikatsiyalari")
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name_uz}"

    @property
    def is_section(self):
        """1 darajali bo'lim (SITC1)"""
        return self.level == 1

    @property
    def is_division(self):
        """2 darajali bo'lim (SITC2)"""
        return self.level == 2

    @property
    def is_group(self):
        """3 darajali guruh (SITC3)"""
        return self.level == 3

    @property
    def is_subgroup(self):
        """4 va 5 darajali subguruh (SITC4 va SITC5 birlashtirilgan)"""
        return self.level in [4, 5]

    def get_section(self):
        """Asosiy bo'limni olish"""
        current = self
        while current.parent:
            current = current.parent
        return current


class Year(BaseModel):
    year = models.IntegerField(unique=True) 

    class Meta:
        verbose_name = _("Yil")
        verbose_name_plural = _("Yillar")
        ordering = ['-year']
        db_table = 'years'

    def __str__(self):
        return str(self.year)
    

class Product(BaseModel):
    code = models.CharField(max_length=6, unique=True, db_index=True)  
    name_ru  = models.TextField()
    name_uz  = models.TextField()
    name_cry = models.TextField()
    name_cry2= models.TextField()
    
    parent = models.ForeignKey('self', to_field='code', on_delete=models.CASCADE, null=True, blank=True, related_name='children')
    level = models.IntegerField(default=1)  # 1=ZNAK_2, 2=ZNAK_4, 3=ZNAK_6
    
    class Meta:
        verbose_name = _("Mahsulot")
        verbose_name_plural = _("Mahsulotlar")
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name_uz}"

    @property
    def is_category(self):
        """2 xonali kategoriya ekanligini tekshirish"""
        return self.level == 1

    @property
    def is_subcategory(self):
        """4 xonali subkategoriya ekanligini tekshirish"""
        return self.level == 2

    @property
    def is_product(self):
        """6 xonali mahsulot ekanligini tekshirish"""
        return self.level == 3

    def get_category(self):
        """Asosiy kategoriyani olish"""
        if self.level == 1:
            return self
        elif self.level == 2:
            return self.parent
        elif self.level == 3:
            return self.parent.parent if self.parent else None
        return None

    def get_subcategory(self):
        """Subkategoriyani olish"""
        if self.level == 2:
            return self
        elif self.level == 3:
            return self.parent
        return None


class TradeData(BaseModel):
    MONTH_CHOICES = (
        ("M1", "Jan"),
        ("M2", "Jan-Feb"),
        ("M3", "Jan-Mar"),
        ("M4", "Jan-Apr"),
        ("M5", "Jan-May"),
        ("M6", "Jan-Jun"),
        ("M7", "Jan-Jul"),
        ("M8", "Jan-Aug"),
        ("M9", "Jan-Sep"),
        ("M10", "Jan-Oct"),
        ("M11", "Jan-Nov"),
        ("M12", "Jan-Dec"),
    )

    TRADE_TYPE = (
        (1, "Export"),
        (2, "Import"),
    )

    trade_type = models.PositiveSmallIntegerField(choices=TRADE_TYPE, default=1)
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='trade_data')
    unit = models.ForeignKey(Unit, on_delete=models.CASCADE, related_name='trade_data')
    year = models.ForeignKey(Year, to_field="year", on_delete=models.CASCADE, related_name='trade_data')
    month = models.CharField(max_length=7, choices=MONTH_CHOICES, default="M1")
    country = models.ForeignKey(Country, on_delete=models.CASCADE, related_name='trade_data')
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='trade_data')
    sitc = models.ForeignKey(SITC, on_delete=models.CASCADE, related_name='trade_data')
    value = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)
    quantity = models.DecimalField(max_digits=20, decimal_places=2, null=True, blank=True)

    class Meta:
        verbose_name = _("Savdo ma'lumoti")
        verbose_name_plural = _("Savdo ma'lumotlari")

    def __str__(self):
        return f"{self.year.year} - {self.country.name_uz} - {self.product.code}"

