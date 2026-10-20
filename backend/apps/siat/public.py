"""JAHON_TAJRIBASI_TAKLIFLAR.md: SIAT katalogi ustidagi ochiq xizmatlar.

- JT-10 e'lonlar kalendari: qaysi ko'rsatkich qachon yangilanadi. Rasmiy sana (`ReleaseEvent`) bo'lsa o'sha,
  bo'lmasa SIAT'dagi oxirgi yangilanish + davriylikdan taxminiy sana ("Taxminiy" belgisi bilan).
- JT-17 mavzuli panellar: har mavzu bo'yicha respublika darajasidagi asosiy ko'rsatkichlar.
- JT-02 aholi soati: oxirgi aholi soni va o'sish sur'ati; hisoblagich brauzerda yuradi.

Hammasi faqat bazadagi SIAT ma'lumotidan, yangi manba yo'q.
"""
import calendar
import datetime as dt

from django.utils import timezone

from .models import ReleaseEvent, SiatIndicator, SiatValue
from .normalize import REPUBLIC

THEME_LABELS = {k: str(v) for k, v in SiatIndicator.THEMES}
PERIOD_MONTHS = {"Y": 12, "Q": 3, "M": 1, "other": 12}
RECENT_DAYS = 120
HORIZON_DAYS = 366


def _add_months(day, months):
    month = day.month - 1 + months
    year = day.year + month // 12
    month = month % 12 + 1
    return dt.date(year, month, min(day.day, calendar.monthrange(year, month)[1]))


def _next_period(period, periodicity):
    """'2025' → '2026', '2025-Q4' → '2026-Q1', '2025-12' → '2026-01'."""
    if not period:
        return ""
    try:
        if "-Q" in period:
            year, q = period.split("-Q")
            year, q = int(year), int(q)
            return f"{year + q // 4}-Q{q % 4 + 1}"
        if len(period) == 7:
            return _add_months(dt.date(int(period[:4]), int(period[5:]), 1), 1).strftime("%Y-%m")
        return str(int(period[:4]) + 1)
    except ValueError:
        return ""


def calendar_indicators():
    """Kalendarga chiqadigan ko'rsatkichlar: hududlar jadvallari va yig'malar (har viloyat jadvali emas)."""
    return (SiatIndicator.objects.filter(is_active=True, kind__in=("source", "group"),
                                         geo_level__in=("region", "district"))
            .order_by("sort_order", "key"))


def _last_periods(indicators):
    rows = (SiatValue.objects.filter(indicator__in=indicators, value__isnull=False)
            .values_list("indicator_id", "period").distinct())
    result = {}
    for indicator_id, period in rows:
        if period > result.get(indicator_id, ""):
            result[indicator_id] = period
    return result


def build_release_calendar(lang="uz", today=None):
    today = today or timezone.localdate()
    horizon = today + dt.timedelta(days=HORIZON_DAYS)
    recent_from = today - dt.timedelta(days=RECENT_DAYS)
    indicators = list(calendar_indicators())
    last_periods = _last_periods(indicators)

    events = list(ReleaseEvent.objects.select_related("indicator")
                  .filter(release_date__gte=recent_from, release_date__lte=horizon))
    official_upcoming = {e.indicator_id for e in events
                         if e.indicator_id and e.status != "published" and e.release_date >= today}

    upcoming, recent = [], []
    for ind in indicators:
        base = {
            "key": ind.key, "title": ind.localized("name", lang), "theme": ind.theme,
            "theme_label": THEME_LABELS.get(ind.theme, ""), "periodicity": ind.periodicity,
            "siat_url": ind.siat_url, "map_url": f"/regions?ind={ind.key}" if ind.show_on_map else "",
        }
        last_period = last_periods.get(ind.pk, "")
        updated = timezone.localtime(ind.source_updated_at).date() if ind.source_updated_at else None
        if updated and updated >= recent_from:
            recent.append({**base, "date": updated.isoformat(), "time": None, "period": last_period,
                           "kind": "siat", "status": "published", "url": ind.siat_url, "note": ""})
        if ind.pk in official_upcoming or not updated:
            continue
        expected = _add_months(updated, PERIOD_MONTHS.get(ind.periodicity, 12))
        if expected > horizon:
            continue
        upcoming.append({**base, "date": expected.isoformat(), "time": None,
                         "period": _next_period(last_period, ind.periodicity), "kind": "estimated",
                         "status": "overdue" if expected < today else "planned", "url": "", "note": ""})

    for e in events:
        ind = e.indicator
        item = {
            "key": ind.key if ind else f"event-{e.pk}", "title": e.title(lang),
            "theme": ind.theme if ind else "other", "theme_label": THEME_LABELS.get(ind.theme if ind else "other", ""),
            "periodicity": ind.periodicity if ind else "", "siat_url": ind.siat_url if ind else "",
            "map_url": f"/regions?ind={ind.key}" if ind and ind.show_on_map else "",
            "date": e.release_date.isoformat(), "time": e.release_time.strftime("%H:%M") if e.release_time else None,
            "period": e.reference_period, "kind": "official", "status": e.status, "url": e.url, "note": e.note_uz,
        }
        if e.status == "published" or e.release_date < today:
            if e.release_date >= recent_from:
                recent.append({**item, "status": "published"})
        else:
            upcoming.append(item)

    upcoming.sort(key=lambda i: (i["date"], i["time"] or "", i["title"]))
    recent.sort(key=lambda i: (i["date"], i["title"]), reverse=True)
    return {"today": today.isoformat(), "upcoming": upcoming, "recent": recent,
            "themes": [{"key": k, "label": v} for k, v in THEME_LABELS.items()
                       if any(i["theme"] == k for i in upcoming + recent)]}


def _ics_escape(text):
    return (text or "").replace("\\", "\\\\").replace(";", "\\;").replace(",", "\\,").replace("\n", "\\n")


def release_calendar_ics(data, site_url=""):
    """iCal (RFC 5545): butun kunlik hodisalar; rasmiy vaqti bor bo'lsa o'sha vaqtda."""
    stamp = timezone.now().strftime("%Y%m%dT%H%M%SZ")
    lines = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//my.stat.uz//E'lonlar kalendari//UZ",
             "CALSCALE:GREGORIAN", "X-WR-CALNAME:my.stat.uz — e'lonlar kalendari", "X-WR-TIMEZONE:Asia/Tashkent"]
    for item in data["upcoming"]:
        day = item["date"].replace("-", "")
        summary = item["title"] + (f" ({item['period']})" if item["period"] else "")
        if item["kind"] == "estimated":
            summary += " — taxminiy"
        lines += ["BEGIN:VEVENT", f"UID:{item['key']}-{day}@my.stat.uz", f"DTSTAMP:{stamp}"]
        if item["time"]:
            lines.append(f"DTSTART;TZID=Asia/Tashkent:{day}T{item['time'].replace(':', '')}00")
        else:
            next_day = (dt.date.fromisoformat(item["date"]) + dt.timedelta(days=1)).strftime("%Y%m%d")
            lines += [f"DTSTART;VALUE=DATE:{day}", f"DTEND;VALUE=DATE:{next_day}"]
        lines.append(f"SUMMARY:{_ics_escape(summary)}")
        link = item["url"] or item["siat_url"] or (site_url + item["map_url"] if item["map_url"] else "")
        if link:
            lines.append(f"URL:{link}")
        lines.append("END:VEVENT")
    lines.append("END:VCALENDAR")
    return "\r\n".join(lines) + "\r\n"


# JT-17: panel -> (nomi, tavsif, ko'rsatkich kalitlari). Admin `SiatIndicator.key` ni o'zgartirsa, shu yerda ham.
PANELS = (
    ("economy", "Iqtisodiyot bir qarashda", "Yalpi ichki mahsulot, o'sish va norasmiy iqtisodiyot",
     ("1299", "658", "660", "1460", "3846")),
    ("labour", "Mehnat bozori", "Ish haqi, uning real o'sishi va ishsizlik",
     ("500", "d-real-wage", "1875", "2818")),
    ("population", "Aholi", "Aholi soni, o'sishi, qishloq aholisi va gender nisbati",
     ("246", "d-pop-growth", "247", "d-rural-share", "d-gender-ratio")),
)
SERIES_POINTS = 10
SECONDS_PER_YEAR = 365.2425 * 86400


def _is_rate(ind):
    unit = (ind.unit_uz or "").lower()
    return ind.diverging_center is not None or "%" in unit or "foiz" in unit


def _republic_series(ind):
    rows = list(SiatValue.objects.filter(indicator=ind, territory_code=REPUBLIC, breakdown="", value__isnull=False)
                .order_by("period").values_list("period", "value", "is_preliminary"))
    return rows[-SERIES_POINTS:]


def _panel_item(ind, lang):
    series = _republic_series(ind)
    if not series:
        return None
    period, value, preliminary = series[-1]
    prev = series[-2][1] if len(series) > 1 else None
    rate = _is_rate(ind)
    change = None
    if prev is not None:
        change = round(value - prev, 2) if rate else (round((value / prev - 1) * 100, 1) if prev else None)
    return {
        "key": ind.key, "name": ind.localized("name", lang),
        "unit": ind.localized("unit", lang) if lang != "uzc" else ind.unit_uz,
        "period": period, "value": value,
        "preliminary": preliminary or (period[:4].isdigit() and int(period[:4]) in set(ind.preliminary_periods)),
        "change": change, "change_kind": "pp" if rate else "pct",
        "higher_is_better": ind.higher_is_better, "diverging_center": ind.diverging_center,
        "series": [{"period": p, "value": v} for p, v, _ in series],
        "map_url": f"/regions?ind={ind.key}" if ind.show_on_map else "", "siat_url": ind.siat_url,
        "derived_from": ind.derived_from,
        "source_updated_at": ind.source_updated_at.isoformat() if ind.source_updated_at else None,
    }


def build_dashboards(lang="uz"):
    keys = {k for _, _, _, ks in PANELS for k in ks}
    by_key = {i.key: i for i in SiatIndicator.objects.filter(key__in=keys, is_active=True)}
    panels = []
    for slug, title, description, panel_keys in PANELS:
        items = [item for item in (_panel_item(by_key[k], lang) for k in panel_keys if k in by_key) if item]
        if items:
            panels.append({"slug": slug, "title": title, "description": description, "items": items})
    return {"panels": panels, "population_clock": population_clock()}


def _siat_growth_rate(pop_series):
    growth = SiatIndicator.objects.filter(key="d-pop-growth").first()
    if growth:
        g = _republic_series(growth)
        if g:
            return g[-1][1]
    if len(pop_series) > 1 and pop_series[-2][1]:
        return (pop_series[-1][1] / pop_series[-2][1] - 1) * 100
    return None


def population_clock():
    """JT-02: boshlang'ich nuqta — admin kiritgan rasmiy qiymat (`PopulationAnchor`), bo'lmasa SIAT 246
    (1-yanvar holatiga doimiy aholi, ming kishi). O'sish — anchor'dagi yoki SIAT'dagi oxirgi yillik sur'at."""
    from .models import PopulationAnchor

    pop = SiatIndicator.objects.filter(key="246").first()
    series = _republic_series(pop) if pop else []
    rate = _siat_growth_rate(series) if series else None
    anchor = PopulationAnchor.objects.first()
    if anchor:
        net = anchor.net_per_second
        if net is not None:
            # stat.uz hisoblagichi: N(t) = N0 + t·(1/tug'ilish − 1/o'lim + 1/kelish − 1/ketish), chiziqli
            rate = net * SECONDS_PER_YEAR / anchor.population * 100
        elif anchor.annual_growth_pct is not None:
            rate = anchor.annual_growth_pct
        return {"base_at": timezone.localtime(anchor.as_of).isoformat(), "base_population": anchor.population,
                "annual_growth_pct": round(rate, 3) if rate is not None else 0.0, "kind": "official",
                "net_per_second": net,
                "rates": {"birth_seconds": anchor.birth_seconds, "death_seconds": anchor.death_seconds,
                          "arrive_seconds": anchor.arrive_seconds, "depart_seconds": anchor.depart_seconds}
                if net is not None else None,
                "source": anchor.source or "O'zbekiston Respublikasi Milliy statistika qo'mitasi",
                "source_url": anchor.source_url}
    if not series:
        return None
    period, value, _ = series[-1]
    base_at = timezone.make_aware(dt.datetime(int(period[:4]), 1, 1))
    return {"base_at": base_at.isoformat(), "base_population": round(value * 1000),
            "annual_growth_pct": round(rate, 3) if rate is not None else 0.0, "kind": "siat",
            "net_per_second": None, "rates": None,
            "source": f"SIAT {pop.key}: doimiy aholi soni, {period[:4]}-yil 1-yanvar holatiga",
            "source_url": pop.siat_url}


def indicator_card(key, lang="uz"):
    """JT-15: embed va ulashish uchun bitta ko'rsatkichning respublika qatori (panel kartochkasi shaklida)."""
    ind = SiatIndicator.objects.filter(key=key, is_active=True).first()
    return _panel_item(ind, lang) if ind else None
