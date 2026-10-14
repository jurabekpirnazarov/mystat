from django.contrib.auth.models import AbstractBaseUser, PermissionsMixin
from rest_framework_simplejwt.tokens import RefreshToken
from .manager import AccountManager
from django.conf import settings
from django.db import models
from django.core.validators import RegexValidator
from apps.common.models import BaseModel, District
from django.utils.translation import gettext_lazy as _

phone_regex = RegexValidator(
    regex=r"^\+?[1-9]\d{1,14}$",
    message="Phone number must be entered in the format: '+999999999'. Up to 15 digits allowed.",
)

AUTH_PROVIDERS = {"oneid": "oneid", "email": "email", "eri": "eri"}



class Role(BaseModel):
    name = models.CharField(max_length=50, unique=True, verbose_name=_("Foydalanuvchi roli"))

    is_active = models.BooleanField(default=True, verbose_name=_("Aktiv"))

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Rol")
        verbose_name_plural = _("Rollar")

class Permission(BaseModel):
    name = models.CharField(max_length=50, unique=True, verbose_name=_("Huquq nomi"))
    is_active = models.BooleanField(default=True, verbose_name=_("Aktiv"))

    def __str__(self):
        return self.name

    class Meta:
        verbose_name = _("Huquq")
        verbose_name_plural = _("Huquqlar")


class RolePermission(BaseModel):
    role = models.ForeignKey(Role, on_delete=models.CASCADE, related_name="permissions", verbose_name=_("Rol"))
    permission = models.ForeignKey(Permission, on_delete=models.CASCADE, related_name="roles", verbose_name=_("Huquq"))

    class Meta:
        unique_together = ("role", "permission")
        verbose_name = _("Rol-Huquq")
        verbose_name_plural = _("Rollar-Huquqlar")

    def __str__(self):
        return f"{self.role.name} - {self.permission.name}"


class User(AbstractBaseUser, PermissionsMixin):
    ROLE_CHOICES = (
        ("user", _("Foydalanuvchi")),
        ("admin", _("Administrator")),
        ("bugalter", _("Buxgalter")),
        ("monitoring", _("Monitoring")),
        ("employee", _("Xodim")),
        ("manager", _("Menejer")),
    )
    GENDER = (
        ("male", _("Erkak")),
        ("female", _("Ayol")),
    )
    USER_TYPE_CHOICES = (
        ("individual", _("Jismoniy shaxs")),
        ("legal_entity", _("Yuridik shaxs")),
    )
    email = models.EmailField(
        verbose_name=_("email"),
        max_length=60,
        null=True,
        blank=True,
        db_index=True,
    )
    username = models.CharField(
        max_length=50, unique=True, verbose_name=_("Foydalanuvchi nomi")
    )
    pinfl = models.CharField(max_length=15, unique=True, null=True, blank=True, verbose_name=_("PINFL"))
    first_name = models.CharField(
        max_length=30, blank=True, null=True, verbose_name=_("Ism")
    )
    last_name = models.CharField(
        max_length=30, blank=True, null=True, verbose_name=_("Familiya")
    )
    middle_name = models.CharField(
        max_length=30, blank=True, null=True, verbose_name=_("Otasining ismi")
    )
    gender = models.CharField(
        max_length=30, choices=GENDER, blank=True, null=True, verbose_name=_("Jinsi")
    )
    role = models.CharField(
        max_length=30, choices=ROLE_CHOICES, default="user", verbose_name=_("Roli")
    )
    date_joined = models.DateTimeField(
        auto_now_add=True, verbose_name=_("Ro'yxatga olingan vaqti")
    )
    last_login = models.DateTimeField(auto_now=True, verbose_name=_("So'nggi faollik"))
    phone_number = models.CharField(validators=[phone_regex], max_length=16, blank=True)
    phone_number_call = models.CharField(
        validators=[phone_regex], max_length=16, blank=True, null=True, verbose_name=_("Telefon")
    )
    phone_notification = models.CharField(
        validators=[phone_regex], max_length=16, blank=True, null=True, verbose_name=_("Bildirishnoma telefoni")
    )
    birth_date = models.DateField(blank=True, null=True, verbose_name=_("Tug'ilgan vaqti"))
    auth_provider = models.CharField(
        max_length=30,
        verbose_name=_("Provayder"),
        blank=False,
        null=False,
        default=AUTH_PROVIDERS.get("email"),
    )
    user_type = models.CharField(
        max_length=30,
        choices=USER_TYPE_CHOICES,
        default="individual",
        verbose_name=_("Foydalanuvchi turi"),
    )
    location = models.ForeignKey(
        District,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        verbose_name=_("Manzil"),
    )
    is_admin = models.BooleanField(default=False)
    is_staff = models.BooleanField(default=False)
    is_active = models.BooleanField(default=True)
    is_superuser = models.BooleanField(default=False)
    is_verify = models.BooleanField(default=False)

    USERNAME_FIELD = "username"
    REQUIRED_FIELDS = [
        "first_name",
    ]

    objects = AccountManager()

    avatar = models.ImageField(upload_to="users/%Y/%m/", blank=True, null=True)

    telegram_chat_id = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return self.full_name

    # def has_module_perms(self, app_label):
    #     return self.is_superuser

    # def has_perm(self, perm, obj=None):
    #     return self.is_superuser

    @property
    def tokens(self):
        refresh = RefreshToken.for_user(self)
        return {"refresh": str(refresh), "access": str(refresh.access_token)}

    @property
    def image_url(self):
        if not self.avatar:
            return None
        if settings.DEBUG:
            return f"{settings.LOCAL_BASE_URL}{self.avatar.url}"
        return f"{settings.PROD_BASE_URL}{self.avatar.url}"

    @property
    def full_name(self):
        name = self.first_name or self.username
        if self.last_name:
            name += f" {self.last_name}"
        if self.middle_name:
            name += f" {self.middle_name}"

        return name

    class Meta:
        verbose_name = _("Foydalanuvchi")
        verbose_name_plural = _("Foydalanuvchilar")

        


class Subscribe(BaseModel):
    email = models.EmailField(unique=True, verbose_name=_("Email"))

    def __str__(self):
        return self.email

    class Meta:
        verbose_name = ""
        verbose_name_plural = _("A'zolar")


class Accountant(BaseModel):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="accountant_profile", verbose_name=_("Foydalanuvchi"),
    )
    branches = models.ManyToManyField(
        "common.Branch", related_name="accountants", verbose_name=_("Filiallar")
    )
    main_branch = models.ForeignKey(
        "common.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="main_accountants",
        verbose_name=_("Asosiy filial"),
    )
    region = models.ForeignKey(
        "common.Region", on_delete=models.SET_NULL, null=True, blank=True, verbose_name=_("Viloyat")
    )
    is_active = models.BooleanField(default=True, verbose_name=_("Faol"))

    class Meta:
        verbose_name = _("Buxgalter ")
        verbose_name_plural = _("Buxgalterlar ")

class Employee(BaseModel):
    user = models.OneToOneField(
        User, on_delete=models.CASCADE, related_name="employee_profile", verbose_name=_("Foydalanuvchi"),
    )
    branch = models.ForeignKey(
        "common.Branch",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="employees",
        verbose_name=_("Filial"),
    )
    districts = models.ManyToManyField(
        "common.District", related_name="employees", verbose_name=_("Tumanlar")
    )
    main_district = models.ForeignKey(
        "common.District",
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="main_employees",
        verbose_name=_("Asosiy tuman"),
    )
    is_active = models.BooleanField(default=True, verbose_name=_("Faol"))

    class Meta:
        verbose_name = _("Xodim")
        verbose_name_plural = _("Xodimlar")


class UserPreference(models.Model):
    """U-15: foydalanuvchi sozlamalari — tanishtiruv ko'rsatilganmi va boshqa UI holati."""
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name="preference")
    onboarding_done_at = models.DateTimeField(null=True, blank=True)
    data = models.JSONField(default=dict, blank=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        verbose_name = _("Foydalanuvchi sozlamasi")
        verbose_name_plural = _("Foydalanuvchi sozlamalari")
