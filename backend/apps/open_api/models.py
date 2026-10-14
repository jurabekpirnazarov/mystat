"""FQ-01 / S-16: ochiq ma'lumotlar API'si uchun kalitlar va kunlik foydalanish."""
import hashlib
import secrets

from django.conf import settings
from django.db import models
from django.utils.translation import gettext_lazy as _

KEY_PREFIX = "ms_"
DEFAULT_DAILY_LIMIT = 1000


def hash_key(raw):
    return hashlib.sha256(raw.encode()).hexdigest()


class ApiKey(models.Model):
    """Kalitning o'zi saqlanmaydi — faqat SHA-256 xeshi va ko'rinadigan 8 belgili prefiks."""
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="api_keys")
    name = models.CharField(max_length=80, verbose_name=_("Nomi"))
    prefix = models.CharField(max_length=12, db_index=True)
    key_hash = models.CharField(max_length=64, unique=True)
    daily_limit = models.PositiveIntegerField(default=DEFAULT_DAILY_LIMIT, verbose_name=_("Kunlik limit"))
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    last_used_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("API kalit")
        verbose_name_plural = _("API kalitlar")

    def __str__(self):
        return f"{self.prefix}… ({self.user})"

    @classmethod
    def generate(cls, user, name, daily_limit=DEFAULT_DAILY_LIMIT):
        """-> (ApiKey, raw_key). raw_key faqat shu yerda bir marta qaytadi."""
        raw = KEY_PREFIX + secrets.token_urlsafe(32)
        obj = cls.objects.create(user=user, name=name, prefix=raw[:11], key_hash=hash_key(raw), daily_limit=daily_limit)
        return obj, raw


class ApiUsage(models.Model):
    """Kalit × kun × endpoint bo'yicha so'rovlar soni (kunlik agregat)."""
    api_key = models.ForeignKey(ApiKey, on_delete=models.CASCADE, related_name="usage")
    date = models.DateField(db_index=True)
    endpoint = models.CharField(max_length=64)
    requests = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("api_key", "date", "endpoint")
        verbose_name = _("API foydalanish")
        verbose_name_plural = _("API foydalanish")
