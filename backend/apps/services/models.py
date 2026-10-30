from decimal import Decimal
from django.core.validators import MinValueValidator, MaxValueValidator
from django.db import models
from apps.accounts.models import User
from apps.common.models import BaseModel, Region, District
from ckeditor.fields import RichTextField
from django.utils.translation import gettext_lazy as _


# Create your models here.
class ServiceCategory(BaseModel):
    name = models.CharField(max_length=255, verbose_name=_("Kategoriya nomi"))
    
    class Meta:
        verbose_name = _("Servis kategoriyasi")
        verbose_name_plural = _("Servis kategoriyalari")

    def __str__(self):
        return self.name


class Service(BaseModel):
    DURATION_CHOICES = (
        ("now", "Hoziroq"),
        ("to_1_day", "1 kun ichida"),
        ("to_1_2_day", "1-2 kun ichida"),
        ("to_week", "1 hafta ichida"),
    )
    category = models.ForeignKey(ServiceCategory, on_delete=models.CASCADE, related_name='services', verbose_name=_("Kategoriya"), null=True, blank=True)
    orders = models.IntegerField(default=0, verbose_name=_("Order"))
    name_uz = models.CharField(max_length=255, verbose_name=_("Servis nomi (Uzbek)"))
    name_ru = models.CharField(max_length=255, verbose_name=_("Servis nomi (Russian)"))
    name_cry = models.CharField(max_length=255, verbose_name=_("Servis nomi (Cyrillic)"))
    description_uz = RichTextField(blank=True, verbose_name=_("Tasnif (Uzbek)"))
    description_ru = RichTextField(blank=True, verbose_name=_("Tasnif (Russian)"))
    description_cry = RichTextField(blank=True, verbose_name=_("Tasnif (Cyrillic)"))
    is_free = models.BooleanField(default=False, verbose_name=_("Tekin"))
    requires_login = models.BooleanField(default=False, verbose_name=_("Kirish talab qilinadi"),
                                         help_text=_("Sahifa ochiq, lekin ma'lumot/amal uchun tizimga kirish kerak"))
    icon = models.CharField(max_length=255, blank=True, null=True, verbose_name="Icon")
    duration = models.CharField(max_length=100, verbose_name=_("Vaqti"), choices=DURATION_CHOICES, default="now")
    slug = models.CharField(max_length=255, verbose_name="Link (Slug)", null=True, blank=True)
    is_active = models.BooleanField(default=True, verbose_name=_("Aktivmi"))
    is_popular = models.BooleanField(default=False, verbose_name=_("Mashhurmi"))
    contact = models.CharField(max_length=13, verbose_name=_("Kontakt"))
    reglament = RichTextField(blank=True, verbose_name=_("Reglament"))
    organization = models.ForeignKey('organizations.Organization', on_delete=models.CASCADE, verbose_name=_("Tashkilot"))
    youtube_link = models.URLField(blank=True, null=True, verbose_name="Youtube Link")
    oferta = models.FileField(upload_to='oferta', blank=True, null=True, verbose_name=_("Oferta fayl"))
    in_package = models.ForeignKey('PackageService', on_delete=models.SET_NULL, related_name='services_in_package', verbose_name=_("Paketda"), null=True, blank=True)

    class Meta:
        verbose_name = _("Servis")
        verbose_name_plural = _("Servislar")

    def __str__(self):
        return self.name_uz


class ServiceItem(BaseModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='items', verbose_name=_("Servis"))
    name_uz = models.CharField(max_length=255, verbose_name=_("Element nomi (Uzbek)"))
    name_ru = models.CharField(max_length=255, verbose_name=_("Element nomi (Russian)"))
    name_cry = models.CharField(max_length=255, verbose_name=_("Element nomi (Cyrillic)"))
    description_uz = models.TextField(blank=True, verbose_name=_("Tasnif (Uzbek)"))
    description_ru = models.TextField(blank=True, verbose_name=_("Tasnif (Russian)"))
    description_cry = models.TextField(blank=True, verbose_name=_("Tasnif (Cyrillic)"))

    class Meta:
        verbose_name = _("Servis elementi")
        verbose_name_plural =_("Servis elementlari")

    def __str__(self):
        return self.name_uz
    

class ServicePackage(BaseModel):
    name_uz = models.CharField(max_length=255, verbose_name=_("Paket nomi (Uzbek)"))
    name_ru = models.CharField(max_length=255, verbose_name=_("Paket nomi (Russian)"))
    name_cry = models.CharField(max_length=255, verbose_name=_("Paket nomi (Cyrillic)"))
    description_uz = RichTextField(blank=True, verbose_name=_("Tasnif (Uzbek)"))
    description_ru = RichTextField(blank=True, verbose_name=_("Tasnif (Russian)"))
    description_cry = RichTextField(blank=True, verbose_name=_("Tasnif (Cyrillic)"))
    base_bhm_count = models.IntegerField(default=1, verbose_name=_("Asosiy BHM miqdori"))
    is_active = models.BooleanField(default=True, verbose_name=_("Aktivmi"))
    duration_days = models.IntegerField(default=365, verbose_name=_("Yaroqlilik (kunlar)"))
    file = models.FileField(upload_to='service_packages/', blank=True, null=True, verbose_name=_("Fayl"))
    is_enterprise = models.BooleanField(default=False, verbose_name=_("Korxona paketimi"))

    # KR-41: paket faollashganda hamyonga beriladigan StatCoin (apps.credits.packages). Bo'sh `statcoin_kind` — mavjud
    # (eski) paketlar: ular StatCoin bermaydi va o'zgarmaydi.
    STATCOIN_KINDS = (("", _("Hamyonga qo'shmaydi")), ("monthly", _("Oylik hamyon to'ldirish")), ("topup", _("Bir martalik qo'shimcha")))
    STATCOIN_PLANS = (("", _("Tarifsiz")), ("s50", "Scoring 50"), ("s60", "Scoring 60"), ("s90", "Scoring 90"),
                      ("corp", _("Korporativ")))
    statcoin_kind = models.CharField(max_length=10, choices=STATCOIN_KINDS, blank=True, default="",
                                     verbose_name=_("Hamyon turi"),
                                     help_text=_("Oylik: har oy shu miqdor beriladi (ishlatilmagani keyingi oyga o'tmaydi). "
                                                 "Qo'shimcha: bir marta, paket muddati (standart 365 kun) amal qiladi."))
    statcoin_amount = models.DecimalField(max_digits=8, decimal_places=1, default=0, verbose_name=_("Hamyonga qo'shiladigan summa (so'm)"))
    statcoin_plan = models.CharField(max_length=10, choices=STATCOIN_PLANS, blank=True, default="",
                                     verbose_name=_("Scoring tarifi darajasi"),
                                     help_text=_("Oylik paket faol bo'lsa hamyonning tarifi shunga o'rnatiladi."))

    @property
    def name(self):
        """Shartnoma kodi (`service_package.name`) uchun: modelda `name` maydoni yo'q edi → AttributeError/500."""
        return self.name_uz or self.name_ru or self.name_cry

    @property
    def price(self):
        from apps.common.models import SiteSettings
        settings = SiteSettings.load()
        if settings:
            return self.base_bhm_count * settings.bhm_value
        return 0

    class Meta:
        verbose_name = _("Servis paket")
        verbose_name_plural =_("Servis paketlar")

    def __str__(self):
            return self.name_uz


class ServicePackagePrice(BaseModel):
    service_package = models.ForeignKey(ServicePackage, on_delete=models.CASCADE, related_name='prices', verbose_name=_("Servis paket"))
    bhm_count = models.IntegerField(default=1, verbose_name=_("BHM miqdori"))
    sector = models.ForeignKey('common.Sector', on_delete=models.CASCADE, related_name='service_package_prices', verbose_name=_("Sektor" ))
    
    class Meta:
        verbose_name = _("Servis paket narxi")
        verbose_name_plural = _("Servis paket narxlari")

    def __str__(self):
        return f"{self.service_package.name_uz} - {self.bhm_count} BHM"


class PackageService(models.Model):
    name_uz = RichTextField(max_length=255, verbose_name=_("Servis nomi"))
    name_ru = RichTextField(max_length=255, verbose_name=_("Servis nomi (Russian)"))
    name_cry = RichTextField(max_length=255, verbose_name=_("Servis nomi (Cyrillic)"))
    slug = models.CharField(max_length=255, verbose_name="Link (Slug)", null=True, blank=True)


    class Meta:
        verbose_name = _("Paket servis")
        verbose_name_plural = _("Paket servislar")

    def __str__(self):
        return f"{self.name_uz}"


class PackageServiceItem(models.Model):
    package = models.ForeignKey(ServicePackage, on_delete=models.CASCADE, related_name='package_service_items', verbose_name=_("Paket"))
    package_service = models.ForeignKey(PackageService, on_delete=models.CASCADE, related_name='service_items', verbose_name=_("Paket servis"))
    name_uz = models.CharField(max_length=255, verbose_name=_("Element nomi (Uzbek)"))
    name_ru = models.CharField(max_length=255, verbose_name=_("Element nomi (Russian)"))
    name_cry = models.CharField(max_length=255, verbose_name=_("Element nomi (Cyrillic)"))
    UNLIMITED = -1

    limit = models.IntegerField(default=0, verbose_name=_("Limit"),
                                help_text=_("0 — ruxsat yo'q, -1 — cheksiz (masalan, \"Barcha to'plamlar\")"))

    class Meta:
        verbose_name = _("Paket servis elementi")
        verbose_name_plural = _("Paket servis elementlari")

    def __str__(self):
        return f"{self.name_uz}"

    @property
    def is_unlimited(self):
        return self.limit < 0

    def is_exhausted(self, used):
        """Limit tugaganmi: cheksiz (-1) hech qachon, 0 — har doim (ruxsat yo'q)."""
        return not self.is_unlimited and used >= self.limit


class ServiceRequests(BaseModel):
    STATUS_CHOICES = (
        ("created", "Created"),
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    contract = models.ForeignKey('contracts.Contract', on_delete=models.CASCADE, related_name='contracts', verbose_name=_("Kontakt"))
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='service_requests', verbose_name=_("Servis"))
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="created", verbose_name=_("Status"))
    requested_date = models.DateField(auto_now_add=True, verbose_name=_("So'rov yuborilgan vaqti"))
    deadline_date = models.DateField(null=True, blank=True, verbose_name=_("Tugatish muddati"))
    completed_date = models.DateField(null=True, blank=True, verbose_name=_("Tugatilgan vaqti"))
    assigned_to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='assigned_user', verbose_name=_("Ga biriktirilgan"))
    notes = models.TextField(blank=True, verbose_name=_("Eslatmalar"))

    class Meta:
        verbose_name = _("Servis so'rov")
        verbose_name_plural = _("Servis so'rovlar")


class ServiceDeliverables(BaseModel):
    service_request = models.ForeignKey(ServiceRequests, on_delete=models.CASCADE, related_name='service_deliverables_requests', verbose_name=_("Servis so'rovlar"))
    file_path = models.CharField(max_length=255, null=True, blank=True, verbose_name=_("Fayl yo'li"))
    content_type = models.CharField(max_length=255, null=True, blank=True, verbose_name=_("Kontent turi"))
    description = models.CharField(max_length=255, null=True, blank=True, verbose_name=_("tasnif"))
    created_by_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_deliverables_users', verbose_name=_("Tomonidan yaratilgan"))

    class Meta:
        verbose_name = _("Taqdim etilgan xizmat")
        verbose_name_plural = _("Taqdim etilgan xizmatlar")


class ActivityPlans(BaseModel):
    region = models.ForeignKey(Region, max_length=255, null=True, blank=True, verbose_name="Region", on_delete=models.CASCADE, related_name='activity_plans')
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name='activity_plans_districts', verbose_name=_("Tuman"))
    year = models.IntegerField(verbose_name=_("Yil"))
    month = models.IntegerField(verbose_name=_("Oy"))
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='activity_plans_services', verbose_name=_("Servis"))
    plan_count = models.IntegerField(default=0, verbose_name=_("Plan soni"))
    created_by_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='activity_plans_users', verbose_name=_("Tomonidan yaratilgan"))

    class Meta:
        verbose_name = _("Faoliyat rejasi")
        verbose_name_plural = _("Faoliyat rejalari")


class UserServicePackage(BaseModel):
    region = models.ForeignKey(Region, max_length=255, null=True, blank=True, verbose_name=_("Viloyat"), on_delete=models.CASCADE, related_name='user_service_packages')
    district = models.ForeignKey(District, on_delete=models.CASCADE, related_name="user_service_package_district", verbose_name=_("Tuman"))
    year = models.IntegerField(verbose_name=_("Yil"))
    month = models.IntegerField(verbose_name=_("Oy"))
    service = models.ForeignKey(ServicePackage, on_delete=models.CASCADE, related_name='user_service_packages', verbose_name=_("Servis"))
    created_by_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_service_package_users', verbose_name=_("Tomonidan yaratilgan"))
    # KR-41: StatCoin paketi to'langan shartnoma asosida avtomatik faollashganda shartnoma shu yerda (idempotentlik)
    contract = models.ForeignKey('contracts.Contract', on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name='activated_packages', verbose_name=_("Shartnoma"))
    # B-07: mavjud (eski) yozuvlarda NULL — muddatsiz hisoblanadi
    starts_at = models.DateField(null=True, blank=True, verbose_name=_("Boshlanish sanasi"))
    expires_at = models.DateField(null=True, blank=True, verbose_name=_("Tugash sanasi"),
                                  help_text=_("Bo'sh bo'lsa — muddatsiz. Yangi paketda boshlanish + paket muddati (kun)."))

    class Meta:
        verbose_name = _("Foydalanuvchi Servis Paket Plan")
        verbose_name_plural = _("Foydalanuvchi Servis Paket planlar")

    def save(self, *args, **kwargs):
        if self._state.adding:
            from datetime import timedelta
            from django.utils import timezone
            if self.starts_at is None:
                self.starts_at = timezone.localdate()
            if self.expires_at is None and self.service_id and self.service.duration_days:
                self.expires_at = self.starts_at + timedelta(days=self.service.duration_days)
        super().save(*args, **kwargs)

    @property
    def is_expired(self):
        from django.utils import timezone
        return self.expires_at is not None and self.expires_at < timezone.localdate()


class UserServicePackageItemUse(BaseModel):
    usp = models.ForeignKey(UserServicePackage, on_delete=models.CASCADE, related_name='user_service_package_items', verbose_name="User Service Package Item")
    psi = models.ForeignKey(PackageServiceItem, on_delete=models.CASCADE, related_name='user_service_package_items', verbose_name="Package Service Item")
    is_success = models.BooleanField(default=False, verbose_name="Is Success")
    request_data = models.JSONField(null=True, blank=True, verbose_name="Request data")
    response_data = models.JSONField(null=True, blank=True, verbose_name="Response data")

    class Meta:
        verbose_name = "User Service Package Item Use"
        verbose_name_plural = "User Service Package Item Use"

    def __str__(self):
        return f"{self.usp} - {self.psi}"


class ServiceRating(BaseModel):
    service = models.ForeignKey(Service, on_delete=models.CASCADE, related_name='service_ratings', verbose_name=_("Servis"))
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='service_ratings', verbose_name=_("Foydalanuvchi"))
    value = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(fields=['service', 'user'], name='uniq_service_user_rating'),
        ]
        verbose_name = _("Servis reyting")
        verbose_name_plural = _("Servis reytinglar")
        indexes = [
            models.Index(fields=['service']),
            models.Index(fields=['user']),
        ]

    def __str__(self):
        return f"{self.service_id} - {self.user_id}: {self.value}"


class ServiceRequestResponse(BaseModel):
    STATUS_CHOICES = (
        ("created", "Created"),
        ("pending", "Pending"),
        ("completed", "Completed"),
        ("cancelled", "Cancelled"),
    )
    contract = models.ForeignKey(
        'contracts.Contract', on_delete=models.CASCADE,
        related_name='service_requests_contract',
        verbose_name=_("Kontakt")
    )
    package_item = models.ForeignKey(
        PackageService, on_delete=models.CASCADE,
        related_name='service_requests_package_item',
        verbose_name=_("Paket servis elementi")
    )
    client_input_text = models.TextField(null=True, blank=True, verbose_name=_("Matn"))
    client_file = models.FileField(upload_to="service_request_response/client", null=True, blank=True, verbose_name=_("Fayl"))
    admin_input_text = models.TextField(null=True, blank=True, verbose_name=_("Matn"))
    admin_file = models.FileField(upload_to="service_request_response/admin", null=True, blank=True, verbose_name=_("Fayl"))
    status = models.CharField(max_length=10, choices=STATUS_CHOICES, default="created", verbose_name=_("Status"))

    def __str__(self):
        return f"{self.package_item} - Mijoz: {self.contract.user} - Xodim: {self.contract.attached_user} - {self.status}"














class CustomRequestTariff(models.Model):
    """S-13/K-06: individual statistik ma'lumot buyurtmasi narxi (BHM'da)."""
    DATA_TYPES = (
        ("trade", _("Tashqi savdo")),
        ("enterprise", _("Korxonalar")),
        ("industry", _("Sanoat")),
        ("demography", _("Demografiya")),
        ("prices", _("Narxlar")),
        ("other", _("Boshqa")),
    )
    data_type = models.CharField(max_length=16, choices=DATA_TYPES, unique=True, verbose_name=_("Ma'lumot turi"))
    base_bhm = models.DecimalField(max_digits=8, decimal_places=2, verbose_name=_("Asosiy narx (BHM)"))
    per_indicator_bhm = models.DecimalField(max_digits=8, decimal_places=2, default=0, verbose_name=_("Har ko'rsatkich"))
    per_year_bhm = models.DecimalField(max_digits=8, decimal_places=2, default=0, verbose_name=_("Har yil"))
    per_region_bhm = models.DecimalField(max_digits=8, decimal_places=2, default=0, verbose_name=_("Har hudud"))
    urgency_multiplier = models.DecimalField(max_digits=4, decimal_places=2, default=Decimal("1.5"), verbose_name=_("Shoshilinch koeffitsienti"))

    class Meta:
        verbose_name = _("Individual buyurtma tarifi")
        verbose_name_plural = _("Individual buyurtma tariflari")

    def __str__(self):
        return self.get_data_type_display()


class CustomDataRequest(models.Model):
    """K-06: katalogda yo'q individual ma'lumot buyurtmasi. Onlayn to'lov yo'q — narx tasdiqlangach mavjud oqim."""
    STATUSES = (
        ("created", _("Yuborildi")),
        ("priced", _("Narx tasdiqlandi")),
        ("in_progress", _("Bajarilmoqda")),
        ("completed", _("Tayyor")),
        ("cancelled", _("Bekor qilindi")),
    )
    FORMATS = (("xlsx", "XLSX"), ("pdf", "PDF"))

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name="custom_data_requests")
    data_type = models.CharField(max_length=16, choices=CustomRequestTariff.DATA_TYPES, verbose_name=_("Ma'lumot turi"))
    indicators = models.JSONField(default=list, verbose_name=_("Ko'rsatkichlar"))
    year_from = models.PositiveSmallIntegerField(verbose_name=_("Yildan"))
    year_to = models.PositiveSmallIntegerField(verbose_name=_("Yilgacha"))
    regions = models.JSONField(default=list, blank=True, verbose_name=_("Hududlar (bo'sh — respublika)"))
    output_format = models.CharField(max_length=4, choices=FORMATS, default="xlsx", verbose_name=_("Format"))
    urgent = models.BooleanField(default=False, verbose_name=_("Shoshilinch"))
    comment = models.TextField(blank=True, verbose_name=_("Izoh"))
    price_bhm = models.DecimalField(max_digits=10, decimal_places=2, verbose_name=_("Hisoblangan narx (BHM)"))
    price_sum = models.DecimalField(max_digits=14, decimal_places=2, verbose_name=_("Hisoblangan narx (so'm)"))
    approved_price_sum = models.DecimalField(max_digits=14, decimal_places=2, null=True, blank=True,
                                             verbose_name=_("Tasdiqlangan narx (so'm)"))
    status = models.CharField(max_length=12, choices=STATUSES, default="created", db_index=True)
    assigned_to = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="assigned_custom_requests", verbose_name=_("Mas'ul xodim"))
    staff_comment = models.TextField(blank=True, verbose_name=_("Xodim izohi"))
    result_file = models.FileField(upload_to="custom_requests/", null=True, blank=True, verbose_name=_("Natija fayli"))
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Individual ma'lumot buyurtmasi")
        verbose_name_plural = _("Individual ma'lumot buyurtmalari")

    def __str__(self):
        return f"#{self.pk} {self.get_data_type_display()} — {self.user}"
