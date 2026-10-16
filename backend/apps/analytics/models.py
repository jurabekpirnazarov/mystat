"""Korxona va hudud ko'rsatkichlari (ISH_REJASI.md S-10, S-11).

Ikkala jadval ham yangi. Real manba bo'lmaguncha `seed_demo` namuna yozadi (OS-13);
real ma'lumot paydo bo'lsa, shu jadvallarga import qilinadi va namuna `--flush` bilan olib tashlanadi.
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class EnterpriseIndicator(models.Model):
    """Korxonaning yillik ko'rsatkichlari. S-10.

    KTUT jadvalida OKED va hudud yo'q, shuning uchun guruh belgilari (OKED bo'limi, viloyat) shu yerda saqlanadi.
    `is_peer=True` — benchmark guruhini to'ldiruvchi anonim namuna korxona (STIR `P` bilan boshlanadi,
    haqiqiy STIR bo'la olmaydi). Ular hech qachon alohida ko'rsatilmaydi, faqat guruh agregati sifatida.

    KORXONA_SCORING.md KR-29: scoring ko'rsatkichlari bilan kengaytirilgan (hammasi ixtiyoriy). `is_synthetic=True` —
    `seed_demo --only enterprise_scoring` partiya bilan yozgan qator (S-01 reyestrida bitta partiya yozuvi);
    `sources` — maydon bo'yicha manba: {"reports_due": "real", "revenue": "synthetic", ...}.
    """
    stir = models.CharField(max_length=20, db_index=True, verbose_name=_("STIR"))
    year = models.PositiveSmallIntegerField(verbose_name=_("Yil"))
    oked_section = models.CharField(max_length=1, db_index=True, verbose_name=_("OKED bo'limi"))
    region = models.ForeignKey("common.Region", on_delete=models.CASCADE, related_name="enterprise_indicators",
                               verbose_name=_("Viloyat"))
    revenue = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                  verbose_name=_("Tushum (ming so'm)"))
    employees = models.PositiveIntegerField(verbose_name=_("Xodimlar soni"))
    output_value = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                       verbose_name=_("Mahsulot hajmi (ming so'm)"))
    export_value = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                       verbose_name=_("Eksport (ming AQSh $)"))
    is_peer = models.BooleanField(default=False, db_index=True, verbose_name=_("Benchmark guruhi a'zosi"))

    # --- KR-29: scoring ko'rsatkichlari ---
    oked_division = models.CharField(max_length=2, blank=True, verbose_name=_("OKED bo'linmasi"))
    district = models.ForeignKey("common.District", on_delete=models.SET_NULL, null=True, blank=True,
                                 related_name="enterprise_indicators", verbose_name=_("Tuman"))
    ownership = models.CharField(max_length=10, blank=True, verbose_name=_("Mulkchilik"))  # private|state|foreign
    founded_year = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("Tashkil topgan yil"))
    revenue_prev2 = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                        verbose_name=_("Tushum, 2 yil oldin (ming so'm)"))
    net_profit = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                     verbose_name=_("Sof foyda (ming so'm)"))
    employees_prev2 = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Xodimlar, 2 yil oldin"))
    avg_wage = models.DecimalField(max_digits=14, decimal_places=1, null=True, blank=True,
                                   verbose_name=_("O'rtacha oylik ish haqi (ming so'm)"))
    export_prev2 = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                       verbose_name=_("Eksport, 2 yil oldin (ming AQSh $)"))
    import_value = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                       verbose_name=_("Import (ming AQSh $)"))
    export_countries = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("Eksport davlatlari"))
    export_hs_count = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("Eksport tovar turlari"))
    avg_tenure_years = models.FloatField(null=True, blank=True, verbose_name=_("O'rtacha ish staji (yil)"))
    turnover_rate = models.FloatField(null=True, blank=True, verbose_name=_("Kadrlar qo'nimsizligi"))
    higher_edu_share = models.FloatField(null=True, blank=True, verbose_name=_("Oliy ma'lumotlilar ulushi"))
    women_count = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Ayol xodimlar"))
    mgmt_count = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Rahbariyat soni"))
    women_mgmt_count = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Rahbariyatdagi ayollar"))
    head_female = models.BooleanField(null=True, blank=True, verbose_name=_("Rahbar ayol"))
    gender_pay_ratio = models.FloatField(null=True, blank=True, verbose_name=_("Ayollar/erkaklar ish haqi nisbati"))
    youth_share = models.FloatField(null=True, blank=True, verbose_name=_("Yoshlar ulushi (18–30)"))
    disabled_count = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Nogironligi bor xodimlar"))
    investment = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                     verbose_name=_("Asosiy kapitalga investitsiya (ming so'm)"))
    products_count = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("Mahsulot turlari"))
    reports_due = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("Majburiy hisobotlar"))
    reports_on_time = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("O'z vaqtida topshirilgan"))
    tax_debt = models.BooleanField(null=True, blank=True, verbose_name=_("Soliq qarzi bor"))
    tax_debt_amount = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                          verbose_name=_("Soliq qarzi (ming so'm)"))
    sources = models.JSONField(default=dict, blank=True, verbose_name=_("Manbalar"))
    is_synthetic = models.BooleanField(default=False, db_index=True, verbose_name=_("Sintetik (partiya)"))

    class Meta:
        unique_together = ("stir", "year")
        indexes = [models.Index(fields=["year", "oked_section", "region"])]
        verbose_name = _("Korxona ko'rsatkichi")
        verbose_name_plural = _("Korxona ko'rsatkichlari")

    def __str__(self):
        return f"{self.stir} · {self.year}"


class RegionIndicator(models.Model):
    """Hudud (viloyat yoki tuman) ko'rsatkichi. S-11."""

    INDICATORS = (
        ("population", _("Aholi soni (ming kishi)")),
        ("avg_salary", _("O'rtacha oylik ish haqi (ming so'm)")),
        ("unemployment_rate", _("Ishsizlik darajasi (%)")),
        ("grp_per_capita", _("Aholi jon boshiga YaHM (mln so'm)")),
        ("births", _("Tug'ilganlar soni")),
        ("deaths", _("Vafot etganlar soni")),
        ("migration_net", _("Migratsiya saldosi")),
        ("retail_turnover", _("Chakana savdo aylanmasi (mlrd so'm)")),
        ("housing_built", _("Foydalanishga topshirilgan uy-joy (ming m²)")),
        ("industry_output", _("Sanoat mahsuloti (mlrd so'm)")),
    )
    PERIODS = (("Y", _("Yillik")), ("Q1", "I chorak"), ("Q2", "II chorak"), ("Q3", "III chorak"), ("Q4", "IV chorak"))

    region = models.ForeignKey("common.Region", on_delete=models.CASCADE, related_name="indicators",
                               verbose_name=_("Viloyat"))
    district = models.ForeignKey("common.District", on_delete=models.CASCADE, null=True, blank=True,
                                 related_name="indicators", verbose_name=_("Tuman"))
    indicator = models.CharField(max_length=32, choices=INDICATORS, db_index=True, verbose_name=_("Ko'rsatkich"))
    year = models.PositiveSmallIntegerField(verbose_name=_("Yil"))
    period = models.CharField(max_length=2, choices=PERIODS, default="Y", verbose_name=_("Davr"))
    value = models.DecimalField(max_digits=18, decimal_places=2, verbose_name=_("Qiymat"))
    unit = models.CharField(max_length=32, blank=True, verbose_name=_("Birlik"))

    class Meta:
        unique_together = ("region", "district", "indicator", "year", "period")
        indexes = [models.Index(fields=["indicator", "year", "period"])]
        verbose_name = _("Hududiy ko'rsatkich")
        verbose_name_plural = _("Hududiy ko'rsatkichlar")

    def __str__(self):
        return f"{self.region} · {self.indicator} · {self.year}{'' if self.period == 'Y' else ' ' + self.period}"


class EnterpriseScore(models.Model):
    """KORXONA_SCORING.md 5.1: korxona bali. Har preset uchun alohida qator (ro'yxatlarda filtr va saralash indeks
    bilan); og'ir JSON (`pillars`, `indicators`) faqat standart preset qatorida — ustunlar presetga bog'liq emas."""

    stir = models.CharField(max_length=20, verbose_name=_("STIR"))
    year = models.PositiveSmallIntegerField(verbose_name=_("Yil"))
    preset = models.CharField(max_length=20, verbose_name=_("Preset"))
    model_version = models.CharField(max_length=20, verbose_name=_("Model versiyasi"))
    overall = models.FloatField(null=True, blank=True, verbose_name=_("Umumiy ball"))
    klass = models.CharField(max_length=1, blank=True, verbose_name=_("Sinf"))  # A..E, "" — ma'lumot yetarli emas
    coverage = models.FloatField(default=0, verbose_name=_("To'liqlik"))
    peer_group = models.CharField(max_length=40, blank=True, verbose_name=_("Tengdoshlar guruhi"))
    peer_size = models.PositiveIntegerField(default=0, verbose_name=_("Guruh hajmi"))
    oked_section = models.CharField(max_length=1, blank=True, db_index=True)
    region_code = models.CharField(max_length=4, blank=True, db_index=True)
    district_soato = models.CharField(max_length=7, blank=True, db_index=True)
    size_class = models.CharField(max_length=10, blank=True)
    pillars = models.JSONField(default=dict, blank=True)
    indicators = models.JSONField(default=dict, blank=True)
    flags = models.JSONField(default=list, blank=True)
    data_source = models.CharField(max_length=10, default="synthetic")  # real | synthetic | mixed
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("stir", "year", "preset", "model_version")
        indexes = [models.Index(fields=["year", "preset", "model_version", "klass"]),
                   models.Index(fields=["year", "preset", "model_version", "overall"]),
                   models.Index(fields=["stir", "preset"])]
        verbose_name = _("Korxona bali")
        verbose_name_plural = _("Korxona ballari")

    def __str__(self):
        return f"{self.stir} · {self.year} · {self.preset} · {self.klass or '—'}"


class CompanyScoringReport(models.Model):
    """KR-38: `validate_company_scoring` tekshiruv hisoboti (admin'da, faqat o'qish)."""

    created_at = models.DateTimeField(auto_now_add=True)
    model_version = models.CharField(max_length=20)
    report = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Korxona scoringi tekshiruvi")
        verbose_name_plural = _("Korxona scoringi tekshiruvlari")

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} · v{self.model_version}"
