"""Matn tozalash yordamchilari."""

# Lotin matnga tasodifan aralashgan kirill harflari (bazadagi OKED nomlarida "ISHLАB" kabi)
_LOOKALIKES = str.maketrans("АаВЕеКМНОоРрСсТХху", "AaBEeKMHOoPpCcTXxy")


def fix_lookalikes(text):
    """Asosan lotin bo'lgan matndagi kirill o'xshash harflarni lotinga almashtiradi; kirill matn o'zgarmaydi."""
    if not text:
        return text
    letters = [ch for ch in text if ch.isalpha()]
    latin = sum(1 for ch in letters if ch.isascii())
    if letters and latin / len(letters) >= 0.6:
        return text.translate(_LOOKALIKES)
    return text


_DIGRAPHS = [("o'", "ў"), ("g'", "ғ"), ("sh", "ш"), ("ch", "ч"), ("yo", "ё"), ("yu", "ю"), ("ya", "я"), ("ye", "е")]
_LETTERS = dict(zip("abdefghijklmnopqrstuvxyz", "абдефгҳижклмнопқрстувхйз"))
_APOS = str.maketrans({"‘": "'", "’": "'", "ʻ": "'", "ʼ": "'", "`": "'"})


def uz_latin_to_cyrillic(text):
    """O'zbek lotin yozuvini kirillga o'giradi (asosiy qoidalar: digraflar, so'z boshidagi e → э, tutuq → ъ)."""
    if not text:
        return text
    src = text.translate(_APOS)
    out, i = [], 0
    while i < len(src):
        ch = src[i]
        low = src[i:i + 2].lower()
        pair = next((cyr for lat, cyr in _DIGRAPHS if low == lat), None)
        if pair:
            out.append(pair.upper() if ch.isupper() else pair)
            i += 2
            continue
        lower = ch.lower()
        if lower == "e":
            prev = src[i - 1] if i else " "
            cyr = "э" if not prev.isalpha() else "е"
        elif lower == "'":
            prev = src[i - 1] if i else " "
            cyr = "ъ" if prev.isalpha() and i + 1 < len(src) and src[i + 1].isalpha() else "'"
        else:
            cyr = _LETTERS.get(lower, ch)
        out.append(cyr.upper() if ch.isupper() and cyr != ch else cyr)
        i += 1
    return "".join(out)


def sector_label(sector, with_code=True):
    if sector is None:
        return None
    name = fix_lookalikes((sector.name_uz or sector.name or "").strip())
    name = name[:1].upper() + name[1:].lower() if name.isupper() else name
    return f"{sector.code} · {name}" if with_code else name
