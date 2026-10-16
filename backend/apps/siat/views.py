"""KR-05: karta API'si. Ma'lumot faqat bazadan (KR-01), javob keshlanadi va sinxronlashda kesh yangilanadi.

GET /api/common/map/indicators/                     — katalog: mavzu, nom, birlik, daraja, davrlar, manba
GET /api/common/map/values/?indicator=246&period=2026&level=district&parent=1735[&breakdown=B]
GET /api/common/map/territory/<soato>/              — hudud kartochkasi: barcha ko'rsatkichlar, o'rni, dinamika
GET /api/common/map/territories/                    — qidiruv uchun hududlar ro'yxati (4 tilda)
Salohiyat indeksi (`indicator=score`, `score-A..E`) va prognoz yillari (`period=2027`, `view=growth`) ham shu
`values/` orqali — karta UI'si bir xil shakldagi javob oladi (views_score.py, SCORING_MODEL.md).
Har so'rovda `lang=uz|ru|en|uzc`. Ma'lumot yo'q (`missing`) qiymat `null` bo'lib keladi, hech qachon 0 emas.
"""
from collections import defaultdict

from django.core.cache import cache
from django.http import Http404
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import SiatIndicator, SiatValue, Territory
from .normalize import REPUBLIC
from .sync import cache_version

CACHE_SECONDS = 6 * 3600
LANGS = ("uz", "ru", "en", "uzc")
SOURCE = {"name": "SIAT, O'zbekiston Respublikasi Milliy statistika qo'mitasi", "license": "CC BY 4.0",
          "url": "https://siat.stat.uz/"}
THEME_LABELS = dict(SiatIndicator.THEMES)


def _lang(request):
    lang = request.query_params.get("lang", "uz")
    return lang if lang in LANGS else "uz"


def _cached(key, build):
    full = f"siat:v{cache_version()}:{key}"
    data = cache.get(full)
    if data is None:
        data = build()
        cache.set(full, data, CACHE_SECONDS)
    return data


def _map_indicators():
    return SiatIndicator.objects.filter(show_on_map=True, is_active=True, geo_level__in=("region", "district"))


def _quantiles(values, classes=5):
    data = sorted(values)
    if not data:
        return []
    result = []
    for i in range(1, classes):
        pos = (len(data) - 1) * i / classes
        lo = int(pos)
        hi = min(lo + 1, len(data) - 1)
        result.append(round(data[lo] + (data[hi] - data[lo]) * (pos - lo), 4))
    return result


def _default_breakdown(indicator):
    # prefetch_related("breakdowns") bo'lsa qo'shimcha so'rovsiz
    first = next(iter(indicator.breakdowns.all()), None)
    return first.code if first else ""


def _territory_name(territory, lang):
    return territory.name(lang) if territory else ""


class IndicatorsView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        lang = _lang(request)
        return Response(_cached(f"indicators:{lang}", lambda: self.build(lang)))

    @staticmethod
    def build(lang):
        indicators = list(_map_indicators().prefetch_related("breakdowns"))
        periods = defaultdict(set)
        rows = (SiatValue.objects.filter(indicator__in=indicators, value__isnull=False)
                .values_list("indicator_id", "period").distinct())
        for indicator_id, period in rows:
            periods[indicator_id].add(period)
        from .views_score import forecast_periods_for, score_catalog, theme_label

        items = []
        for ind in indicators:
            ps = sorted(periods.get(ind.pk, ()))
            if not ps:
                continue
            items.append({
                "key": ind.key, "siat_id": ind.siat_id, "kind": ind.kind, "code": ind.code,
                "name": ind.localized("name", lang), "unit": ind.localized("unit", lang) if lang != "uzc" else ind.unit_uz,
                "theme": ind.theme, "geo_level": ind.geo_level, "periodicity": ind.periodicity,
                "periods": ps, "last_period": ps[-1], "preliminary_years": ind.preliminary_periods,
                "higher_is_better": ind.higher_is_better, "diverging_center": ind.diverging_center,
                "source_updated_at": ind.source_updated_at, "last_synced_at": ind.last_synced_at,
                "siat_url": ind.siat_url, "derived_from": ind.derived_from,
                "notes": ind.localized("notes", lang) if lang != "uzc" else ind.notes_uz,
                "methodology": ind.methodology_uz[:1500],
                "breakdowns": [{"code": b.code, "name": getattr(b, f"name_{lang}", "") or b.name_uz}
                               for b in ind.breakdowns.all()],
                "forecast_periods": forecast_periods_for(ind.key) if ind.periodicity == "Y" else [],
            })
        items.extend(score_catalog(lang))   # SCORING_MODEL.md 7-bo'lim: "Salohiyat" guruhi
        from .views_company import catalog as company_catalog

        items.extend(company_catalog(lang))  # KORXONA_SCORING.md KR-37: korxonalar sifati qatlami
        themes = [{"key": k, "label": str(v)} for k, v in SiatIndicator.THEMES if any(i["theme"] == k for i in items)]
        if any(i["theme"] == "potential" for i in items):
            themes.append(theme_label())
        return {"themes": themes, "indicators": items, "source": SOURCE}


class ValuesView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        from .views_score import forecast_periods_for, forecast_values_payload, is_score_key

        params = request.query_params
        key = params.get("indicator", "")
        if is_score_key(key):
            return self.score(request, key)
        from .views_company import is_company_key, values_payload as company_values

        if is_company_key(key):
            level = params.get("level") or "region"
            if level not in ("region", "district"):
                return Response({"detail": "level: region yoki district"}, status=400)
            parent = params.get("parent") or ""
            lang = _lang(request)
            data = _cached(f"values:{key}:{level}:{parent}:{params.get('period', '')}:{lang}",
                           lambda: company_values(key, level, parent, params.get("period"), lang))
            if data is None:
                raise Http404("Korxona ballari hisoblanmagan")
            if params.get("export") in ("csv", "xlsx"):
                return export_values(data, params["export"])
            return Response(data)
        indicator = _map_indicators().filter(key=key).first()
        if indicator is None:
            raise Http404("Ko'rsatkich topilmadi yoki kartada ko'rsatilmaydi")
        level = params.get("level") or "region"
        if level not in ("region", "district"):
            return Response({"detail": "level: region yoki district"}, status=400)
        if level == "district" and indicator.geo_level != "district":
            return Response({"detail": "Bu ko'rsatkich tumanlar kesimida yo'q"}, status=400)
        parent = params.get("parent") or ""
        if parent and not (parent.isdigit() and len(parent) == 4):
            return Response({"detail": "parent: 4 xonali SOATO kodi"}, status=400)
        breakdown = params.get("breakdown")
        codes = set(indicator.breakdowns.values_list("code", flat=True))
        if breakdown is None or (codes and breakdown not in codes):
            breakdown = _default_breakdown(indicator)
        lang = _lang(request)
        period = params.get("period") or ""
        view = params.get("view") or ""
        if view not in ("", "growth"):
            return Response({"detail": "view: growth"}, status=400)
        from .views_score import SCENARIOS

        scenario = SCENARIOS.get(params.get("scenario") or params.get("sc") or "base")
        if scenario is None:
            return Response({"detail": "scenario: base|opt|pes"}, status=400)
        if period and period in forecast_periods_for(key) and not breakdown:
            # 10.8: prognoz yili — shkala, legenda va eksport odatdagi qiymatlar bilan bir xil shaklda
            def build_forecast():
                last = self.build(indicator, level, parent, breakdown, "", lang)
                if last is None:
                    return None
                base = {**last, "periods": last["periods"] + forecast_periods_for(key)}
                return forecast_values_payload(indicator, level, parent, period, lang, view, base, scenario)
            data = _cached(f"values:fc:{key}:{level}:{parent}:{period}:{view}:{scenario}:{lang}", build_forecast)
            if data is None:
                raise Http404("Prognoz yo'q")
            if params.get("export") in ("csv", "xlsx"):
                return export_values(data, params["export"])
            return Response(data)
        cache_key = f"values:{key}:{level}:{parent}:{breakdown}:{period}:{lang}"
        data = _cached(cache_key, lambda: self.build(indicator, level, parent, breakdown, period, lang))
        if data is None:
            raise Http404("Bu davr uchun ma'lumot yo'q")
        export = params.get("export")
        if export in ("csv", "xlsx"):
            return export_values(data, export)
        return Response(data)

    def score(self, request, key):
        """SCORING_MODEL.md 7-bo'lim: `ind=score` / `score-A..E` — salohiyat indeksi kartada."""
        from .views_score import BadRequest, score_values_payload

        params = request.query_params
        level = params.get("level") or "region"
        if level not in ("region", "district"):
            return Response({"detail": "level: region yoki district"}, status=400)
        parent = params.get("parent") or ""
        if parent and not (parent.isdigit() and len(parent) == 4):
            return Response({"detail": "parent: 4 xonali SOATO kodi"}, status=400)
        lang = _lang(request)
        weights_key = params.get("weights") or params.get("sw") or params.get("preset") or params.get("sp") or ""
        cache_key = f"values:{key}:{level}:{parent}:{params.get('period', '')}:{weights_key}:{lang}"
        try:
            data = _cached(cache_key, lambda: score_values_payload(key, level, parent, params.get("period"), params, lang))
        except BadRequest as exc:
            return Response({"detail": str(exc)}, status=400)
        if params.get("export") in ("csv", "xlsx"):
            return export_values(data, params["export"])
        return Response(data)

    @staticmethod
    def build(indicator, level, parent, breakdown, period, lang):
        territories = Territory.objects.filter(level=level)
        if parent:
            territories = territories.filter(parent_id=parent) if level == "district" else territories.filter(soato=parent)
        territories = list(territories)
        codes = [t.soato for t in territories]
        base = SiatValue.objects.filter(indicator=indicator, breakdown=breakdown)
        scoped = base.filter(territory_code__in=codes)
        periods = sorted(set(scoped.filter(value__isnull=False).values_list("period", flat=True)))
        if not periods:
            return None
        if not period or period not in periods:
            if period:
                return None
            period = periods[-1]
        rows = {v.territory_code: v for v in scoped.filter(period=period)}
        prelim_years = set(indicator.preliminary_periods)
        items = []
        for t in territories:
            v = rows.get(t.soato)
            items.append({"code": t.soato, "name": t.name(lang), "kind": t.kind,
                          "value": v.value if v else None, "missing": v is None or v.value is None,
                          "preliminary": bool(v and v.is_preliminary) or int(period[:4]) in prelim_years})
        # Shkala barcha davrlar bo'yicha bir xil (KR-08: animatsiya ma'noli bo'lishi uchun); respublika kirmaydi (N5)
        all_values = list(scoped.filter(value__isnull=False).values_list("value", flat=True))
        current = [i["value"] for i in items if i["value"] is not None]
        republic = base.filter(territory_code=REPUBLIC, period=period).values_list("value", flat=True).first()
        parent_value = None
        if parent and level == "district":
            parent_value = base.filter(territory_code=parent, period=period).values_list("value", flat=True).first()
        parent_obj = Territory.objects.filter(soato=parent).first() if parent else None
        breakdown_obj = indicator.breakdowns.filter(code=breakdown).first() if breakdown else None
        return {
            "indicator": indicator.key, "name": indicator.localized("name", lang),
            "unit": indicator.localized("unit", lang) if lang != "uzc" else indicator.unit_uz,
            "level": level, "parent": {"code": parent, "name": _territory_name(parent_obj, lang), "value": parent_value}
            if parent else None,
            "breakdown": {"code": breakdown, "name": getattr(breakdown_obj, f"name_{lang}", "") or breakdown_obj.name_uz}
            if breakdown_obj else None,
            "period": period, "periods": periods, "forecast_periods": [], "forecast": False,
            "preliminary": int(period[:4]) in prelim_years,
            "republic": republic, "items": items,
            "scale": {"min": min(all_values) if all_values else None, "max": max(all_values) if all_values else None,
                      "quantiles": _quantiles(all_values), "current_quantiles": _quantiles(current),
                      "diverging_center": indicator.diverging_center},
            "higher_is_better": indicator.higher_is_better, "siat_url": indicator.siat_url, "source": SOURCE,
        }


def export_values(data, kind):
    """KR-12: joriy ko'rinish jadvali. CSV — UTF-8 BOM (FQ-01 ochiq API bilan bir xil), XLSX — openpyxl."""
    import csv
    import io

    from django.http import HttpResponse

    title = data["name"] + (f" — {data['breakdown']['name']}" if data.get("breakdown") else "")
    note = f"Manba: {data['source']['name']}, {data['source']['license']}. {data['siat_url']}".strip()
    header = ["SOATO", "Hudud", f"Qiymat ({data['unit']})", "Dastlabki"]
    rows = [[i["code"], i["name"], i["value"], "ha" if i["preliminary"] else ""] for i in data["items"]]
    if data.get("republic") is not None:
        rows.append(["1700", "O'zbekiston Respublikasi", data["republic"], ""])
    header.append("is_forecast")
    rows = [r + [int(bool(data.get("forecast")))] for r in rows]
    if data.get("forecast"):
        from .forecast.service import current_version

        # Prognoz qatorlari (10.8.7): 80% oraliq va prognoz versiyasi (usul nomi foydalanuvchiga chiqmaydi)
        version = current_version() or ""
        header[2] = f"Prognoz ({data['unit']})"
        header += ["80% oraliq (past)", "80% oraliq (yuqori)", "Prognoz versiyasi"]
        by_code = {i["code"]: i for i in data["items"]}
        rows = [r + ([by_code[r[0]].get("lo80"), by_code[r[0]].get("hi80")] if r[0] in by_code else ["", ""]) + [version]
                for r in rows]
        note += " " + (data.get("note") or "")
        if data.get("scenario") and data["scenario"] != "base":
            note += {"optimistic": " Ssenariy: ijobiy.", "pessimistic": " Ssenariy: salbiy."}[data["scenario"]]
    filename = f"siat-{data['indicator']}-{data['period']}.{kind}"
    if kind == "csv":
        buf = io.StringIO()
        writer = csv.writer(buf)
        writer.writerow([f"{title}, {data['period']}"])
        writer.writerow([note])
        writer.writerow(header)
        writer.writerows(rows)
        response = HttpResponse("﻿" + buf.getvalue(), content_type="text/csv; charset=utf-8")
    else:
        from openpyxl import Workbook

        wb = Workbook()
        ws = wb.active
        ws.title = data["period"][:31]
        ws.append([f"{title}, {data['period']}"])
        ws.append([note])
        ws.append(header)
        for row in rows:
            ws.append(row)
        ws.column_dimensions["B"].width = 34
        ws.column_dimensions["C"].width = 18
        buf = io.BytesIO()
        wb.save(buf)
        response = HttpResponse(buf.getvalue(),
                                content_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    return response


class TerritoryView(APIView):
    """KR-09: hudud kartochkasi — har ko'rsatkichning oxirgi qiymati, o'rni, o'rtachadan farqi, dinamikasi."""
    permission_classes = (AllowAny,)

    def get(self, request, soato):
        territory = Territory.objects.select_related("parent").filter(soato=soato).first()
        if territory is None or territory.level == "country":
            raise Http404("Hudud topilmadi")
        lang = _lang(request)
        return Response(_cached(f"territory:{soato}:{lang}", lambda: self.build(territory, lang)))

    @staticmethod
    def build(territory, lang):
        from .forecast.service import territory_forecast

        siblings = Territory.objects.filter(level=territory.level)
        if territory.level == "district":
            siblings = siblings.filter(parent_id=territory.parent_id)
        sibling_codes = list(siblings.values_list("soato", flat=True))
        indicators = []
        for ind in _map_indicators().prefetch_related("breakdowns"):
            if territory.level == "district" and ind.geo_level != "district":
                continue
            breakdown = _default_breakdown(ind)
            own = list(SiatValue.objects.filter(indicator=ind, breakdown=breakdown, territory_code=territory.soato)
                       .order_by("period").values("period", "value", "is_preliminary"))
            filled = [r for r in own if r["value"] is not None]
            if not filled:
                continue
            last = filled[-1]
            peers = dict(SiatValue.objects.filter(indicator=ind, breakdown=breakdown, period=last["period"],
                                                  territory_code__in=sibling_codes, value__isnull=False)
                         .values_list("territory_code", "value"))
            ordered = sorted(peers.values(), reverse=True)
            rank = ordered.index(last["value"]) + 1 if last["value"] in ordered else None
            mean = sum(ordered) / len(ordered) if ordered else None
            republic = SiatValue.objects.filter(indicator=ind, breakdown=breakdown, territory_code=REPUBLIC,
                                                period=last["period"]).values_list("value", flat=True).first()
            indicators.append({
                "key": ind.key, "name": ind.localized("name", lang), "theme": ind.theme,
                "unit": ind.localized("unit", lang) if lang != "uzc" else ind.unit_uz,
                "period": last["period"], "value": last["value"],
                "preliminary": last["is_preliminary"] or int(last["period"][:4]) in set(ind.preliminary_periods),
                "rank": rank, "of": len(ordered), "higher_is_better": ind.higher_is_better,
                "average": round(mean, 3) if mean is not None else None,
                "vs_average_pct": round((last["value"] / mean - 1) * 100, 1) if mean else None,
                "republic": republic, "siat_url": ind.siat_url, "derived_from": ind.derived_from,
                "series": [{"period": r["period"], "value": r["value"]} for r in own],
                "forecast": territory_forecast(ind.key, territory.soato, last["period"], last["value"], lang)
                if ind.periodicity == "Y" and len(last["period"]) == 4 else None,
            })
        parent = territory.parent if territory.parent_id and territory.parent_id != REPUBLIC else None
        return {
            "soato": territory.soato, "name": territory.name(lang), "level": territory.level, "kind": territory.kind,
            "parent": {"soato": parent.soato, "name": parent.name(lang)} if parent else None,
            "area_km2": territory.area_km2, "profile": _profile_link(territory),
            "children": Territory.objects.filter(parent=territory).count(),
            "indicators": indicators, "source": SOURCE,
        }


def _profile_link(territory):
    """FQ-02 hududiy profil sahifasiga havola (common.Region / District orqali)."""
    from apps.common.models import District, Region

    if territory.level == "region":
        region = Region.objects.filter(code=territory.soato).first()
        return f"/regions/{region.id}" if region else None
    district = District.objects.filter(region__code=territory.soato[:4], code=territory.soato[4:]).first()
    return f"/regions/{district.region_id}?district={district.id}" if district else None


class TerritoriesView(APIView):
    """KR-13: hudud qidiruvi uchun (4 tilda nom)."""
    permission_classes = (AllowAny,)

    def get(self, request):
        def build():
            return {"items": [
                {"code": t.soato, "level": t.level, "kind": t.kind, "parent": t.parent_id,
                 "names": {lang: t.name(lang) for lang in LANGS}}
                for t in Territory.objects.exclude(level="country")]}
        return Response(_cached("territories", build))
