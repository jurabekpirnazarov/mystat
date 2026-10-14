"""FQ-01: ochiq ma'lumotlar API'si — /api/open/v1/ (faqat o'qish, API kalit bilan).

Kalit: `X-API-Key: ms_...` sarlavhasi (yoki `?api_key=`). Kalitsiz yoki noto'g'ri — 401, kunlik limitdan
oshganda — 429. Bu xizmat kvotasi; saytning umumiy rate limiti (2.1-bo'lim) alohida va keyinga qoldirilgan.
Format: `?format=json` (default) yoki `?format=csv` (UTF-8 BOM, Excel to'g'ri ochadi).
"""
import csv
import io

from django.db import transaction
from django.db.models import F, Sum
from django.db.models.functions import Substr
from django.utils import timezone
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework import exceptions, status
from rest_framework.authentication import BaseAuthentication
from rest_framework.permissions import IsAuthenticated
from rest_framework.renderers import BaseRenderer, JSONRenderer
from rest_framework.views import APIView
from rest_framework.response import Response

from .models import ApiKey, ApiUsage, hash_key

PAGE_MAX = 1000


class ApiKeyAuthentication(BaseAuthentication):
    def authenticate(self, request):
        raw = request.headers.get("X-API-Key") or request.query_params.get("api_key")
        if not raw:
            raise exceptions.NotAuthenticated("API kalit kerak: X-API-Key sarlavhasi.")
        key = ApiKey.objects.select_related("user").filter(key_hash=hash_key(raw), is_active=True).first()
        if key is None or not key.user.is_active:
            raise exceptions.AuthenticationFailed("API kalit noto'g'ri yoki bekor qilingan.")
        return key.user, key

    def authenticate_header(self, request):
        return "X-API-Key"


class CSVRenderer(BaseRenderer):
    media_type = "text/csv"
    format = "csv"
    charset = "utf-8"

    def render(self, data, accepted_media_type=None, renderer_context=None):
        rows = data.get("results") if isinstance(data, dict) else None
        buf = io.StringIO()
        if rows is None:  # xato javobi
            buf.write(str(data.get("detail", data) if isinstance(data, dict) else data))
        else:
            if isinstance(data, dict) and data.get("source") == "synthetic":
                buf.write("# NAMUNA MA'LUMOT: raqamlar haqiqiy statistika emas\n")
            if rows:
                writer = csv.DictWriter(buf, fieldnames=list(rows[0].keys()))
                writer.writeheader()
                writer.writerows(rows)
            if isinstance(data, dict):
                buf.write(f"# Manba: my.stat.uz, {data.get('source_label', '')}, {timezone.localdate():%Y-%m-%d}\n")
        return ("﻿" + buf.getvalue()).encode("utf-8")


class OpenApiView(APIView):
    authentication_classes = [ApiKeyAuthentication]
    permission_classes = []
    renderer_classes = [JSONRenderer, CSVRenderer]
    endpoint = ""
    filename = "data"

    def initial(self, request, *args, **kwargs):
        super().initial(request, *args, **kwargs)
        key = request.auth
        today = timezone.localdate()
        with transaction.atomic():
            used = ApiUsage.objects.filter(api_key=key, date=today).aggregate(n=Sum("requests"))["n"] or 0
            if used >= key.daily_limit:
                raise exceptions.Throttled(detail=f"Kunlik limit ({key.daily_limit} so'rov) tugadi. Ertaga qayta urining.")
            row, _ = ApiUsage.objects.select_for_update().get_or_create(api_key=key, date=today, endpoint=self.endpoint)
            ApiUsage.objects.filter(pk=row.pk).update(requests=F("requests") + 1)
        ApiKey.objects.filter(pk=key.pk).update(last_used_at=timezone.now())

    def page(self, request, rows, source="real", source_label=""):
        try:
            limit = max(1, min(int(request.query_params.get("limit", 100)), PAGE_MAX))
            offset = max(0, int(request.query_params.get("offset", 0)))
        except ValueError:
            raise exceptions.ValidationError("limit/offset butun son bo'lishi kerak")
        rows = list(rows)
        data = {"count": len(rows), "limit": limit, "offset": offset, "source": source, "source_label": source_label,
                "results": rows[offset:offset + limit]}
        response = Response(data)
        if getattr(request, "accepted_renderer", None) and request.accepted_renderer.format == "csv":
            suffix = "_NAMUNA" if source == "synthetic" else ""
            response["Content-Disposition"] = f'attachment; filename="{self.filename}{suffix}.csv"'
        return response


COMMON = [OpenApiParameter("format", str, enum=["json", "csv"]), OpenApiParameter("limit", int), OpenApiParameter("offset", int)]


class CpiView(OpenApiView):
    endpoint, filename = "cpi", "cpi"

    @extend_schema(parameters=COMMON, summary="Iste'mol narxlari indeksi (oylik, zanjirli)",
                   description="Misol: `curl -H 'X-API-Key: ms_...' https://my.stat.uz/api/open/v1/cpi/?format=csv`")
    def get(self, request):
        from apps.additional_services.api_endpoints.PriceIndexAPI.series import cpi_chain
        return self.page(request, cpi_chain(), source_label="ISN (o'tgan oyga nisbatan)")


class TradeSummaryView(OpenApiView):
    endpoint, filename = "trade/summary", "trade_summary"

    @extend_schema(parameters=COMMON + [OpenApiParameter("year", int), OpenApiParameter("flow", str, enum=["export", "import"]),
                                        OpenApiParameter("group", str, enum=["country", "hs2"])],
                   summary="Tashqi savdo agregatlari (ming AQSh $)")
    def get(self, request):
        from apps.additional_services.api_endpoints.ExternalTradeAPI.flows import FLOWS, latest_periods
        from apps.additional_services.models.ex_trade import TradeData
        periods = latest_periods()
        if not periods:
            return self.page(request, [])
        try:
            year = int(request.query_params.get("year") or max(periods))
        except ValueError:
            raise exceptions.ValidationError("year butun son")
        if year not in periods:
            raise exceptions.NotFound(f"{year}-yil uchun ma'lumot yo'q")
        flow = request.query_params.get("flow", "export")
        if flow not in FLOWS:
            raise exceptions.ValidationError("flow: export|import")
        qs = TradeData.objects.filter(year_id=year, month=periods[year], trade_type=FLOWS[flow])
        if request.query_params.get("group") == "hs2":
            rows = (qs.annotate(hs2=Substr("product__code", 1, 2)).values("hs2").annotate(value=Sum("value")).order_by("-value"))
            data = [{"year": year, "period": periods[year], "flow": flow, "hs2": r["hs2"], "value": float(r["value"] or 0)} for r in rows]
        else:
            rows = qs.values("country__name_en", "country__ctrana").annotate(value=Sum("value")).order_by("-value")
            data = [{"year": year, "period": periods[year], "flow": flow, "country": r["country__name_en"],
                     "iso_numeric": r["country__ctrana"], "value": float(r["value"] or 0)} for r in rows]
        return self.page(request, data, source_label="Tashqi savdo (bojxona), ming AQSh $")


class RegionIndicatorsView(OpenApiView):
    endpoint, filename = "regions/indicators", "region_indicators"

    @extend_schema(parameters=COMMON + [OpenApiParameter("indicator", str), OpenApiParameter("year", int),
                                        OpenApiParameter("region", int), OpenApiParameter("period", str, enum=["Y", "Q1", "Q2", "Q3", "Q4"])],
                   summary="Hududiy ko'rsatkichlar")
    def get(self, request):
        from apps.analytics.models import RegionIndicator
        from apps.common.synthetic import table_source
        qs = RegionIndicator.objects.filter(district__isnull=True).select_related("region").order_by("region__code", "indicator", "year", "period")
        for param, field in (("indicator", "indicator"), ("year", "year"), ("region", "region_id"), ("period", "period")):
            if request.query_params.get(param):
                qs = qs.filter(**{field: request.query_params[param]})
        from apps.analytics.geo import region_name_uz
        data = [{"region": region_name_uz(r.region), "region_code": r.region.code, "indicator": r.indicator, "year": r.year,
                 "period": r.period, "value": float(r.value), "unit": r.unit} for r in qs[:20000]]
        return self.page(request, data, source=table_source(RegionIndicator), source_label="Hududiy ko'rsatkichlar")


class ClassificationsView(OpenApiView):
    endpoint, filename = "classifications", "classifications"

    @extend_schema(parameters=COMMON, summary="Statistik klassifikatorlar ro'yxati")
    def get(self, request):
        from apps.additional_services.models.staticclassification_model import StatisticClassification
        from apps.common.synthetic import table_source
        rows = StatisticClassification.objects.all().order_by("id").values()
        data = [{k: (str(v) if v is not None and not isinstance(v, (int, float, bool, str)) else v) for k, v in r.items()
                 if not k.startswith("file")} for r in rows]
        return self.page(request, data, source=table_source(StatisticClassification), source_label="Klassifikatorlar")


class ReportFormsView(OpenApiView):
    endpoint, filename = "reports/forms", "report_forms"

    @extend_schema(parameters=COMMON, summary="Statistik hisobot shakllari va muddatlari")
    def get(self, request):
        from apps.additional_services.models import ReportList
        rows = ReportList.objects.filter(is_active=True).order_by("id")
        data = [{"id": r.id, "name": r.type_uz, "form": r.formsname_uz.strip(), "deadline_text": r.srok_uz.replace("_x000D_", " "),
                 "periodicity": r.report_type, "deadline": r.deadline.isoformat() if r.deadline else None} for r in rows]
        return self.page(request, data, source_label="Hisobot shakllari")


class DemographicsView(OpenApiView):
    endpoint, filename = "demographics", "demographics"

    @extend_schema(parameters=COMMON + [OpenApiParameter("group_by", str, description="vergul bilan ustun nomlari, masalan `Yil,Hudud` (ustunlar: /api/additional-services/demographics/schema/)")],
                   summary="Demografiya bo'limi agregati")
    def get(self, request, slug):
        from apps.additional_services.api_endpoints.DemographicsAPI import writer
        from apps.additional_services.models import DemographicSection
        section = DemographicSection.objects.filter(slug=slug, is_active=True, is_published=True).first()
        if section is None:
            raise exceptions.NotFound("Bo'lim topilmadi")
        df = writer.read_section_df(slug)
        value_col = ((section.filter_schema or {}).get("value_column") or {}).get("name") or ""
        group_by = [g for g in (request.query_params.get("group_by") or "").split(",") if g in df.columns]
        if df.empty or not value_col:
            return self.page(request, [])
        df = writer.group_and_aggregate(df, value_col, group_by) if group_by else df
        source = "synthetic" if writer.data_source() == "synthetic" else "real"
        rows = df.where(df.notna(), None).to_dict("records")
        return self.page(request, rows, source=source, source_label=f"Demografiya: {section.slug}")


# ----------------------------------------------------------- kabinet: kalitlarni boshqarish (JWT bilan)
class MyKeysView(APIView):
    """GET — kalitlarim (prefiks, limit, bugungi foydalanish); POST {name} — yangi kalit (bir marta ko'rsatiladi)."""
    permission_classes = (IsAuthenticated,)
    MAX_KEYS = 5

    def get(self, request):
        today = timezone.localdate()
        keys = ApiKey.objects.filter(user=request.user)
        used = {r["api_key"]: r["n"] for r in ApiUsage.objects.filter(api_key__in=keys, date=today).values("api_key").annotate(n=Sum("requests"))}
        return Response([{"id": k.id, "name": k.name, "prefix": k.prefix, "daily_limit": k.daily_limit, "is_active": k.is_active,
                          "created_at": k.created_at, "last_used_at": k.last_used_at, "used_today": used.get(k.id, 0)} for k in keys])

    def post(self, request):
        name = (request.data.get("name") or "").strip()[:80] or "Mening kalitim"
        if ApiKey.objects.filter(user=request.user, is_active=True).count() >= self.MAX_KEYS:
            return Response({"detail": f"Ko'pi bilan {self.MAX_KEYS} ta faol kalit."}, status=400)
        key, raw = ApiKey.generate(request.user, name)
        return Response({"id": key.id, "name": key.name, "prefix": key.prefix, "key": raw,
                         "warning": "Kalit faqat hozir ko'rsatiladi — saqlab qo'ying."}, status=status.HTTP_201_CREATED)


class MyKeyDetailView(APIView):
    """DELETE — kalitni bekor qilish; GET — 30 kunlik foydalanish."""
    permission_classes = (IsAuthenticated,)

    def get(self, request, pk):
        key = ApiKey.objects.filter(user=request.user, pk=pk).first()
        if key is None:
            return Response(status=404)
        since = timezone.localdate() - timezone.timedelta(days=29)
        rows = ApiUsage.objects.filter(api_key=key, date__gte=since).values("date").annotate(n=Sum("requests")).order_by("date")
        by_day = {r["date"]: r["n"] for r in rows}
        days = [since + timezone.timedelta(days=i) for i in range(30)]
        endpoints = ApiUsage.objects.filter(api_key=key, date__gte=since).values("endpoint").annotate(n=Sum("requests")).order_by("-n")
        return Response({"id": key.id, "usage": [{"date": d.isoformat(), "requests": by_day.get(d, 0)} for d in days],
                         "endpoints": list(endpoints)})

    def delete(self, request, pk):
        updated = ApiKey.objects.filter(user=request.user, pk=pk, is_active=True).update(is_active=False)
        return Response(status=204 if updated else 404)
