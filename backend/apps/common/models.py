from django.db import models
from django.conf import settings
from django.utils.translation import gettext_lazy as _, gettext
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.core.validators import RegexValidator
from django.core.validators import FileExtensionValidator

from ckeditor.fields import RichTextField


class AdminTOTPDevice(models.Model):
    """Admin login uchun Google Authenticator (TOTP) qurilmasi.
    Har foydalanuvchi uchun bitta secret va is_verified holati."""
    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="admin_totp",
        verbose_name=_("Foydalanuvchi"),
    )
    secret = models.CharField(verbose_name=_("TOTP Secret"), max_length=64)
    is_active = models.BooleanField(verbose_name=_("Faol"), default=True)
    is_verified = models.BooleanField(
        verbose_name=_("Sozlash tasdiqlangan"),
        default=False,
        help_text=_("Foydalanuvchi birinchi marta QR'ni skan qilib kod kiritgan paytda True bo'ladi."),
    )
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Admin 2FA qurilma")
        verbose_name_plural = _("Admin 2FA qurilmalar")

    def __str__(self):
        return f"{self.user} ({'verified' if self.is_verified else 'pending'})"



class SingletonModel(models.Model):
    class Meta:
        abstract = True

    def save(self, *args, **kwargs):
        self.pk = 1
        super().save(*args, **kwargs)
        self.__class__.objects.filter(pk__gt=1).delete()

    @classmethod
    def load(cls):
        obj, created = cls.objects.get_or_create(pk=1)
        return obj
    
    def delete(self, *args, **kwargs):
        pass


class SiteSettings(SingletonModel):
    #Korxona va tashkilotlar to'g'risida ma'lumot olish uchun registr serverdagi authorizatsiya ma'lumotlarini saqlab ketdim
    main_server_client_id = models.CharField(verbose_name=_("Main server client id"), blank=True, null=True)
    main_server_client_secret = models.CharField(verbose_name=_("Main server client secret"), blank=True, null=True)


    site_name = models.CharField(max_length=200, default="Mening Saytim")
    logo = models.ImageField(upload_to="logos/", blank=True, null=True)
    contact_email = models.EmailField(default="admin@example.com")
    didox_user_token = models.CharField(max_length=255, blank=True, null=True)
    didox_partner_token = models.CharField(max_length=255, blank=True, null=True)
    didox_url = models.URLField(default="https://api.didox.uz/v1/contract")
    didox_seller_address = models.CharField(max_length=255, blank=True, null=True)
    didox_client_url = models.URLField(default="https://web.goodsign.uz")
    didox_user_updated_at = models.DateTimeField(blank=True, null=True)
    tax_spic = models.CharField(
        verbose_name=_("Soliq SPIC"),
        default="",
        max_length=20
    )
    tax_service_code = models.CharField(
        verbose_name=_("Soliq Servis kod"),
        max_length=100,
        blank=True,
        null=True
    )
    tax_package_code = models.CharField(
        verbose_name=_("Soliq Paket kod"),
        max_length=255,
        default=""
    )
    tax_nds = models.IntegerField(
        default=15,
        verbose_name=_("Soliq NDS")
    )
    tax_tin = models.CharField(
        verbose_name="Soliq INN",
        default="",
        max_length=9
    )

    bhm_value = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        default=0,
        verbose_name=_("BHM qiymati")
    )
    last_didox_update = models.DateTimeField(blank=True, null=True)

    def __str__(self):
        return "Sayt sozlamalari"
    

class BaseModel(models.Model):
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        abstract = True

    def delete(self, *args, **kwargs):
        self.is_active = False
        self.save()

    def hard_delete(self, *args, **kwargs):
        super().delete(*args, **kwargs)


class Region(BaseModel):
    name = models.CharField(max_length=100, unique=True, verbose_name=_("Viloyatning nomi"))
    code = models.CharField(max_length=10, unique=True, verbose_name=_("Viloyatning kodi"))

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Viloyat")
        verbose_name_plural = _("Viloyatlar")
        ordering = ['name']
        db_table = 'region'


class District(BaseModel):
    name = models.CharField(max_length=100, verbose_name=_("Tumanning nomi"))
    region = models.ForeignKey(Region, on_delete=models.CASCADE, related_name='districts', verbose_name=_("Viloyat"))
    code = models.CharField(max_length=10, verbose_name=_("Tumanning kodi"))
    is_stat = models.BooleanField(default=False, verbose_name=_("Statistika Boshqarmasi uchun"))


    def __str__(self):
        return f"{self.region.code}{self.code}"

    class Meta:
        verbose_name = _("Tuman")
        verbose_name_plural = _("Tumanlar")
        ordering = ['name']
        unique_together = ('code', 'region')
        db_table = 'district'


class File(BaseModel):
    filename = models.CharField(max_length=255)
    original_filename = models.CharField(max_length=255)
    file_path = models.CharField(max_length=1024)  # yoki FileField ishlatish mumkin
    file_size = models.IntegerField()
    mime_type = models.CharField(max_length=100)

    # Generic Foreign Key uchun kerak bo'lgan 2 ta field
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.PositiveIntegerField()
    content_object = GenericForeignKey('content_type', 'object_id')
    uploaded_by_user = models.ForeignKey('accounts.User', on_delete=models.CASCADE)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename


class QuestionAnswer(BaseModel):
    question_uz = models.CharField(max_length=255, verbose_name=_("Savol (uz)"))
    question_ru = models.CharField(max_length=255, verbose_name=_("Savol (ru)"))
    question_cry = models.CharField(max_length=255, verbose_name=_("Savol (cry)"))
    answer_uz = RichTextField(verbose_name=_("Javob (uz)"))
    answer_ru = RichTextField(verbose_name=_("Javob (ru)"))
    answer_cry = RichTextField(verbose_name=_("Javob (cry)"))

    def __str__(self):
        return self.question_uz or 'QA'


class Branch(models.Model):
    name = models.CharField(max_length=255)
    region = models.OneToOneField(Region, on_delete=models.SET_NULL, null=True, blank=True)
    inn = models.CharField(max_length=9, unique=True, validators=[
        RegexValidator(
            regex=r'^\d{9}$',
            message=_("INN must be 9 digits."),
            code='invalid_inn'
        )
    ])
    bugalter = models.ForeignKey('accounts.User', on_delete=models.SET_NULL, null=True, blank=True)
    address = models.CharField(max_length=255)


    def __str__(self):
        return self.name


class Contact(BaseModel):
    name = models.CharField(max_length=255)
    surname = models.CharField(max_length=255)
    phone_number = models.CharField(max_length=13)
    email = models.EmailField()
    text = RichTextField()

    def __str__(self):
        return self.name
    

class Sector(BaseModel):
    """
    Sectors/Fields of economy
    """
    name = models.CharField(max_length=255)
    name_uz = models.CharField(max_length=255, blank=True, null=True)
    name_cry = models.CharField(max_length=255, blank=True, null=True)
    name_en = models.CharField(max_length=255, blank=True, null=True)
    name_ru = models.CharField(max_length=255, blank=True, null=True)
    name_qr = models.CharField(max_length=255, blank=True, null=True)
    stat_classifier = models.CharField(max_length=50, blank=True, null=True)
    code = models.CharField(max_length=50, unique=True, db_index=True)
    code2 = models.CharField(max_length=50, blank=True, null=True)
    code3 = models.CharField(max_length=50, blank=True, null=True)
    code4 = models.CharField(max_length=50, blank=True, null=True)
    order = models.IntegerField(default=0)
    parent_code = models.CharField(max_length=50, blank=True, null=True,
                                   help_text="Raw parent code from import (kept for reference)")
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, blank=True, null=True, related_name='children')

    class Meta:
        verbose_name = _("Sector")
        verbose_name_plural = _("Sektorlar")
        ordering = ['code']

    def __str__(self):
        return f"{self.code} - {self.name}"
    


class ConsultingPlan(BaseModel):
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True)
    price = models.DecimalField(max_digits=15, decimal_places=2)
    year = models.ForeignKey("additional_services.Year", on_delete=models.SET_NULL, null=True)

    def __str__(self):
        return str(self.price) + " - " + str(self.year)
    
    class Meta:
        verbose_name = _("Reja ")
        verbose_name_plural = _("Rejalar")
        ordering = ['-year']
        unique_together = ('district', 'year')


class InformationModel(BaseModel):
    region = models.ForeignKey(Region, on_delete=models.SET_NULL, null=True, blank=True)
    district = models.ForeignKey(District, on_delete=models.SET_NULL, null=True, blank=True)
    is_main = models.BooleanField(default=False)
    file = models.FileField(upload_to='information/', blank=True, null=True, verbose_name=_("Fayl"))


class Byulleten(BaseModel):
    file = models.FileField(upload_to='byulleten/', blank=True, null=True, verbose_name=_("Fayl"))
    name_uz = models.CharField(max_length=255)
    name_ru = models.CharField(max_length=255)
    name_cyr = models.CharField(max_length=255)


class AboutPortal(BaseModel):
    video_rolik = models.FileField(
        upload_to='aboutportal/',
        blank=True,
        null=True,
        verbose_name=_("Video rolik"),
        validators=[FileExtensionValidator(allowed_extensions=['mp4', 'avi', 'mov'])],
        help_text="Maksimal hajm: 500MB"
    )
    pdf_file = models.FileField(upload_to='aboutportal/', blank=True, null=True, verbose_name=_("Fayl"))
    consulting_file = models.FileField(upload_to='aboutportal/', blank=True, null=True, verbose_name=_("Shartnoma fayl"))









class SyntheticRecord(models.Model):
    """Lokal/dev uchun `seed_demo` yaratgan sintetik yozuvlar reyestri.
    Real yozuvlar bu jadvalga hech qachon tushmaydi; `seed_demo --flush` faqat shu yerdagilarni o'chiradi."""
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE)
    object_id = models.CharField(max_length=64)
    seed_key = models.CharField(max_length=255, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)

    content_object = GenericForeignKey("content_type", "object_id")

    class Meta:
        verbose_name = _("Sintetik yozuv")
        verbose_name_plural = _("Sintetik yozuvlar")
        indexes = [models.Index(fields=["content_type", "object_id"])]

    def __str__(self):
        return self.seed_key
