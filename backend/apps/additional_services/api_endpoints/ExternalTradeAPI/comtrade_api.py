"""`/api/additional-services/external-trade/comtrade/overview/` — UN Comtrade+ (O'zbekiston) va bojxona ma'lumotini yonma-yon ko'rsatadi."""
from django.db.models import Sum
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.additional_services.models.comtrade import UZ_CODE, ComtradeFlow, ComtradeSyncLog
from apps.additional_services.models.ex_trade import Product, TradeData

from .flows import latest_periods

FLOW_NAME = {"X": "export", "M": "import"}
TOP = 10


def _f(v):
    return float(v) if v is not None else None


class ComtradeOverviewAPIView(APIView):
    """GET ?year=2024&hs=1701 — yil bo'yicha jami eksport/import, eng katta hamkorlar va bojxona ma'lumoti bilan farq.
    `hs` berilmasa jami `TOTAL` yozuvdan olinadi (yuklangan bo'lsa). Qiymatlar AQSh dollarida (bojxona: ming $ -> $ ga o'giriladi)."""
    permission_classes = [AllowAny]

    def get(self, request):
        base = ComtradeFlow.objects.filter(reporter_code=UZ_CODE, period_type="A")
        years = sorted(base.values_list("year", flat=True).distinct(), reverse=True)
        sync = ComtradeSyncLog.objects.first()
        last = {"status": sync.status, "finished_at": sync.finished_at, "rows": sync.rows, "error": sync.error[:300]} if sync else None
        codes = sorted(base.exclude(cmd_code="TOTAL").values_list("cmd_code", flat=True).distinct())[:50]
        names = dict(Product.objects.filter(code__in=codes).values_list("code", "name_uz"))
        options = [{"code": c, "name": (names.get(c) or "")[:80]} for c in codes]
        if not years:
            return Response({"years": [], "year": None, "hs": "", "hs_options": [], "totals": {}, "partners": [], "compare": None, "last_sync": last})
        try:
            year = int(request.query_params.get("year") or years[0])
        except ValueError:
            year = years[0]
        hs = "".join(ch for ch in request.query_params.get("hs", "") if ch.isdigit())[:6]
        if not hs and options and not base.filter(cmd_code="TOTAL").exists():
            hs = options[0]["code"]  # jami (TOTAL) yuklanmagan: yuklangan birinchi mahsulot ko'rsatiladi
        qs = base.filter(year=year)
        qs = qs.filter(cmd_code__startswith=hs) if hs else qs.filter(cmd_code="TOTAL")
        partners = qs.exclude(partner_code=0)
        # HS4 va HS6 qatorlari ustma-ust tushmasligi uchun faqat eng qisqa kod uzunligi olinadi
        lengths = sorted({len(c) for c in qs.values_list("cmd_code", flat=True).distinct()})
        if lengths:
            qs = qs.filter(cmd_code__regex=rf"^.{{{lengths[0]}}}$")
            partners = partners.filter(cmd_code__regex=rf"^.{{{lengths[0]}}}$")
        totals = {FLOW_NAME[r["flow"]]: _f(r["v"]) for r in partners.values("flow").annotate(v=Sum("value_usd"))}
        by = {}
        for r in partners.values("flow", "partner_code", "partner__name_uz").annotate(v=Sum("value_usd")):
            row = by.setdefault(r["partner_code"], {"code": r["partner_code"], "country": r["partner__name_uz"] or f"Kod {r['partner_code']}", "export": 0.0, "import": 0.0})
            row[FLOW_NAME[r["flow"]]] = _f(r["v"]) or 0.0
        top = sorted(by.values(), key=lambda p: -(p["export"] + p["import"]))[:TOP]
        return Response({"years": years, "year": year, "hs": hs, "hs_options": options, "totals": totals, "partners": top,
                         "compare": self._compare(year, hs, totals) if hs else None, "last_sync": last})

    @staticmethod
    def _compare(year, hs, totals):
        month = latest_periods().get(year)
        if not month:
            return None
        out = {"customs_period": month, "rows": {}}
        for name, code in (("export", 1), ("import", 2)):
            v = TradeData.objects.filter(year_id=year, month=month, product__code__startswith=hs, trade_type=code).aggregate(v=Sum("value"))["v"]
            customs = _f(v) * 1000 if v is not None else None
            ct = totals.get(name)
            out["rows"][name] = {"customs_usd": customs, "comtrade_usd": ct,
                                 "diff_pct": round((ct - customs) / customs * 100, 1) if customs and ct is not None else None}
        out["note"] = "Bojxona ma'lumoti yil oxirigacha to'liq bo'lmasa (kumulyativ oy) farq tabiiy; Comtrade yillik."
        return out
