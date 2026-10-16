"""SCORING_MODEL.md KR-22: metodologiya matni 4 tilda (uz, ru, en; uzc — uz matnidan transliteratsiya).

Barcha raqamlar `scoring.yaml` parametrlaridan qo'yiladi — matnda qo'lda yozilgan raqam yo'q. Prognoz usullari va
aniqligi jadvali alohida (`forecast/quality.py`, GET forecast/quality/); bu yerda faqat uning yorliqlari. ⟦…⟧ ichidagi formulalar kirillga o'girilmaydi.
"""
import re

from apps.common.text import uz_latin_to_cyrillic

_KEEP = re.compile(r"⟦(.*?)⟧")
_SLOT = re.compile(r"(\{[a-z_]+\})")

SECTIONS = [
    {"key": "calc", "title": {"uz": "1. Hisoblash", "ru": "1. Расчёт", "en": "1. Calculation"}, "items": [
        {"uz": "Har ko'rsatkich tengdoshlar (viloyatlar yoki barcha tumanlar) orasida standartlashtiriladi: "
               "⟦z⟧ = (⟦x⟧ − o'rtacha) / standart og'ish. Taqsimoti qiyshiq ko'rsatkichlar (ish haqi, aholi, YaHM) avval logarifmlanadi.",
         "ru": "Каждый показатель стандартизируется внутри группы (области или все районы): z = (x − среднее) / "
               "стандартное отклонение. Показатели с асимметричным распределением (зарплата, население, ВРП) сначала логарифмируются.",
         "en": "Each indicator is standardised within its peer group (regions or all districts): z = (x − mean) / standard "
               "deviation. Skewed indicators (wages, population, GRP) are log-transformed first."},
        {"uz": "Chetdagi qiymatlar ±{z_clip} da cheklanadi, ball = 50 + {score_scale}·⟦z⟧ (0–100). 50 — tengdoshlar o'rtachasi, "
               "70 dan yuqori — kuchli, 30 dan past — zaif.",
         "ru": "Крайние значения ограничиваются ±{z_clip}, балл = 50 + {score_scale}·z (0–100). 50 — среднее по группе, "
               "выше 70 — сильная сторона, ниже 30 — слабая.",
         "en": "Outliers are clipped at ±{z_clip}; score = 50 + {score_scale}·z (0–100). 50 is the peer average, above 70 is "
               "strong, below 30 is weak."},
        {"uz": "Ustun bahosi — ustundagi ko'rsatkichlar o'rtachasi; indeks — ustunlarning vaznli o'rtachasi. Yo'q qiymat "
               "o'rtacha bilan to'ldirilmaydi: vazn qolganlariga taqsimlanadi.",
         "ru": "Оценка направления — среднее его показателей; индекс — взвешенное среднее направлений. Пропуски не "
               "заполняются средним: вес перераспределяется между остальными.",
         "en": "A pillar score is the mean of its indicators; the index is the weighted mean of pillars. Missing values are "
               "not imputed: their weight is shared among the rest."},
        {"uz": "Har yil o'z ichida solishtiriladi: indeks \"shu yili boshqalarga nisbatan qayerda\" degan ma'noni beradi.",
         "ru": "Сравнение идёт внутри каждого года: индекс показывает положение относительно других в этом году.",
         "en": "Each year is compared on its own: the index shows the position relative to others in that year."},
        {"uz": "Tanlangan yil yoki ko'pi bilan {max_lag} yil oldingi qiymat olinadi (kartochkada \"… ma'lumoti\" deb belgilanadi).",
         "ru": "Берётся значение выбранного года или не старше {max_lag} года (в карточке помечается «данные … г.»).",
         "en": "The value for the selected year is used, or one at most {max_lag} year older (marked \"… data\" on the card)."},
    ]},
    {"key": "pillars", "title": {"uz": "2. Ustunlar va ko'rsatkichlar", "ru": "2. Направления и показатели",
                                 "en": "2. Pillars and indicators"}, "items": [],
     "note": {"uz": "Tumanlarda faqat tuman kesimidagi ko'rsatkichlar (mehnat bozori va demografiya) — \"Mehnat va demografiya "
                    "indeksi\". Viloyat ko'rsatkichlari tumanga meros qilinmaydi.",
              "ru": "Для районов используются только районные показатели (рынок труда и демография) — «Индекс труда и "
                    "демографии». Показатели области районам не передаются.",
              "en": "Districts use only district-level indicators (labour market and demography) — the \"Labour and "
                    "demography index\". Regional indicators are not inherited."}},
    {"key": "weights", "title": {"uz": "3. Vaznlar", "ru": "3. Веса", "en": "3. Weights"}, "items": []},
    {"key": "reliability", "title": {"uz": "4. Ishonchlilik", "ru": "4. Надёжность", "en": "4. Reliability"}, "items": [
        {"uz": "To'liqlik {coverage_min_pct}% dan kam bo'lsa indeks ko'rsatilmaydi (\"Ma'lumot yetarli emas\"), "
               "{coverage_full_pct}% dan kam bo'lsa — \"qisman ma'lumot\".",
         "ru": "При полноте ниже {coverage_min_pct}% индекс не показывается («Недостаточно данных»), ниже "
               "{coverage_full_pct}% — «частичные данные».",
         "en": "Below {coverage_min_pct}% coverage the index is not shown (\"Insufficient data\"); below "
               "{coverage_full_pct}% it is marked \"partial data\"."},
        {"uz": "O'rin oralig'i: vaznlar {rank_iterations} marta ±{rank_jitter_pct}% ga tasodifan o'zgartiriladi; o'rinlarning "
               "10- va 90-percentili ko'rsatiladi.",
         "ru": "Диапазон мест: веса {rank_iterations} раз случайно меняются на ±{rank_jitter_pct}%; показываются 10-й и "
               "90-й процентили мест.",
         "en": "Rank range: weights are randomly perturbed by ±{rank_jitter_pct}% {rank_iterations} times; the 10th and "
               "90th percentiles of rank are shown."},
        {"uz": "Yangi tumanlar tuzilgan yildan oldin baholanmaydi; ma'muriy bo'linish yilidagi aholi o'sishi hisobga olinmaydi.",
         "ru": "Новые районы не оцениваются до года образования; прирост населения в год административного деления не учитывается.",
         "en": "New districts are not scored before they were established; population growth in a boundary-change year is ignored."},
    ]},
    {"key": "analysis", "title": {"uz": "5. Kuchli tomonlar, tarmoqlar va tavsiyalar",
                                  "ru": "5. Сильные стороны, отрасли и рекомендации",
                                  "en": "5. Strengths, sectors and recommendations"}, "items": [
        {"uz": "Kuchli tomon — tengdoshlar orasida yuqori {strong_top}%, zaif — quyi {weak_pct}%.",
         "ru": "Сильная сторона — верхние {strong_top}% группы, слабая — нижние {weak_pct}%.",
         "en": "A strength is the top {strong_top}% of peers; a weakness is the bottom {weak_pct}%."},
        {"uz": "Tarmoq ixtisosi (lokalizatsiya koeffitsienti): tarmoqning viloyatdagi ulushi / respublikadagi ulushi, so'nggi "
               "{sector_years} yil. {lq_high} va undan yuqori — ixtisoslashgan tarmoq.",
         "ru": "Специализация отрасли (коэффициент локализации): доля отрасли в области / доля в республике за последние "
               "{sector_years} года. {lq_high} и выше — специализированная отрасль.",
         "en": "Sector specialisation (location quotient): the sector's regional share / national share over the last "
               "{sector_years} years. {lq_high} or higher means a specialised sector."},
        {"uz": "Tavsiyalar oldindan belgilangan qoidalar bo'yicha (ko'pi bilan {max_recommendations} ta), har birida asos bo'lgan "
               "raqamlar. Hech qaysi qoida mos kelmasa — eng zaif ustun bo'yicha umumiy tavsiya.",
         "ru": "Рекомендации строятся по заранее заданным правилам (не более {max_recommendations}), с цифрами-обоснованием. "
               "Если ни одно правило не подходит — общая рекомендация по самому слабому направлению.",
         "en": "Recommendations follow predefined rules (at most {max_recommendations}), each with its supporting figures. "
               "If no rule applies, a general recommendation for the weakest pillar is given."},
        {"uz": "O'xshash hududlar — standartlashtirilgan ko'rsatkichlar bo'yicha eng yaqin {peers} hudud.",
         "ru": "Похожие территории — {peers} ближайших по стандартизированным показателям.",
         "en": "Similar territories are the {peers} closest by standardised indicators."},
    ]},
    {"key": "forecast", "title": {"uz": "6. Prognoz", "ru": "6. Прогноз", "en": "6. Forecast"}, "items": [
        {"uz": "Har ko'rsatkich uchun bir necha statistik usul o'tgan yillar ma'lumotida sinab ko'riladi; eng aniq chiqqani "
               "tanlanadi, murakkab usul oddiyidan sezilarli yaxshi bo'lgandagina ishlatiladi.",
         "ru": "Для каждого показателя несколько статистических методов проверяются на данных прошлых лет; выбирается "
               "самый точный, сложный метод — только если он заметно лучше простого.",
         "en": "Several statistical methods are tested on past data for each indicator; the most accurate is chosen, and a "
               "complex method is used only if it is clearly better than a simple one."},
        {"uz": "80% ishonch oralig'i o'tgan yillardagi haqiqiy xatolardan olinadi va yil sayin kengayadi. Pandemiya yili va "
               "statistika metodologiyasi o'zgargan yillar xatolarga kirmaydi. Ijobiy va salbiy ssenariylar — o'xshash "
               "hududlarning o'sish sur'atlari asosida.",
         "ru": "80%-й интервал строится по фактическим ошибкам прошлых лет и расширяется с горизонтом. Год пандемии и годы "
               "смены методологии статистики в ошибки не входят. Оптимистичный и пессимистичный сценарии — по темпам роста "
               "похожих территорий.",
         "en": "The 80% interval comes from actual errors in past years and widens with the horizon. The pandemic year and "
               "years with a change in statistical methodology are excluded. Optimistic and pessimistic scenarios use the "
               "growth rates of similar territories."},
        {"uz": "\"Nega shunday prognoz?\" va \"Agar ishsizlik o'zgarsa?\" — statistik bog'liqlik, sabab-oqibat emas.",
         "ru": "«Почему такой прогноз?» и «Если изменится безработица?» — статистическая связь, а не причинно-следственная.",
         "en": "\"Why this forecast?\" and \"What if unemployment changes?\" show statistical association, not causation."},
        {"uz": "Kelajak yillari indeksi shu formula bilan, prognoz qiymatlaridan hisoblanadi.",
         "ru": "Индекс будущих лет считается по той же формуле из прогнозных значений.",
         "en": "The index for future years uses the same formula on forecast values."},
    ]},
]

LABELS = {
    "title": {"uz": "Salohiyat indeksi: metodologiya", "ru": "Индекс потенциала: методология", "en": "Potential index: methodology"},
    "pillar": {"uz": "Ustun", "ru": "Направление", "en": "Pillar"},
    "indicator": {"uz": "Ko'rsatkich", "ru": "Показатель", "en": "Indicator"},
    "direction": {"uz": "Yo'nalish", "ru": "Направление влияния", "en": "Direction"},
    "level": {"uz": "Daraja", "ru": "Уровень", "en": "Level"},
    "higher_better": {"uz": "yuqori — yaxshi", "ru": "выше — лучше", "en": "higher is better"},
    "lower_better": {"uz": "past — yaxshi", "ru": "ниже — лучше", "en": "lower is better"},
    "district": {"uz": "tuman", "ru": "район", "en": "district"},
    "region": {"uz": "viloyat", "ru": "область", "en": "region"},
    "preset": {"uz": "Preset", "ru": "Пресет", "en": "Preset"},
    "source": {"uz": "Manba: SIAT, O'zbekiston Respublikasi Milliy statistika qo'mitasi, CC BY 4.0.",
               "ru": "Источник: SIAT, Национальный комитет Республики Узбекистан по статистике, CC BY 4.0.",
               "en": "Source: SIAT, National Statistics Committee of the Republic of Uzbekistan, CC BY 4.0."},
    "close": {"uz": "Yopish", "ru": "Закрыть", "en": "Close"},
    "fc_quality": {"uz": "Prognoz aniqligi (o'tgan yillar bo'yicha sinov)", "ru": "Точность прогноза (проверка на прошлых годах)",
                   "en": "Forecast accuracy (tested on past years)"},
    "fc_horizon": {"uz": "Ufq", "ru": "Горизонт", "en": "Horizon"},
    "fc_years": {"uz": "{h} yil", "ru": "{h} г.", "en": "{h} yr"},
    "fc_method": {"uz": "Usul", "ru": "Метод", "en": "Method"},
    "fc_error": {"uz": "O'rtacha xato", "ru": "Средняя ошибка", "en": "Mean error"},
    "fc_direction": {"uz": "Yo'nalish to'g'ri", "ru": "Направление верно", "en": "Direction right"},
    "fc_coverage": {"uz": "80% oraliq qamrovi", "ru": "Охват 80%-го интервала", "en": "80% interval coverage"},
    "fc_small": {"uz": "* — sinov nuqtalari kam (30 dan kam), natija taxminiy.",
                 "ru": "* — мало точек проверки (меньше 30), результат приблизительный.",
                 "en": "* — few test points (under 30); the figure is approximate."},
    "fc_monitoring": {"uz": "Prognoz va haqiqat", "ru": "Прогноз и факт", "en": "Forecast vs actual"},
    "fc_monitoring_text": {"uz": "{name}: o'rtacha xato {error}%, haqiqiy qiymat 80% oraliqqa {inside}% hollarda tushdi ({count} ta).",
                           "ru": "{name}: средняя ошибка {error}%, факт попал в 80%-й интервал в {inside}% случаев ({count}).",
                           "en": "{name}: mean error {error}%, the actual value fell inside the 80% interval in {inside}% of cases ({count})."},
    "fc_monitoring_empty": {"uz": "Yangi haqiqiy ma'lumot kelgach, o'tgan prognoz u bilan shu yerda solishtiriladi.",
                            "ru": "Когда появятся новые фактические данные, прошлый прогноз будет сравнён с ними здесь.",
                            "en": "When new actual data arrive, the previous forecast is compared with them here."},
}


def _fmt(value):
    return f"{value:g}" if isinstance(value, float) else value


def values(params):
    """Matndagi o'rinbosarlar: scoring.yaml parametrlari va ulardan hosilalar (foiz ko'rinishi)."""
    out = {k: _fmt(v) for k, v in params.items()}
    out.update({
        "coverage_min_pct": round(params["coverage_min"] * 100), "coverage_full_pct": round(params["coverage_full"] * 100),
        "rank_jitter_pct": round(params["rank_jitter"] * 100), "strong_top": _fmt(100 - params["strong_pct"]),
    })
    return out


def text(obj, lang, fill=None):
    """Tilga mos matn: avval raqamlar qo'yiladi, keyin (uzc) kirillga o'giriladi; ⟦…⟧ qismlar o'zgarmaydi."""
    raw = obj.get("uz") if lang == "uzc" else obj.get(lang) or obj.get("uz")
    raw = raw.format(**fill) if fill else raw
    if lang != "uzc":
        return _KEEP.sub(lambda m: m.group(1), raw)
    parts = _KEEP.split(raw)   # juft indeks — o'giriladigan matn, toq — formula
    return "".join(p if i % 2 else _cyr(p) for i, p in enumerate(parts))


def _cyr(part):
    """Kirillga o'girish; UI to'ldiradigan {o'rinbosar}lar o'zgarmaydi."""
    pieces = _SLOT.split(part)
    return "".join(p if i % 2 else uz_latin_to_cyrillic(p) for i, p in enumerate(pieces))


def build(cfg, lang):
    """-> {"sections": [{key, title, items[], note}], "labels": {...}} tanlangan tilda, raqamlar bilan."""
    fill = values(cfg["params"])
    sections = [{"key": s["key"], "title": text(s["title"], lang),
                 "items": [text(item, lang, fill) for item in s["items"]],
                 "note": text(s["note"], lang) if s.get("note") else None} for s in SECTIONS]
    return {"sections": sections, "labels": {k: text(v, lang) for k, v in LABELS.items()}}
