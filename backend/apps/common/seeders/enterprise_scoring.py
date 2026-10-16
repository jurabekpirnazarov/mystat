"""KORXONA_SCORING.md KR-30, KR-32: real KTUT korxonalariga scoring ko'rsatkichlari (sintetik, faqat DEBUG=True).

- Real KTUT jadvaliga tegilmaydi: qiymatlar `EnterpriseIndicator` ga STIR bo'yicha, `is_synthetic=True` bilan
  partiya qilib yoziladi; S-01 reyestrida bitta partiya yozuvi (`enterprise_scoring:batch`). `--flush` shu ustun
  bo'yicha o'chiradi (`flush_batch`).
- KTUT'da OKED, hudud va mulkchilik yo'q, shuning uchun ular ham sintetik (`sources` da "synthetic"), hamma joyda
  "Namuna" belgisi bilan. Sanoat jadvalida mahsuloti bor korxona ishlab chiqaruvchi bo'limga (A, B, C) qo'yiladi.
- Real manbali maydonlar (KR-32) generatsiya qilinmaydi: majburiy hisobotlar soni (`KtutReportList` + hisobot
  kalendari), mahsulot turlari (`IndustrialProduct`). Hisobot topshirilgan holati manbasi yo'q (OS-11) — o'z vaqtida
  ulushi sintetik. Tashqi savdo jadvalida korxona kesimi yo'q — eksport/import sintetik. KTUT'da ro'yxatdan o'tgan
  sana yo'q — faoliyat davomiyligi sintetik.
- Ish haqi bazasi — SIAT 500 (viloyat, oxirgi yil), bo'lmasa generator jadvali.
- Demo korxonalar (S-10 qatorlari bor): mavjud tushum, xodimlar, eksport saqlanadi, qolgan maydonlar to'ldiriladi.
"""
import random
from collections import defaultdict
from decimal import Decimal

from django.contrib.contenttypes.models import ContentType
from django.db import transaction

from apps.analytics.company_scoring import generator
from apps.analytics.models import EnterpriseIndicator, EnterpriseScore
from apps.common.models import District, Region, SyntheticRecord

from . import Seeder

BATCH_KEY = "enterprise_scoring:batch"
DECIMAL_FIELDS = {"revenue", "revenue_prev2", "net_profit", "output_value", "investment", "export_value",
                  "export_prev2", "import_value", "avg_wage", "tax_debt_amount"}
SCORING_FIELDS = ("oked_division", "district", "ownership", "founded_year", "revenue_prev2", "net_profit",
                  "employees_prev2", "avg_wage", "export_prev2", "import_value", "export_countries", "export_hs_count",
                  "avg_tenure_years", "turnover_rate", "higher_edu_share", "women_count", "mgmt_count",
                  "women_mgmt_count", "head_female", "gender_pay_ratio", "youth_share", "disabled_count", "investment",
                  "products_count", "reports_due", "reports_on_time", "tax_debt", "tax_debt_amount")
REAL_FIELDS = ("reports_due", "products_count")


def _dec(v):
    return Decimal(f"{v:.1f}") if v is not None else None


def report_deadlines_per_year(years):
    """{reportlist_id: {yil: muddatlar soni}} — hisobot kalendari bo'yicha (KR-32, real)."""
    from apps.additional_services.api_endpoints.KtutReportAPI.calendar import occurrences_in_month
    from apps.additional_services.models import ReportList

    out = {}
    for report in ReportList.objects.all():
        out[report.pk] = {y: sum(len(list(occurrences_in_month(report, y, m))) for m in range(1, 13)) for y in years}
    return out


def real_sources(inns, years):
    """KR-32: {inn: {"reports_due": {yil: n}, "products_count": n}} — faqat real manbasi borlar."""
    from apps.additional_services.models import IndustrialProduct, KtutReportList

    deadlines = report_deadlines_per_year(years)
    due = defaultdict(lambda: defaultdict(int))
    for inn, report_id in KtutReportList.objects.filter(ktut__inn__in=inns).values_list("ktut__inn", "reportlist_id"):
        for y, n in deadlines.get(report_id, {}).items():
            due[inn][y] += n
    products = defaultdict(set)
    for inn, skp in IndustrialProduct.objects.filter(inn__in=inns).values_list("inn", "skp_id"):
        products[inn].add(skp)
    out = {}
    for inn in set(due) | set(products):
        out[inn] = {}
        if inn in due:
            out[inn]["reports_due"] = dict(due[inn])
        if inn in products:
            out[inn]["products_count"] = len(products[inn])
    return out


def region_wages():
    """SIAT 500 (o'rtacha oylik ish haqi, so'm) -> {viloyat kodi: mln so'm}, har viloyat uchun oxirgi yil."""
    from apps.siat.models import SiatValue

    out = {}
    rows = (SiatValue.objects.filter(indicator__key="500", breakdown="", territory_code__regex=r"^\d{4}$",
                                     value__isnull=False).order_by("period").values_list("territory_code", "value"))
    for code, value in rows:
        out[code] = value / 1e6
    return out


def districts_by_region():
    """{viloyat kodi: [(District, aholi vazni), ...]} — SIAT tumanlariga mos keladiganlari (KR-37 xaritasi uchun)."""
    from apps.siat.models import SiatValue, Territory

    soato = set(Territory.objects.filter(level="district").values_list("soato", flat=True))
    pop = dict(SiatValue.objects.filter(indicator__key="246", breakdown="", territory_code__in=soato,
                                        value__isnull=False).order_by("period").values_list("territory_code", "value"))
    out = defaultdict(list)
    for d in District.objects.select_related("region").order_by("id"):
        code = d.region.code + d.code
        if code in soato:
            out[d.region.code].append((d, pop.get(code) or 1.0))
    return out


def pick_district(stir, region_code, districts):
    options = districts.get(region_code) or []
    if not options:
        return None
    rnd = random.Random(f"district:{stir}")
    total = sum(w for _, w in options)
    x = rnd.random() * total
    for d, w in options:
        x -= w
        if x <= 0:
            return d
    return options[-1][0]


class EnterpriseScoringSeeder(Seeder):
    name = "enterprise_scoring"
    depends_on = ("enterprise_indicators", "report_guides")   # report_guides demo KTUT qatorlarini yaratadi
    limit = None            # `seed_demo --only enterprise_scoring` uchun lokal tezlik: ENTERPRISE_SCORING_LIMIT
    batch_size = 5000

    def seed(self):
        import os

        from apps.additional_services.models import Ktut

        limit = int(os.environ.get("ENTERPRISE_SCORING_LIMIT") or 0) or self.limit
        inns = list(Ktut.objects.exclude(inn__isnull=True).exclude(inn="").order_by("id")
                    .values_list("inn", flat=True).distinct())
        if limit:
            inns = inns[:limit]
        years = list(generator.YEARS)
        regions = {r.code: r for r in Region.objects.all()}
        if not regions:
            self.log("  enterprise_scoring: viloyatlar ma'lumotnomasi bo'sh — o'tkazib yuborildi")
            return
        wages = region_wages()
        districts = districts_by_region()
        real = real_sources(inns, years)

        demo_tins = set(EnterpriseIndicator.objects.filter(is_peer=False, is_synthetic=False)
                        .values_list("stir", flat=True))
        existing = set(EnterpriseIndicator.objects.filter(is_synthetic=True).values_list("stir", "year"))
        created = 0
        batch = []
        for inn in inns:
            if inn in demo_tins:
                continue
            product_maker = "products_count" in real.get(inn, {})
            result = generator.generate(inn, region_wage=wages, region_codes=set(regions))
            prof = result["profile"]
            if product_maker and prof["oked_section"] not in ("A", "B", "C"):
                rnd = random.Random(f"producer:{inn}")
                section = "C"
                prof = {**prof, "oked_section": section,
                        "oked_division": generator._weighted(rnd, generator.DIVISIONS[section])}
                result = generator.generate(inn, profile=prof, region_wage=wages, region_codes=set(regions))
            region = regions.get(prof["region_code"])
            district = pick_district(inn, prof["region_code"], districts)
            for year, row in result["rows"].items():
                if (inn, year) in existing:
                    continue
                batch.append(self._make(inn, year, row, prof, region, district, real.get(inn, {})))
            if len(batch) >= self.batch_size:
                created += self._flush_batch(batch)
                batch = []
        created += self._flush_batch(batch)
        self._update_demo(demo_tins, wages, districts, real, years)
        self._register_batch()
        self.stats[(EnterpriseIndicator._meta.label, "created")] += created
        self.log(f"  enterprise_scoring: {created} qator ({len(inns)} KTUT korxonasi)")
        # KR-31: seeder tugagach ballar qayta hisoblanadi
        from apps.analytics.company_scoring.service import compute_all

        n = compute_all(stdout=self.stdout)
        # Ballar hosila: yangi ko'rsatkich qatori bo'lmasa — "mavjud edi" (seed_demo idempotentligi)
        self.stats[(EnterpriseScore._meta.label, "created" if created else "existed")] += n

    def _make(self, inn, year, row, prof, region, district, real):
        values, sources = self._values(row, year, real)
        sources.update({"oked_section": "synthetic", "region": "synthetic", "ownership": "synthetic"})
        return EnterpriseIndicator(
            stir=inn, year=year, oked_section=prof["oked_section"], oked_division=prof["oked_division"], region=region,
            district=district, ownership=prof["ownership"], is_peer=False, is_synthetic=True, sources=sources, **values)

    @staticmethod
    def _values(row, year, real):
        values, sources = {}, {}
        for key, v in row.items():
            values[key] = _dec(v) if key in DECIMAL_FIELDS else v
            sources[key] = "synthetic"
        due_real = (real.get("reports_due") or {}).get(year)
        if due_real is not None:
            gen_due = row.get("reports_due") or 1
            values["reports_on_time"] = min(due_real, int(round(due_real * (row.get("reports_on_time") or 0) / gen_due)))
            values["reports_due"] = due_real
            sources["reports_due"] = "real"
        if "products_count" in real:
            values["products_count"] = real["products_count"]
            sources["products_count"] = "real"
        return values, sources

    def _flush_batch(self, batch):
        if not batch:
            return 0
        with transaction.atomic():
            EnterpriseIndicator.objects.bulk_create(batch, batch_size=self.batch_size, ignore_conflicts=True)
        return len(batch)

    def _update_demo(self, demo_tins, wages, districts, real, years):
        """S-10 demo korxonalari: mavjud tushum, xodimlar, eksport saqlanadi, scoring maydonlari to'ldiriladi."""
        rows = defaultdict(dict)
        for obj in EnterpriseIndicator.objects.filter(stir__in=demo_tins).select_related("region"):
            rows[obj.stir][obj.year] = obj
        for tin, by_year in rows.items():
            any_row = next(iter(by_year.values()))
            prof = {"oked_section": any_row.oked_section, "region_code": any_row.region.code,
                    "oked_division": any_row.oked_division or next(iter(generator.DIVISIONS[any_row.oked_section]))
                    if any_row.oked_section in generator.DIVISIONS else "", "ownership": any_row.ownership or "private"}
            if any_row.oked_section not in generator.DIVISIONS:
                continue
            result = generator.generate(tin, profile=prof, region_wage=wages)
            district = pick_district(tin, prof["region_code"], districts)
            for year in years:
                obj, gen = by_year.get(year), result["rows"].get(year) or result["rows"].get(2025)
                if obj is None or gen is None:
                    continue
                values, sources = self._values(gen, year, real.get(tin, {}))
                was_null = obj.export_value is None or (obj.sources or {}).get("_export_was_null", False)
                prev = by_year.get(year - 2)
                gen_rev = gen.get("revenue") or 0
                rev = float(obj.revenue or 0)
                values.update({
                    # S-10 da eksport qilmaydiganlarda None — scoring uchun "eksport yo'q" (0), noma'lum emas
                    "revenue": obj.revenue, "employees": obj.employees,
                    "export_value": obj.export_value if obj.export_value is not None else Decimal(0),
                    "output_value": obj.output_value,
                    "revenue_prev2": prev.revenue if prev else None,
                    "employees_prev2": prev.employees if prev else None,
                    "export_prev2": (prev.export_value or Decimal(0)) if prev else None,
                    "net_profit": _dec(rev * (gen.get("net_profit") or 0) / gen_rev) if gen_rev else None,
                    "founded_year": min(gen.get("founded_year") or 2015, min(by_year)),
                    "export_countries": gen.get("export_countries") if obj.export_value else 0,
                    "export_hs_count": gen.get("export_hs_count") if obj.export_value else 0,
                })
                for key in SCORING_FIELDS:
                    if key in values:
                        setattr(obj, key, values[key])
                obj.oked_division, obj.ownership, obj.district = prof["oked_division"], prof["ownership"], district
                obj.sources = {**sources, "_scoring": "demo", **({"_export_was_null": True} if was_null else {})}
                obj.save()

    def _register_batch(self):
        ct = ContentType.objects.get_for_model(EnterpriseIndicator)
        SyntheticRecord.objects.get_or_create(seed_key=BATCH_KEY, defaults={"content_type": ct, "object_id": "batch"})

    @classmethod
    def flush_batch(cls, dry_run=False):
        """`seed_demo --flush`: partiya qatorlarini `is_synthetic` bo'yicha o'chirish, demo qatorlardagi scoring
        maydonlarini tozalash va hisoblangan ballarni o'chirish. -> {model: soni}"""
        qs = EnterpriseIndicator.objects.filter(is_synthetic=True)
        demo = EnterpriseIndicator.objects.filter(sources__has_key="_scoring")
        scores = EnterpriseScore.objects.exclude(data_source="real")
        counts = {EnterpriseIndicator._meta.label: qs.count(), EnterpriseScore._meta.label: scores.count()}
        if dry_run:
            return counts
        with transaction.atomic():
            qs.delete()
            demo.filter(sources__has_key="_export_was_null").update(export_value=None)
            demo.update(**{f: None for f in SCORING_FIELDS if f not in ("oked_division", "ownership")},
                        oked_division="", ownership="", sources={})
            scores.delete()
            SyntheticRecord.objects.filter(seed_key=BATCH_KEY).delete()
        return counts

