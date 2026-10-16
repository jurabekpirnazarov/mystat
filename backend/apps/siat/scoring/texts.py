"""Kartochka matnlari (uz, ru, en; uzc — uz matnidan transliteratsiya). Raqamlar API qiymatlaridan qo'yiladi."""
from apps.common.text import uz_latin_to_cyrillic

TEXTS = {
    "rank": {"uz": "{of} dan {rank}-o'rin", "ru": "{rank}-е место из {of}", "en": "rank {rank} of {of}"},
    "vs_national": {"uz": "respublikadan {pct}% {dir}", "ru": "на {pct}% {dir}, чем в среднем по республике",
                    "en": "{pct}% {dir} than the national level"},
    "higher": {"uz": "yuqori", "ru": "выше", "en": "higher"},
    "lower": {"uz": "past", "ru": "ниже", "en": "lower"},
    "parent_data": {"uz": "viloyat ma'lumoti", "ru": "данные области", "en": "regional data"},
    "lagged": {"uz": "{year} ma'lumoti", "ru": "данные {year} г.", "en": "{year} data"},
    "index_region": {"uz": "Salohiyat indeksi", "ru": "Индекс потенциала", "en": "Potential index"},
    "index_district": {"uz": "Mehnat va demografiya indeksi", "ru": "Индекс труда и демографии",
                       "en": "Labour and demography index"},
    "no_rule": {"uz": "Aniq ixtisos ko'rinmaydi, ko'rsatkichlari tengdoshlar o'rtachasiga yaqin.",
                "ru": "Явной специализации не видно, показатели близки к среднему.",
                "en": "No clear specialisation; indicators are close to the peer average."},
    "weakest_title": {"uz": "Eng zaif yo'nalishni kuchaytirish: {pillar}", "ru": "Укрепление самого слабого направления: {pillar}",
                      "en": "Strengthening the weakest area: {pillar}"},
    "weakest_why": {"uz": "Bu ustun bo'yicha baho {score} (tengdoshlar o'rtachasi 50).",
                    "ru": "Оценка по этому направлению {score} (среднее по группе — 50).",
                    "en": "The score for this area is {score} (peer average is 50)."},
    "not_created": {"uz": "Hali tuzilmagan", "ru": "Ещё не образован", "en": "Not yet established"},
    "no_data": {"uz": "Ma'lumot yo'q", "ru": "Нет данных", "en": "No data"},
    "short": {"uz": "o'sish: ma'lumot qisqa", "ru": "рост: короткий ряд", "en": "growth: short series"},
    "lag_too_old": {"uz": "{max_lag} yildan eski ma'lumot", "ru": "данные старше {max_lag} года", "en": "data older than {max_lag} year"},
    "sector_leading": {"uz": "{name}: respublikadan {lq} barobar ko'proq ixtisoslashgan va tezroq o'smoqda. Eksport va klasterni kengaytirish mumkin.",
                       "ru": "{name}: специализация в {lq} раза выше, чем по республике, и растёт быстрее. Можно расширять экспорт и кластер.",
                       "en": "{name}: {lq} times more specialised than the country and growing faster. Exports and the cluster can expand."},
    "sector_slowing": {"uz": "{name}: an'anaviy tarmoq (respublikadan {lq} barobar), lekin respublikadan sekin o'smoqda. Modernizatsiya kerak.",
                       "ru": "{name}: традиционная отрасль (в {lq} раза выше среднего), но растёт медленнее. Нужна модернизация.",
                       "en": "{name}: a traditional sector ({lq} times the national share) but growing slower. Needs modernisation."},
    "sector_growing": {"uz": "{name}: hali ixtisos emas, lekin respublikadan tez o'smoqda (yiliga {growth}% ga qarshi {national}%).",
                       "ru": "{name}: пока не специализация, но растёт быстрее республики ({growth}% против {national}% в год).",
                       "en": "{name}: not yet a specialisation but growing faster than the country ({growth}% vs {national}% a year)."},
    "sector_invest": {"uz": "{name}: investitsiya ulushi yuqori (respublikadan {lq} barobar), ishlab chiqarish hali ortda.",
                      "ru": "{name}: доля инвестиций высокая (в {lq} раза), а производство пока отстаёт.",
                      "en": "{name}: a high investment share ({lq} times the national) while output still lags."},
}

SECTOR_LABELS = {
    "leading": {"uz": "Yetakchi tarmoq", "ru": "Ведущая отрасль", "en": "Leading sector"},
    "slowing": {"uz": "Sustlashayotgan ixtisos", "ru": "Замедляющаяся специализация", "en": "Slowing specialisation"},
    "growing": {"uz": "O'sayotgan tarmoq", "ru": "Растущая отрасль", "en": "Growing sector"},
    "invest": {"uz": "Investitsiya kelmoqda, natija hali yo'q", "ru": "Инвестиции идут, результата пока нет",
               "en": "Investment arriving, no output yet"},
}

STATUS = {
    "ok": {"uz": "To'liq ma'lumot", "ru": "Полные данные", "en": "Complete data"},
    "partial": {"uz": "Qisman ma'lumot", "ru": "Частичные данные", "en": "Partial data"},
    "insufficient": {"uz": "Ma'lumot yetarli emas", "ru": "Недостаточно данных", "en": "Insufficient data"},
    "not_created": TEXTS["not_created"],
}


def tr(obj, lang):
    """{'uz','ru','en'} lug'atidan tilga mos matn; uzc — uz matni kirillga o'girilgan."""
    if not isinstance(obj, dict):
        return obj
    if lang == "uzc":
        return uz_latin_to_cyrillic(obj.get("uz", ""))
    return obj.get(lang) or obj.get("uz", "")


def t(key, lang, **kwargs):
    template = TEXTS[key]
    if lang == "uzc":
        return uz_latin_to_cyrillic(template["uz"].format(**kwargs))
    return (template.get(lang) or template["uz"]).format(**kwargs)


def fmt_number(value, digits=1):
    if value is None:
        return "—"
    a = abs(value)
    text = f"{value:,.0f}" if a >= 1000 else f"{value:,.{digits}f}"
    return text.replace(",", " ").replace(".", ",")
