"""KR-02: SIAT ko'rsatkichini ma'lumotga qarab tasniflash va metadata'ni o'qish."""
import re

from .normalize import REPUBLIC, clean_name, is_soato

DISTRICT_MIN = 150
REGION_MIN = 14

# Metadata maydonlari `name_en` bo'yicha topiladi (uz nomlarida apostroflar har xil)
META_KEYS = {
    "first_published": ("date of first publication",),
    "source_modified": ("last modified date",),
    "code": ("indicator identification number (code)",),
    "name": ("indicator name",),
    "periodicity": ("periodicity",),
    "unit": ("unit of measurement",),
    "methodology": ("calculation methodology (briefly)", "calculation methodology"),
    "department": ("name of department",),
    "note": ("note",),
}
LANGS = ("uz", "ru", "en", "uzc")


def parse_metadata(metadata):
    """metadata[] -> {maydon: {til: matn}}. Bir nechta "Note" bo'lsa birlashtiriladi."""
    result = {}
    for item in metadata or []:
        name_en = re.sub(r"\s+", " ", str(item.get("name_en") or "")).strip().rstrip(" :").lower()
        field = next((f for f, keys in META_KEYS.items() if name_en in keys), None)
        if field is None:
            continue
        values = {lang: str(item.get(f"value_{lang}") or "").strip() for lang in LANGS}
        if field in result:
            if field in ("note", "methodology"):
                for lang in LANGS:
                    if values[lang] and values[lang] not in result[field][lang]:
                        result[field][lang] = "; ".join(x for x in (result[field][lang], values[lang]) if x)
            continue  # boshqa maydonlarda birinchisi (masalan ikkinchi "Indicator name" — qisqa nom)
        result[field] = values
    return result


def periodicity_of(meta, periods):
    if periods and all("-" in p and p[5] == "Q" for p in periods):
        return "Q"
    if periods and all(len(p) == 7 for p in periods):
        return "M"
    if periods and all(len(p) == 4 for p in periods):
        return "Y"
    return "other"


_ACTIVITY_RE = re.compile(r"^[A-U](\s*,\s*[A-U])*$|^\d{2}$")


def classify(rows):
    """data[] -> (geo_level, dimension).

    geo_level: `district` (7 xonali kodlar >= 150), `region` (17xx kodlar >= 14), `country` (faqat 1700),
    `none` (kodlar SOATO emas — tarmoq yoki mahsulot kesimi, kartaga chiqmaydi: N6, N7).
    """
    codes = [str(r.get("Code", "")).strip() for r in rows]
    soato = [c for c in codes if is_soato(c)]
    if codes and len(soato) >= 0.9 * len(codes):
        districts = sum(1 for c in soato if len(c) == 7)
        regions = sum(1 for c in soato if len(c) == 4 and c != REPUBLIC)
        if districts >= DISTRICT_MIN:
            return "district", "territory"
        if regions >= REGION_MIN:
            return "region", "territory"
        return "country", "territory"
    activity = sum(1 for c in codes if _ACTIVITY_RE.match(c))
    return "none", ("activity" if activity >= 0.6 * len(codes) else "product")


# "Har hudud uchun alohida jadval" (4604–4617, 2599–2612): nomdagi hudud -> SOATO
REGION_PATTERNS = (
    ("1735", r"qoraqalpog"), ("1703", r"andijon"), ("1706", r"buxoro"), ("1708", r"jizzax"),
    ("1710", r"qashqadaryo"), ("1712", r"navoiy"), ("1714", r"namangan"), ("1718", r"samarqand"),
    ("1722", r"surxondaryo"), ("1724", r"sirdaryo"), ("1727", r"toshkent\s+viloyat"),
    ("1726", r"toshkent\s+shahr"), ("1730", r"farg"), ("1733", r"xorazm"),
)
_REGION_WORD_RE = re.compile(
    r"(respublikasi(da|ning|)|viloyati(da|ning|)|shahri(da|ning|)|bo['‘’ʻ`]?yicha)", re.IGNORECASE)


def region_in_title(title):
    """Nomdagi hudud -> (SOATO, nom hududsiz "guruh kaliti") yoki (None, None)."""
    text = clean_name(title)
    plain = re.sub(r"[‘’ʻ'`]", "", text).lower()
    for code, pattern in REGION_PATTERNS:
        match = re.search(pattern, plain)
        if match:
            # guruh kaliti: hudud nomi va unga yopishgan so'z olib tashlanadi, qolgani — bir xil
            rest = re.sub(r"\(.*?\)", " ", plain)
            rest = re.sub(pattern + r"\w*", " ", rest)
            rest = _REGION_WORD_RE.sub(" ", rest)
            rest = re.sub(r"[^\w]+", " ", rest).strip()
            return code, rest
    return None, None


_REGION_PHRASE_RE = re.compile(
    r"(Qoraqalpog.?iston|Andijon|Buxoro|Jizzax|Qashqadaryo|Navoiy|Namangan|Samarqand|Surxondaryo|Sirdaryo|"
    r"Toshkent|Farg.?ona|Xorazm)\s+(Respublikasi|viloyati|shahri)\w*\s*(bo.?yicha)?\s*,?\s*", re.IGNORECASE)


def strip_region(title):
    """Ko'rsatish uchun nomdan hudud qismini olib tashlaydi: yig'ma ko'rsatkich nomi."""
    text = _REGION_PHRASE_RE.sub("", clean_name(title))
    text = re.sub(r"\(\s*,?\s*", "(", text)
    text = re.sub(r"\s*,?\s*\)", ")", text).replace("()", "")
    text = re.sub(r"\s{2,}", " ", text).strip(" ,")
    return text[:1].upper() + text[1:]
