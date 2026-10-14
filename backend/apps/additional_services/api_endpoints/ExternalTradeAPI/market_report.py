"""K-03: HS kodi bo'yicha bozor tahlili hisoboti (to'liq real ma'lumot — tashqi savdo).

- Har yil uchun mavjud eng oxirgi kumulyativ davr olinadi (flows.latest_periods), joriy yil qisman bo'lishi mumkin.
- O'rtacha narx faqat o'lchov birligi tonna bo'lgan qatorlardan: qiymat / og'irlik. Boshqa birlikdagi qatorlar
  narx hisobidan chiqariladi va javobda ularning ulushi aytiladi.
- Bozor konsentratsiyasi — Herfindahl–Hirschman indeksi (eksport hamkorlari ulushlari kvadratlari yig'indisi).
- Qisqa versiya hammaga ochiq; to'liq versiya (`?full=1`) login va paket limiti bilan (slug "market-report", OS-14).
- Agregatlar 24 soat keshlanadi.
"""

from django.core.cache import cache
from django.db.models import Q, Sum
from rest_framework.exceptions import NotAuthenticated
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models.ex_trade import Product, TradeData
from apps.common.search import ci_contains
from apps.services.limits import consume

from .flows import FLOWS, OTHER_COUNTRIES_CODE, _month_num, latest_periods, period_label

CACHE_SECONDS = 24 * 60 * 60
TONNE_UNIT_CODE = "168"
MARKET_REPORT_SLUG = "market-report"
SHORT_TOP = 5
FULL_TOP = 10


def _f(v):
    return float(v) if v is not None else 0.0


def _hhi(values):
    total = sum(values)
    if not total:
        return None
    return round(sum((v / total * 100) ** 2 for v in values))


def _hhi_label(hhi):
    if hhi is None:
        return None
    if hhi < 1500:
        return "Past konsentratsiya: eksport ko'p davlatlarga taqsimlangan"
    if hhi < 2500:
        return "O'rtacha konsentratsiya"
    return "Yuqori konsentratsiya: eksport bir necha davlatga bog'liq"


def _period_stats(base, year, month, by_country):
    """Bitta (yil, davr) uchun eksport/import jami, og'irlik, o'rtacha narx; davlatlar kesimi `by_country` ga."""
    entry = {"year": year, "period": month, "period_label": period_label(month), "partial": month != "M12"}
    for flow, code in FLOWS.items():
        qs = base.filter(year_id=year, month=month, trade_type=code)
        agg = qs.aggregate(total_value=Sum("value"), tonnes=Sum("quantity", filter=Q(unit__code=TONNE_UNIT_CODE)),
                           tonne_value=Sum("value", filter=Q(unit__code=TONNE_UNIT_CODE)))
        value = _f(agg["total_value"])
        tonnes = _f(agg["tonnes"])
        entry[f"{flow}_value"] = value
        entry[f"{flow}_tonnes"] = tonnes
        # qiymat ming AQSh $ (OS-10) -> AQSh $ / tonna
        entry[f"{flow}_price"] = round(_f(agg["tonne_value"]) * 1000 / tonnes, 1) if tonnes else None
        entry[f"{flow}_price_coverage"] = round(_f(agg["tonne_value"]) / value * 100, 1) if value else None
        rows = qs.values("country_id", "country__name_uz", "country__ctrana").annotate(total=Sum("value"))
        by_country[(year, month, flow)] = {r["country_id"]: {**r, "value": r["total"]} for r in rows}
    entry["balance"] = entry["export_value"] - entry["import_value"]
    return entry


def build_market_report(hs):
    periods = latest_periods()
    base = TradeData.objects.filter(product__code__startswith=hs)
    by_country = {}  # (yil, davr, oqim) -> {country_id: row}
    years = [_period_stats(base, year, month, by_country) for year, month in periods.items()]
    years = [y for y in years if y["export_value"] or y["import_value"]]
    if not years:
        return None
    last = years[-1]
    # O'tgan yilning xuddi shu davri (masalan 2025 yanvar–sentabr ↔ 2024 yanvar–sentabr), bo'lsa
    prev = None
    prev_year = last["year"] - 1
    if prev_year in periods and _month_num(periods[prev_year]) >= _month_num(last["period"]):
        prev = _period_stats(base, prev_year, last["period"], by_country)
        if not (prev["export_value"] or prev["import_value"]):
            prev = None
    last_key = (last["year"], last["period"])

    def top(flow, limit):
        current = by_country[(*last_key, flow)]
        rows = [r for r in current.values() if r["country__ctrana"] != OTHER_COUNTRIES_CODE]
        total = sum(_f(r["value"]) for r in current.values())
        rows.sort(key=lambda r: _f(r["value"]), reverse=True)
        prev_rows = by_country.get((prev["year"], prev["period"], flow), {}) if prev else {}
        out = []
        for r in rows[:limit]:
            p = _f(prev_rows.get(r["country_id"], {}).get("value"))
            out.append({"country_id": r["country_id"], "country": r["country__name_uz"], "value": _f(r["value"]),
                        "share": round(_f(r["value"]) / total * 100, 1) if total else 0,
                        "change_pct": round((_f(r["value"]) - p) / p * 100, 1) if p else None})
        return out

    export_rows = [r for r in by_country[(*last_key, "export")].values() if r["country__ctrana"] != OTHER_COUNTRIES_CODE]
    hhi = _hhi([_f(r["value"]) for r in export_rows])

    # O'sayotgan / qisqarayotgan bozorlar: eksport qiymati sezilarli (jami 1% dan ortiq) bo'lgan davlatlar
    growth = []
    if prev:
        total_last = last["export_value"] or 1
        prev_rows = by_country[(prev["year"], prev["period"], "export")]
        for r in export_rows:
            p = _f(prev_rows.get(r["country_id"], {}).get("value"))
            v = _f(r["value"])
            if p and v / total_last >= 0.01:
                growth.append({"country": r["country__name_uz"], "value": v, "prev_value": p,
                               "change_pct": round((v - p) / p * 100, 1)})
        growth.sort(key=lambda g: g["change_pct"], reverse=True)

    def change(key):
        return round((last[key] - prev[key]) / prev[key] * 100, 1) if prev and prev[key] else None

    product = Product.objects.filter(code=hs).first()
    return {
        "hs": hs,
        "product": {"code": hs, "name_uz": product.name_uz if product else None, "name_ru": product.name_ru if product else None},
        "value_unit": "ming AQSh $",
        "latest": {**last, "export_change_pct": change("export_value"), "import_change_pct": change("import_value"),
                   "compared_with": prev["year"] if prev else None,
                   "export_partners": len(export_rows)},
        "dynamics": years,
        "top_export": {"short": top("export", SHORT_TOP), "full": top("export", FULL_TOP)},
        "top_import": {"short": top("import", SHORT_TOP), "full": top("import", FULL_TOP)},
        "concentration": {"hhi": hhi, "label": _hhi_label(hhi)},
        "growing_markets": growth[:5],
        "shrinking_markets": [g for g in reversed(growth) if g["change_pct"] < 0][:5],
        "notes": [
            "Joriy yil ma'lumoti qisman davr uchun bo'lishi mumkin (davr yorlig'iga qarang).",
            "O'rtacha narx faqat tonnada o'lchangan yozuvlardan hisoblanadi; boshqa birlikdagilar (dona, litr...) chiqarib tashlangan.",
            "\"Boshqa davlatlar\" agregati reytingga kiritilmaydi.",
        ],
    }


class MarketReportAPIView(APIView):
    """GET /api/additional-services/market-report/?hs=5201[&full=1]"""
    permission_classes = [AllowAny]

    def get(self, request):
        hs = "".join(ch for ch in (request.query_params.get("hs") or "") if ch.isdigit())[:6]
        if len(hs) < 2:
            return Response({"detail": "HS kodi kamida 2 raqam bo'lishi kerak."}, status=400)
        full = request.query_params.get("full") in ("1", "true")
        usage = None
        if full:
            if not request.user.is_authenticated:
                raise NotAuthenticated("To'liq hisobot uchun tizimga kiring.")
            usage = consume(request.user, MARKET_REPORT_SLUG, {"hs": hs}, once_per_day=True)

        key = f"market_report:v2:{hs}"
        data = cache.get(key)
        if data is None:
            data = build_market_report(hs)
            cache.set(key, data or {}, CACHE_SECONDS)
        if not data:
            return Response({"detail": "Bu HS kodi bo'yicha savdo ma'lumoti topilmadi."}, status=404)

        result = dict(data)
        for block in ("top_export", "top_import"):
            result[block] = data[block]["full" if full else "short"]
        if not full:
            result.pop("growing_markets")
            result.pop("shrinking_markets")
            result["concentration"] = None
        result["full"] = full
        result["usage"] = usage
        return Response(result)


class HsSearchAPIView(APIView):
    """GET /api/additional-services/hs-search/?q=paxta — kod yoki nom (uz/ru/kirill) bo'yicha 20 ta taklif."""
    permission_classes = [AllowAny]

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 2:
            return Response([])
        if q.isdigit():
            qs = Product.objects.filter(code__startswith=q)
        else:
            qs = Product.objects.filter(ci_contains(("name_uz", "name_ru", "name_cry"), q))
        rows = qs.order_by("level", "code").values("code", "name_uz", "level")[:20]
        return Response([{"code": r["code"], "name": r["name_uz"], "level": r["level"]} for r in rows])


