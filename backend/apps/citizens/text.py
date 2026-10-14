"""Ism qidiruvi uchun lotin/kirill moslashtirish (FQ-09: "Muhammad" va "Мухаммад" bir xil natija)."""

_CYR_TO_LAT = {
    "а": "a", "б": "b", "в": "v", "г": "g", "д": "d", "е": "e", "ё": "yo", "ж": "j", "з": "z", "и": "i", "й": "y",
    "к": "k", "л": "l", "м": "m", "н": "n", "о": "o", "п": "p", "р": "r", "с": "s", "т": "t", "у": "u", "ф": "f",
    "х": "x", "ц": "ts", "ч": "ch", "ш": "sh", "щ": "sh", "ъ": "", "ы": "i", "ь": "", "э": "e", "ю": "yu", "я": "ya",
    "ў": "o", "қ": "q", "ғ": "g", "ҳ": "h",
}


def name_search_key(text):
    """Kichik harfli "fonetik" kalit: kirill → lotin, tutuq va apostroflar olib tashlanadi, x/h, q/k, ye/e birlashtiriladi."""
    s = "".join(_CYR_TO_LAT.get(ch, ch) for ch in (text or "").strip().lower())
    for apos in ("'", "‘", "’", "ʻ", "ʼ", "`"):
        s = s.replace(apos, "")
    s = s.replace("kh", "h").replace("x", "h").replace("q", "k").replace("ye", "e").replace("iy", "i")
    return s
