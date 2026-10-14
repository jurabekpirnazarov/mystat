"""K-02 tarmoq benchmarki."""
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.synthetic import synthetic_ids
from apps.services.limits import consume, limit_status

from .geo import region_name_uz
from .models import EnterpriseIndicator
from .stats import percentile_rank, quantile

MIN_GROUP = 10
BENCHMARK_SLUG = "benchmark"
METRICS = [
    ("revenue", "Tushum", "ming so'm"),
    ("employees", "Xodimlar soni", "kishi"),
    ("output_value", "Mahsulot hajmi", "ming so'm"),
    ("export_value", "Eksport", "ming AQSh $"),
    ("revenue_per_employee", "Xodim boshiga tushum", "ming so'm"),
]


def _value(row, key):
    if key == "revenue_per_employee":
        return float(row["revenue"]) / row["employees"] if row["employees"] else None
    v = row.get(key)
    return float(v) if v is not None else None


def _section_of(sector):
    while sector is not None and sector.parent_id:
        sector = sector.parent
    return sector


def _source(rows_qs):
    """Benchmark guruhi to'liq namuna bo'lsa "synthetic" (S-09)."""
    ids = synthetic_ids(EnterpriseIndicator)
    if not ids:
        return "real"
    pks = {str(pk) for pk in rows_qs.values_list("pk", flat=True)}
    return "synthetic" if pks and pks <= ids else "mixed" if pks & ids else "real"


def _summary(metrics):
    lines = []
    for m in metrics:
        p = m["percentile"]
        if p is None:
            continue
        if p >= 70:
            lines.append(f"{m['label']} bo'yicha guruhning yuqori {max(1, round(100 - p))}% idasiz.")
        elif p <= 30:
            lines.append(f"{m['label']} bo'yicha guruhning quyi {max(1, round(p))}% idasiz.")
    return lines or ["Ko'rsatkichlaringiz guruh o'rtachasiga yaqin."]


class BenchmarkView(APIView):
    """GET /api/analytics/benchmark/?year=&geo=region|country

    Faqat agregat (median, kvartillar, guruh hajmi) va foydalanuvchining o'z qiymati/persentili qaytadi.
    Begona korxonaning alohida qiymati yoki STIR'i hech qachon qaytarilmaydi.
    """
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        org = getattr(request.user, "organization", None)
        if org is None:
            return Response({"detail": "Korxona profili topilmadi.", "code": "no_organization"}, status=404)
        section = _section_of(org.sector) if org.sector_id else None
        region = org.district.region if org.district_id else None
        if section is None or region is None:
            return Response({"detail": "Profilda tarmoq (OKED) yoki hudud ko'rsatilmagan.", "code": "no_group"},
                            status=404)

        years = sorted(EnterpriseIndicator.objects.filter(oked_section=section.code)
                       .values_list("year", flat=True).distinct())
        if not years:
            return Response({"detail": "Bu tarmoq bo'yicha ma'lumot yo'q.", "code": "no_data"}, status=404)
        try:
            year = int(request.query_params.get("year") or years[-1])
        except ValueError:
            year = years[-1]
        if year not in years:
            year = years[-1]
        geo = request.query_params.get("geo", "region")

        peers = EnterpriseIndicator.objects.filter(oked_section=section.code, is_peer=True).exclude(stir=org.tin)
        level = "region"
        group = peers.filter(region=region)
        if geo == "country" or group.filter(year=year).count() < MIN_GROUP:
            level, group = "country", peers

        usage = consume(request.user, BENCHMARK_SLUG, {"year": year, "level": level}, once_per_day=True)

        fields = ("year", "revenue", "employees", "output_value", "export_value")
        group_rows = list(group.filter(year=year).values(*fields))
        own_rows = {r["year"]: r for r in EnterpriseIndicator.objects.filter(stir=org.tin).values(*fields)}
        own = own_rows.get(year)

        metrics = []
        for key, label, unit in METRICS:
            values = sorted(v for v in (_value(r, key) for r in group_rows) if v is not None)
            own_value = _value(own, key) if own else None
            metrics.append({
                "key": key, "label": label, "unit": unit, "count": len(values),
                "p25": quantile(values, 0.25), "median": quantile(values, 0.5), "p75": quantile(values, 0.75),
                "own": own_value, "percentile": percentile_rank(values, own_value),
            })

        dynamics = []
        all_group = list(group.values(*fields))
        for y in years:
            row = {"year": y}
            for key in ("revenue", "revenue_per_employee", "employees"):
                vals = sorted(v for v in (_value(r, key) for r in all_group if r["year"] == y) if v is not None)
                row[f"{key}_median"] = quantile(vals, 0.5)
                row[f"{key}_own"] = _value(own_rows[y], key) if y in own_rows else None
            dynamics.append(row)

        return Response({
            "year": year,
            "years": years,
            "level": level,
            "group": {
                "oked_section": section.code,
                "oked_name": (section.name_uz or section.name or "").replace("а", "a").replace("А", "A").strip().capitalize(),
                "region": region_name_uz(region) if level == "region" else "Respublika bo'yicha",
                "size": len(group_rows),
            },
            "has_own": own is not None,
            "metrics": metrics,
            "dynamics": dynamics,
            "summary": _summary(metrics),
            "data_source": _source(group.filter(year=year)),
            "usage": usage,
        })


class BenchmarkStatusView(APIView):
    """Limit holati (sarflamasdan) — sahifa ochilishidan oldin ko'rsatish uchun."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(limit_status(request.user, BENCHMARK_SLUG))
