"""A-03 / S-14: konsultant bilan onlayn konsultatsiya."""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.utils.translation import gettext_lazy as _


class Consultant(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consultant_profile")
    topics = models.ManyToManyField("services.Service", blank=True, related_name="consultants", verbose_name=_("Mavzular"))
    title = models.CharField(max_length=160, blank=True, verbose_name=_("Lavozim / mutaxassislik"))
    bio_uz = models.TextField(blank=True)
    bio_ru = models.TextField(blank=True)
    bio_cry = models.TextField(blank=True)
    photo = models.ImageField(upload_to="consultants/", null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta:
        verbose_name = _("Konsultant")
        verbose_name_plural = _("Konsultantlar")

    def __str__(self):
        return self.user.full_name


class ConsultationSlot(models.Model):
    FORMATS = (("online", _("Onlayn")), ("office", _("Ofisda")))
    consultant = models.ForeignKey(Consultant, on_delete=models.CASCADE, related_name="slots")
    starts_at = models.DateTimeField(db_index=True)
    duration_min = models.PositiveSmallIntegerField(default=45)
    format = models.CharField(max_length=8, choices=FORMATS, default="online")
    is_booked = models.BooleanField(default=False, db_index=True)

    class Meta:
        ordering = ("starts_at",)
        unique_together = ("consultant", "starts_at")
        verbose_name = _("Vaqt sloti")
        verbose_name_plural = _("Vaqt slotlari")

    def __str__(self):
        return f"{self.consultant} · {self.starts_at:%Y-%m-%d %H:%M}"


class ConsultationBooking(models.Model):
    STATUSES = (("booked", _("Band qilingan")), ("done", _("O'tdi")), ("cancelled", _("Bekor qilingan")))
    slot = models.ForeignKey(ConsultationSlot, on_delete=models.CASCADE, related_name="bookings")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="consultation_bookings")
    topic = models.CharField(max_length=200, verbose_name=_("Mavzu"))
    question = models.TextField(blank=True, verbose_name=_("Savol"))
    status = models.CharField(max_length=10, choices=STATUSES, default="booked", db_index=True)
    meeting_url = models.URLField(blank=True, verbose_name=_("Uchrashuv havolasi"))
    note = models.TextField(blank=True, verbose_name=_("Konsultant izohi"))
    limit_use = models.ForeignKey("services.UserServicePackageItemUse", on_delete=models.SET_NULL, null=True, blank=True)
    rating = models.PositiveSmallIntegerField(null=True, blank=True, validators=[MinValueValidator(1), MaxValueValidator(5)])
    rating_comment = models.TextField(blank=True)
    reminded_24h = models.BooleanField(default=False)
    reminded_1h = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    cancelled_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-slot__starts_at",)
        constraints = [models.UniqueConstraint(fields=["slot"], condition=models.Q(status="booked"), name="one_active_booking_per_slot")]
        verbose_name = _("Konsultatsiya")
        verbose_name_plural = _("Konsultatsiyalar")

    def __str__(self):
        return f"{self.user} · {self.slot}"
