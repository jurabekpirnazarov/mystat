"""Mobil ilova uchun ichiga joylanadigan namuna (test) ma'lumotlarni yaratadi.

Manbalar (hammasi mystat/ papkasidan):
  - korxona_scoring/namuna_korxonalar.csv, namuna_scoring.csv  -> companies.json
  - BOSH_SAHIFA_VIDJETLAR.md 3.3, 5.3                           -> regions.json, indicators.json
  - HIBRID_DIZAYN.md 6.4, OS-H-09                                -> topics.json
  - MYGOV_JORIY_ETISH.md 4.1, 4.2                                -> services.json
  - HISOBOT_TOPSHIRISH_VA_YANGI_FUNKSIYALAR.md HT-01..03,
    stat-hisobot/ANALIZ.md (1-KB, MEHNAT, INVEST demo shakllari)  -> report_forms.json, report_obligations.json
  - KORXONA_SCORING.md 4.5, 4.6, 4.8                             -> scoring_meta.json

Ko'rsatkich qiymatlari va ob-havo SINTETIK (seed bilan), rasmiy statistika emas.
Har faylda "is_sample": true. Ishga tushirish:

    python3 generate_mobile_data.py            # JSON fayllar shu papkaga
    python3 generate_mobile_data.py --sqlite   # + mystat_demo.db
"""
import csv
import json
import random
import sqlite3
import sys
from datetime import date, timedelta
from pathlib import Path

HERE = Path(__file__).resolve().parent
MYSTAT = HERE.parent
SEED = 42
DATASET_VERSION = "2026.10.27-namuna.1"
REFERENCE_DATE = "2026-10-27"
SAMPLE_NOTE = "Namuna ma'lumot. Rasmiy statistika emas, faqat ilovani sinash uchun."

rnd = random.Random(SEED)


def dump(name, payload):
    body = {"is_sample": True, "dataset_version": DATASET_VERSION, **payload}
    (HERE / name).write_text(json.dumps(body, ensure_ascii=False, indent=1 if name != "companies.json" else None,
                                        separators=None if name != "companies.json" else (",", ":")),
                             encoding="utf-8")


# --- Hududlar (BOSH_SAHIFA_VIDJETLAR 5.3) ---------------------------------------------
REGIONS = [
    # soato, uz, cry, ru, markaz, lat, lon, aholi_2026 (ming, sintetik baza)
    ("1700", "Respublika", "Республика", "Республика", "Toshkent", 41.31, 69.28, None),
    ("1735", "Qoraqalpog'iston Respublikasi", "Қорақалпоғистон Республикаси", "Республика Каракалпакстан", "Nukus", 42.46, 59.60, 2058.3),
    ("1703", "Andijon viloyati", "Андижон вилояти", "Андижанская область", "Andijon", 40.78, 72.34, 3400.0),
    ("1706", "Buxoro viloyati", "Бухоро вилояти", "Бухарская область", "Buxoro", 39.77, 64.42, 2060.0),
    ("1708", "Jizzax viloyati", "Жиззах вилояти", "Джизакская область", "Jizzax", 40.12, 67.84, 1480.0),
    ("1710", "Qashqadaryo viloyati", "Қашқадарё вилояти", "Кашкадарьинская область", "Qarshi", 38.86, 65.79, 3650.0),
    ("1712", "Navoiy viloyati", "Навоий вилояти", "Навоийская область", "Navoiy", 40.10, 65.38, 1070.0),
    ("1714", "Namangan viloyati", "Наманган вилояти", "Наманганская область", "Namangan", 41.00, 71.67, 3100.0),
    ("1718", "Samarqand viloyati", "Самарқанд вилояти", "Самаркандская область", "Samarqand", 39.65, 66.96, 4300.0),
    ("1722", "Surxondaryo viloyati", "Сурхондарё вилояти", "Сурхандарьинская область", "Termiz", 37.22, 67.28, 2950.0),
    ("1724", "Sirdaryo viloyati", "Сирдарё вилояти", "Сырдарьинская область", "Guliston", 40.49, 68.78, 930.0),
    ("1726", "Toshkent shahri", "Тошкент шаҳри", "город Ташкент", "Toshkent", 41.31, 69.28, 3100.0),
    ("1727", "Toshkent viloyati", "Тошкент вилояти", "Ташкентская область", "Nurafshon", 41.04, 69.36, 3050.0),
    ("1730", "Farg'ona viloyati", "Фарғона вилояти", "Ферганская область", "Farg'ona", 40.39, 71.78, 4150.0),
    ("1733", "Xorazm viloyati", "Хоразм вилояти", "Хорезмская область", "Urganch", 41.55, 60.63, 1980.0),
]
# CSV dagi hudud nomi -> SOATO (namuna_korxonalar.csv da hudud_soato bor, bu faqat tekshiruv uchun)
YEARS = list(range(2017, 2027))


def regions_json():
    return [{"soato": s, "name": {"uz": uz, "cry": cry, "ru": ru}, "center": c, "lat": la, "lon": lo,
             "is_country": s == "1700"} for s, uz, cry, ru, c, la, lo, _ in REGIONS]


# --- Ko'rsatkichlar katalogi (BOSH_SAHIFA_VIDJETLAR 3.3) --------------------------------
INDICATORS = [
    dict(key="population", indicator_key="population-total", title={"uz": "Doimiy aholi soni", "ru": "Численность постоянного населения", "cry": "Доимий аҳоли сони"},
         unit="ming kishi", siat_id=246, scope="region", change_kind="percent", periodicity="Y", default=True, topic="population"),
    dict(key="gdp_growth", indicator_key="gdp-growth", title={"uz": "YaIM o'sish sur'ati", "ru": "Темп роста ВВП", "cry": "ЯИМ ўсиш суръати"},
         unit="%", siat_id=658, scope="region", change_kind="pp", periodicity="Y", default=True, topic="national-accounts"),
    dict(key="inflation", indicator_key="cpi-annual", title={"uz": "Inflyatsiya (ISN, yillik)", "ru": "Инфляция (ИПЦ, годовая)", "cry": "Инфляция (ИНИ, йиллик)"},
         unit="%", siat_id=None, scope="country", change_kind="pp", periodicity="Y", default=True, topic="prices"),
    dict(key="unemployment", indicator_key="unemployment-rate", title={"uz": "Ishsizlik darajasi", "ru": "Уровень безработицы", "cry": "Ишсизлик даражаси"},
         unit="%", siat_id=1875, scope="region", change_kind="pp", periodicity="Y", default=True, topic="labour"),
    dict(key="wage", indicator_key="avg-wage", title={"uz": "O'rtacha oylik ish haqi", "ru": "Среднемесячная заработная плата", "cry": "Ўртача ойлик иш ҳақи"},
         unit="ming so'm", siat_id=500, scope="region", change_kind="percent", periodicity="Y", default=False, topic="labour"),
    dict(key="gdp_per_capita", indicator_key="gdp-per-capita", title={"uz": "Aholi jon boshiga YaIM", "ru": "ВВП на душу населения", "cry": "Аҳоли жон бошига ЯИМ"},
         unit="ming so'm", siat_id=660, scope="region", change_kind="percent", periodicity="Y", default=False, topic="national-accounts"),
    dict(key="trade_turnover", indicator_key="trade-turnover", title={"uz": "Tashqi savdo aylanmasi", "ru": "Внешнеторговый оборот", "cry": "Ташқи савдо айланмаси"},
         unit="mlrd AQSh dollari", siat_id=None, scope="country", change_kind="percent", periodicity="Y", default=False, topic="trade"),
    dict(key="enterprises", indicator_key="active-enterprises", title={"uz": "Faoliyat yuritayotgan korxonalar", "ru": "Действующие предприятия", "cry": "Фаолият юритаётган корхоналар"},
         unit="ming", siat_id=None, scope="region", change_kind="percent", periodicity="Y", default=False, topic="enterprises"),
]


def series_growth(last, rate, jitter):
    vals = [last]
    for _ in YEARS[:-1]:
        vals.append(vals[-1] / (1 + rate + rnd.uniform(-jitter, jitter)))
    return list(reversed(vals))


def series_level(center, spread, trend=0.0):
    return [center + trend * (i - len(YEARS) + 1) + rnd.uniform(-spread, spread) for i in range(len(YEARS))]


def indicator_values():
    """[{indicator, soato, year, value, preliminary}] - SINTETIK."""
    rows = []
    reg = [r for r in REGIONS if r[0] != "1700"]
    per_region = {}
    for s, *_, pop in reg:
        tash = s == "1726"
        per_region[s] = {
            "population": series_growth(pop, 0.019, 0.003),
            "gdp_growth": series_level(6.0, 1.2),
            "unemployment": series_level(5.2 if tash else 6.3, 0.6, trend=-0.15),
            "wage": series_growth(rnd.uniform(9800, 10800) if tash else rnd.uniform(4600, 6200), 0.16, 0.03),
            "gdp_per_capita": series_growth(rnd.uniform(68000, 80000) if tash else rnd.uniform(24000, 42000), 0.18, 0.03),
            "enterprises": series_growth(rnd.uniform(70, 80) if tash else rnd.uniform(11, 32), 0.07, 0.02),
        }
    for key, vals_by in [(k, {s: v[k] for s, v in per_region.items()}) for k in per_region["1726"]]:
        for s, vals in vals_by.items():
            for y, v in zip(YEARS, vals):
                rows.append((key, s, y, v))
        # Respublika: yig'indi yoki o'rtacha
        for i, y in enumerate(YEARS):
            col = [vals_by[s][i] for s in vals_by]
            if key in ("population", "enterprises"):
                v = sum(col)
            else:
                v = sum(col) / len(col)
            rows.append((key, "1700", y, v))
    for key, vals in [("inflation", series_level(10.5, 2.0, trend=-0.5)),
                      ("trade_turnover", series_growth(68.0, 0.12, 0.05))]:
        for y, v in zip(YEARS, vals):
            rows.append((key, "1700", y, v))
    digits = {"population": 1, "gdp_growth": 1, "unemployment": 1, "wage": 0, "gdp_per_capita": 0,
              "enterprises": 1, "inflation": 1, "trade_turnover": 1}
    return [{"indicator": k, "soato": s, "period": str(y), "value": round(v, digits[k]),
             "preliminary": y == YEARS[-1]} for k, s, y, v in rows]


# --- Ob-havo (BOSH_SAHIFA_VIDJETLAR 5.2 shakli, SINTETIK) -------------------------------
CODES = ["clear", "partly_cloudy", "cloudy", "rain"]


def weather_json():
    ref = date.fromisoformat(REFERENCE_DATE)
    out = []
    for s, *_rest in REGIONS:
        city = _rest[3]
        base = rnd.uniform(10, 19)
        out.append({
            "soato": s, "city": city, "observed_at": f"{REFERENCE_DATE}T10:00:00+05:00",
            "current": {"temp": round(base, 1), "feels_like": round(base - rnd.uniform(0.5, 2.5), 1),
                        "code": rnd.choice(CODES), "wind_ms": round(rnd.uniform(1, 6), 1), "humidity": rnd.randint(30, 70)},
            "daily": [{"date": (ref + timedelta(days=d)).isoformat(), "code": rnd.choice(CODES),
                       "t_max": round(base + rnd.uniform(-3, 3)), "t_min": round(base - rnd.uniform(6, 10))} for d in (1, 2, 3)],
            "stale": True,
        })
    return out


# --- Mavzular (HIBRID 6.4, OS-H-09) -----------------------------------------------------
TOPICS = [
    ("population", "Aholi", 6), ("prices", "Narxlar va inflyatsiya", 5), ("labour", "Mehnat", 7),
    ("national-accounts", "Milliy hisoblar", None), ("trade", "Tashqi savdo", 3), ("industry", "Sanoat", 9),
    ("agriculture", "Qishloq xo'jaligi", None), ("construction", "Qurilish", None),
    ("retail-services", "Savdo va xizmatlar", None), ("enterprises", "Korxonalar", 1),
    ("education-health", "Ta'lim va sog'liq", None), ("regions", "Hududlar", 8),
]

# --- Xizmatlar katalogi (MYGOV_JORIY_ETISH 4.1, 4.2) -----------------------------------
SPHERES = {1: "Korxonalar va tashkilotlar", 2: "Hisobot topshirish", 3: "Tashqi savdo", 4: "Biznes tahlili",
           5: "Narxlar va inflyatsiya", 6: "Aholi va demografiya", 7: "Mehnat va ish haqi", 8: "Hududlar",
           9: "Sanoat", 10: "Nashrlar", 11: "Tasniflagichlar va metodologiya", 12: "Ochiq ma'lumotlar",
           13: "Fuqarolar uchun", 14: "Tariflar va shartnomalar"}
# number, title, web_route, prod, mobile: offline | web | cabinet
SERVICES = [
    (101, "Kontragent kartasi", "/check", "live", "offline"), (102, "Korxona ma'lumoti (STIR bo'yicha)", "/orginfo", "live", "web"),
    (103, "Korxonalar ro'yxati (KTUT)", "/organizations", "live", "offline"), (104, "Statistik kodlar ma'lumotnomasi", "/stat-codes", "live", "web"),
    (105, "Ma'lumotnomani tekshirish", "/stat-codes/verify", "live", "web"), (106, "Korxona bali", "/company/:stir", "hidden", "offline"),
    (107, "Korxona profili (StatCoin)", "/company/:stir", "hidden", "web"), (108, "Korxona pasporti", "/cabinet/organization", "partial", "cabinet"),
    (201, "Hisobot kalendari", "/report-calendar", "live", "offline"), (202, "Hisobotlarim", "/cabinet/reports", "live", "cabinet"),
    (203, "Hisobot shakllari va reglamentlar", "/reports", "live", "offline"),
    (301, "Tashqi savdo statistikasi", "/ex-trade", "live", "offline"), (302, "Bozor tahlili", "/market-report", "live", "web"),
    (303, "Savdo oqimlari", "/trade-flows", "live", "web"),
    (401, "Hamkor va raqobatchi qidiruvi", "/partners", "live", "offline"), (402, "Individual ma'lumot so'rovi", "/cabinet", "live", "web"),
    (403, "Xizmat so'rovlari", "/cabinet", "live", "web"), (404, "Tarmoq benchmarki", "/cabinet", "hidden", "web"),
    (405, "Faoliyat rejasi", "/cabinet", "live", "web"),
    (501, "Inflyatsiya (ISN) kalkulyatori", "/cpi-calculator", "live", "offline"), (502, "Narxlar va iste'mol savati", "/prices", "hidden", "web"),
    (601, "Demografik ma'lumotlar", "/demographics", "live", "offline"), (602, "Aholi paneli va aholi soati", "/dashboards/aholi", "live", "offline"),
    (603, "Ismlar statistikasi", "/names", "hidden", "web"),
    (701, "Mehnat paneli", "/dashboards/mehnat", "live", "offline"), (702, "Mening ish haqim", "/my-salary", "hidden", "web"),
    (801, "Hududlar xaritasi", "/regions", "live", "offline"), (802, "Hudud profili", "/regions/:id", "partial", "offline"),
    (803, "Salohiyat indeksi va prognoz", "/regions", "live", "web"),
    (901, "Sanoat ishlab chiqaruvchilari", "/industry", "live", "web"), (902, "Iqtisodiyot paneli", "/dashboards/iqtisodiyot", "live", "offline"),
    (1001, "Kitob do'koni", "/books", "live", "web"), (1002, "Statistik byulletenlar, e-kitoblar", "/cabinet", "live", "web"),
    (1003, "Pochta bo'limlari xaritasi", "/book-order/map", "live", "web"),
    (1101, "Statistik tasniflagichlar", "/statistical-classifications", "partial", "web"), (1102, "Lug'at", "/glossary", "live", "web"),
    (1103, "Korxona bali metodologiyasi", "/methodology/company-score", "live", "offline"),
    (1104, "Kontragent kartasi metodologiyasi", "/methodology/company-card", "live", "web"),
    (1201, "E'lonlar kalendari", "/release-calendar", "live", "web"), (1202, "Ochiq API", "/developers", "live", "web"),
    (1203, "Mavzuli panellar", "/dashboards/:slug", "live", "offline"), (1204, "Ko'rsatkichlarga obuna va sevimlilar", "/cabinet", "live", "offline"),
    (1301, "Savol bering (Savollarim)", "/answers", "live", "web"), (1302, "Statistika oddiy tilda", "/learn", "live", "web"),
    (1303, "So'rovnomalar", "/surveys", "partial", "web"), (1304, "Fuqarolar markazi", "/citizens", "live", "web"),
    (1401, "Tarif paketlari va kalkulyator", "/tariffs", "live", "web"), (1402, "Konsultatsiya", "/consultation", "hidden", "web"),
    (1403, "Shartnomalar va to'lovlar", "/cabinet", "live", "web"), (1404, "StatCoin hamyoni", "/cabinet", "partial", "web"),
]
POPULAR = [101, 201, 301, 501, 601, 801, 302, 401, 1201, 104, 1401, 1202]

# --- Hisobot shakllari (ANALIZ demo shakllari + HT-01 qoidalari) ------------------------
FORMS = [
    {"code": "1-KB", "name": "Kichik korxona faoliyati (soddalashtirilgan namuna)", "periodicity": "Q", "deadline_rule": "Q+25d"},
    {"code": "MEHNAT", "name": "Mehnat bo'yicha hisobot (soddalashtirilgan namuna)", "periodicity": "M", "deadline_rule": "M+10d"},
    {"code": "INVEST", "name": "Investitsiyalar bo'yicha hisobot (soddalashtirilgan namuna)", "periodicity": "Q", "deadline_rule": "Q+20d"},
    {"code": "1-KORXONA", "name": "Korxona faoliyati, yillik (soddalashtirilgan namuna)", "periodicity": "Y", "deadline_rule": "Y+90d"},
]


def periods_for(periodicity, year):
    if periodicity == "M":
        return [(f"{year}-{m:02d}", date(year + (m == 12), m % 12 + 1, 1) - timedelta(days=1)) for m in range(1, 13)]
    if periodicity == "Q":
        return [(f"{year} Q{q}", date(year + (q == 4), (q * 3) % 12 + 1, 1) - timedelta(days=1)) for q in range(1, 5)]
    return [(str(year), date(year, 12, 31))]


def deadline(period_end, rule):
    return period_end + timedelta(days=int(rule.split("+")[1].rstrip("d")))


def report_obligations(demo_stirs):
    """Demo korxonalar uchun "majburiyat x davr" qatorlari (HT-02). Holat faqat submitted/unknown saqlanadi,
    due_soon/overdue ilovada qurilma sanasidan hisoblanadi (HT-03)."""
    ref = date.fromisoformat(REFERENCE_DATE)
    out = []
    for stir in demo_stirs:
        for f in FORMS:
            for year in (2025, 2026):
                for period, end in periods_for(f["periodicity"], year):
                    dl = deadline(end, f["deadline_rule"])
                    if end > ref + timedelta(days=92):
                        continue  # kelajakdan faqat keyingi davr
                    row = {"stir": stir, "form_code": f["code"], "period": period, "deadline": dl.isoformat(),
                           "status": "unknown", "submitted_at": None}
                    if dl < ref and rnd.random() < 0.85:
                        late = rnd.random() < 0.15
                        row["status"] = "submitted"
                        row["submitted_at"] = (dl + timedelta(days=rnd.randint(1, 9)) if late else dl - timedelta(days=rnd.randint(0, 12))).isoformat()
                    out.append(row)
    return out


# --- Korxonalar (namuna CSV'lardan) -----------------------------------------------------
def num(v, cast=float):
    return None if v in ("", None) else cast(float(v))


def companies():
    with open(MYSTAT / "korxona_scoring/namuna_korxonalar.csv", encoding="utf-8") as f:
        base = {r["stir"]: r for r in csv.DictReader(f)}
    with open(MYSTAT / "korxona_scoring/namuna_scoring.csv", encoding="utf-8") as f:
        scores = {r["stir"]: r for r in csv.DictReader(f)}
    out = []
    for stir, r in base.items():
        s = scores.get(stir, {})
        out.append({
            "stir": stir, "name": r["nomi"], "oked_section": r["oked_bolim"], "oked_section_name": r["oked_bolim_nomi"],
            "oked_division": r["oked_bolinma"], "oked_division_name": r["oked_bolinma_nomi"],
            "soato": r["hudud_soato"], "region": r["hudud"], "ownership": r["mulkchilik"], "founded": num(r["tashkil_yili"], int),
            "employees": num(r["xodimlar"], int), "revenue_mln": num(r["tushum_mln"]), "net_profit_mln": num(r["sof_foyda_mln"]),
            "avg_wage_thousand": num(r["ortacha_ish_haqi_ming"]), "export_thousand_usd": num(r["eksport_ming_usd"]),
            "import_thousand_usd": num(r["import_ming_usd"]), "women_share": num(r["ayollar_ulushi"]),
            "reports_due": num(r["hisobotlar_soni"], int), "reports_on_time": num(r["oz_vaqtida_topshirilgan"], int),
            "tax_debt": r["soliq_qarzi"] == "1",
            "score": {
                "overall": num(s.get("umumiy_ball")), "klass": s.get("sinf") or "—", "coverage": num(s.get("toliqlik")),
                "peer_group": s.get("tengdoshlar_guruhi"),
                "pillars": {p: num(s.get(f"ustun_{p}")) for p in "MOTXIS"},
                "flags": [x for x in (s.get("bayroqlar") or "").split("|") if x],
                "preset": s.get("preset", "muvozanatli"), "data_source": "synthetic",
            },
        })
    return out


SCORING_META = {
    "classes": [{"klass": "A", "label": "Yuqori", "min": 70}, {"klass": "B", "label": "Yaxshi", "min": 58},
                {"klass": "C", "label": "O'rta", "min": 45}, {"klass": "D", "label": "Past", "min": 35},
                {"klass": "E", "label": "Xavf zonasi", "min": 0}, {"klass": "—", "label": "Ma'lumot yetarli emas", "min": None}],
    "pillars": {"M": "Moliyaviy holat", "O": "O'sish va investitsiya", "T": "Tashqi savdo", "X": "Mehnat resurslari",
                "I": "Inklyuzivlik", "S": "Intizom va ishonchlilik"},
    "presets": {"muvozanatli": {"M": 20, "O": 15, "T": 15, "X": 20, "I": 15, "S": 15},
                "hamkor": {"M": 30, "O": 20, "T": 20, "X": 10, "I": 5, "S": 15},
                "bank": {"M": 35, "O": 15, "T": 5, "X": 10, "I": 5, "S": 30},
                "eksport": {"M": 20, "O": 15, "T": 40, "X": 10, "I": 5, "S": 10},
                "ijtimoiy": {"M": 5, "O": 15, "T": 5, "X": 30, "I": 30, "S": 15}},
    "flags": {"soliq_qarzi": "Soliq qarzi bor (ball 57 dan oshmaydi)", "hisobot_intizomi_past": "Hisobotlarning yarmidan kami o'z vaqtida",
              "zarar_bilan_ishlagan": "Zarar bilan ishlagan"},
    "min_coverage": 0.6, "partial_coverage": 0.85,
    "disclaimer": "Korxona bali rasmiy baho emas. Namuna ballar sintetik korxonalar uchun hisoblangan.",
}

STATUSES = [
    {"code": "not_started", "label": "Topshirilmagan", "tone": "neutral"},
    {"code": "due_soon", "label": "Muddati yaqin", "tone": "warning", "computed": True, "days": 5},
    {"code": "overdue", "label": "Muddati o'tgan", "tone": "danger", "computed": True},
    {"code": "submitted", "label": "Topshirilgan", "tone": "info"},
    {"code": "accepted", "label": "Qabul qilingan", "tone": "success"},
    {"code": "rejected", "label": "Rad etilgan", "tone": "danger"},
    {"code": "unknown", "label": "Ma'lumot yo'q", "tone": "neutral"},
]


def main():
    comps = companies()
    # Demo kabinet uchun 3 korxona: kichik, o'rta, yirik (deterministik tanlov)
    by_size = {}
    for c in sorted(comps, key=lambda c: c["stir"]):
        e = c["employees"] or 0
        k = "kichik" if e <= 50 else "orta" if e <= 250 else "yirik"
        if k not in by_size and c["score"]["klass"] != "—":
            by_size[k] = c
    demo_orgs = [by_size[k] for k in ("kichik", "orta", "yirik") if k in by_size]

    dump("meta.json", {"generated_for": "mystat mobil ilova (offline demo)", "reference_date": REFERENCE_DATE,
                       "note": SAMPLE_NOTE, "seed": SEED,
                       "files": ["regions.json", "indicators.json", "indicator_values.json", "weather.json", "topics.json",
                                 "services.json", "report_forms.json", "report_obligations.json", "companies.json",
                                 "scoring_meta.json", "demo_user.json", "notifications.json"]})
    dump("regions.json", {"items": regions_json()})
    dump("indicators.json", {"items": INDICATORS, "default_cards": [i["key"] for i in INDICATORS if i["default"]]})
    dump("indicator_values.json", {"note": "SINTETIK qiymatlar (seed=42), rasmiy emas", "items": indicator_values()})
    dump("weather.json", {"note": "SINTETIK ob-havo, provayder ulanmagan", "items": weather_json()})
    dump("topics.json", {"items": [{"slug": s, "title": t, "sphere_id": sp} for s, t, sp in TOPICS]})
    dump("services.json", {"spheres": [{"id": k, "title": v} for k, v in SPHERES.items()],
                           "items": [{"number": n, "sphere_id": n // 100, "title": t, "web_route": r, "prod": p,
                                      "mobile": m, "popular": n in POPULAR} for n, t, r, p, m in SERVICES],
                           "popular_order": POPULAR})
    dump("report_forms.json", {"items": FORMS, "statuses": STATUSES})
    dump("report_obligations.json", {"items": report_obligations([o["stir"] for o in demo_orgs])})
    dump("companies.json", {"items": comps})
    dump("scoring_meta.json", SCORING_META)
    dump("demo_user.json", {"login": "demo", "password_hint": "Faqat offline demo, haqiqiy kirish yo'q",
                            "full_name": "Demo Foydalanuvchi", "type": "legal",
                            "organizations": [{"stir": o["stir"], "name": o["name"]} for o in demo_orgs],
                            "statcoin_balance": 12, "active_package": {"name": "Paket 2 (namuna)", "orginfo_left": 87}})
    dump("notifications.json", {"items": [
        {"id": 1, "kind": "report_due", "title": "1-KB hisoboti muddati yaqin", "body": "2026 Q3 davri uchun muddat 25-oktabr.", "created_at": "2026-10-20T09:00:00+05:00", "read": False},
        {"id": 2, "kind": "release", "title": "Yangi e'lon: ISN, sentyabr", "body": "Iste'mol narxlari indeksi e'lon qilindi (namuna).", "created_at": "2026-10-03T10:00:00+05:00", "read": True},
        {"id": 3, "kind": "answer", "title": "Savolingizga javob keldi", "body": "Hisobot shakllari bo'yicha savolingizga javob berildi (namuna).", "created_at": "2026-10-18T15:30:00+05:00", "read": False},
    ]})
    if "--sqlite" in sys.argv:
        build_sqlite(comps)
    print("OK", len(comps), "korxona;", "demo:", [o["stir"] for o in demo_orgs])


def build_sqlite(comps):
    db = HERE / "mystat_demo.db"
    db.unlink(missing_ok=True)
    con = sqlite3.connect(db)
    con.executescript("""
    CREATE TABLE meta(key TEXT PRIMARY KEY, value TEXT);
    CREATE TABLE region(soato TEXT PRIMARY KEY, name_uz TEXT, name_cry TEXT, name_ru TEXT, center TEXT, lat REAL, lon REAL);
    CREATE TABLE indicator(key TEXT PRIMARY KEY, json TEXT);
    CREATE TABLE indicator_value(indicator TEXT, soato TEXT, period TEXT, value REAL, preliminary INTEGER,
                                 PRIMARY KEY(indicator, soato, period));
    CREATE TABLE company(stir TEXT PRIMARY KEY, name TEXT, oked_section TEXT, soato TEXT, employees INTEGER,
                         overall REAL, klass TEXT, json TEXT);
    CREATE INDEX company_filter ON company(soato, oked_section, klass);
    CREATE VIRTUAL TABLE company_fts USING fts5(stir, name, content='company', content_rowid='rowid');
    CREATE TABLE report_obligation(stir TEXT, form_code TEXT, period TEXT, deadline TEXT, status TEXT, submitted_at TEXT);
    CREATE INDEX ro_stir ON report_obligation(stir, deadline);
    CREATE TABLE doc(name TEXT PRIMARY KEY, json TEXT);  -- kichik ro'yxatlar: services, topics, weather, scoring_meta ...
    """)
    con.execute("INSERT INTO meta VALUES('dataset_version', ?), ('reference_date', ?), ('is_sample', '1')",
                (DATASET_VERSION, REFERENCE_DATE))
    con.executemany("INSERT INTO region VALUES(?,?,?,?,?,?,?)", [(s, uz, cry, ru, c, la, lo) for s, uz, cry, ru, c, la, lo, _ in REGIONS])
    con.executemany("INSERT INTO indicator VALUES(?,?)", [(i["key"], json.dumps(i, ensure_ascii=False)) for i in INDICATORS])
    vals = json.loads((HERE / "indicator_values.json").read_text(encoding="utf-8"))["items"]
    con.executemany("INSERT INTO indicator_value VALUES(?,?,?,?,?)",
                    [(v["indicator"], v["soato"], v["period"], v["value"], int(v["preliminary"])) for v in vals])
    con.executemany("INSERT INTO company VALUES(?,?,?,?,?,?,?,?)",
                    [(c["stir"], c["name"], c["oked_section"], c["soato"], c["employees"], c["score"]["overall"],
                      c["score"]["klass"], json.dumps(c, ensure_ascii=False)) for c in comps])
    con.execute("INSERT INTO company_fts(company_fts) VALUES('rebuild')")
    obl = json.loads((HERE / "report_obligations.json").read_text(encoding="utf-8"))["items"]
    con.executemany("INSERT INTO report_obligation VALUES(?,?,?,?,?,?)",
                    [(o["stir"], o["form_code"], o["period"], o["deadline"], o["status"], o["submitted_at"]) for o in obl])
    for name in ("services", "topics", "weather", "scoring_meta", "report_forms", "demo_user", "notifications"):
        con.execute("INSERT INTO doc VALUES(?,?)", (name, (HERE / f"{name}.json").read_text(encoding="utf-8")))
    con.commit()
    con.execute("VACUUM")
    con.close()


if __name__ == "__main__":
    main()
