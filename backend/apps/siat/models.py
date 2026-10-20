"""SIAT (siat.stat.uz) ko'rsatkichlari — o'z bazamizga sinxronlanadi. SIAT_KARTA_TAHLIL.md KR-01.

Karta va hududiy profil SIAT'ga brauzerdan emas, shu jadvallardan murojaat qiladi: SIAT sekin yoki
ishlamay qolsa ham oxirgi sinxronlangan ma'lumot ko'rsatiladi. Litsenziya: CC BY 4.0 (manba ko'rsatiladi).
"""
from django.db import models
from django.utils.translation import gettext_lazy as _


class Territory(models.Model):
    """Hudud SOATO (MHOBT) kodi bo'yicha. Nomlar SIAT faylidan olinadi va tozalanadi (N1)."""

    LEVELS = (("country", _("Respublika")), ("region", _("Viloyat")), ("district", _("Tuman/shahar")))
    KINDS = (("country", _("Respublika")), ("region", _("Viloyat")), ("district", _("Tuman")), ("city", _("Shahar")))

    soato = models.CharField(max_length=7, primary_key=True, verbose_name=_("SOATO kodi"))
    parent = models.ForeignKey("self", on_delete=models.SET_NULL, null=True, blank=True, related_name="children",
                               verbose_name=_("Yuqori hudud"))
    level = models.CharField(max_length=10, choices=LEVELS, db_index=True, verbose_name=_("Daraja"))
    kind = models.CharField(max_length=10, choices=KINDS, verbose_name=_("Turi"))
    name_uz = models.CharField(max_length=120, verbose_name=_("Nomi (uz)"))
    name_ru = models.CharField(max_length=120, blank=True, verbose_name=_("Nomi (ru)"))
    name_en = models.CharField(max_length=120, blank=True, verbose_name=_("Nomi (en)"))
    name_uzc = models.CharField(max_length=120, blank=True, verbose_name=_("Nomi (uz, kirill)"))
    area_km2 = models.FloatField(null=True, blank=True, verbose_name=_("Maydoni (km²)"),
                                 help_text=_("Chegaralar faylidan hisoblanadi (aholi zichligi uchun)"))

    class Meta:
        ordering = ["soato"]
        verbose_name = _("Hudud (SOATO)")
        verbose_name_plural = _("Hududlar (SOATO)")

    def __str__(self):
        return f"{self.soato} · {self.name_uz}"

    def name(self, lang="uz"):
        return getattr(self, f"name_{lang}", "") or self.name_uz


class SiatIndicator(models.Model):
    GEO_LEVELS = (("district", _("Tuman")), ("region", _("Viloyat")), ("country", _("Faqat respublika")),
                  ("none", _("Hudud emas")))
    DIMENSIONS = (("territory", _("Hudud")), ("activity", _("Faoliyat turi")), ("product", _("Mahsulot")),
                  ("other", _("Boshqa")))
    PERIODICITY = (("Y", _("Yillik")), ("Q", _("Choraklik")), ("M", _("Oylik")), ("other", _("Boshqa")))
    THEMES = (("population", _("Aholi")), ("labour", _("Mehnat")), ("economy", _("Iqtisodiyot")),
              ("social", _("Ijtimoiy soha")), ("prices", _("Narxlar")), ("other", _("Boshqa")))
    KINDS = (("source", _("SIAT jadvali")), ("group", _("Hududlar jadvallaridan yig'ilgan")),
             ("derived", _("Hisoblangan")))

    key = models.SlugField(max_length=40, unique=True, verbose_name=_("Kalit"),
                           help_text=_("SIAT jadvali uchun ID raqami, yig'ma va hisoblanganlar uchun nom"))
    siat_id = models.PositiveIntegerField(null=True, blank=True, unique=True, verbose_name=_("SIAT ID"))
    kind = models.CharField(max_length=10, choices=KINDS, default="source", verbose_name=_("Turi"))
    code = models.CharField(max_length=20, blank=True, verbose_name=_("Ko'rsatkich kodi"))
    name_uz = models.CharField(max_length=300, blank=True, verbose_name=_("Nomi (uz)"))
    name_ru = models.CharField(max_length=300, blank=True, verbose_name=_("Nomi (ru)"))
    name_en = models.CharField(max_length=300, blank=True, verbose_name=_("Nomi (en)"))
    name_uzc = models.CharField(max_length=300, blank=True, verbose_name=_("Nomi (uz, kirill)"))
    unit_uz = models.CharField(max_length=120, blank=True, verbose_name=_("Birlik (uz)"))
    unit_ru = models.CharField(max_length=120, blank=True, verbose_name=_("Birlik (ru)"))
    unit_en = models.CharField(max_length=120, blank=True, verbose_name=_("Birlik (en)"))
    periodicity = models.CharField(max_length=5, choices=PERIODICITY, default="Y", verbose_name=_("Davriyligi"))
    geo_level = models.CharField(max_length=10, choices=GEO_LEVELS, default="none", db_index=True,
                                 verbose_name=_("Hudud darajasi"))
    dimension = models.CharField(max_length=10, choices=DIMENSIONS, default="territory", verbose_name=_("Kesim"))
    theme = models.CharField(max_length=12, choices=THEMES, default="other", verbose_name=_("Mavzu"))
    show_on_map = models.BooleanField(default=False, db_index=True, verbose_name=_("Kartada ko'rsatilsin"))
    is_active = models.BooleanField(default=True, verbose_name=_("Sinxronlansin"),
                                    help_text=_("O'chirilsa ma'lumot yangilanmaydi va kartadan yashiriladi"))
    zero_is_value = models.BooleanField(default=False, verbose_name=_("0 — haqiqiy qiymat"),
                                        help_text=_("Belgilanmasa 0.0 'ma'lumot yo'q' deb hisoblanadi (N2)"))
    higher_is_better = models.BooleanField(null=True, blank=True, verbose_name=_("Yuqori qiymat yaxshimi"))
    diverging_center = models.FloatField(null=True, blank=True, verbose_name=_("Ikki tomonlama shkala markazi"),
                                         help_text=_("O'sish sur'ati (%) ko'rsatkichlari uchun odatda 100"))
    notes_uz = models.TextField(blank=True, verbose_name=_("Izoh (uz)"))
    notes_ru = models.TextField(blank=True, verbose_name=_("Izoh (ru)"))
    notes_en = models.TextField(blank=True, verbose_name=_("Izoh (en)"))
    methodology_uz = models.TextField(blank=True, verbose_name=_("Hisoblash metodikasi"))
    preliminary_periods = models.JSONField(default=list, blank=True, verbose_name=_("Dastlabki ma'lumot yillari"))
    group_key = models.CharField(max_length=200, blank=True, db_index=True, verbose_name=_("Guruh kaliti"),
                                 help_text=_("Har hudud uchun alohida jadval bo'lsa — hududsiz nomi"))
    group_region = models.CharField(max_length=4, blank=True, verbose_name=_("Jadval hududi (SOATO)"))
    group_region_override = models.CharField(
        max_length=4, blank=True, verbose_name=_("Jadval hududi (qo'lda)"),
        help_text=_("SIAT nomida hudud noto'g'ri yozilgan bo'lsa (masalan ikki jadval bitta hududga) — to'g'ri SOATO"))
    derived_from = models.CharField(max_length=200, blank=True, verbose_name=_("Hisoblash manbasi"))
    first_published = models.DateField(null=True, blank=True, verbose_name=_("Birinchi e'lon"))
    source_updated_at = models.DateTimeField(null=True, blank=True, verbose_name=_("SIAT'da yangilangan"))
    last_synced_at = models.DateTimeField(null=True, blank=True, verbose_name=_("Oxirgi sinxronlash"))
    last_error = models.TextField(blank=True, verbose_name=_("Oxirgi xato"))
    quality_issues = models.JSONField(default=list, blank=True, verbose_name=_("Sifat ogohlantirishlari"))
    sort_order = models.PositiveSmallIntegerField(default=100, verbose_name=_("Tartib"))

    class Meta:
        ordering = ["sort_order", "key"]
        verbose_name = _("SIAT ko'rsatkichi")
        verbose_name_plural = _("SIAT ko'rsatkichlari")

    def __str__(self):
        return f"{self.key} · {self.name_uz[:80]}"

    @property
    def siat_url(self):
        return f"https://siat.stat.uz/data/{self.siat_id}/" if self.siat_id else ""

    def localized(self, field, lang="uz"):
        return getattr(self, f"{field}_{lang}", "") or getattr(self, f"{field}_uz", "")


class SiatBreakdown(models.Model):
    """Yig'ma ko'rsatkichdagi kesim (masalan faoliyat turi): foydalanuvchi kartada tanlaydi."""

    indicator = models.ForeignKey(SiatIndicator, on_delete=models.CASCADE, related_name="breakdowns")
    code = models.CharField(max_length=32)
    name_uz = models.CharField(max_length=300)
    name_ru = models.CharField(max_length=300, blank=True)
    name_en = models.CharField(max_length=300, blank=True)
    name_uzc = models.CharField(max_length=300, blank=True)
    sort_order = models.PositiveIntegerField(default=0)

    class Meta:
        unique_together = ("indicator", "code")
        ordering = ["sort_order"]
        verbose_name = _("Kesim")
        verbose_name_plural = _("Kesimlar")

    def __str__(self):
        return f"{self.code} · {self.name_uz}"


class SiatValue(models.Model):
    indicator = models.ForeignKey(SiatIndicator, on_delete=models.CASCADE, related_name="values")
    territory_code = models.CharField(max_length=7, db_index=True, verbose_name=_("SOATO"))
    breakdown = models.CharField(max_length=32, blank=True, default="", verbose_name=_("Kesim kodi"))
    period = models.CharField(max_length=7, verbose_name=_("Davr"), help_text="2025, 2025-01 yoki 2025-Q1")
    value = models.FloatField(null=True, blank=True, verbose_name=_("Qiymat"))
    is_preliminary = models.BooleanField(default=False, verbose_name=_("Dastlabki"))

    class Meta:
        unique_together = ("indicator", "territory_code", "breakdown", "period")
        indexes = [models.Index(fields=["indicator", "breakdown", "period"])]
        verbose_name = _("SIAT qiymati")
        verbose_name_plural = _("SIAT qiymatlari")

    def __str__(self):
        return f"{self.indicator_id} · {self.territory_code} · {self.period}"

    @property
    def is_missing(self):
        return self.value is None


class SiatSyncLog(models.Model):
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    trigger = models.CharField(max_length=20, default="beat", verbose_name=_("Kim ishga tushirdi"))
    updated = models.PositiveIntegerField(default=0, verbose_name=_("Yangilandi"))
    unchanged = models.PositiveIntegerField(default=0, verbose_name=_("O'zgarmagan"))
    failed = models.PositiveIntegerField(default=0, verbose_name=_("Xato"))
    details = models.TextField(blank=True)

    class Meta:
        ordering = ["-started_at"]
        verbose_name = _("Sinxronlash jurnali")
        verbose_name_plural = _("Sinxronlash jurnali")

    def __str__(self):
        return f"{self.started_at:%Y-%m-%d %H:%M} · {self.updated}/{self.unchanged}/{self.failed}"


class TerritoryScore(models.Model):
    """SCORING_MODEL.md KR-16: oldindan hisoblangan salohiyat indeksi (standart presetlar × yillar × darajalar)."""

    soato = models.CharField(max_length=7, db_index=True, verbose_name=_("SOATO"))
    level = models.CharField(max_length=10, verbose_name=_("Daraja"))
    period = models.CharField(max_length=7, verbose_name=_("Davr"))
    preset = models.CharField(max_length=20, verbose_name=_("Preset"))
    is_forecast = models.BooleanField(default=False, verbose_name=_("Prognoz yili"))
    score = models.FloatField(null=True, blank=True, verbose_name=_("Indeks"))
    rank = models.PositiveSmallIntegerField(null=True, blank=True, verbose_name=_("O'rin"))
    rank_low = models.PositiveSmallIntegerField(null=True, blank=True)
    rank_high = models.PositiveSmallIntegerField(null=True, blank=True)
    rank_in_parent = models.PositiveSmallIntegerField(null=True, blank=True)
    pillars = models.JSONField(default=dict, blank=True, verbose_name=_("Ustunlar"))
    details = models.JSONField(default=dict, blank=True, verbose_name=_("Tafsilotlar"))
    coverage = models.FloatField(default=0, verbose_name=_("To'liqlik"))
    status = models.CharField(max_length=15, default="ok", verbose_name=_("Holat"))
    methodology_version = models.CharField(max_length=20, verbose_name=_("Metodologiya versiyasi"))
    computed_at = models.DateTimeField(auto_now=True)

    class Meta:
        unique_together = ("soato", "period", "preset", "methodology_version")
        indexes = [models.Index(fields=["level", "period", "preset", "methodology_version"])]
        ordering = ["level", "period", "rank"]
        verbose_name = _("Salohiyat indeksi")
        verbose_name_plural = _("Salohiyat indeksi")

    def __str__(self):
        return f"{self.soato} · {self.period} · {self.preset} · {self.score}"


class ScoringReport(models.Model):
    """KR-22: `compute_scores` tekshiruv hisoboti (korrelyatsiya, reyting barqarorligi, orqaga sinov)."""

    created_at = models.DateTimeField(auto_now_add=True)
    methodology_version = models.CharField(max_length=20)
    report = models.JSONField(default=dict)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Scoring hisoboti")
        verbose_name_plural = _("Scoring hisobotlari")

    def __str__(self):
        return f"{self.created_at:%Y-%m-%d %H:%M} · v{self.methodology_version}"


class ForecastModelRun(models.Model):
    """SCORING_MODEL.md 10.7: ko'rsatkich × daraja × horizont uchun tanlangan prognoz usuli va orqaga sinov natijasi.

    Usul nomi va aniqlik o'lchovlari faqat ichki (admin, hisobot) — foydalanuvchi interfeysida ko'rsatilmaydi.
    """

    indicator = models.CharField(max_length=40, verbose_name=_("Ko'rsatkich"))
    level = models.CharField(max_length=10, verbose_name=_("Daraja"))
    horizon = models.PositiveSmallIntegerField(verbose_name=_("Horizont (yil)"))
    model_kind = models.CharField(max_length=10, verbose_name=_("Usul"))
    params = models.JSONField(default=dict, blank=True)
    backtest = models.JSONField(default=dict, blank=True, verbose_name=_("Orqaga sinov"))
    interval = models.JSONField(default=dict, blank=True, verbose_name=_("80% oraliq (qoldiqlar)"))
    trained_at = models.DateTimeField(auto_now_add=True)
    data_until = models.CharField(max_length=7, verbose_name=_("Ma'lumot oxiri"))
    version = models.CharField(max_length=40, db_index=True, verbose_name=_("Versiya"))
    artifact_path = models.CharField(max_length=300, blank=True)
    is_active = models.BooleanField(default=True, db_index=True)

    class Meta:
        ordering = ["-trained_at", "indicator", "level", "horizon"]
        verbose_name = _("Prognoz modeli")
        verbose_name_plural = _("Prognoz modellari")

    def __str__(self):
        return f"{self.indicator} · {self.level} · h{self.horizon} · {self.version}"


class ForecastValue(models.Model):
    SCENARIOS = (("base", _("Bazaviy")), ("optimistic", _("Ijobiy")), ("pessimistic", _("Salbiy")))

    indicator = models.CharField(max_length=40, verbose_name=_("Ko'rsatkich"))
    soato = models.CharField(max_length=7, verbose_name=_("SOATO"))
    period = models.CharField(max_length=7, verbose_name=_("Davr"))
    horizon = models.PositiveSmallIntegerField()
    scenario = models.CharField(max_length=12, choices=SCENARIOS, default="base")
    value = models.FloatField()
    lo80 = models.FloatField(null=True, blank=True)
    hi80 = models.FloatField(null=True, blank=True)
    model_run = models.ForeignKey(ForecastModelRun, on_delete=models.CASCADE, null=True, blank=True,
                                  related_name="values")
    version = models.CharField(max_length=40, db_index=True)
    drivers = models.JSONField(default=list, blank=True, verbose_name=_("Asosiy omillar"))

    class Meta:
        unique_together = ("indicator", "soato", "period", "scenario", "version")
        indexes = [models.Index(fields=["indicator", "period", "scenario", "version"])]
        verbose_name = _("Prognoz qiymati")
        verbose_name_plural = _("Prognoz qiymatlari")

    def __str__(self):
        return f"{self.indicator} · {self.soato} · {self.period} · {self.scenario}"


class ForecastVersion(models.Model):
    """Har `train_forecasts` ishga tushishi — bitta versiya; faqat oxirgi muvaffaqiyatli versiya ishlatiladi."""

    version = models.CharField(max_length=40, unique=True)
    created_at = models.DateTimeField(auto_now_add=True)
    is_current = models.BooleanField(default=False, db_index=True)
    data_until = models.JSONField(default=dict, blank=True, verbose_name=_("Ko'rsatkichlar ma'lumot oxiri"))
    report = models.JSONField(default=dict, blank=True, verbose_name=_("Hisobot"))
    monitoring = models.JSONField(default=dict, blank=True, verbose_name=_("Prognoz va haqiqat"))
    what_if = models.JSONField(default=dict, blank=True, verbose_name=_("Maqsadli ssenariy"))
    error = models.TextField(blank=True)

    class Meta:
        ordering = ["-created_at"]
        verbose_name = _("Prognoz versiyasi")
        verbose_name_plural = _("Prognoz versiyalari")

    def __str__(self):
        return f"{self.version}{' · joriy' if self.is_current else ''}"


class ReleaseEvent(models.Model):
    """JAHON_TAJRIBASI JT-10: e'lonlar kalendari. Qo'mitaning rasmiy e'lon sanasi admin'da kiritiladi.

    Ko'rsatkich uchun rasmiy sana bo'lmasa, kalendar SIAT'dagi oxirgi yangilanish va davriylikdan
    taxminiy sanani hisoblaydi (`releases.py`). Rasmiy sana doim taxminiydan ustun.
    """

    STATUSES = (("planned", _("Rejalashtirilgan")), ("published", _("E'lon qilindi")),
                ("postponed", _("Ko'chirildi")))

    indicator = models.ForeignKey(SiatIndicator, on_delete=models.SET_NULL, null=True, blank=True,
                                  related_name="releases", verbose_name=_("Ko'rsatkich"),
                                  help_text=_("Bo'sh bo'lsa — umumiy e'lon (masalan, ro'yxat natijalari)"))
    title_uz = models.CharField(max_length=300, blank=True, verbose_name=_("Nomi (uz)"),
                                help_text=_("Bo'sh bo'lsa ko'rsatkich nomi olinadi"))
    title_ru = models.CharField(max_length=300, blank=True, verbose_name=_("Nomi (ru)"))
    release_date = models.DateField(db_index=True, verbose_name=_("E'lon sanasi"))
    release_time = models.TimeField(null=True, blank=True, verbose_name=_("Vaqti"))
    reference_period = models.CharField(max_length=40, blank=True, verbose_name=_("Davr"),
                                        help_text=_("Masalan: 2026-yil, 2026-yil I chorak"))
    status = models.CharField(max_length=10, choices=STATUSES, default="planned", verbose_name=_("Holat"))
    url = models.URLField(blank=True, verbose_name=_("E'lon havolasi"))
    note_uz = models.CharField(max_length=300, blank=True, verbose_name=_("Izoh"))

    class Meta:
        ordering = ["release_date", "release_time"]
        verbose_name = _("E'lon (kalendar)")
        verbose_name_plural = _("E'lonlar kalendari")

    def __str__(self):
        return f"{self.release_date} · {self.title()}"

    def title(self, lang="uz"):
        own = getattr(self, f"title_{lang}", "") or self.title_uz
        if own:
            return own
        return self.indicator.localized("name", lang) if self.indicator_id else ""


class PopulationAnchor(models.Model):
    """JT-02: aholi soati uchun rasmiy boshlang'ich nuqta (qo'mita hisoblagichi yoki ro'yxat natijasi).

    Eng oxirgi `as_of` li yozuv olinadi; bo'lmasa soat SIAT 246 (1-yanvar holati) dan hisoblanadi.
    Ro'yxat-2026 dan keyin SIAT bahosi rasmiy hisoblagichdan sezilarli farq qilishi mumkin, shuning uchun
    admin bu yerga qo'mita e'lon qilgan raqamni kiritadi.
    """

    population = models.PositiveBigIntegerField(verbose_name=_("Aholi soni (kishi)"))
    as_of = models.DateTimeField(verbose_name=_("Qaysi vaqt holatiga"))
    annual_growth_pct = models.FloatField(null=True, blank=True, verbose_name=_("Yillik o'sish, %"),
                                          help_text=_("Bo'sh bo'lsa SIAT'dagi oxirgi o'sish sur'ati olinadi"))
    source = models.CharField(max_length=300, blank=True, verbose_name=_("Manba"),
                              help_text=_("Masalan: stat.uz aholi hisoblagichi"))
    source_url = models.URLField(blank=True, verbose_name=_("Manba havolasi"))
    # stat.uz hisoblagichi parametrlari: "har N soniyada bitta" tug'ilish/o'lim/kelish/ketish. Berilsa soat ular bo'yicha
    # chiziqli yuradi (stat.uz bilan bir xil), aks holda `annual_growth_pct` bo'yicha.
    birth_seconds = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Tug'ilish: har N soniyada"))
    death_seconds = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("O'lim: har N soniyada"))
    arrive_seconds = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Kelganlar: har N soniyada"))
    depart_seconds = models.PositiveIntegerField(null=True, blank=True, verbose_name=_("Ketganlar: har N soniyada"))
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-as_of"]
        verbose_name = _("Aholi soati: rasmiy qiymat")
        verbose_name_plural = _("Aholi soati: rasmiy qiymatlar")

    def __str__(self):
        return f"{self.as_of:%Y-%m-%d %H:%M} · {self.population:,}".replace(",", " ")

    @property
    def net_per_second(self):
        """Sof o'sish (kishi/soniya) stat.uz parametrlaridan; to'liq bo'lmasa None."""
        parts = (self.birth_seconds, self.death_seconds, self.arrive_seconds, self.depart_seconds)
        if not all(parts):
            return None
        b, d, a, p = parts
        return 1 / b - 1 / d + 1 / a - 1 / p
