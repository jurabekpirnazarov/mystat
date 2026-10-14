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


def sector_label(sector, with_code=True):
    if sector is None:
        return None
    name = fix_lookalikes((sector.name_uz or sector.name or "").strip())
    name = name[:1].upper() + name[1:].lower() if name.isupper() else name
    return f"{sector.code} · {name}" if with_code else name
