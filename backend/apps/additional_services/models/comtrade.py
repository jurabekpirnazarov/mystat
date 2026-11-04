"""UN Comtrade+ dan olingan O'zbekiston tashqi savdo ma'lumoti (HS6, hamkor davlat kesimida).

`TradeData` bojxona ma'lumoti (viloyat kesimida, so'mda emas, ming AQSh $). Bu jadval esa xalqaro manba: O'zbekiston
hisobot beruvchi (860) sifatida, shuningdek ixtiyoriy "ko'zgu" (hamkor davlatlar O'zbekiston haqida bergan) ma'lumot.
Ikkalasi aralashtirilmaydi: solishtirish uchun alohida endpoint bor.
"""
from django.db import models

from .ex_trade import Country, Product

UZ_CODE = 860


class ComtradeFlow(models.Model):
    FLOWS = (("X", "Eksport"), ("M", "Import"))
    FREQ = (("A", "Yillik"), ("M", "Oylik"))

    period_type = models.CharField(max_length=1, choices=FREQ, default="A")
    year = models.PositiveSmallIntegerField(db_index=True)
    month = models.PositiveSmallIntegerField(default=0, help_text="Yillik ma'lumotda 0")
    flow = models.CharField(max_length=1, choices=FLOWS)
    reporter_code = models.PositiveIntegerField(default=UZ_CODE, help_text="860 = O'zbekiston; boshqasi = ko'zgu ma'lumot")
    partner_code = models.PositiveIntegerField(help_text="0 = Dunyo (jami)")
    partner = models.ForeignKey(Country, null=True, blank=True, on_delete=models.SET_NULL, related_name="comtrade_flows")
    cmd_code = models.CharField(max_length=10, help_text="HS kodi (6 xona) yoki TOTAL")
    product = models.ForeignKey(Product, null=True, blank=True, on_delete=models.SET_NULL, related_name="comtrade_flows")
    value_usd = models.DecimalField(max_digits=22, decimal_places=2, null=True, blank=True)
    net_weight_kg = models.DecimalField(max_digits=22, decimal_places=2, null=True, blank=True)
    qty = models.DecimalField(max_digits=22, decimal_places=2, null=True, blank=True)
    qty_unit_code = models.IntegerField(null=True, blank=True)
    source = models.CharField(max_length=10, default="api", help_text="api (kalit bilan) yoki preview (kalitsiz, 500 qatorgacha)")
    fetched_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = "comtrade_flows"
        verbose_name = "Comtrade savdo yozuvi"
        verbose_name_plural = "Comtrade savdo yozuvlari"
        constraints = [models.UniqueConstraint(
            fields=["period_type", "year", "month", "reporter_code", "partner_code", "flow", "cmd_code"], name="uniq_comtrade_flow")]
        indexes = [models.Index(fields=["reporter_code", "flow", "year", "cmd_code"]),
                   models.Index(fields=["partner", "year"])]

    def __str__(self):
        return f"{self.year} {self.flow} {self.cmd_code} → {self.partner_code}: {self.value_usd}"


class ComtradeSyncLog(models.Model):
    """Har sinxronizatsiya urinishi: kvota nazorati va xatolarni kuzatish uchun."""
    started_at = models.DateTimeField(auto_now_add=True)
    finished_at = models.DateTimeField(null=True, blank=True)
    params = models.JSONField(default=dict)
    calls = models.PositiveIntegerField(default=0)
    rows = models.PositiveIntegerField(default=0)
    status = models.CharField(max_length=10, default="running")  # running / ok / partial / failed
    error = models.TextField(blank=True)

    class Meta:
        db_table = "comtrade_sync_log"
        ordering = ["-started_at"]
