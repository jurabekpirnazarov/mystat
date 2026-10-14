"""FQ-02: hududiy profil — viloyat va tuman "pasporti".

Manbalar (har ko'rsatkich yonida `source`):
- real: tumanlar soni (District), sanoat korxonalari soni va asosiy tarmoqlari (IndustrialProduct manzili),
  tashqi savdo (TradeData.region — SOATO kodi orqali);
- namuna (S-11, OS-13): aholi, ish haqi, ishsizlik, YaHM va boshqalar — RegionIndicator.
"""
from django.core.cache import cache
from django.db.models import Avg, Count, Sum
from django.shortcuts import get_object_or_404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.api_endpoints.ExternalTradeAPI.flows import latest_periods
from apps.additional_services.models import IndustrialProduct
from apps.additional_services.models.ex_trade import TradeData
from apps.common.models import District, Region
from apps.common.synthetic import synthetic_ids

from .geo import ADDRESS_PREFIX, region_name_uz
from .models import RegionIndicator

CACHE_SECONDS = 3600
LABELS = dict(RegionIndicator.INDICATORS)
# Respublika qiymati: yig'indi (hajm ko'rsatkichlari) yoki o'rtacha (darajalar)
SUM_INDICATORS = {"population", "births", "deaths", "migration_net", "retail_turnover", "housing_built", "industry_output"}
HIGHER_IS_BETTER = {"avg_salary": True, "unemployment_rate": False, "grp_per_capita": True, "births": None,
                    "deaths": None, "population": None, "migration_net": True, "retail_turnover": True,
                    "housing_built": True, "industry_output": True}
CARD_ORDER = ["population", "avg_salary", "unemployment_rate", "grp_per_capita", "births", "industry_output",
              "retail_turnover", "housing_built"]


def _source(qs):
    ids = synthetic_ids(RegionIndicator)
    if not ids:
        return "real"
    pks = {str(pk) for pk in qs.values_list("pk", flat=True)}
    return "synthetic" if pks and pks <= ids else "mixed" if pks & ids else "real"


def _latest_year():
    return RegionIndicator.objects.filter(district__isnull=True, period="Y").order_by("-year").values_list("year", flat=True).first()


def _republic(year):
    rows = RegionIndicator.objects.filter(district__isnull=True, period="Y", year=year).values("indicator").annotate(
        total=Sum("value"), avg=Avg("value"))
    return {r["indicator"]: float(r["total"] if r["indicator"] in SUM_INDICATORS else r["avg"]) for r in rows}


def _trade(region_code):
    periods = latest_periods()
    if not periods:
        return None
    year = max(periods)
    month = periods[year]
    rows = TradeData.objects.filter(region__soato=region_code, year_id=year, month=month).values("trade_type").annotate(v=Sum("value"))
    values = {r["trade_type"]: float(r["v"] or 0) for r in rows}
    if not values:
        return None
    return {"year": year, "period": month, "export": values.get(1, 0.0), "import": values.get(2, 0.0), "unit": "ming AQSh $"}


def _industry(region_code):
    prefix = ADDRESS_PREFIX.get(region_code)
    if not prefix:
        return None
    qs = IndustrialProduct.objects.filter(adress_uz__startswith=prefix)
    companies = qs.values("inn").distinct().count()
    top = (qs.values("category__parent__name_uz", "category__name_uz").annotate(n=Count("inn", distinct=True))
           .order_by("-n")[:5])
    return {"companies": companies, "top_categories": [{"name": t["category__name_uz"], "companies": t["n"]} for t in top]}


def build_region_profile(region):
    year = _latest_year()
    data = {"region": {"id": region.id, "code": region.code, "name": region.name, "name_uz": region_name_uz(region)},
            "year": year, "cards": [], "dynamics": {}, "districts": [], "data_source": "real"}
    data["districts_count"] = District.objects.filter(region=region).count()
    data["industry"] = _industry(region.code)
    data["trade"] = _trade(region.code)
    if year is None:
        return data

    own = RegionIndicator.objects.filter(region=region, district__isnull=True, period="Y")
    latest = {r.indicator: r for r in own.filter(year=year)}
    prev = {r.indicator: r for r in own.filter(year=year - 1)}
    republic = _republic(year)
    regions_count = Region.objects.count() or 1
    for key in CARD_ORDER:
        row = latest.get(key)
        if row is None:
            continue
        value = float(row.value)
        rep = republic.get(key)
        compare_to = rep / regions_count if key in SUM_INDICATORS and rep else rep  # hajm: viloyat o'rtachasi bilan
        better = HIGHER_IS_BETTER.get(key)
        diff = (value - compare_to) / compare_to * 100 if compare_to else None
        data["cards"].append({
            "key": key, "label": str(LABELS[key]), "unit": row.unit, "value": value,
            "change_pct": round((value - float(prev[key].value)) / float(prev[key].value) * 100, 1) if key in prev and float(prev[key].value) else None,
            "republic": round(rep, 1) if rep is not None else None,
            "vs_average_pct": round(diff, 1) if diff is not None else None,
            "assessment": None if better is None or diff is None else ("good" if (diff > 0) == better else "bad"),
            "source": "synthetic" if str(row.pk) in synthetic_ids(RegionIndicator) else "real",
        })
    for key in ("population", "avg_salary", "unemployment_rate", "grp_per_capita"):
        data["dynamics"][key] = [{"year": r.year, "value": float(r.value)} for r in own.filter(indicator=key).order_by("year")]
    district_rows = RegionIndicator.objects.filter(region=region, district__isnull=False, year=year, period="Y").select_related("district")
    table = {}
    for r in district_rows:
        table.setdefault(r.district_id, {"id": r.district_id, "name": r.district.name})[r.indicator] = float(r.value)
    data["districts"] = sorted(table.values(), key=lambda d: -d.get("population", 0))
    data["data_source"] = _source(own.filter(year=year))
    return data


class RegionProfileView(APIView):
    """GET /api/common/regions/<id>/profile/"""
    permission_classes = (AllowAny,)

    def get(self, request, pk):
        region = get_object_or_404(Region, pk=pk)
        key = f"region_profile:v1:{pk}"
        data = cache.get(key)
        if data is None:
            data = build_region_profile(region)
            cache.set(key, data, CACHE_SECONDS)
        return Response(data)


class DistrictProfileView(APIView):
    """GET /api/common/districts/<id>/profile/ — tuman: asosiy 4 ko'rsatkich va viloyat o'rtachasi bilan taqqoslash."""
    permission_classes = (AllowAny,)

    def get(self, request, pk):
        district = get_object_or_404(District.objects.select_related("region"), pk=pk)
        year = _latest_year()
        rows = RegionIndicator.objects.filter(district=district, period="Y")
        siblings = RegionIndicator.objects.filter(region=district.region, district__isnull=False, year=year, period="Y")
        avg = {r["indicator"]: float(r["a"]) for r in siblings.values("indicator").annotate(a=Avg("value"))}
        cards = []
        for r in rows.filter(year=year):
            cards.append({"key": r.indicator, "label": str(LABELS[r.indicator]), "unit": r.unit, "value": float(r.value),
                          "region_average": round(avg.get(r.indicator, 0), 1)})
        dynamics = {}
        for r in rows.order_by("year"):
            dynamics.setdefault(r.indicator, []).append({"year": r.year, "value": float(r.value)})
        return Response({"district": {"id": district.id, "name": district.name},
                         "region": {"id": district.region_id, "name": district.region.name}, "year": year,
                         "cards": cards, "dynamics": dynamics, "data_source": _source(rows)})


class RegionMapView(APIView):
    """GET /api/common/regions/map/?indicator=avg_salary — barcha viloyatlar bo'yicha bitta ko'rsatkich (xarita)."""
    permission_classes = (AllowAny,)

    def get(self, request):
        indicator = request.query_params.get("indicator", "population")
        regions = list(Region.objects.order_by("code"))
        if indicator == "companies":
            items = [{"region_id": r.id, "code": r.code, "name": region_name_uz(r),
                      "value": (_industry(r.code) or {}).get("companies", 0)} for r in regions]
            return Response({"indicator": indicator, "label": "Sanoat korxonalari soni", "unit": "ta", "year": None,
                             "items": items, "data_source": "real"})
        if indicator not in LABELS:
            return Response({"detail": "Noma'lum ko'rsatkich"}, status=400)
        year = _latest_year()
        qs = RegionIndicator.objects.filter(indicator=indicator, district__isnull=True, period="Y", year=year)
        values = {r.region_id: r for r in qs}
        items = [{"region_id": r.id, "code": r.code, "name": region_name_uz(r),
                  "value": float(values[r.id].value) if r.id in values else None} for r in regions]
        unit = next((v.unit for v in values.values()), "")
        return Response({"indicator": indicator, "label": str(LABELS[indicator]), "unit": unit, "year": year,
                         "items": items, "data_source": _source(qs),
                         "indicators": [{"key": k, "label": str(v)} for k, v in RegionIndicator.INDICATORS] +
                                       [{"key": "companies", "label": "Sanoat korxonalari soni"}]})
