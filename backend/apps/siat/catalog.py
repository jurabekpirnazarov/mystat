"""Kartaga boshlang'ich ko'rsatkichlar (SIAT_KARTA_TAHLIL.md, 3-bo'lim). Admin keyin o'zgartira oladi.

`sync_siat --catalog` sitemap.xml dagi barcha ko'rsatkichlarni tasniflaydi; bu ro'yxat esa birinchi
sinxronlashda qaysilari kartaga chiqishi, mavzusi va shkalasini belgilaydi.
"""

# siat_id: (mavzu, kartada, yuqori yaxshimi, shkala markazi, tartib)
DEFAULT_INDICATORS = {
    246: ("population", True, None, None, 10),    # Doimiy aholi soni (jami), tuman
    245: ("population", False, None, None, 11),   # erkaklar (gender nisbati uchun)
    247: ("population", True, None, None, 12),    # qishloq aholisi, tuman
    500: ("labour", True, True, None, 20),        # O'rtacha oylik ish haqi, tuman
    1875: ("labour", True, False, None, 21),      # Ishsizlik darajasi, tuman
    2818: ("labour", True, False, None, 22),      # Ishsizlik darajasi (erkaklar), viloyat
    1299: ("economy", True, True, None, 30),      # Hududiy YaIM hajmi
    658: ("economy", True, True, 100.0, 31),      # Hududiy YaIM o'sish sur'ati
    660: ("economy", True, True, None, 32),       # Aholi jon boshiga hududiy YaIM
    1460: ("economy", True, True, 100.0, 33),     # Dehqon xo'jaliklari mahsuloti o'sishi
    1409: ("social", True, True, None, 40),       # Maktabgacha ta'lim tashkilotlari
    3843: ("economy", True, None, None, 36),      # Norasmiy iqtisodiyot hajmi, viloyat
    3846: ("economy", True, False, None, 37),     # Norasmiy iqtisodiyotning YaHM'dagi ulushi
}
# Har hudud uchun alohida jadval: bitta yig'ma ko'rsatkichga birlashtiriladi (KR-02, 3-qadam)
DEFAULT_GROUPS = {
    "industry-by-activity": (range(4604, 4618), "economy", 34),     # Sanoat mahsuloti, faoliyat turlari
    "investment-by-activity": (range(2599, 2613), "economy", 35),   # Investitsiyalar, faoliyat turlari
}
EXTRA_SOURCES = [3844, 3845, 3847, 3848]  # Norasmiy/yashirin iqtisodiyot — admin kartaga qo'shishi mumkin

# Hisoblangan ko'rsatkichlar (KR-10): kalit -> (nomi uz/ru/en, birlik uz, manba, mavzu, tartib, yuqori yaxshimi)
DERIVED = {
    "d-density": (("Aholi zichligi", "Плотность населения", "Population density"), "kishi/km²",
                  "SIAT 246 va chegaralar fayli (maydon)", "population", 13, None),
    "d-rural-share": (("Qishloq aholisi ulushi", "Доля сельского населения", "Rural population share"), "%",
                      "SIAT 247 / 246", "population", 14, None),
    "d-pop-growth": (("Aholi o'sishi", "Прирост населения", "Population growth"), "%",
                     "SIAT 246, yildan yilga", "population", 15, True),
    "d-gender-ratio": (("Gender nisbati (100 ayolga erkak)", "Мужчин на 100 женщин", "Men per 100 women"),
                       "erkak / 100 ayol", "SIAT 245 / (246 − 245)", "population", 16, None),
    "d-real-wage": (("Real ish haqi o'sishi", "Рост реальной заработной платы", "Real wage growth"), "%",
                    "SIAT 500 va iste'mol narxlari indeksi", "labour", 23, True),
}

THEME_KEYWORDS = (
    ("population", ("aholi", "tug'il", "vafot", "migratsiya", "demograf")),
    ("labour", ("ish haqi", "ishsiz", "band", "mehnat")),
    ("prices", ("narx", "indeks", "inflyatsiya")),
    ("social", ("ta'lim", "maktab", "sog'liq", "shifoxona", "kasalxona", "uy-joy")),
    ("economy", ("yaim", "yalpi", "iqtisodiyot", "sanoat", "investitsiya", "savdo", "qishloq xo'jaligi", "eksport", "import",
                 "mahsulot", "xizmat", "qurilish")),
)


def guess_theme(name):
    text = (name or "").lower().replace("‘", "'").replace("’", "'").replace("ʻ", "'").replace("`", "'")
    for theme, words in THEME_KEYWORDS:
        if any(w in text for w in words):
            return theme
    return "other"


def tracked_ids():
    ids = list(DEFAULT_INDICATORS)
    for members, _, _ in DEFAULT_GROUPS.values():
        ids.extend(members)
    return ids + EXTRA_SOURCES
