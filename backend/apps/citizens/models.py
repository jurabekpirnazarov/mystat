"""Fuqarolar va tadqiqotchilar uchun bo'lim (ISH_REJASI.md S-15, FQ-04..FQ-10).

Barcha jadvallar yangi. Ish haqi, narxlar, ismlar va so'rovnoma javoblari real manba bo'lmaguncha (OS-13, OS-16)
`seed_demo` yozadigan namuna; UI'da "Namuna ma'lumot" banneri bilan.
"""
from django.conf import settings
from django.db import models
from django.db.models import Q
from django.utils.translation import gettext_lazy as _


class SalaryDistribution(models.Model):
    """Hudud × tarmoq (OKED bo'limi) × yil bo'yicha oylik ish haqi taqsimoti, ming so'm."""
    region = models.ForeignKey("common.Region", on_delete=models.CASCADE, related_name="salary_distributions")
    sector = models.ForeignKey("common.Sector", on_delete=models.CASCADE, related_name="salary_distributions")
    year = models.PositiveSmallIntegerField()
    mean = models.DecimalField(max_digits=10, decimal_places=1)
    median = models.DecimalField(max_digits=10, decimal_places=1)
    p25 = models.DecimalField(max_digits=10, decimal_places=1)
    p75 = models.DecimalField(max_digits=10, decimal_places=1)
    p90 = models.DecimalField(max_digits=10, decimal_places=1)

    class Meta:
        unique_together = ("region", "sector", "year")
        verbose_name = _("Ish haqi taqsimoti")
        verbose_name_plural = _("Ish haqi taqsimoti")


class ConsumerPrice(models.Model):
    """Asosiy iste'mol mahsulotining hududdagi oylik o'rtacha narxi, so'm."""
    product = models.CharField(max_length=32, db_index=True)
    product_name = models.CharField(max_length=120)
    unit = models.CharField(max_length=16)
    region = models.ForeignKey("common.Region", on_delete=models.CASCADE, related_name="consumer_prices")
    month = models.DateField(help_text=_("Oyning 1-kuni"))
    price = models.DecimalField(max_digits=12, decimal_places=0)

    class Meta:
        unique_together = ("product", "region", "month")
        indexes = [models.Index(fields=["product", "month"])]
        verbose_name = _("Iste'mol narxi")
        verbose_name_plural = _("Iste'mol narxlari")


class Article(models.Model):
    """"Statistika oddiy tilda" maqolasi (FQ-07). Matn Markdown."""
    TOPICS = (("prices", _("Narxlar va inflyatsiya")), ("economy", _("Iqtisodiyot")),
              ("population", _("Aholi")), ("labour", _("Mehnat")), ("methods", _("Statistika qanday ishlaydi")))
    slug = models.SlugField(max_length=80, unique=True)
    topic = models.CharField(max_length=16, choices=TOPICS)
    title_uz = models.CharField(max_length=200)
    title_ru = models.CharField(max_length=200, blank=True)
    title_cry = models.CharField(max_length=200, blank=True)
    summary_uz = models.TextField()
    summary_ru = models.TextField(blank=True)
    summary_cry = models.TextField(blank=True)
    body_uz = models.TextField()
    body_ru = models.TextField(blank=True)
    body_cry = models.TextField(blank=True)
    cover = models.ImageField(upload_to="articles/", null=True, blank=True)
    reading_minutes = models.PositiveSmallIntegerField(default=3)
    related = models.JSONField(default=list, blank=True, help_text=_("[{label, to}] — bog'liq sahifalar"))
    is_published = models.BooleanField(default=True)
    published_at = models.DateField()

    class Meta:
        ordering = ("-published_at", "id")
        verbose_name = _("Maqola")
        verbose_name_plural = _("Maqolalar")

    def __str__(self):
        return self.title_uz


class GlossaryTerm(models.Model):
    slug = models.SlugField(max_length=60, unique=True)
    term_uz = models.CharField(max_length=120)
    term_ru = models.CharField(max_length=120, blank=True)
    term_cry = models.CharField(max_length=120, blank=True)
    definition_uz = models.TextField()
    definition_ru = models.TextField(blank=True)
    definition_cry = models.TextField(blank=True)
    example_uz = models.TextField(blank=True)
    article = models.ForeignKey(Article, on_delete=models.SET_NULL, null=True, blank=True, related_name="terms")

    class Meta:
        ordering = ("term_uz",)
        verbose_name = _("Lug'at atamasi")
        verbose_name_plural = _("Lug'at")

    def __str__(self):
        return self.term_uz


class Survey(models.Model):
    slug = models.SlugField(max_length=80, unique=True)
    title_uz = models.CharField(max_length=200)
    title_ru = models.CharField(max_length=200, blank=True)
    title_cry = models.CharField(max_length=200, blank=True)
    description_uz = models.TextField(blank=True)
    is_active = models.BooleanField(default=True, help_text=_("Faol — javob qabul qilinadi"))
    results_public = models.BooleanField(default=True)
    closes_at = models.DateField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("So'rovnoma")
        verbose_name_plural = _("So'rovnomalar")

    def __str__(self):
        return self.title_uz


class SurveyQuestion(models.Model):
    KINDS = (("single", _("Bitta tanlov")), ("multi", _("Ko'p tanlov")), ("scale", _("Shkala")))
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="questions")
    order = models.PositiveSmallIntegerField(default=0)
    text_uz = models.CharField(max_length=300)
    text_ru = models.CharField(max_length=300, blank=True)
    text_cry = models.CharField(max_length=300, blank=True)
    kind = models.CharField(max_length=8, choices=KINDS, default="single")
    options = models.JSONField(default=list, blank=True, help_text=_('[{"id": "a", "text_uz": "..."}]'))
    scale_max = models.PositiveSmallIntegerField(default=5)

    class Meta:
        ordering = ("survey", "order", "id")
        verbose_name = _("Savol")
        verbose_name_plural = _("Savollar")

    def __str__(self):
        return self.text_uz


class SurveyResponse(models.Model):
    AGE_GROUPS = (("18-24", "18–24"), ("25-34", "25–34"), ("35-44", "35–44"), ("45-54", "45–54"), ("55+", "55+"))
    survey = models.ForeignKey(Survey, on_delete=models.CASCADE, related_name="responses")
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                             related_name="survey_responses")
    region = models.ForeignKey("common.Region", on_delete=models.SET_NULL, null=True, blank=True)
    age_group = models.CharField(max_length=8, choices=AGE_GROUPS, blank=True)
    is_sample = models.BooleanField(default=False, help_text=_("Namuna javob (seed_demo)"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        constraints = [models.UniqueConstraint(fields=["survey", "user"], condition=Q(user__isnull=False),
                                               name="one_response_per_user")]
        verbose_name = _("So'rovnoma javobi")
        verbose_name_plural = _("So'rovnoma javoblari")


class SurveyAnswer(models.Model):
    response = models.ForeignKey(SurveyResponse, on_delete=models.CASCADE, related_name="answers")
    question = models.ForeignKey(SurveyQuestion, on_delete=models.CASCADE, related_name="answers")
    value = models.JSONField(help_text=_("Variant id'lari ro'yxati yoki shkala qiymati"))

    class Meta:
        unique_together = ("response", "question")


class NameStat(models.Model):
    """Yangi tug'ilganlarga qo'yilgan ismlar soni (FQ-09)."""
    GENDERS = (("M", _("O'g'il")), ("F", _("Qiz")))
    name = models.CharField(max_length=40, db_index=True)
    name_cyr = models.CharField(max_length=40, db_index=True)
    gender = models.CharField(max_length=1, choices=GENDERS)
    year = models.PositiveSmallIntegerField()
    region = models.ForeignKey("common.Region", on_delete=models.CASCADE, related_name="name_stats")
    count = models.PositiveIntegerField()

    class Meta:
        unique_together = ("name", "gender", "year", "region")
        indexes = [models.Index(fields=["year", "gender"])]
        verbose_name = _("Ism statistikasi")
        verbose_name_plural = _("Ismlar statistikasi")


class CitizenQuestion(models.Model):
    """FQ-10: fuqaroning statistik ma'lumot bo'yicha savoli."""
    CATEGORIES = (("population", _("Aholi")), ("economy", _("Iqtisodiyot")), ("prices", _("Narxlar")),
                  ("social", _("Ijtimoiy soha")), ("other", _("Boshqa")))
    STATUSES = (("new", _("Yangi")), ("answered", _("Javob berildi")), ("rejected", _("Rad etildi")))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="citizen_questions")
    category = models.CharField(max_length=12, choices=CATEGORIES, default="other")
    region = models.ForeignKey("common.Region", on_delete=models.SET_NULL, null=True, blank=True)
    question = models.TextField(verbose_name=_("Savol"))
    allow_publish = models.BooleanField(default=False, verbose_name=_("Ochiq bazaga qo'shishga rozilik"))
    answer = models.TextField(blank=True, verbose_name=_("Javob"))
    answered_by = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True,
                                    related_name="answered_citizen_questions")
    status = models.CharField(max_length=10, choices=STATUSES, default="new", db_index=True)
    created_at = models.DateTimeField(auto_now_add=True)
    answered_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Fuqaro savoli")
        verbose_name_plural = _("Fuqaro savollari")

    @property
    def is_public(self):
        return self.status == "answered" and self.allow_publish


class FavoriteIndicator(models.Model):
    """FQ-04: fuqaro kabinetidagi sevimli ko'rsatkich (sahifa + parametrlar)."""
    KINDS = (("cpi", "CPI"), ("region", _("Hudud")), ("salary", _("Ish haqi")), ("prices", _("Narxlar")),
             ("names", _("Ismlar")), ("trade", _("Tashqi savdo")), ("demography", _("Demografiya")),
             # MYGOV_DIZAYN MG-07: xizmat pasportidagi "Tanlanganlarga qo'shish" (params = {"number": 302})
             ("service", _("Xizmat")))
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="favorite_indicators")
    kind = models.CharField(max_length=16, choices=KINDS)
    title = models.CharField(max_length=120)
    params = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ("-created_at",)
        verbose_name = _("Sevimli ko'rsatkich")
        verbose_name_plural = _("Sevimli ko'rsatkichlar")
