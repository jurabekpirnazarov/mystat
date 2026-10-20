"""JT-02: aholi soati — stat.uz bosh sahifasidagi "Doimiy aholi soni" hisoblagichi bilan sinxronlash.

stat.uz sahifasida hisoblagich parametrlari ochiq JavaScript o'zgaruvchilari sifatida beriladi:

    let start_date = "01.10.2026";  // boshlang'ich nuqta (oy boshi, Toshkent vaqti 00:00)
    let population = "39535225";    // shu sanadagi doimiy aholi
    let sec = 1696679;              // start_date dan sahifa yaratilgan paytgacha o'tgan soniyalar
    let birth_p = 30; let death_p = 220; let arrive_p = 85; let depart_p = 84;   // "har N soniyada bitta"

Hozirgi raqam (stat.uz formulasi): population + ceil(sec/birth) − ceil(sec/death) + ceil(sec/arrive) − ceil(sec/depart).
Biz `PopulationAnchor` ga boshlang'ich nuqta va parametrlarni yozamiz; soat brauzerda shu formula bilan yuradi.
Sahifa tuzilishi o'zgarsa `ParseError` — eski nuqta saqlanib qoladi (soat to'xtamaydi).
"""
import datetime as dt
import math
import re
import zoneinfo

import requests

STAT_UZ_URL = "https://stat.uz/uz/"
TASHKENT = zoneinfo.ZoneInfo("Asia/Tashkent")
FIELDS = {
    "start_date": r'let\s+start_date\s*=\s*"(\d{2}\.\d{2}\.\d{4})"',
    "population": r'let\s+population\s*=\s*"(\d+)"',
    "sec": r"let\s+sec\s*=\s*(\d+)",
    "birth": r"let\s+birth_p\s*=\s*(\d+)",
    "death": r"let\s+death_p\s*=\s*(\d+)",
    "arrive": r"let\s+arrive_p\s*=\s*(\d+)",
    "depart": r"let\s+depart_p\s*=\s*(\d+)",
}


class ParseError(Exception):
    pass


def parse(html):
    """stat.uz HTML -> dict (as_of, population, sec, birth, death, arrive, depart, current)."""
    found = {}
    for key, rx in FIELDS.items():
        m = re.search(rx, html)
        if not m:
            raise ParseError(f"stat.uz sahifasida `{key}` topilmadi — hisoblagich tuzilishi o'zgargan bo'lishi mumkin")
        found[key] = m.group(1)
    day, month, year = (int(x) for x in found["start_date"].split("."))
    data = {"as_of": dt.datetime(year, month, day, tzinfo=TASHKENT), "population": int(found["population"]),
            **{k: int(found[k]) for k in ("sec", "birth", "death", "arrive", "depart")}}
    if min(data["birth"], data["death"], data["arrive"], data["depart"]) <= 0:
        raise ParseError("stat.uz hisoblagich parametrlari noto'g'ri (0 yoki manfiy)")
    data["current"] = official_value(data, data["sec"])
    data["page_time"] = data["as_of"] + dt.timedelta(seconds=data["sec"])
    return data


def official_value(params, sec):
    """stat.uz bilan bir xil hisob (ceil bilan)."""
    return (params["population"] + math.ceil(sec / params["birth"]) - math.ceil(sec / params["death"])
            + math.ceil(sec / params["arrive"]) - math.ceil(sec / params["depart"]))


def fetch(url=STAT_UZ_URL, timeout=30):
    resp = requests.get(url, timeout=timeout, headers={"User-Agent": "my.stat.uz population-sync"})
    resp.raise_for_status()
    return resp.text


def estimate(anchor, at):
    """Bizdagi soat `at` paytida nima ko'rsatadi (frontend formulasi bilan bir xil)."""
    seconds = (at - anchor.as_of).total_seconds()
    net = anchor.net_per_second
    if net is not None:
        return anchor.population + seconds * net
    rate = (anchor.annual_growth_pct or 0) / 100
    return anchor.population * (1 + rate) ** (seconds / (365.2425 * 86400))


def sync(html=None, dry_run=False):
    """-> dict hisobot: rasmiy raqam, bizniki (yangilashdan oldin), farq, nima qilindi."""
    from .models import PopulationAnchor

    data = parse(html if html is not None else fetch())
    latest = PopulationAnchor.objects.first()
    before = round(estimate(latest, data["page_time"])) if latest else None
    same = latest is not None and (
        latest.as_of == data["as_of"] and latest.population == data["population"]
        and (latest.birth_seconds, latest.death_seconds, latest.arrive_seconds, latest.depart_seconds)
        == (data["birth"], data["death"], data["arrive"], data["depart"]))
    action = "unchanged" if same else ("would_create" if dry_run else "created")
    if not same and not dry_run:
        PopulationAnchor.objects.create(
            population=data["population"], as_of=data["as_of"], birth_seconds=data["birth"],
            death_seconds=data["death"], arrive_seconds=data["arrive"], depart_seconds=data["depart"],
            source="stat.uz — doimiy aholi soni hisoblagichi", source_url=STAT_UZ_URL)
    return {**data, "ours_before": before, "diff_before": None if before is None else data["current"] - before,
            "action": action}
