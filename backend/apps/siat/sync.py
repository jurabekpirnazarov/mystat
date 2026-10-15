"""KR-01: SIAT -> baza sinxronlash. Tarmoq xatosida eski ma'lumot o'zgarmaydi.

Oqim: file_info (updated_at) -> o'zgargan bo'lsa fayl -> tasnif (KR-02) -> tozalash (KR-03) -> saqlash ->
yig'ma va hisoblangan ko'rsatkichlar (KR-10) -> sifat tekshiruvi (KR-14) -> kesh tozalanadi.
"""
import logging
from datetime import date

from django.core.cache import cache
from django.db import transaction
from django.utils import timezone
from django.utils.dateparse import parse_datetime

from . import client
from .catalog import DEFAULT_GROUPS, DEFAULT_INDICATORS, DERIVED, guess_theme
from .classify import classify, parse_metadata, periodicity_of, region_in_title, strip_region
from .models import SiatBreakdown, SiatIndicator, SiatSyncLog, SiatValue, Territory
from .normalize import (REPUBLIC, extract_rows, is_rate_unit, is_soato, period_year, preliminary_years,
                        territory_kind, territory_level)

logger = logging.getLogger(__name__)
CACHE_VERSION_KEY = "siat:version"


def bump_cache():
    """Karta API keshi versiya orqali bekor qilinadi (KR-05)."""
    try:
        cache.incr(CACHE_VERSION_KEY)
    except ValueError:
        cache.set(CACHE_VERSION_KEY, 2, None)


def cache_version():
    version = cache.get(CACHE_VERSION_KEY)
    if version is None:
        cache.set(CACHE_VERSION_KEY, 1, None)
        version = 1
    return version


def _date(text):
    try:
        return date.fromisoformat(str(text)[:10])
    except ValueError:
        return None


def _indicator_for(siat_id):
    indicator = SiatIndicator.objects.filter(siat_id=siat_id).first()
    if indicator is None:
        theme, on_map, better, center, order = DEFAULT_INDICATORS.get(siat_id, (None, False, None, None, 100))
        indicator = SiatIndicator(key=str(siat_id), siat_id=siat_id, kind="source", theme=theme or "other",
                                  show_on_map=on_map, higher_is_better=better, diverging_center=center,
                                  sort_order=order)
        indicator._theme_guess = theme is None
    return indicator


def _areas():
    """build_map_boundaries hisoblagan maydonlar (km²) — aholi zichligi uchun (KR-10)."""
    import json
    import os

    path = os.path.join(os.path.dirname(__file__), "data", "areas.json")
    try:
        with open(path, encoding="utf-8") as fh:
            return json.load(fh)
    except (OSError, ValueError):
        return {}


def _save_territories(rows):
    """SIAT qatorlaridagi hududlar -> Territory (nomlar tozalangan, N1). Mavjud nom ustiga yoziladi."""
    areas = _areas()
    for row in rows:
        code = row["code"]
        if not is_soato(code):
            continue
        parent = None if code == REPUBLIC else (REPUBLIC if len(code) == 4 else code[:4])
        Territory.objects.update_or_create(soato=code, defaults={
            "level": territory_level(code), "kind": territory_kind(code),
            "name_uz": row["name_uz"][:120], "name_ru": row["name_ru"][:120], "name_en": row["name_en"][:120],
            "name_uzc": row["name_uzc"][:120],
        })
        if code in areas:
            Territory.objects.filter(soato=code, area_km2__isnull=True).update(area_km2=areas[code])
        if parent and Territory.objects.filter(soato=parent).exists():
            Territory.objects.filter(soato=code).update(parent_id=parent)


@transaction.atomic
def load_payload(indicator, payload, source_updated_at=None, catalog=False):
    """SIAT JSON (format 1) -> baza. Admin'dagi qo'lda yuklash ham shu funksiyani chaqiradi.

    `catalog=True` (sitemap'dan topilgan yangi ko'rsatkich): hudud kesimi bo'lmasa faqat metadata saqlanadi va
    ko'rsatkich sinxronlashdan chiqariladi; hudud kesimi bo'lsa — kartaga nomzod (admin `show_on_map` qo'yadi).
    """
    block = payload[0] if isinstance(payload, list) else payload
    if not isinstance(block, dict) or "data" not in block:
        raise client.SiatError("Fayl formati noma'lum: 'data' topilmadi (format 1 kerak)")
    meta = parse_metadata(block.get("metadata"))
    rows = block["data"] or []
    name = meta.get("name", {})
    unit = meta.get("unit", {})
    notes = meta.get("note", {})
    geo_level, dimension = classify(rows)
    rate = is_rate_unit(unit.get("uz", "")) or is_rate_unit(unit.get("ru", ""))
    extracted, periods, issues = extract_rows(rows, zero_is_value=indicator.zero_is_value, rate=rate)
    prelim, conflict = preliminary_years(notes)

    indicator.code = meta.get("code", {}).get("uz", "")[:20]
    for lang in ("uz", "ru", "en", "uzc"):
        setattr(indicator, f"name_{lang}", (name.get(lang) or "").strip()[:300])
    for lang in ("uz", "ru", "en"):
        setattr(indicator, f"unit_{lang}", (unit.get(lang) or "").strip()[:120])
        setattr(indicator, f"notes_{lang}", notes.get(lang, ""))
    indicator.methodology_uz = meta.get("methodology", {}).get("uz", "")
    indicator.periodicity = periodicity_of(meta, periods)
    indicator.geo_level = geo_level
    indicator.dimension = dimension
    indicator.preliminary_periods = sorted(prelim)
    indicator.first_published = _date(meta.get("first_published", {}).get("uz"))
    if getattr(indicator, "_theme_guess", False):
        indicator.theme = guess_theme(indicator.name_uz)
    region, group_key = region_in_title(indicator.name_uz) if geo_level == "none" else (None, None)
    indicator.group_region = indicator.group_region_override or region or ""
    indicator.group_key = (group_key or "")[:200]
    if geo_level in ("none", "country"):
        indicator.show_on_map = False  # N6, N7: hudud kesimi yo'q
    indicator.source_updated_at = parse_datetime(source_updated_at) if isinstance(source_updated_at, str) else source_updated_at
    indicator.last_synced_at = timezone.now()
    indicator.last_error = ""
    indicator.quality_issues = issues + (["“Dastlabki” yillar tillar bo'yicha har xil yozilgan — hammasi belgilandi"]
                                         if conflict else [])
    store_values = True
    if catalog and indicator._state.adding:
        from .catalog import tracked_ids
        store_values = (geo_level in ("region", "district") or bool(indicator.group_region)
                        or indicator.siat_id in tracked_ids())
        indicator.is_active = store_values
    indicator.save()
    if not store_values:
        return indicator

    if dimension == "territory":
        _save_territories(extracted)
    indicator.values.all().delete()
    indicator.breakdowns.all().delete()
    objs = []
    for order, row in enumerate(extracted):
        if dimension == "territory":
            territory, breakdown = row["code"], ""
            if not is_soato(territory):
                continue
        else:
            territory, breakdown = (indicator.group_region or REPUBLIC), row["code"][:32]
            SiatBreakdown.objects.get_or_create(indicator=indicator, code=breakdown, defaults={
                "name_uz": row["name_uz"][:300], "name_ru": row["name_ru"][:300], "name_en": row["name_en"][:300],
                "name_uzc": row["name_uzc"][:300], "sort_order": order})
        for period, value in row["values"].items():
            objs.append(SiatValue(indicator=indicator, territory_code=territory, breakdown=breakdown, period=period,
                                  value=value, is_preliminary=period_year(period) in prelim))
    SiatValue.objects.bulk_create(objs, batch_size=2000, ignore_conflicts=True)
    return indicator


def sync_indicator(siat_id, force=False, catalog=False):
    """-> 'updated' | 'unchanged'. Xato bo'lsa SiatError (eski ma'lumot o'zgarmaydi)."""
    indicator = _indicator_for(siat_id)
    try:
        info = client.file_info(siat_id)
        updated_at = parse_datetime(info["updated_at"]) if info.get("updated_at") else None
        if (not force and indicator.pk and updated_at and indicator.source_updated_at == updated_at
                and indicator.values.exists()):
            SiatIndicator.objects.filter(pk=indicator.pk).update(last_synced_at=timezone.now(), last_error="")
            return "unchanged"
        payload = client.download(info["file"])
        load_payload(indicator, payload, updated_at, catalog=catalog)
        return "updated"
    except Exception as exc:  # noqa: BLE001 — har qanday xatoda eski ma'lumot qoladi
        logger.warning("SIAT %s: %s", siat_id, exc)
        if indicator.pk:
            SiatIndicator.objects.filter(pk=indicator.pk).update(last_error=str(exc)[:2000])
        raise client.SiatError(str(exc)) from exc


def rebuild_groups():
    """Har hudud uchun alohida jadvallar -> bitta yig'ma ko'rsatkich (KR-02, 3-qadam).

    Ikki jadval bitta hududga tegishli deb yozilgan bo'lsa (SIAT'da 2601 va 2603 — ikkalasi "Qashqadaryo"),
    qaysi biri to'g'ri ekanini bilib bo'lmaydi: ikkalasi ham olinmaydi, hudud kartada "ma'lumot yo'q" bo'ladi
    va admin'da ogohlantirish chiqadi (jadval hududini qo'lda belgilash mumkin).
    Davrlar: a'zolarning ko'pchiligida bor davr turi (odatda yillik) olinadi, oylik qo'shimchalar tashlanadi.
    """
    from collections import Counter

    built = []
    for key, (members, theme, order) in DEFAULT_GROUPS.items():
        sources = list(SiatIndicator.objects.filter(siat_id__in=list(members), kind="source").exclude(group_region="")
                       .order_by("siat_id"))
        if len(sources) < 2:
            continue
        by_region = {}
        for source in sources:
            by_region.setdefault(source.group_region, []).append(source)
        issues = []
        used = []
        for region, items in sorted(by_region.items()):
            if len(items) > 1:
                ids = ", ".join(str(i.siat_id) for i in items)
                issues.append(f"Jadvallar {ids} bitta hududga ({region}) tegishli deb yozilgan — hudud ko'rsatilmadi; "
                              "to'g'ri hududni SIAT jadvalida \"Jadval hududi (qo'lda)\" bilan belgilang")
            else:
                used.append(items[0])
        missing = 14 - len(used)
        if missing > 0:
            issues.append(f"{missing} ta hudud jadvali yo'q")
        lengths = Counter()
        for source in used:
            lengths.update({len(p) for p in source.values.values_list("period", flat=True).distinct()})
        period_len = lengths.most_common(1)[0][0] if lengths else 4

        group = SiatIndicator.objects.filter(key=key).first() or SiatIndicator(
            key=key, kind="group", theme=theme, sort_order=order, show_on_map=True)
        first = sources[0]
        for lang in ("uz", "ru", "en", "uzc"):
            setattr(group, f"name_{lang}", strip_region(getattr(first, f"name_{lang}"))[:300])
        for field in ("unit_uz", "unit_ru", "unit_en"):
            setattr(group, field, getattr(first, field))
        group.periodicity = {4: "Y", 7: "M"}.get(period_len, "other")
        group.geo_level = "region" if len(used) >= 10 else "none"
        group.dimension = "territory"
        group.derived_from = "SIAT " + ", ".join(str(s.siat_id) for s in used)
        group.preliminary_periods = sorted({y for s in used for y in s.preliminary_periods})
        group.source_updated_at = max((s.source_updated_at for s in used if s.source_updated_at), default=None)
        group.last_synced_at = timezone.now()
        group.quality_issues = issues
        group.save()
        with transaction.atomic():
            group.values.all().delete()
            group.breakdowns.all().delete()
            names = {}
            for source in used:
                for b in source.breakdowns.all():
                    names.setdefault(b.code, b)
            for order_no, (code, b) in enumerate(names.items()):
                SiatBreakdown.objects.create(indicator=group, code=code, name_uz=b.name_uz, name_ru=b.name_ru,
                                             name_en=b.name_en, name_uzc=b.name_uzc, sort_order=order_no)
            SiatValue.objects.bulk_create([
                SiatValue(indicator=group, territory_code=v.territory_code, breakdown=v.breakdown, period=v.period,
                          value=v.value, is_preliminary=v.is_preliminary)
                for v in SiatValue.objects.filter(indicator__in=used) if len(v.period) == period_len
            ], batch_size=2000, ignore_conflicts=True)
        built.append(group)
    return built


def _series(siat_id):
    """{(soato, period): value} — `breakdown=''` qiymatlar."""
    rows = SiatValue.objects.filter(indicator__siat_id=siat_id, breakdown="", value__isnull=False)
    return {(v.territory_code, v.period): v.value for v in rows.only("territory_code", "period", "value")}


def _prelim(siat_id):
    ind = SiatIndicator.objects.filter(siat_id=siat_id).first()
    return set(ind.preliminary_periods if ind else [])


def _annual_cpi():
    """Respublika CPI: yil o'rtacha zanjirli indeksi (FQ-03 bazasi). -> {yil: o'tgan yilga nisbatan koeffitsient}"""
    try:
        from apps.additional_services.api_endpoints.PriceIndexAPI.series import cpi_chain
        chain = cpi_chain()
    except Exception:  # noqa: BLE001
        return {}
    by_year = {}
    for item in chain:
        by_year.setdefault(int(item["month"][:4]), []).append(item["index"])
    avg = {y: sum(v) / len(v) for y, v in by_year.items() if len(v) == 12}
    return {y: avg[y] / avg[y - 1] for y in avg if y - 1 in avg}


def rebuild_derived():
    """KR-10: SIAT'da yo'q, lekin mavjud ma'lumotdan hisoblanadigan ko'rsatkichlar."""
    total = _series(246)
    if not total:
        return []
    computed = {}
    areas = dict(Territory.objects.filter(area_km2__isnull=False).values_list("soato", "area_km2"))
    if areas:
        computed["d-density"] = {k: v * 1000 / areas[k[0]] for k, v in total.items() if areas.get(k[0])}
    rural = _series(247)
    if rural:
        computed["d-rural-share"] = {k: rural[k] / v * 100 for k, v in total.items() if v and k in rural}
    computed["d-pop-growth"] = {
        (code, period): (v / total[(code, str(int(period) - 1))] - 1) * 100
        for (code, period), v in total.items() if total.get((code, str(int(period) - 1)))}
    men = _series(245)
    if men:
        computed["d-gender-ratio"] = {k: men[k] / (v - men[k]) * 100 for k, v in total.items()
                                      if k in men and v - men[k] > 0}
    wages, cpi = _series(500), _annual_cpi()
    if wages and cpi:
        computed["d-real-wage"] = {
            (code, period): (w / wages[(code, str(int(period) - 1))] / cpi[int(period)] - 1) * 100
            for (code, period), w in wages.items()
            if int(period) in cpi and wages.get((code, str(int(period) - 1)))}
    population = SiatIndicator.objects.filter(siat_id=246).first()
    prelim = {
        "d-density": _prelim(246), "d-rural-share": _prelim(246) | _prelim(247), "d-pop-growth": _prelim(246),
        "d-gender-ratio": _prelim(246) | _prelim(245), "d-real-wage": _prelim(500),
    }
    built = []
    for key, values in computed.items():
        if not values:
            continue
        (name_uz, name_ru, name_en), unit, source, theme, order, better = DERIVED[key]
        indicator, _ = SiatIndicator.objects.get_or_create(key=key, defaults={
            "kind": "derived", "theme": theme, "sort_order": order, "show_on_map": True, "higher_is_better": better})
        indicator.name_uz, indicator.name_ru, indicator.name_en, indicator.unit_uz = name_uz, name_ru, name_en, unit
        indicator.derived_from = f"Hisoblangan, manba: {source}"
        indicator.geo_level = population.geo_level if population and key != "d-real-wage" else (
            SiatIndicator.objects.filter(siat_id=500).values_list("geo_level", flat=True).first() or "region")
        indicator.periodicity = "Y"
        indicator.dimension = "territory"
        indicator.preliminary_periods = sorted(prelim[key])
        indicator.last_synced_at = timezone.now()
        indicator.source_updated_at = population.source_updated_at if population else None
        indicator.save()
        with transaction.atomic():
            indicator.values.all().delete()
            SiatValue.objects.bulk_create([
                SiatValue(indicator=indicator, territory_code=code, period=period, value=round(value, 3),
                          is_preliminary=int(period[:4]) in prelim[key])
                for (code, period), value in values.items()], batch_size=2000)
        built.append(indicator)
    return built


def run_sync(ids=None, force=False, trigger="beat", catalog=False):
    """Ro'yxatdagi (berilmasa: faol) ko'rsatkichlarni sinxronlaydi. -> SiatSyncLog"""
    from .catalog import tracked_ids
    from .quality import check_all

    log = SiatSyncLog.objects.create(trigger=trigger)
    if ids is None:
        known = set(SiatIndicator.objects.filter(kind="source", is_active=True).values_list("siat_id", flat=True))
        inactive = set(SiatIndicator.objects.filter(kind="source", is_active=False).values_list("siat_id", flat=True))
        ids = sorted((known | set(tracked_ids())) - inactive)
    details, changed = [], False
    for siat_id in ids:
        try:
            status = sync_indicator(siat_id, force=force, catalog=catalog)
        except client.SiatError as exc:
            log.failed += 1
            details.append(f"{siat_id}: {exc}")
            continue
        if status == "updated":
            log.updated += 1
            changed = True
        else:
            log.unchanged += 1
    if changed or force:
        rebuild_groups()
        rebuild_derived()
    check_all()
    log.details = "\n".join(details)[:20000]
    log.finished_at = timezone.now()
    log.save()
    if changed:
        bump_cache()
        _notify_subscribers()
    return log


def _notify_subscribers():
    """A-02: "Hudud ko'rsatkichlari" obunachilariga bitta hodisa (dispatch Celery Beat'da)."""
    from apps.notifications.models import IndicatorUpdateEvent

    today = timezone.localdate()
    IndicatorUpdateEvent.objects.get_or_create(
        indicator="region", date=today,
        defaults={"title": "Hududiy ko'rsatkichlar yangilandi (SIAT)", "link": "/regions"})
