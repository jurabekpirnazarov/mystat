"""MYGOV_DIZAYN.md MG-10 va MG-11: xizmat katalogi bo'yicha foydalanish soni, baho va sharhlar, sahifa fikri.

Xizmat `service_number` bilan aniqlanadi — frontend katalogidagi doimiy raqam (`frontend/src/config/serviceCatalog.ts`,
masalan 302 = "Bozor tahlili"). Backend katalogni saqlamaydi.

`is_synthetic=True` qatorlar `seed_demo` (portal seeder) yozadi; ular faqat DEBUG=True da hisobga olinadi.
"""
from django.conf import settings
from django.core.validators import MaxValueValidator, MinValueValidator
from django.db import models
from django.db.models import Q


class ServiceUsage(models.Model):
    """Xizmatning asosiy amali bajarilgani (sahifa ochilishi emas): "Xizmatdan foydalanish"/"Ariza yuborish" bosildi."""
    service_number = models.PositiveIntegerField(db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL,
                             related_name="service_usages")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)
    is_synthetic = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name = "Xizmatdan foydalanish"
        verbose_name_plural = "Xizmatlardan foydalanish"
        indexes = [models.Index(fields=["service_number", "created_at"])]


class ServiceReview(models.Model):
    """Xizmatga baho (1–5) va ixtiyoriy sharh. Bir foydalanuvchi bir xizmatga bitta baho (o'zgartirishi mumkin).

    Sharh matni moderatsiyadan keyin ko'rinadi (`is_published`, OS-MG-07); baho darhol hisobga olinadi.
    """
    service_number = models.PositiveIntegerField(db_index=True)
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.CASCADE,
                             related_name="service_reviews")
    author_name = models.CharField(max_length=80, blank=True, help_text="Sharh muallifi ko'rinishi, masalan \"ABDULLA I.\"")
    score = models.PositiveSmallIntegerField(validators=[MinValueValidator(1), MaxValueValidator(5)])
    comment = models.TextField(blank=True, max_length=1000)
    is_published = models.BooleanField(default=False, help_text="Sharh matni saytda ko'rinadimi (moderatsiya)")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    is_synthetic = models.BooleanField(default=False, db_index=True)

    class Meta:
        verbose_name = "Xizmat bahosi"
        verbose_name_plural = "Xizmat baholari"
        ordering = ["-created_at"]
        constraints = [
            models.UniqueConstraint(fields=["service_number", "user"], condition=Q(user__isnull=False),
                                    name="portal_review_one_per_user"),
        ]

    def __str__(self):
        return f"#{self.service_number}: {self.score}"


class ServiceReviewVote(models.Model):
    """Sharh ostidagi "Foydali / Foydasiz" — bir foydalanuvchi bir sharhga bitta ovoz (o'zgartirishi mumkin)."""
    review = models.ForeignKey(ServiceReview, on_delete=models.CASCADE, related_name="votes")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="review_votes")
    helpful = models.BooleanField()
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Sharhga ovoz"
        verbose_name_plural = "Sharhlarga ovozlar"
        constraints = [models.UniqueConstraint(fields=["review", "user"], name="portal_vote_one_per_user")]


class PageFeedback(models.Model):
    """"Sahifadagi kontent sizga ma'qul keldimi?" — Ha/Yo'q va ixtiyoriy izoh. Shaxsiy ma'lumot so'ralmaydi."""
    path = models.CharField(max_length=300, db_index=True)
    liked = models.BooleanField()
    comment = models.TextField(blank=True, max_length=500)
    lang = models.CharField(max_length=5, blank=True)
    client_key = models.CharField(max_length=64, db_index=True, help_text="IP xeshi — kuniga bir marta cheklovi uchun")
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        verbose_name = "Sahifa fikri"
        verbose_name_plural = "Sahifa fikrlari"
        ordering = ["-created_at"]


class TypoReport(models.Model):
    """Matndagi xato: foydalanuvchi belgilab Ctrl+Enter bosgan."""
    path = models.CharField(max_length=300)
    selected_text = models.TextField(max_length=1000)
    comment = models.TextField(blank=True, max_length=500)
    lang = models.CharField(max_length=5, blank=True)
    is_resolved = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        verbose_name = "Matndagi xato"
        verbose_name_plural = "Matndagi xatolar"
        ordering = ["is_resolved", "-created_at"]
