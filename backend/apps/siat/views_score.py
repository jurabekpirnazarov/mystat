"""SCORING_MODEL.md KR-19, KR-26: salohiyat indeksi va prognoz API'si (`/api/common/map/` ostida).

GET score/config/                                   — ustunlar, ko'rsatkichlar, presetlar, qoidalar, parametrlar
GET score/?level=region|district&parent=1708&period=2025&preset=balanced | &weights=25,25,15,25,10 [&export=csv|xlsx]
GET score/<soato>/?period=2025&preset=balanced
GET forecast/?indicator=500&level=district&parent=1708&period=2027&scenario=base
GET forecast/<soato>/?indicator=500
GET forecast/<soato>/what-if/?feature=unemployment&delta=-1   — "maqsadli ssenariy" (10.5, P2; bog'liqlik, sabab emas)

GET forecast/quality/                               — usullar va o'tgan yillardagi aniqlik (metodologiya sahifasi)

Prognoz javoblarida ichki usul kodlari (M0..M4) va MASE yo'q: usul oddiy tildagi nom bilan, aniqlik — foizda.
"""
from django.http import Http404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema, inline_serializer
from rest_framework import serializers
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .forecast import service as fc
from .forecast import spec as fc_spec
from .models import SiatValue, Territory
from .scoring import config as score_config
from .scoring import service as score
from .scoring.texts import t, tr

LANGS = ("uz", "ru", "en", "uzc")
SOURCE = {"name": "SIAT, O'zbekiston Respublikasi Milliy statistika qo'mitasi", "license": "CC BY 4.0",
          "url": "https://siat.stat.uz/"}
DISCLAIMER = {
    "uz": "Taxminiy tahlil, rasmiy baho emas. Ochiq statistikaga asoslangan.",
    "ru": "Оценочный анализ, не официальная оценка. Основан на открытой статистике.",
    "en": "An estimate based on open statistics, not an official assessment.",
}
FORECAST_NOTE = {
    "uz": "Prognoz rasmiy emas, SIAT ma'lumotiga asoslangan statistik model. Ma'lumot qatorlari qisqa, natijani ehtiyotkorlik bilan talqin qiling.",
    "ru": "Прогноз неофициальный: статистическая модель на данных SIAT. Ряды короткие, интерпретируйте с осторожностью.",
    "en": "Unofficial forecast from a statistical model on SIAT data. Series are short; interpret with caution.",
}
SCORE_KEYS = ("score", "score-A", "score-B", "score-C", "score-D", "score-E")


class BadRequest(Exception):
    pass


# --- OpenAPI (KR-19) -------------------------------------------------------------------------------------------
_F = serializers
P_LEVEL = OpenApiParameter("level", str, enum=["region", "district"], description="Daraja (standart: region)")
P_PARENT = OpenApiParameter("parent", str, description="Viloyat SOATO kodi (4 xona) — tumanlar uchun")
P_PERIOD = OpenApiParameter("period", str, description="Yil; bo'lmasa — eng so'nggi to'liq yil. Prognoz yili ham bo'lishi mumkin")
P_PRESET = OpenApiParameter("preset", str, enum=["balanced", "investor", "social"], description="Vazn preseti (yoki `sp`)")
P_WEIGHTS = OpenApiParameter("weights", str, description="5 ta manfiy bo'lmagan vazn, vergul bilan: `25,25,15,25,10` (yoki `sw`)")
P_LANG = OpenApiParameter("lang", str, enum=list(LANGS))
P_EXPORT = OpenApiParameter("export", str, enum=["csv", "xlsx"], description="Reyting jadvali fayli")
P_INDICATOR = OpenApiParameter("indicator", str, required=True, description="Karta ko'rsatkichi kaliti (masalan `500`)")
P_SCENARIO = OpenApiParameter("scenario", str, enum=["base", "optimistic", "pessimistic"])

_SCORE_ITEM = {
    "soato": _F.CharField(), "name": _F.CharField(), "kind": _F.CharField(),
    "score": _F.FloatField(allow_null=True, help_text="0–100; to'liqlik yetarli bo'lmasa null (0 emas)"),
    "rank": _F.IntegerField(allow_null=True), "rank_range": _F.ListField(child=_F.IntegerField(), allow_null=True),
    "rank_in_parent": _F.IntegerField(allow_null=True), "pillars": _F.DictField(child=_F.FloatField(allow_null=True)),
    "coverage": _F.FloatField(allow_null=True), "partial": _F.BooleanField(), "missing": _F.BooleanField(),
    "status": _F.CharField(),
    "outlook": inline_serializer("ScoreOutlook", {
        "score_change": _F.FloatField(allow_null=True), "rank_change": _F.IntegerField(allow_null=True),
        "from_rank": _F.IntegerField(allow_null=True), "to_rank": _F.IntegerField(allow_null=True),
        "to_score": _F.FloatField(allow_null=True)}, required=False),
}
ScoreList = inline_serializer("ScoreList", {
    "level": _F.CharField(), "parent": _F.CharField(allow_null=True), "period": _F.CharField(),
    "periods": _F.ListField(child=_F.CharField()), "forecast_periods": _F.ListField(child=_F.CharField()),
    "forecast": _F.BooleanField(), "preset": _F.CharField(allow_null=True), "weights": _F.DictField(child=_F.FloatField()),
    "of": _F.IntegerField(), "index_name": _F.CharField(), "items": inline_serializer("ScoreItem", _SCORE_ITEM, many=True),
    "outlook": _F.JSONField(allow_null=True, help_text="{from, to, up[], down[]} — eng ko'p ko'tarilishi/tushishi kutilganlar"),
    "methodology_version": _F.CharField(), "disclaimer": _F.CharField(), "forecast_note": _F.CharField(allow_null=True),
})
ScoreDetail = inline_serializer("ScoreDetail", {
    "soato": _F.CharField(), "level": _F.CharField(), "name": _F.CharField(), "score": _F.FloatField(allow_null=True),
    "rank": _F.IntegerField(allow_null=True), "rank_range": _F.ListField(child=_F.IntegerField(), allow_null=True),
    "coverage": _F.FloatField(allow_null=True), "partial": _F.BooleanField(),
    "pillars": _F.JSONField(), "strengths": _F.JSONField(), "weaknesses": _F.JSONField(), "sectors": _F.JSONField(),
    "recommendations": _F.JSONField(), "peers": _F.JSONField(), "parent_context": _F.JSONField(allow_null=True),
    "gaps": _F.JSONField(), "future": _F.JSONField(allow_null=True), "methodology_version": _F.CharField(),
})
ForecastList = inline_serializer("ForecastList", {
    "indicator": _F.CharField(), "period": _F.CharField(), "periods": _F.ListField(child=_F.CharField()),
    "scenario": _F.CharField(required=False), "note": _F.CharField(), "detail": _F.CharField(required=False),
    "items": inline_serializer("ForecastItem", {
        "soato": _F.CharField(), "name": _F.CharField(), "value": _F.FloatField(allow_null=True),
        "lo80": _F.FloatField(allow_null=True), "hi80": _F.FloatField(allow_null=True),
        "growth_pct": _F.FloatField(allow_null=True), "direction_uncertain": _F.BooleanField()}, many=True),
})
ForecastDetail = inline_serializer("ForecastDetail", {
    "indicator": _F.CharField(), "soato": _F.CharField(), "history": _F.JSONField(), "forecast": _F.JSONField(),
    "scenarios": _F.JSONField(), "drivers": _F.JSONField(), "note": _F.CharField(),
    "model": _F.JSONField(allow_null=True, help_text="{method, error_pct, direction_pct, coverage_pct} — oddiy tilda"),
})


def _lang(request):
    lang = request.query_params.get("lang", "uz")
    return lang if lang in LANGS else "uz"


def _cached(key, build):
    from .views import _cached as base_cached

    return base_cached(key, build)


def resolve_weights(cfg, level, params):
    """preset yoki weights (sp/sw ham) -> (preset nomi|None, {ustun: vazn}). Xato bo'lsa BadRequest."""
    raw = params.get("weights") or params.get("sw")
    preset = params.get("preset") or params.get("sp") or "balanced"
    if raw:
        try:
            values = score_config.parse_weights(raw)
        except ValueError as exc:
            raise BadRequest(str(exc)) from exc
        return None, score_config.weights_for(cfg, level, custom=values)
    if preset not in cfg["presets"]:
        raise BadRequest(f"preset noma'lum: {preset}")
    return preset, score_config.weights_for(cfg, level, preset)


def resolve_period(cfg, level, value):
    actual, future = score.periods(cfg, level)
    if not actual:
        raise Http404("Indeks uchun ma'lumot yetarli emas")
    if not value:
        return score.default_year(cfg, level=level), actual, future
    try:
        year = int(str(value)[:4])
    except ValueError as exc:
        raise BadRequest("period: yil") from exc
    if year not in actual and year not in future:
        raise Http404("Bu yil uchun indeks yo'q")
    return year, actual, future


def _result(cfg, level, year, weights, future):
    panel = score.forecast_panel(cfg) if year in future else score.get_panel(cfg)
    return score.cached(cfg, level, year, weights, panel), panel


def future_target(future):
    """"Kelajak" solishtiruvi uchun prognoz yili: odatda 2028 (3 yillik ufq ichidagi ikkinchi yil)."""
    return future[-1] if len(future) < 2 else future[1]


def attach_outlook(cfg, level, year, weights, actual, future, items, movers=3):
    """10.6 va 10.8.6: har qatorga o'rin va indeks o'zgarishi (haqiqiy yil → prognoz yili yoki aksincha) va eng ko'p
    ko'tarilishi/tushishi kutilgan hududlar. -> {"from", "to", "up": [...], "down": [...]} | None."""
    if not future or not actual:
        return None
    if year in future:
        start, end = actual[-1], year
    else:
        start, end = year, future_target(future)
    a, _ = _result(cfg, level, start, weights, future)
    b, _ = _result(cfg, level, end, weights, future)
    rows = []
    for item in items:
        x, y = a["items"].get(item["soato"]) or {}, b["items"].get(item["soato"]) or {}
        change = rank_change = None
        if x.get("score") is not None and y.get("score") is not None:
            change = round(y["score"] - x["score"], 1)
            if x.get("rank") and y.get("rank"):
                rank_change = x["rank"] - y["rank"]     # musbat — yuqoriga ko'tariladi
        item["outlook"] = {"score_change": change, "rank_change": rank_change, "from_rank": x.get("rank"),
                           "to_rank": y.get("rank"), "to_score": y.get("score")}
        if rank_change is not None:
            rows.append((rank_change, change, item))
    ranked = sorted(rows, key=lambda r: (-r[0], -(r[1] or 0)))
    pick = lambda rs: [{"soato": i["soato"], "name": i["name"], "rank_change": rc, "score_change": ch,
                        "from_rank": i["outlook"]["from_rank"], "to_rank": i["outlook"]["to_rank"]}
                       for rc, ch, i in rs[:movers]]
    return {"from": str(start), "to": str(end),
            "up": pick([r for r in ranked if r[0] > 0]),
            "down": pick([r for r in reversed(ranked) if r[0] < 0])}


def _apply_stored_ranges(result_items, level, year, preset, future):
    """Prognoz yili: Monte Carlo o'rin oralig'i (compute_scores oldindan hisoblagan) bo'lsa — shuni beramiz."""
    if year not in future or not preset:
        return result_items
    from .scoring.store import stored_rank_range

    stored = stored_rank_range(level, year, preset)
    if not stored:
        return result_items
    for item in result_items:
        if item["soato"] in stored and item.get("score") is not None:
            item["rank_range"] = list(stored[item["soato"]])
    return result_items


class ScoreConfigView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(tags=["SIAT xarita: salohiyat"], parameters=[P_LANG], responses=OpenApiTypes.OBJECT,
                   summary="Scoring konfiguratsiyasi: ustunlar, ko'rsatkichlar, presetlar, qoidalar")
    def get(self, request):
        lang = _lang(request)
        cfg = score_config.load()
        return Response(_cached(f"score:config:{lang}", lambda: {**score.config_payload(cfg, lang),
                                                                  "disclaimer": tr(DISCLAIMER, lang),
                                                                  "source": SOURCE}))


class ScoreListView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(tags=["SIAT xarita: salohiyat"],
                   parameters=[P_LEVEL, P_PARENT, P_PERIOD, P_PRESET, P_WEIGHTS, P_LANG, P_EXPORT],
                   responses={200: ScoreList, 400: OpenApiTypes.OBJECT},
                   summary="Hududlar salohiyati indeksi va reyting")
    def get(self, request):
        params = request.query_params
        cfg = score_config.load()
        level = params.get("level") or "region"
        if level not in ("region", "district"):
            return Response({"detail": "level: region yoki district"}, status=400)
        parent = params.get("parent") or ""
        if parent and not (parent.isdigit() and len(parent) == 4):
            return Response({"detail": "parent: 4 xonali SOATO kodi"}, status=400)
        try:
            preset, weights = resolve_weights(cfg, level, params)
            year, actual, future = resolve_period(cfg, level, params.get("period"))
        except BadRequest as exc:
            return Response({"detail": str(exc)}, status=400)
        lang = _lang(request)
        key = f"score:list:{level}:{parent}:{year}:{preset}:{sorted(weights.items())}:{lang}"
        data = _cached(key, lambda: self.build(cfg, level, parent, year, preset, weights, actual, future, lang))
        export = params.get("export")
        if export in ("csv", "xlsx"):
            return export_scores(cfg, data, export, lang)
        return Response(data)

    @staticmethod
    def build(cfg, level, parent, year, preset, weights, actual, future, lang):
        result, panel = _result(cfg, level, year, weights, future)
        items = _apply_stored_ranges(score.render_list(result, panel, lang, parent or None), level, year, preset, future)
        outlook = attach_outlook(cfg, level, year, weights, actual, future, items)
        return {
            "level": level, "parent": parent or None, "period": str(year), "periods": [str(y) for y in actual],
            "forecast_periods": [str(y) for y in future], "forecast": year in future,
            "preset": preset, "weights": weights, "of": result["of"],
            "index_name": t("index_region" if level == "region" else "index_district", lang),
            "pillars": [{"key": p, "name": tr(cfg["pillars"][p]["name"], lang)} for p in score_config.PILLARS
                        if weights.get(p, 0) > 0],
            "national": {"pillars": {p: 50 for p in score_config.PILLARS if weights.get(p, 0) > 0}},
            "items": items, "outlook": outlook, "methodology_version": cfg["version"], "source": SOURCE,
            "disclaimer": DISCLAIMER.get(lang if lang != "uzc" else "uz"),
            "forecast_note": FORECAST_NOTE.get(lang if lang != "uzc" else "uz") if year in future else None,
        }


class ScoreDetailView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(tags=["SIAT xarita: salohiyat"], parameters=[P_PERIOD, P_PRESET, P_WEIGHTS, P_LANG],
                   responses={200: ScoreDetail, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
                   summary="Hudud kartochkasi: ustunlar, kuchli/zaif tomonlar, tavsiyalar, o'xshashlar")
    def get(self, request, soato):
        territory = Territory.objects.filter(soato=soato).exclude(level="country").first()
        if territory is None:
            raise Http404("Hudud topilmadi")
        cfg = score_config.load()
        level = territory.level
        try:
            preset, weights = resolve_weights(cfg, level, request.query_params)
            year, actual, future = resolve_period(cfg, level, request.query_params.get("period"))
        except BadRequest as exc:
            return Response({"detail": str(exc)}, status=400)
        lang = _lang(request)
        key = f"score:detail:{soato}:{year}:{preset}:{sorted(weights.items())}:{lang}"
        return Response(_cached(key, lambda: self.build(cfg, soato, level, year, preset, weights, actual, future, lang)))

    @staticmethod
    def build(cfg, soato, level, year, preset, weights, actual, future, lang):
        result, panel = _result(cfg, level, year, weights, future)
        if soato not in result["items"]:
            raise Http404("Hudud indeks guruhida yo'q")
        region_result = None
        if level == "district":
            region_result, _ = _result(cfg, "region", year, score_config.weights_for(cfg, "region", preset or "balanced"),
                                       score.periods(cfg, "region")[1])
        detail = score.render_detail(cfg, result, panel, soato, lang, region_result)
        if year in future and preset:
            from .scoring.store import stored_rank_range

            stored = stored_rank_range(level, year, preset, [soato])
            if soato in stored and detail.get("score") is not None:
                detail["rank_range"] = list(stored[soato])
        detail.update({"periods": [str(y) for y in actual], "forecast_periods": [str(y) for y in future],
                       "preset": preset, "disclaimer": DISCLAIMER.get(lang if lang != "uzc" else "uz"),
                       "forecast_note": FORECAST_NOTE.get(lang if lang != "uzc" else "uz") if year in future else None,
                       "source": SOURCE})
        detail["future"] = _future_block(cfg, soato, level, year, weights, preset, actual, future, lang) \
            if future and year not in future else None
        return detail


def _future_block(cfg, soato, level, year, weights, preset, actual, future, lang):
    """10.8.4 "Kelajak": prognoz yilidagi indeks va o'rin o'zgarishi, shu yil uchun tavsiyalar."""
    target = future_target(future)
    result, panel = _result(cfg, level, target, weights, future)
    item = result["items"].get(soato)
    if not item or item.get("score") is None:
        return None
    from .scoring.store import stored_rank_range

    rank_range = item.get("rank_range")
    if preset:
        rank_range = list(stored_rank_range(level, target, preset, [soato]).get(soato) or rank_range or [])
    now_result, _ = _result(cfg, level, year, weights, future)
    now = now_result["items"].get(soato) or {}
    recs = [score.render_recommendation(cfg, r, item, result["national"], lang, result["of"])
            for r in item.get("recommendations", [])]
    return {"period": str(target), "score": item["score"], "rank": item.get("rank"), "of": result["of"],
            "rank_range": rank_range, "from_period": str(year), "from_rank": now.get("rank"),
            "from_score": now.get("score"), "pillars": item.get("pillars"), "recommendations": recs,
            "note": FORECAST_NOTE.get(lang if lang != "uzc" else "uz")}


def export_scores(cfg, data, kind, lang):
    """KR-21: reyting jadvali eksporti — metodologiya versiyasi va manba qatori bilan."""
    import csv
    import io

    from django.http import HttpResponse

    pillars = data["pillars"]
    title = f"{data['index_name']}, {data['period']}" + (" (prognoz)" if data["forecast"] else "")
    weights = ", ".join(f"{p['key']}={data['weights'][p['key']]:g}" for p in pillars)
    meta = [title, f"Vaznlar: {data['preset'] or 'maxsus'} ({weights}) · Metodologiya v{data['methodology_version']}",
            f"Manba: {SOURCE['name']}, {SOURCE['license']}. {data['disclaimer']}"]
    outlook = data.get("outlook")
    if data["forecast"]:
        meta.insert(2, f"Prognoz versiyasi: {fc.current_version() or '—'}. {data.get('forecast_note') or ''}".strip())
    header = (["SOATO", "Hudud", "Indeks", "O'rin", "O'rin oralig'i"] + [p["name"] for p in pillars]
              + ["To'liqlik", "Holat", "is_forecast"])
    if outlook:
        header += [f"Indeks o'zgarishi ({outlook['from']}→{outlook['to']})", f"O'rin o'zgarishi ({outlook['from']}→{outlook['to']})"]
    rows = []
    for i in data["items"]:
        rr = i.get("rank_range")
        row = ([i["soato"], i["name"], i["score"], i["rank"], f"{rr[0]}–{rr[1]}" if rr else ""]
               + [i["pillars"].get(p["key"]) for p in pillars] + [i["coverage"], i["status"], int(bool(data["forecast"]))])
        if outlook:
            o = i.get("outlook") or {}
            row += [o.get("score_change"), o.get("rank_change")]
        rows.append(row)
    filename = f"salohiyat-{data['level']}-{data['period']}.{kind}"
    if kind == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        for line in meta:
            writer.writerow([line])
        writer.writerow(header)
        writer.writerows(rows)
        response = HttpResponse("﻿" + buf.getvalue(), content_type="text/csv; charset=utf-8")
    else:
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        ws.title = data["period"][:31]
        for line in meta:
            ws.append([line])
        ws.append(header)
        for row in rows:
            ws.append(row)
        ws.column_dimensions["B"].width = 34
        buf = io.BytesIO()
        wb.save(buf)
        response = HttpResponse(buf.getvalue(),
                                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


# --- Prognoz ----------------------------------------------------------------------------------------------------

def _forecast_indicator(key):
    """Karta kaliti yoki prognoz kaliti -> (karta kaliti, prognoz kaliti)."""
    if key in fc.MAP_KEYS:
        return key, fc.MAP_KEYS[key]
    if key in fc_spec.INDICATORS:
        return key, key
    return None, None


class ForecastListView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(tags=["SIAT xarita: prognoz"], parameters=[P_INDICATOR, P_LEVEL, P_PARENT, P_PERIOD, P_SCENARIO, P_LANG],
                   responses={200: ForecastList, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
                   summary="Ko'rsatkich prognozi (80% oraliq bilan). Tarixiy yil — bo'sh `items` va izoh")
    def get(self, request):
        params = request.query_params
        map_key, ind = _forecast_indicator(params.get("indicator", ""))
        if not ind:
            raise Http404("Bu ko'rsatkich uchun prognoz yo'q")
        level = params.get("level") or "region"
        if level not in ("region", "district"):
            return Response({"detail": "level: region yoki district"}, status=400)
        scenario = SCENARIOS.get(params.get("scenario") or params.get("sc") or "base")
        if scenario is None:
            return Response({"detail": "scenario: base|optimistic|pessimistic"}, status=400)
        parent = params.get("parent") or ""
        period = params.get("period") or ""
        lang = _lang(request)
        key = f"forecast:list:{map_key}:{level}:{parent}:{period}:{scenario}:{lang}"
        return Response(_cached(key, lambda: self.build(map_key, ind, level, parent, period, scenario, lang)))

    @staticmethod
    def build(map_key, ind, level, parent, period, scenario, lang):
        version = fc.current_version()
        periods = fc.forecast_periods(version).get(map_key, []) if version else []
        note = FORECAST_NOTE.get(lang if lang != "uzc" else "uz")
        if not period:
            period = periods[0] if periods else ""
        territories = Territory.objects.filter(level=level)
        if parent:
            territories = territories.filter(parent_id=parent)
        territories = {t.soato: t for t in territories}
        if period not in periods:
            return {"indicator": map_key, "period": period, "periods": periods, "items": [],
                    "detail": "Bu davr prognoz yili emas (tarixiy yoki prognoz yo'q)", "note": note}
        values = forecast_map_values(map_key, list(territories), period, scenario)
        last = _last_actual(map_key, list(territories))
        kind = fc_spec.INDICATORS[ind]["kind"] if map_key not in ("d-pop-growth", "d-rural-share") else "rate"
        items = []
        for code, t_obj in territories.items():
            v = values.get(code)
            base_year, base_value = last.get(code, (None, None))
            years = int(period) - base_year if base_year else 0
            items.append({"soato": code, "name": t_obj.name(lang), "value": v["value"] if v else None,
                          "lo80": v["lo80"] if v else None, "hi80": v["hi80"] if v else None,
                          "growth_pct": fc.growth(v["value"], base_value, years, kind) if v else None,
                          "direction_uncertain": bool(v and v["lo80"] is not None and base_value is not None
                                                      and v["lo80"] < base_value < v["hi80"])})
        return {"indicator": map_key, "period": period, "periods": periods, "scenario": scenario, "items": items,
                "note": note}


class ForecastQualityView(APIView):
    """10.4 va KR-28: har ko'rsatkich × daraja × horizont uchun tanlangan usul, o'rtacha xato, yo'nalish, 80% qamrov va
    prognoz/haqiqat monitoringi."""

    permission_classes = (AllowAny,)

    @extend_schema(tags=["SIAT xarita: prognoz"], parameters=[P_LANG], responses={200: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
                   summary="Prognoz usullari va o'tgan yillardagi aniqligi")
    def get(self, request):
        from .forecast.quality import quality_payload

        lang = _lang(request)
        data = _cached(f"forecast:quality:{lang}", lambda: quality_payload(lang))
        if data is None:
            raise Http404("Prognoz hali o'qitilmagan")
        return Response(data)


class ForecastDetailView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(tags=["SIAT xarita: prognoz"], parameters=[P_INDICATOR, P_LANG],
                   responses={200: ForecastDetail, 404: OpenApiTypes.OBJECT},
                   summary="Hudud prognozi: tarix, prognoz, ssenariylar, asosiy omillar")
    def get(self, request, soato):
        map_key, ind = _forecast_indicator(request.query_params.get("indicator", ""))
        if not ind:
            raise Http404("Bu ko'rsatkich uchun prognoz yo'q")
        lang = _lang(request)
        key = f"forecast:detail:{soato}:{map_key}:{lang}"

        def build():
            source_key, breakdown = fc_spec.INDICATORS[ind]["source"]
            history = list(SiatValue.objects.filter(indicator__key=source_key, breakdown=breakdown if breakdown != "*" else "",
                                                    territory_code=soato, value__isnull=False)
                           .order_by("period").values("period", "value"))
            history = [h for h in history if len(h["period"]) == 4]
            if not history:
                raise Http404("Tarixiy ma'lumot yo'q")
            block = fc.territory_forecast(map_key, soato, history[-1]["period"], history[-1]["value"], lang)
            if not block:
                raise Http404("Prognoz yo'q")
            return {"indicator": map_key, "soato": soato, "history": history, **block,
                    "note": FORECAST_NOTE.get(lang if lang != "uzc" else "uz")}
        return Response(_cached(key, build))


WHAT_IF_NOTE = {
    "uz": "Bu bog'liqlik, sabab-oqibat emas: o'tgan yillarda ishsizligi shunday o'zgargan tumanlarda boshqa ko'rsatkichlar "
          "qanday bo'lganiga asoslangan statistik baho.",
    "ru": "Это связь, а не причинно-следственный эффект: оценка по районам, где безработица менялась похожим образом.",
    "en": "This is an association, not a causal effect: based on districts where unemployment changed similarly.",
}
WHAT_IF_LABEL = {"unemployment": {"uz": "Ishsizlik darajasi", "ru": "Уровень безработицы", "en": "Unemployment rate"}}


class WhatIfView(APIView):
    """10.5 "Maqsadli ssenariy": omil `delta` ga o'zgarsa, tuman ko'rsatkichlari prognozi (oldindan hisoblangan)."""

    permission_classes = (AllowAny,)

    @extend_schema(tags=["SIAT xarita: prognoz"],
                   parameters=[OpenApiParameter("feature", str, enum=list(fc_spec.WHAT_IF)),
                               OpenApiParameter("delta", float, description="Masalan -1 (p.p.)"), P_LANG],
                   responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT},
                   summary="Maqsadli ssenariy: omil o'zgarsa, boshqa ko'rsatkichlar prognozi (bog'liqlik)")
    def get(self, request, soato):
        if not fc_spec.WHAT_IF_ENABLED:
            raise Http404("Maqsadli ssenariy o'chirilgan")
        params = request.query_params
        feature = params.get("feature") or "unemployment"
        spec_ = fc_spec.WHAT_IF.get(feature)
        if not spec_:
            return Response({"detail": f"feature: {', '.join(fc_spec.WHAT_IF)}"}, status=400)
        deltas = [str(d) for d in spec_["deltas"]]
        delta = params.get("delta") or deltas[0]
        try:
            delta = str(int(float(delta)))
        except ValueError:
            return Response({"detail": "delta: son"}, status=400)
        if delta not in deltas:
            return Response({"detail": f"delta: {', '.join(deltas)}"}, status=400)
        lang = _lang(request)
        key = f"forecast:whatif:{soato}:{feature}:{delta}:{lang}"
        return Response(_cached(key, lambda: self.build(soato, feature, delta, deltas, spec_, lang)))

    @staticmethod
    def build(soato, feature, delta, deltas, spec_, lang):
        from .models import ForecastVersion, SiatIndicator

        record = ForecastVersion.objects.filter(is_current=True).only("what_if").first()
        data = (record.what_if if record else {}) or {}
        names = {i.key: i for i in SiatIndicator.objects.filter(key__in=spec_["targets"])}
        lng = lang if lang != "uzc" else "uz"
        indicators = []
        for ind in spec_["targets"]:
            by_h = ((data.get(ind) or {}).get(soato) or {}).get(feature) or {}
            rows = []
            for h in sorted(by_h, key=int):
                r = by_h[h]
                v = r["values"].get(delta)
                if v is None:
                    continue
                rows.append({"period": r["period"], "base": r["base"], "value": v,
                             "change_pct": round((v / r["base"] - 1) * 100, 2) if r["base"] else None})
            if rows:
                obj = names.get(ind)
                indicators.append({"indicator": ind, "name": obj.localized("name", lng) if obj else ind,
                                   "unit": obj.localized("unit", lng) if obj else "", "rows": rows})
        if not indicators:
            raise Http404("Bu hudud uchun maqsadli ssenariy yo'q")
        return {"soato": soato, "feature": feature, "feature_name": WHAT_IF_LABEL.get(feature, {}).get(lng, feature),
                "unit": spec_["unit"], "delta": float(delta), "deltas": [float(d) for d in deltas],
                "indicators": indicators, "note": WHAT_IF_NOTE.get(lng), "version": record.version if record else None}


def _last_actual(map_key, codes):
    """{kod: (yil, qiymat)} — karta ko'rsatkichining oxirgi haqiqiy qiymati."""
    out = {}
    rows = (SiatValue.objects.filter(indicator__key=map_key, breakdown="", territory_code__in=codes, value__isnull=False)
            .values_list("territory_code", "period", "value"))
    for code, period, value in rows:
        if len(period) == 4 and (code not in out or int(period) > out[code][0]):
            out[code] = (int(period), value)
    return out


SCENARIOS = {"base": "base", "opt": "optimistic", "pes": "pessimistic",
             "optimistic": "optimistic", "pessimistic": "pessimistic"}


def forecast_map_values(map_key, codes, period, scenario="base"):
    """Karta: {kod: {"value", "lo80", "hi80"}} (hosilalar ham)."""
    actual = {}
    if map_key in ("d-density", "d-pop-growth"):
        actual["areas"] = dict(Territory.objects.filter(soato__in=codes, area_km2__isnull=False).exclude(kind="city")
                               .values_list("soato", "area_km2"))
        actual["246"] = {(c, int(p)): v for c, p, v in SiatValue.objects.filter(
            indicator__key="246", territory_code__in=codes, period=str(int(period) - 1), value__isnull=False)
            .values_list("territory_code", "period", "value")}
    return fc.values_for(map_key, codes, period, actual, scenario)


def forecast_values_payload(indicator, level, parent, period, lang, view, base_payload, scenario="base"):
    """ValuesView uchun: prognoz yili (yoki o'sish rejimi) — oddiy MapValues shakli + `forecast`, `lo80/hi80`.
    `scenario` (10.8.1, URL `sc=`): base | optimistic | pessimistic."""
    territories = Territory.objects.filter(level=level)
    if parent:
        territories = territories.filter(parent_id=parent) if level == "district" else territories.filter(soato=parent)
    territories = list(territories)
    codes = [t_obj.soato for t_obj in territories]
    values = forecast_map_values(indicator.key, codes + ["1700"] + ([parent] if parent else []), period, scenario)
    last = _last_actual(indicator.key, codes + ["1700"] + ([parent] if parent else []))
    ind = fc.MAP_KEYS[indicator.key]
    kind = "rate" if indicator.key in ("d-pop-growth", "d-rural-share") else fc_spec.INDICATORS[ind]["kind"]

    def growth_of(code):
        v = values.get(code)
        base_year, base_value = last.get(code, (None, None))
        if not v or not base_year:
            return None
        return fc.growth(v["value"], base_value, int(period) - base_year, kind)

    items = []
    for t_obj in territories:
        v = values.get(t_obj.soato)
        base_year, base_value = last.get(t_obj.soato, (None, None))
        value = growth_of(t_obj.soato) if view == "growth" else (v["value"] if v else None)
        items.append({"code": t_obj.soato, "name": t_obj.name(lang), "kind": t_obj.kind, "value": value,
                      "missing": value is None, "preliminary": False, "forecast": True,
                      "lo80": v["lo80"] if v and view != "growth" else None,
                      "hi80": v["hi80"] if v and view != "growth" else None,
                      "direction_uncertain": bool(v and v["lo80"] is not None and base_value is not None
                                                  and v["lo80"] < base_value < v["hi80"])})
    current = [i["value"] for i in items if i["value"] is not None]
    from .views import _quantiles

    # Shkala uchala ssenariyda bir xil — ssenariy almashganda ranglar solishtiriladigan bo'lsin
    scale_values = list(current)
    for other in ("base", "optimistic", "pessimistic"):
        if other == scenario:
            continue
        other_values = forecast_map_values(indicator.key, codes, period, other)
        for t_obj in territories:
            v = other_values.get(t_obj.soato)
            base_year, base_value = last.get(t_obj.soato, (None, None))
            if not v:
                continue
            x = fc.growth(v["value"], base_value, int(period) - base_year, kind) if view == "growth" and base_year                 else (v["value"] if view != "growth" else None)
            if x is not None:
                scale_values.append(x)

    republic = growth_of("1700") if view == "growth" else (values.get("1700") or {}).get("value")
    parent_value = None
    if parent and level == "district":
        parent_value = growth_of(parent) if view == "growth" else (values.get(parent) or {}).get("value")
    unit = indicator.localized("unit", lang) if lang != "uzc" else indicator.unit_uz
    if view == "growth":
        unit = "p.p./yil" if kind == "rate" else "%/yil"
    center = None
    if view == "growth" and current:
        center = republic if republic is not None and min(current) < republic < max(current) else (
            0.0 if min(current) < 0 < max(current) else None)
    return {
        **base_payload, "period": period, "preliminary": False, "forecast": True, "view": view or "level",
        "unit": unit, "republic": republic, "items": items,
        "parent": {**base_payload["parent"], "value": parent_value} if base_payload.get("parent") else None,
        "scenario": scenario,
        "scale": {"min": min(scale_values) if scale_values else None, "max": max(scale_values) if scale_values else None,
                  "quantiles": _quantiles(scale_values), "current_quantiles": _quantiles(current),
                  "diverging_center": center if view == "growth" else indicator.diverging_center},
        "note": FORECAST_NOTE.get(lang if lang != "uzc" else "uz"),
    }


def score_catalog(lang):
    """Karta katalogi uchun "Salohiyat" guruhi: indeks va 5 ta ustun (psevdo-ko'rsatkich)."""
    cfg = score_config.load()
    try:
        actual_r, future_r = score.periods(cfg, "region")
        actual_d, future_d = score.periods(cfg, "district")
    except Exception:  # noqa: BLE001 — scoring ma'lumoti hali yo'q bo'lsa katalog buzilmasin
        return []
    if not actual_r:
        return []
    default = score.default_year(cfg, level="region")
    note = DISCLAIMER.get(lang if lang != "uzc" else "uz")
    items = []
    for key in SCORE_KEYS:
        pillar = key.split("-")[1] if "-" in key else None
        district = pillar in (None, "B", "C")
        if pillar:
            name = tr(cfg["pillars"][pillar]["name"], lang)
        else:
            name = t("index_region", lang)
        actual = sorted(set(actual_r) | (set(actual_d) if district else set()))
        future = sorted(set(future_r) | (set(future_d) if district else set()))
        items.append({
            "key": key, "siat_id": None, "kind": "score", "code": "", "name": name,
            "unit": "ball (0–100)", "theme": "potential", "geo_level": "district" if district else "region",
            "periodicity": "Y", "periods": [str(y) for y in actual], "forecast_periods": [str(y) for y in future],
            "last_period": str(default or actual[-1]), "preliminary_years": [], "higher_is_better": True,
            "diverging_center": 50.0, "source_updated_at": None, "last_synced_at": None, "siat_url": "",
            "derived_from": "Hisoblangan: SIAT ko'rsatkichlari asosida salohiyat indeksi (metodologiya v"
                            f"{cfg['version']})", "notes": note, "methodology": "", "breakdowns": [],
            "pillar": pillar,
        })
    return items


def score_values_payload(key, level, parent, period, params, lang):
    """ValuesView: `score` / `score-A..E` — MapValues shaklida (0–100 qat'iy shkala, 50 markazli)."""
    cfg = score_config.load()
    pillar = key.split("-")[1] if "-" in key else None
    if level == "district" and pillar in ("A", "D", "E"):
        raise BadRequest("Bu ustun faqat viloyat darajasida")
    preset, weights = resolve_weights(cfg, level, params)
    year, actual, future = resolve_period(cfg, level, period)
    result, panel = _result(cfg, level, year, weights, future)
    territories = Territory.objects.filter(level=level)
    if parent:
        territories = territories.filter(parent_id=parent) if level == "district" else territories.filter(soato=parent)
    status_text = {"insufficient": "Ma'lumot yetarli emas", "not_created": "Hali tuzilmagan"}
    items = []
    for t_obj in territories:
        item = result["items"].get(t_obj.soato) or {"status": "insufficient", "missing": True}
        if pillar:
            value = None if item.get("status") == "not_created" else (item.get("pillars") or {}).get(pillar)
        else:
            value = item.get("score")
        items.append({"code": t_obj.soato, "name": t_obj.name(lang), "kind": t_obj.kind, "value": value,
                      "missing": value is None, "preliminary": item.get("status") == "partial",
                      "forecast": year in future, "status": item.get("status"),
                      "note": status_text.get(item.get("status")) if value is None else None,
                      "rank": item.get("rank") if not pillar else None})
    parent_obj = Territory.objects.filter(soato=parent).first() if parent else None
    parent_value = None
    if parent and level == "district":
        region_result, _ = _result(cfg, "region", year, score_config.weights_for(cfg, "region", preset or "balanced"),
                                   score.periods(cfg, "region")[1])
        p_item = region_result["items"].get(parent) or {}
        parent_value = (p_item.get("pillars") or {}).get(pillar) if pillar else p_item.get("score")
    name = tr(cfg["pillars"][pillar]["name"], lang) if pillar else t(
        "index_region" if level == "region" else "index_district", lang)
    all_periods = [str(y) for y in actual]
    return {
        "indicator": key, "name": name, "unit": "ball (0–100)", "level": level,
        "parent": {"code": parent, "name": parent_obj.name(lang) if parent_obj else "", "value": parent_value} if parent else None,
        "breakdown": None, "period": str(year), "periods": all_periods + [str(y) for y in future],
        "forecast_periods": [str(y) for y in future], "forecast": year in future,
        "preliminary": False, "republic": None, "items": items,
        "scale": {"min": 0, "max": 100, "quantiles": [20, 40, 60, 80], "current_quantiles": [20, 40, 60, 80],
                  "diverging_center": 50},
        "higher_is_better": True, "siat_url": "", "source": SOURCE, "preset": preset, "weights": weights,
        "methodology_version": cfg["version"], "disclaimer": DISCLAIMER.get(lang if lang != "uzc" else "uz"),
        "note": FORECAST_NOTE.get(lang if lang != "uzc" else "uz") if year in future else None,
    }


def is_score_key(key):
    return key in SCORE_KEYS


def theme_label():
    return {"key": "potential", "label": "Salohiyat (taxminiy)"}


def forecast_periods_for(indicator_key):
    return fc.forecast_periods().get(indicator_key, [])

