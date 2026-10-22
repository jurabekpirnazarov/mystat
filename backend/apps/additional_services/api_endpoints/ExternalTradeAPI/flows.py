"""Tashqi savdo oqimlari: davlatlar kesimida eksport/import. B-04, U-09.

TradeData.month kumulyativ (M1 = yanvar, M12 = yanvar–dekabr), shuning uchun har yil uchun
mavjud eng oxirgi oy olinadi va faqat shu oy qatorlari yig'iladi.
"""
from decimal import Decimal

from django.core.cache import cache
from django.db.models import Sum
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models.ex_trade import TradeData

CACHE_SECONDS = 60 * 60
FLOWS = {"export": 1, "import": 2}
# TI-02: "aylanma" = eksport + import (TRADEINT_DIZAYN.md). FLOWS ni market_report ikkala oqimni aylanib chiqish uchun ishlatadi
FLOW_CODES = {"export": [1], "import": [2], "total": [1, 2]}
# "Boshqa davlatlar" agregat yozuvi — reytingga kiritilmaydi, alohida qaytariladi
OTHER_COUNTRIES_CODE = "999"
MONTH_LABELS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"]


def _month_num(code):
    return int(code[1:]) if code and code[1:].isdigit() else 0


def latest_periods():
    """{yil: oxirgi kumulyativ oy kodi}, masalan {2025: 'M12', 2026: 'M8'}."""
    def compute():
        result = {}
        for year, month in TradeData.objects.values_list("year_id", "month").distinct():
            if _month_num(month) > _month_num(result.get(year)):
                result[year] = month
        return dict(sorted(result.items()))
    return cache.get_or_set("trade_flows:periods", compute, CACHE_SECONDS)


def period_label(month_code):
    n = _month_num(month_code)
    return "yanvar" if n == 1 else f"yanvar–{MONTH_LABELS[n - 1]}" if n else ""


def _totals_by_country(year, month, flow, hs):
    qs = TradeData.objects.filter(year_id=year, month=month, trade_type__in=FLOW_CODES[flow])
    if hs:
        qs = qs.filter(product__code__startswith=hs)
    return {
        row["country_id"]: row
        for row in qs.values("country_id", "country__name_uz", "country__name_en", "country__ctrana")
        .annotate(value=Sum("value"), quantity=Sum("quantity"))
    }


class TradeFlowsAPIView(APIView):
    """GET external-trade/trade-flows/?year=2025&flow=export|import|total&hs=52&limit=20

    Javob: davr, jami qiymat va davlatlar (ulush, o'tgan yilning shu davriga nisbatan o'zgarish)."""
    permission_classes = [AllowAny]

    def get(self, request):
        periods = latest_periods()
        if not periods:
            return Response({"years": [], "countries": []})

        flow = request.query_params.get("flow", "export")
        if flow not in FLOW_CODES:
            return Response({"detail": "flow: export, import yoki total"}, status=400)
        try:
            year = int(request.query_params.get("year") or max(periods))
            limit = max(1, min(int(request.query_params.get("limit") or 20), 300))
        except ValueError:
            return Response({"detail": "year/limit butun son bo'lishi kerak"}, status=400)
        if year not in periods:
            return Response({"detail": f"{year}-yil uchun ma'lumot yo'q", "years": list(periods)}, status=404)
        hs = (request.query_params.get("hs") or "").strip()[:6]

        key = f"trade_flows:{year}:{flow}:{hs}:{limit}"
        data = cache.get(key)
        if data is None:
            data = self._build(periods, year, flow, hs, limit)
            cache.set(key, data, CACHE_SECONDS)
        return Response(data)

    @staticmethod
    def _build(periods, year, flow, hs, limit):
        month = periods[year]
        current = _totals_by_country(year, month, flow, hs)
        # O'tgan yilning xuddi shu davri (agar shu oy mavjud bo'lsa)
        prev_year = year - 1
        previous = {}
        if prev_year in periods and _month_num(periods[prev_year]) >= _month_num(month):
            previous = _totals_by_country(prev_year, month, flow, hs)

        total = sum((row["value"] or Decimal(0)) for row in current.values())
        other = sum((r["value"] or Decimal(0)) for r in current.values() if r["country__ctrana"] == OTHER_COUNTRIES_CODE)
        rows = sorted(
            (r for r in current.values() if r["country__ctrana"] != OTHER_COUNTRIES_CODE),
            key=lambda r: r["value"] or 0, reverse=True,
        )
        countries = []
        for row in rows[:limit]:
            value = row["value"] or Decimal(0)
            prev = previous.get(row["country_id"], {}).get("value")
            countries.append({
                "country_id": row["country_id"],
                "country_name": row["country__name_uz"],
                "country_name_en": row["country__name_en"],
                "iso_numeric": row["country__ctrana"],
                "value": float(value),
                "quantity": float(row["quantity"] or 0),
                "share": float(value / total * 100) if total else 0.0,
                "prev_value": float(prev) if prev is not None else None,
                "change_pct": float((value - prev) / prev * 100) if prev else None,
            })
        from .trade_hub import data_quality
        quality = data_quality()
        # Taqqoslash ishonchsiz bo'lgan yillar: tanlangan yil yoki o'tgan yil ma'lumoti to'liq emas
        warnings = [quality[y] for y in (year, prev_year) if y in quality]
        return {
            "year": year,
            "flow": flow,
            "hs": hs or None,
            "warnings": warnings,
            "period": month,
            "period_label": period_label(month),
            "total_value": float(total),
            "other_countries_value": float(other),
            "countries_count": len(rows),
            "years": list(periods),
            "countries": countries,
        }


class TradeFlowDynamicsAPIView(APIView):
    """GET external-trade/trade-flows/dynamics/?country=<id>&flow=export — yillar bo'yicha qiymat (har yilning oxirgi davri)."""
    permission_classes = [AllowAny]

    def get(self, request):
        flow = request.query_params.get("flow", "export")
        if flow not in FLOW_CODES:
            return Response({"detail": "flow: export, import yoki total"}, status=400)
        country = request.query_params.get("country")
        if country and not country.isdigit():
            return Response({"detail": "country — davlat id"}, status=400)

        key = f"trade_flows:dyn:{flow}:{country or 'all'}"
        data = cache.get(key)
        if data is None:
            data = []
            for year, month in latest_periods().items():
                qs = TradeData.objects.filter(year_id=year, month=month, trade_type__in=FLOW_CODES[flow])
                if country:
                    qs = qs.filter(country_id=int(country))
                value = qs.aggregate(v=Sum("value"))["v"] or 0
                data.append({"year": year, "period": month, "period_label": period_label(month), "value": float(value)})
            cache.set(key, data, CACHE_SECONDS)
        return Response(data)


EXPORT_MAX_ROWS = 10_000


class TradeFlowsExportAPIView(APIView):
    """GET external-trade/trade-flows/export/?year=&flow=&hs=&detail=country|hs4&file=csv|xlsx — U-16.

    Server ko'pi bilan 10 000 qator qaytaradi; kesilgan bo'lsa fayl oxirida aytiladi.
    """
    permission_classes = [AllowAny]

    def get(self, request):
        import csv
        import io

        from django.db.models.functions import Substr
        from django.http import HttpResponse

        periods = latest_periods()
        flow = request.query_params.get("flow", "export")
        if flow not in FLOW_CODES or not periods:
            return Response({"detail": "flow: export, import yoki total"}, status=400)
        try:
            year = int(request.query_params.get("year") or max(periods))
        except ValueError:
            return Response({"detail": "year butun son"}, status=400)
        if year not in periods:
            return Response({"detail": f"{year}-yil uchun ma'lumot yo'q"}, status=404)
        hs = "".join(ch for ch in (request.query_params.get("hs") or "") if ch.isdigit())[:6]
        detail = request.query_params.get("detail", "country")
        qs = TradeData.objects.filter(year_id=year, month=periods[year], trade_type__in=FLOW_CODES[flow])
        if hs:
            qs = qs.filter(product__code__startswith=hs)
        if detail == "hs4":
            rows = (qs.annotate(hs4=Substr("product__code", 1, 4)).values("country__name_uz", "hs4")
                    .annotate(total=Sum("value"), qty=Sum("quantity")).order_by("-total"))
            header = ["Davlat", "HS4", "Qiymat (ming AQSh $)", "Miqdor"]
            keys = ("country__name_uz", "hs4")
        else:
            rows = (qs.values("country__name_uz", "country__ctrana")
                    .annotate(total=Sum("value"), qty=Sum("quantity")).order_by("-total"))
            header = ["Davlat", "ISO kod", "Qiymat (ming AQSh $)", "Miqdor"]
            keys = ("country__name_uz", "country__ctrana")
        data = [[r[keys[0]], r[keys[1]], float(r["total"] or 0), float(r["qty"] or 0)]
                for r in rows[:EXPORT_MAX_ROWS + 1]]
        truncated = len(data) > EXPORT_MAX_ROWS
        data = data[:EXPORT_MAX_ROWS]
        note = (f"Manba: my.stat.uz, tashqi savdo, {year}-yil {period_label(periods[year])}, {flow}"
                + (f", HS {hs}*" if hs else "") + (f". Natija {EXPORT_MAX_ROWS} qatorda kesildi." if truncated else "."))
        name = f"tashqi-savdo-{flow}-{year}{'-' + hs if hs else ''}"
        if request.query_params.get("file") == "xlsx":  # "format" — DRF parametri, shuning uchun "file"
            from openpyxl import Workbook
            wb = Workbook()
            ws = wb.active
            ws.append(header)
            for row in data:
                ws.append(row)
            ws.append([])
            ws.append([note])
            buf = io.BytesIO()
            wb.save(buf)
            resp = HttpResponse(buf.getvalue(), content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
            resp["Content-Disposition"] = f'attachment; filename="{name}.xlsx"'
        else:
            out = io.StringIO()
            writer = csv.writer(out)
            writer.writerow(header)
            writer.writerows(data)
            writer.writerow([note])
            resp = HttpResponse(("\ufeff" + out.getvalue()).encode("utf-8"), content_type="text/csv; charset=utf-8")
            resp["Content-Disposition"] = f'attachment; filename="{name}.csv"'
        resp["X-Rows"] = str(len(data))
        resp["X-Truncated"] = "1" if truncated else "0"
        return resp
