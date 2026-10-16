"""Prognoz aniqligi foydalanuvchi uchun (SCORING_MODEL.md 10.4, 10.8.3, KR-28): usul nomi (oddiy tilda), o'tgan
yillardagi o'rtacha xato, o'sish yo'nalishi to'g'riligi, 80% oraliq qamrovi va prognoz/haqiqat monitoringi.

Ichki kodlar (M0..M4) va MASE javobga chiqmaydi — faqat odam o'qiydigan nom va foizlar.
"""
from ..scoring.texts import tr
from . import spec
from .methods import DAMPED, DRIFT, ENSEMBLE, NAIVE, PANEL

METHOD_NAMES = {
    NAIVE: {"uz": "Oxirgi qiymat saqlanadi", "ru": "Сохранение последнего значения", "en": "Last value carried forward"},
    DRIFT: {"uz": "So'nggi yillar o'rtacha o'sishi", "ru": "Средний рост последних лет", "en": "Recent average growth"},
    DAMPED: {"uz": "So'nuvchi trend", "ru": "Затухающий тренд", "en": "Damped trend"},
    PANEL: {"uz": "Tumanlar bo'yicha omillar modeli", "ru": "Факторная модель по районам", "en": "Cross-district factor model"},
    ENSEMBLE: {"uz": "Trend va omillar modeli aralashmasi", "ru": "Сочетание тренда и факторной модели",
               "en": "Blend of trend and factor model"},
}
EXTRA_NAMES = {
    "industry-total": {"uz": "Sanoat mahsuloti (jami)", "ru": "Промышленная продукция (всего)", "en": "Industrial output (total)"},
    "investment-total": {"uz": "Asosiy kapitalga investitsiyalar (jami)", "ru": "Инвестиции в основной капитал (всего)",
                         "en": "Fixed capital investment (total)"},
}
LEVELS = {"region": {"uz": "viloyat", "ru": "область", "en": "region"},
          "district": {"uz": "tuman", "ru": "район", "en": "district"}}
NOTE = {
    "uz": "O'tgan yillarda prognoz qilingan va keyin ma'lum bo'lgan haqiqiy qiymat bilan solishtirilgan. Xato — o'rtacha "
          "foiz og'ish; yo'nalish — o'sish yoki pasayish to'g'ri topilgan hollar; qamrov — haqiqiy qiymat 80% oraliqqa "
          "tushgan hollar (maqsad ≈ 80%). Pandemiya yili va statistika metodologiyasi o'zgargan yillar kirmaydi.",
    "ru": "Прогнозы прошлых лет сравнены с фактическими значениями. Ошибка — среднее отклонение в процентах; направление — "
          "доля случаев, когда рост или снижение угаданы верно; охват — доля попаданий факта в 80%-й интервал (цель ≈ 80%). "
          "Год пандемии и годы смены методологии исключены.",
    "en": "Past forecasts were compared with the actual values published later. Error is the mean percentage deviation; "
          "direction is the share of cases where growth or decline was right; coverage is the share of actual values inside "
          "the 80% interval (target ≈ 80%). The pandemic year and methodology changes are excluded.",
}


def _r(v, digits=1):
    return round(v, digits) if isinstance(v, (int, float)) else None


def indicator_names(lang):
    from ..models import SiatIndicator

    keys = [k for k in spec.INDICATORS if k not in EXTRA_NAMES]
    lng = lang if lang != "uzc" else "uz"
    names = {i.key: i.localized("name", lng) for i in SiatIndicator.objects.filter(key__in=keys)}
    for k, v in EXTRA_NAMES.items():
        names[k] = tr(v, lang)
    if lang == "uzc":
        names = {k: tr({"uz": v}, "uzc") for k, v in names.items()}
    return names


def summary_row(row, lang):
    """Hisobotdagi bitta (ko'rsatkich, daraja, horizont) yozuvi -> foydalanuvchi qatori."""
    m = row.get("metrics") or {}
    iv = row.get("interval") or {}
    return {"method": tr(METHOD_NAMES.get(row.get("method"), METHOD_NAMES[NAIVE]), lang),
            "error_pct": _r(m.get("mape")), "direction_pct": _r(m.get("direction")),
            "coverage_pct": _r(iv.get("coverage")), "n": m.get("n"), "small_sample": bool(iv.get("small_sample"))}


def quality_payload(lang):
    """Metodologiya sahifasi: barcha ko'rsatkichlar bo'yicha aniqlik va monitoring. Prognoz bo'lmasa — None."""
    from ..models import ForecastVersion

    record = ForecastVersion.objects.filter(is_current=True).first()
    if not record:
        return None
    names = indicator_names(lang)
    rows = []
    for key in spec.INDICATORS:
        for level, horizons in (record.report.get(key) or {}).items():
            for h in sorted(horizons, key=int):
                rows.append({"indicator": key, "name": names.get(key, key), "level": tr(LEVELS[level], lang),
                             "horizon": int(h), **summary_row(horizons[h], lang)})
    monitoring = [{"indicator": key, "name": names.get(key, key), "error_pct": _r(m.get("mape")),
                   "inside_pct": _r(m.get("inside_pct")), "count": m.get("count"),
                   "outside": len(m.get("outside") or []), "previous_version": m.get("previous_version")}
                  for key, m in (record.monitoring or {}).items()]
    return {"version": record.version, "trained_at": record.created_at.isoformat(), "rows": rows,
            "monitoring": monitoring, "note": tr(NOTE, lang)}


def card_model(rows, lang):
    """Kartochka (10.8.3): usul nomi va o'tgan yillardagi o'rtacha xato. rows — bazaviy ForecastValue'lar."""
    runs = [r.model_run for r in rows if r.model_run_id]
    if not runs:
        return None
    first, last = runs[0], runs[-1]
    metrics = (first.backtest or {}).get(first.model_kind) or {}
    last_metrics = (last.backtest or {}).get(last.model_kind) or {}
    return {"method": tr(METHOD_NAMES.get(first.model_kind, METHOD_NAMES[NAIVE]), lang),
            "error_pct": _r(metrics.get("mape")), "error_pct_last": _r(last_metrics.get("mape")),
            "direction_pct": _r(metrics.get("direction")), "horizons": [first.horizon, last.horizon],
            "coverage_pct": _r((first.interval or {}).get("coverage"))}
