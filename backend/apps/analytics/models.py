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
    """
    stir = models.CharField(max_length=20, db_index=True, verbose_name=_("STIR"))
    year = models.PositiveSmallIntegerField(verbose_name=_("Yil"))
    oked_section = models.CharField(max_length=1, db_index=True, verbose_name=_("OKED bo'limi"))
    region = models.ForeignKey("common.Region", on_delete=models.CASCADE, related_name="enterprise_indicators",
                               verbose_name=_("Viloyat"))
    revenue = models.DecimalField(max_digits=18, decimal_places=1, verbose_name=_("Tushum (ming so'm)"))
    employees = models.PositiveIntegerField(verbose_name=_("Xodimlar soni"))
    output_value = models.DecimalField(max_digits=18, decimal_places=1, verbose_name=_("Mahsulot hajmi (ming so'm)"))
    export_value = models.DecimalField(max_digits=18, decimal_places=1, null=True, blank=True,
                                       verbose_name=_("Eksport (ming AQSh $)"))
    is_peer = models.BooleanField(default=False, db_index=True, verbose_name=_("Benchmark guruhi a'zosi"))

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
