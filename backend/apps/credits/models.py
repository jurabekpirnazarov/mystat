"""KORXONA_SCORING.md 11.3, KR-40: StatCoin hamyoni (hujjatlarda "umumiy kredit"; foydalanuvchiga "StatCoin") va ledger.

Bitta hamyon har `Organization` uchun, korxonasiz foydalanuvchida shaxsiy hamyon. Ledger faqat qo'shiladi
(o'chirilmaydi): balans = yozuvlar yig'indisi. Har `spend`/`expire` yozuvi qaysi grant'dan yechilganini (`grant`)
ko'rsatadi, shuning uchun grant qoldig'i = grant summasi + unga bog'langan manfiy yozuvlar (FIFO muddat bo'yicha).
`Transaction`/`Order` (to'lov) jadvallariga tegilmaydi.
"""
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _


class CreditWallet(models.Model):
    # Tarif darajasi (11.2). KR-41 da paketdan to'ldiriladi; hozircha admin yoki demo seeder qo'yadi.
    PLANS = (("", _("Tarifsiz")), ("s50", "Scoring 50"), ("s60", "Scoring 60"), ("s90", "Scoring 90"),
             ("corp", _("Korporativ")))
    PLAN_RANK = {"": 0, "s50": 1, "s60": 2, "s90": 3, "corp": 4}

    organization = models.OneToOneField("organizations.Organization", on_delete=models.CASCADE, null=True, blank=True,
                                        related_name="credit_wallet", verbose_name=_("Korxona"))
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, null=True, blank=True,
                                related_name="credit_wallet", verbose_name=_("Foydalanuvchi"))
    plan = models.CharField(max_length=10, choices=PLANS, blank=True, default="", verbose_name=_("Tarif"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = _("Hamyon")
        verbose_name_plural = _("Hamyonlar")
        constraints = [models.CheckConstraint(
            check=Q(organization__isnull=False, user__isnull=True) | Q(organization__isnull=True, user__isnull=False),
            name="credit_wallet_one_owner")]

    def __str__(self):
        return str(self.organization or self.user)

    @property
    def plan_rank(self):
        return self.PLAN_RANK.get(self.plan, 0)


class CreditLedger(models.Model):
    KINDS = (("grant", _("Berildi")), ("spend", _("Yechildi")), ("expire", _("Muddati o'tdi")),
             ("refund", _("Qaytarildi")), ("adjust", _("Tuzatish")))

    wallet = models.ForeignKey(CreditWallet, on_delete=models.CASCADE, related_name="ledger", verbose_name=_("Hamyon"))
    kind = models.CharField(max_length=10, choices=KINDS, verbose_name=_("Turi"))
    amount = models.DecimalField(max_digits=10, decimal_places=1, verbose_name=_("Miqdor"))  # grant +, spend/expire −
    # spend/expire/refund qaysi grant'ga tegishli (FIFO); grant va adjust(+) uchun bo'sh
    grant = models.ForeignKey("self", on_delete=models.RESTRICT, null=True, blank=True, related_name="uses",
                              verbose_name=_("Grant"))
    action_code = models.CharField(max_length=40, blank=True, verbose_name=_("Amal"))
    object_ref = models.CharField(max_length=80, blank=True, verbose_name=_("Obyekt"))
    source_package_id = models.PositiveBigIntegerField(null=True, blank=True, unique=True,
                                                       verbose_name=_("Paket (UserServicePackage)"))
    expires_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Amal qilish muddati"))
    created_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                   related_name="+", verbose_name=_("Kim"))
    reason = models.CharField(max_length=255, blank=True, verbose_name=_("Sabab"))
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        indexes = [models.Index(fields=["wallet", "kind", "expires_at"])]
        verbose_name = _("Hamyon yozuvi")
        verbose_name_plural = _("Hamyon yozuvlari")

    def __str__(self):
        return f"{self.get_kind_display()} {self.amount}"


class CreditUnlock(models.Model):
    """Ochilgan korxona va daraja: muddat ichida qayta ko'rish va preset almashtirish kredit yechmaydi (11.3)."""

    LEVELS = (("basis", _("Ball nimaga asoslangan")), ("deep", _("Chuqur tahlil")))

    wallet = models.ForeignKey(CreditWallet, on_delete=models.CASCADE, related_name="unlocks", verbose_name=_("Hamyon"))
    stir = models.CharField(max_length=20, verbose_name=_("STIR"))
    level = models.CharField(max_length=10, choices=LEVELS, verbose_name=_("Daraja"))
    expires_at = models.DateTimeField(verbose_name=_("Ochiq muddati"))
    unlocked_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="+", verbose_name=_("Kim ochgan"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ("wallet", "stir", "level")
        verbose_name = _("Ochilgan korxona")
        verbose_name_plural = _("Ochilgan korxonalar")

    def __str__(self):
        return f"{self.stir} · {self.level}"


class CreditPrice(models.Model):
    """Amal narxi (kreditda). Kodda qattiq yozilmaydi — admin'da o'zgaradi (11.2, 13.5)."""

    action_code = models.CharField(max_length=40, unique=True, verbose_name=_("Amal kodi"))
    name = models.CharField(max_length=120, blank=True, verbose_name=_("Nomi"))
    credits = models.DecimalField(max_digits=8, decimal_places=1, verbose_name=_("Narx (so'm)"))
    is_active = models.BooleanField(default=True, verbose_name=_("Faol"))

    class Meta:
        verbose_name = _("Amal narxi")
        verbose_name_plural = _("Amal narxlari")

    def __str__(self):
        return f"{self.action_code} = {self.credits}"
