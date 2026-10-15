"""KR-03: SIAT faylidagi ma'lumotni tozalash.

SIAT fayllarida tekshirib topilgan nuqsonlar (SIAT_KARTA_TAHLIL.md, 4-bo'lim):
- N1: nomlarda lotin va kirill harflari aralash, apostroflar har xil, qo'sh bo'shliq — shuning uchun
  moslashtirish faqat SOATO kodi bo'yicha, nom faqat ko'rsatish uchun tozalanadi;
- N2: 0.0 "ma'lumot yo'q" ma'nosida (yangi tumanlarning oldingi yillari, foiz ko'rsatkichlari);
- N3: oy kalitida kirill "М" (`2010-М01`);
- N4: `2023.1` kabi takror va tartibsiz ustunlar;
- N5: respublika qatori (`1700`) data ichida;
- N9: "dastlabki" belgisi faqat izoh matnida.
"""
import re
import unicodedata

REPUBLIC = "1700"

# Ko'rinishi bir xil harflar (lotin <-> kirill)
_LAT_TO_CYR = str.maketrans("AaBCcEeHKkMOoPpTXxYy", "АаВСсЕеНКкМОоРрТХхУу")
_CYR_TO_LAT = str.maketrans("АаВСсЕеНКкМОоРрТХхУу", "AaBCcEeHKkMOoPpTXxYy")
_CYR_RE = re.compile(r"[Ѐ-ӿ]")
_LAT_RE = re.compile(r"[A-Za-z]")
_APOSTROPHES = "'`´‘’ʼʹ′"
_APOS_RE = re.compile(f"([A-Za-z])[{_APOSTROPHES}ʻ]")
_GLUED_RE = re.compile(r"(?<=[a-z])(city|district|shahri|tumani)$", re.IGNORECASE)


def _fix_word(word):
    cyr = len(_CYR_RE.findall(word))
    lat = len(_LAT_RE.findall(word))
    if cyr and lat:
        return word.translate(_LAT_TO_CYR) if cyr >= lat else word.translate(_CYR_TO_LAT)
    return word


def _apostrophe(match):
    letter = match.group(1)
    # O'zbek lotinida oʻ/gʻ — teskari vergul (ʻ), qolgan joyda tutuq belgisi (’)
    return letter + ("ʻ" if letter in "oOgG" else "’")


def clean_name(value):
    """Ko'rsatish uchun nomni tozalaydi (N1). Moslashtirishda ishlatilmaydi."""
    if not value:
        return ""
    text = unicodedata.normalize("NFC", str(value))
    text = " ".join(_fix_word(w) for w in text.split())
    text = _APOS_RE.sub(_apostrophe, text)
    text = _GLUED_RE.sub(lambda m: " " + m.group(1), text)
    return text.strip()


def is_soato(code):
    code = str(code or "").strip()
    return code.isdigit() and code.startswith("17") and len(code) in (4, 7)


def territory_level(code):
    if code == REPUBLIC:
        return "country"
    return "region" if len(code) == 4 else "district"


def territory_kind(code):
    """7 xonali kodda oxirgi 3 raqam: 2xx — tuman, 4xx — shahar."""
    if len(code) != 7:
        return territory_level(code)
    return "city" if code[4] == "4" else "district"


_PERIOD_RE = re.compile(r"^(\d{4})(?:-?([MQ])(\d{1,2}))?$")
_DUP_RE = re.compile(r"^\d{4}\.\d+$")


def normalize_period(key):
    """Davr kaliti -> (`2025` | `2025-01` | `2025-Q1`) yoki None. N3: kirill М/К -> lotin."""
    raw = str(key).strip().replace("М", "M").replace("м", "M").replace("К", "Q").replace("Қ", "Q").upper()
    match = _PERIOD_RE.match(raw)
    if not match:
        return None
    year, kind, num = match.groups()
    if not kind:
        return year
    num = int(num)
    if kind == "M" and 1 <= num <= 12:
        return f"{year}-{num:02d}"
    if kind == "Q" and 1 <= num <= 4:
        return f"{year}-Q{num}"
    return None


def period_year(period):
    return int(period[:4])


def _to_number(value):
    if value is None or isinstance(value, bool):
        return None
    if isinstance(value, (int, float)):
        return float(value)
    text = str(value).strip().replace(" ", "").replace(" ", "").replace(",", ".")
    if text in ("", "-", "–", "—", "x", "X", "..", "…"):
        return None
    try:
        return float(text)
    except ValueError:
        return None


_RATE_RE = re.compile(r"foiz|%|процент|percent|indeks|индекс|index|nisbat", re.IGNORECASE)


def is_rate_unit(unit):
    """Foiz, indeks va nisbatlarda 0.0 — deyarli doim "ma'lumot yo'q"."""
    return bool(_RATE_RE.search(unit or ""))


def parse_columns(rows):
    """Davr ustunlarini aniqlaydi. -> (period_map {asl kalit: davr}, issues)

    N4: `2023.1` kabi ustun boshqa ustun bilan bir xil bo'lsa tashlanadi; bir xil bo'lmasa ham qaysi davrga
    tegishli ekanini bilib bo'lmaydi — u ham tashlanadi va sifat ogohlantirishiga yoziladi.
    """
    keys = []
    for row in rows:
        for k in row:
            if k != "Code" and not k.startswith("Klassifikator") and k not in keys:
                keys.append(k)
    issues = []
    mapping = {}
    for key in keys:
        period = normalize_period(key)
        if period is None:
            if _DUP_RE.match(str(key)):
                same = [k for k in keys if k != key and all(r.get(k) == r.get(key) for r in rows)]
                issues.append(f"`{key}` ustuni tashlandi" + (f" (`{same[0]}` bilan bir xil)" if same else " (davri noma'lum)"))
            else:
                issues.append(f"`{key}` ustuni davr emas — tashlandi")
            continue
        mapping[key] = period
    return mapping, issues


def extract_rows(rows, zero_is_value=False, rate=False):
    """data[] -> qiymatlar ro'yxati: {code, breakdown, name_*, values: {period: float|None}}.

    N2: hudud qatorida 0.0 dan keyin musbat qiymat boshlansa, oldingi 0.0 lar `None` (ma'lumot yo'q).
    Foiz/indeks ko'rsatkichlarida har qanday 0.0 — `None`. `zero_is_value=True` bo'lsa 0 haqiqiy qiymat.
    """
    _, issues = parse_columns(rows)
    # Bir davrga bir nechta kalit bo'lishi mumkin (`2010-М01` kirill va `2010-M01` lotin) — hammasi o'qiladi
    all_keys = {}
    for row in rows:
        for key in row:
            period = normalize_period(key)
            if period and key not in all_keys.setdefault(period, []):
                all_keys[period].append(key)
    ordered = sorted(all_keys)
    result = []
    for row in rows:
        code = str(row.get("Code", "")).strip()
        values = {}
        for period in ordered:
            value = None
            for key in all_keys[period]:
                value = _to_number(row.get(key))
                if value is not None:
                    break
            values[period] = value
        if not zero_is_value:
            if rate:
                values = {p: (None if v == 0 else v) for p, v in values.items()}
            else:
                # Keyinroq musbat qiymat bor bo'lsa 0 — hudud hali tuzilmagan yoki vaqtincha yopilgan
                # (Bo'zatov 2020-yilda tuzilgan, Taxiatosh 2013–2017 yopiq bo'lgan)
                seen_positive = False
                for period in reversed(ordered):
                    v = values[period]
                    if v is not None and v != 0:
                        seen_positive = True
                    elif v == 0 and seen_positive:
                        values[period] = None
                # Hamma qiymati 0 bo'lgan qator (masalan Toshkent shahri qishloq aholisi) — ma'lumot yo'q
                if all(v in (None, 0) for v in values.values()):
                    values = {p: None for p in values}
        result.append({
            "code": code,
            "name_uz": clean_name(row.get("Klassifikator")),
            "name_ru": clean_name(row.get("Klassifikator_ru")),
            "name_en": clean_name(row.get("Klassifikator_en")),
            "name_uzc": clean_name(row.get("Klassifikator_uzc")),
            "values": values,
        })
    return result, ordered, issues


_PRELIM_WORDS = r"dastlabki|предварительн|preliminary|дастлабки"
_YEAR_RE = re.compile(r"(?<!\d)(19|20)\d{2}(?!\d)")


def preliminary_years(notes):
    """N9: izohlardan "dastlabki" yillarni ajratadi. -> (yillar to'plami, tillar bo'yicha zidmi)

    Masalan: "2023 yillik yakuniy ko'rsatkichlar, 2024 yillar dastlabki ma'lumotlar" -> {2024}.
    Har til alohida o'qiladi; natija birlashtiriladi (ehtiyot uchun), zid bo'lsa `True` qaytadi.
    """
    by_lang = {}
    for lang, text in notes.items():
        years = set()
        for sentence in re.split(r"[;\n]|(?<=\D)\.(?=\s)", text or ""):
            for part in re.split(r",", sentence):
                if re.search(_PRELIM_WORDS, part, re.IGNORECASE):
                    years |= {int(m.group(0)) for m in _YEAR_RE.finditer(part)}
        if years:
            by_lang[lang] = years
    all_years = set().union(*by_lang.values()) if by_lang else set()
    conflict = len({frozenset(v) for v in by_lang.values()}) > 1
    return all_years, conflict
