"""KORXONA_SCORING.md 3-bo'lim: korxona ko'rsatkichlari generatori (sintetik, faqat DEBUG=True).

Django'siz sof Python: `seed_demo --only enterprise_scoring` (real KTUT STIR'lari uchun) va namunaviy skript
`korxona_scoring/generate_companies.py` (soxta korxonalar) bir xil funksiyani chaqiradi.

Takrorlanuvchan: har korxona `random.Random(42 + crc32(stir))` bilan — qayta ishga tushirilsa yoki korxonalar
qo'shilsa ham, boshqa korxonaning qiymatlari o'zgarmaydi. Yashirin sifat omili `q ~ N(0, 1)` o'sish, unumdorlik,
marja, ish haqi, staj, intizom va eksport ehtimolini bir yo'nalishda siljitadi (ko'rsatkichlar o'zaro bog'langan).

Qiymatlar taxminiy, faqat namunaning ishonarli ko'rinishi uchun; ular rasmiy statistika emas.
"""
import math
import random
import zlib

YEARS = (2023, 2024, 2025)        # 2023 va 2025 generatsiya, 2024 — oralig'ida interpolyatsiya
BASE_YEAR = 2025
CAPITAL = "1726"                   # Toshkent shahri
NAVOIY = "1712"
USD_RATE = 12_500                  # so'm / AQSh $

# OKED bo'limlari ulushi (taxminiy): savdo ≈32%, sanoat ≈14%, qishloq xo'jaligi ≈9%, qurilish ≈9%
SECTION_SHARE = {"A": 9, "B": 1, "C": 14, "D": 0.5, "E": 1, "F": 9, "G": 32, "H": 4, "I": 5, "J": 3, "K": 1.5,
                 "L": 2, "M": 3, "N": 3, "P": 3, "Q": 3, "R": 1, "S": 2.5}
# Bo'linmalar (2 xonali OKED) va ulushi bo'lim ichida
DIVISIONS = {
    "A": {"01": 85, "02": 5, "03": 10}, "B": {"08": 100}, "C": {"10": 30, "13": 12, "14": 14, "20": 6, "22": 8, "23": 10,
                                                                "25": 12, "28": 8},
    "D": {"35": 100}, "E": {"38": 100}, "F": {"41": 60, "42": 15, "43": 25}, "G": {"45": 10, "46": 30, "47": 60},
    "H": {"49": 80, "52": 20}, "I": {"55": 20, "56": 80}, "J": {"62": 70, "63": 30}, "K": {"64": 60, "66": 40},
    "L": {"68": 100}, "M": {"69": 50, "71": 30, "73": 20}, "N": {"77": 30, "82": 70}, "P": {"85": 100},
    "Q": {"86": 80, "87": 20}, "R": {"93": 100}, "S": {"96": 100},
}
# Hudud ulushi: Toshkent sh. ≈20%, qolganlari aholiga yaqin
REGION_SHARE = {"1726": 20, "1727": 8, "1703": 7.5, "1730": 9, "1718": 7, "1714": 6.5, "1735": 5, "1706": 5,
                "1722": 6, "1710": 6, "1733": 4.5, "1724": 2.8, "1708": 3.3, "1712": 3.4}
# Hudud turi bo'yicha OKED siljishi: poytaxtda J, K, M ko'p; Navoiyda B ko'p; qishloq hududlarida A ko'p
REGION_TILT = {CAPITAL: {"J": 2.5, "K": 2.5, "M": 2.0, "A": 0.15, "B": 0.3, "N": 1.5}, NAVOIY: {"B": 4.0, "C": 1.2}}
RURAL_TILT = {"A": 1.4}

EMP_MEDIAN = {"A": 6, "B": 25, "C": 15, "D": 60, "E": 20, "F": 10, "G": 4, "H": 8, "I": 5, "J": 6, "K": 20, "L": 4,
              "M": 5, "N": 7, "P": 12, "Q": 10, "R": 5, "S": 4}
RPE_MEDIAN = {"A": 120, "B": 900, "C": 450, "D": 1200, "E": 250, "F": 350, "G": 700, "H": 300, "I": 150, "J": 400,
              "K": 1500, "L": 300, "M": 250, "N": 200, "P": 80, "Q": 100, "R": 120, "S": 120}   # mln so'm / yil
WAGE_COEF = {"A": 0.65, "B": 1.6, "C": 0.95, "D": 1.5, "E": 0.9, "F": 1.0, "G": 0.85, "H": 1.05, "I": 0.75, "J": 1.6,
             "K": 1.9, "L": 0.95, "M": 1.2, "N": 0.85, "P": 0.8, "Q": 0.85, "R": 0.8, "S": 0.75}
WOMEN_BASE = {"A": 0.30, "B": 0.12, "C": 0.35, "D": 0.20, "E": 0.25, "F": 0.08, "G": 0.45, "H": 0.12, "I": 0.50,
              "J": 0.30, "K": 0.55, "L": 0.40, "M": 0.45, "N": 0.35, "P": 0.75, "Q": 0.78, "R": 0.45, "S": 0.55}
WOMEN_DIVISION = {"10": 0.45, "13": 0.70, "14": 0.80}
EDU_BASE = {"A": 0.08, "B": 0.25, "C": 0.20, "D": 0.45, "E": 0.20, "F": 0.15, "G": 0.20, "H": 0.18, "I": 0.15,
            "J": 0.70, "K": 0.75, "L": 0.40, "M": 0.65, "N": 0.25, "P": 0.80, "Q": 0.60, "R": 0.35, "S": 0.20}
STAJ_BASE = {"D": 8, "P": 7, "Q": 7, "B": 6, "K": 5.5, "G": 3, "I": 2.5, "F": 3.5, "A": 4.5}
EXPORT_BASE = {"A": 0.10, "B": 0.15, "C": 0.12, "G": 0.04, "H": 0.03}
EXPORT_DIVISION = {"13": 0.35, "14": 0.35, "46": 0.10, "10": 0.15}
EXPORT_SCALE = 0.65              # namunada eksportchilar ≈7% bo'lishi uchun
INVEST_FACTOR = {"B": 3.0, "C": 1.5, "D": 4.0, "E": 1.5, "F": 1.2, "H": 1.5, "K": 2.0, "J": 1.2, "A": 1.0}
# Hudud o'rtacha oylik ish haqi (mln so'm) — ilova SIAT 500 dan uzatadi; bu yerda zaxira qiymat
DEFAULT_WAGE = 5.1
CAPITAL_WAGE = 8.2


def seed_for(stir):
    return 42 + zlib.crc32(str(stir).encode())


def _weighted(rnd, weights):
    total = sum(weights.values())
    x = rnd.random() * total
    for key, w in weights.items():
        x -= w
        if x <= 0:
            return key
    return key


def _poisson(rnd, lam):
    if lam > 30:
        return max(0, int(round(rnd.gauss(lam, math.sqrt(lam)))))
    limit, k, p = math.exp(-lam), 0, 1.0
    while True:
        p *= rnd.random()
        if p <= limit:
            return k
        k += 1


def _binomial(rnd, n, p):
    p = min(max(p, 0.0), 1.0)
    if n <= 0:
        return 0
    if n > 60:
        mean, sd = n * p, math.sqrt(n * p * (1 - p))
        return int(min(n, max(0, round(rnd.gauss(mean, sd)))))
    return sum(1 for _ in range(n) if rnd.random() < p)


def _clip(x, lo, hi):
    return min(max(x, lo), hi)


def pick_profile(rnd, region_codes=None):
    """OKED bo'limi/bo'linmasi, hudud va mulkchilik (real KTUT'da yo'q — sintetik, 'Namuna' bilan)."""
    regions = {c: w for c, w in REGION_SHARE.items() if region_codes is None or c in region_codes} or REGION_SHARE
    region = _weighted(rnd, regions)
    tilt = REGION_TILT.get(region, RURAL_TILT if region not in (CAPITAL, "1727") else {})
    section = _weighted(rnd, {s: w * tilt.get(s, 1.0) for s, w in SECTION_SHARE.items()})
    division = _weighted(rnd, DIVISIONS[section])
    u = rnd.random()
    ownership = "state" if u < 0.05 else "foreign" if u < 0.10 else "private"
    return {"oked_section": section, "oked_division": division, "region_code": region, "ownership": ownership}


def generate(stir, profile=None, region_wage=None, region_codes=None):
    """Bitta korxona. -> {"profile": {...}, "rows": {yil: {maydon: qiymat}}}.

    profile — real ma'lumotdan ma'lum bo'lsa (OKED, hudud, mulkchilik); bo'lmasa sintetik tanlanadi.
    region_wage — {hudud kodi: o'rtacha oylik ish haqi, mln so'm} (SIAT 500).
    """
    rnd = random.Random(seed_for(stir))
    base = pick_profile(rnd, region_codes)
    profile = {**base, **(profile or {})}
    sec, div, region, own = profile["oked_section"], profile["oked_division"], profile["region_code"], profile["ownership"]
    q = rnd.gauss(0, 1)
    capital = region == CAPITAL

    # Yosh va o'lcham
    age = 1 + int(rnd.expovariate(1 / 8))
    founded = max(1992, BASE_YEAR - age + 1)
    size_mult = rnd.uniform(1.5, 3.0) if own != "private" else 1.0
    emp = max(1, int(round(math.exp(math.log(EMP_MEDIAN[sec]) + rnd.gauss(0, 1.05)) * size_mult)))
    emp = min(emp, 20_000)

    # Moliya (mln so'm)
    rpe = RPE_MEDIAN[sec] * (1.25 if capital else 1.0) * math.exp(rnd.gauss(0, 0.6) + 0.25 * q)
    revenue = emp * rpe
    rev_g = rnd.gauss(0.12 + 0.06 * q, 0.15)
    margin = _clip(rnd.gauss(0.06 + 0.04 * q, 0.08), -0.5, 0.5)
    emp_g = rnd.gauss(0.03 + 0.04 * q, 0.12)
    invest = rpe * 0.04 * INVEST_FACTOR.get(sec, 0.6) * math.exp(rnd.gauss(0, 0.8) + 0.3 * q) if rnd.random() < 0.6 else 0.0
    products = 1 + _poisson(rnd, max(0.3, 1.5 + 0.5 * q + 0.3 * math.log(emp))) if sec in "ABC" else None

    # Ish haqi (mln so'm / oy)
    reg_wage = (region_wage or {}).get(region) or (CAPITAL_WAGE if capital else DEFAULT_WAGE)
    wage = reg_wage * WAGE_COEF[sec] * math.exp(0.12 * q + rnd.gauss(0, 0.15)) * (0.82 if emp < 5 else 1.0)

    # Tashqi savdo (ming AQSh $)
    p_exp = EXPORT_DIVISION.get(div, EXPORT_BASE.get(sec, 0.0)) * min(3.0, 1 + 0.3 * math.log(emp)) \
        * (2.0 if own == "foreign" else 1.0) * math.exp(0.35 * q)
    exporter = rnd.random() < min(p_exp * EXPORT_SCALE, 0.9)
    export = countries = hs = export_prev2 = None
    if exporter:
        share = rnd.betavariate(2, 4)
        export = revenue * share * 1000 / USD_RATE      # mln so'm -> ming $
        countries = 1 + _poisson(rnd, 1.5 + 0.3 * math.log(emp))
        hs = 1 + _poisson(rnd, max(0.2, 1 + 0.5 * q))
        export_prev2 = 0.0 if rnd.random() < 0.2 else export / (1 + rnd.gauss(0.1 + 0.1 * q, 0.3)) ** 2
    p_imp = min(0.9, (0.07 + (0.10 if sec in "CG" else 0.0)) * min(3.0, 1 + 0.25 * math.log(emp)) * (1.8 if own == "foreign" else 1))
    imp = revenue * rnd.uniform(0.03, 0.3) * 1000 / USD_RATE if rnd.random() < p_imp else 0.0

    # Mehnat
    staj = _clip(rnd.gauss(STAJ_BASE.get(sec, 4) + 0.7 * q, 1.4), 0.3, float(age))
    turnover = _clip(0.6 / (staj + 0.5) + rnd.gauss(0, 0.05), 0.02, 1.2)
    edu = _clip(EDU_BASE[sec] + 0.05 * q + rnd.gauss(0, 0.08), 0.0, 1.0)
    p_women = _clip(WOMEN_DIVISION.get(div, WOMEN_BASE[sec]) + rnd.gauss(0, 0.08), 0.01, 0.97)
    women = _binomial(rnd, emp, p_women)
    mgmt = max(1, int(round(emp * 0.08)))
    head_female = rnd.random() < min(0.9, p_women * 0.6)
    women_mgmt = _binomial(rnd, mgmt, p_women * 0.7)
    pay_ratio = _clip(rnd.gauss(0.82 + 0.04 * q, 0.10), 0.4, 1.3) if emp >= 6 else None
    youth = _clip(0.28 + (0.07 if sec in "GI" else 0.12 if sec == "J" else 0.0) + rnd.gauss(0, 0.08), 0.0, 1.0)
    disabled = None
    if emp >= 20:
        rate = rnd.uniform(0.03, 0.045) if rnd.random() < 0.5 else rnd.uniform(0.0, 0.02)
        disabled = _binomial(rnd, emp, rate)

    # Intizom
    tax_debt = rnd.random() < 0.07 * math.exp(-0.7 * q)
    tax_amount = revenue * rnd.uniform(0.002, 0.05) * 1000 if tax_debt else None
    reports_due = max(1, _poisson(rnd, 3 + 0.8 * math.log(1 + emp)))
    on_time = _binomial(rnd, reports_due, 0.86 + 0.07 * q)

    # Bo'shliqlar: ≈6% da mehnat bloki yo'q, ≈3% da moliya yo'q
    no_labor, no_finance = rnd.random() < 0.06, rnd.random() < 0.03

    # 2023 holati (2 yil oldin) va undan oldingi 2021 (2023 qatorining o'sishi uchun)
    rev23 = revenue / (1 + rev_g) ** 2
    emp23 = max(1, int(round(emp / (1 + emp_g) ** 2)))
    rev_g_old, emp_g_old = rnd.gauss(0.12 + 0.06 * q, 0.15), rnd.gauss(0.03 + 0.04 * q, 0.12)
    exp23 = export_prev2 if exporter else None
    exp21 = (0.0 if (exp23 or 0) == 0 else exp23 / (1 + rnd.gauss(0.1, 0.3)) ** 2) if exporter else None

    def row(year, rev, rev_p2, employees, emp_p2, exp_v, exp_p2, k):
        """k — 2025 ga nisbatan masshtab (ish haqi va boshqa darajalar uchun)."""
        too_young = founded > year - 2
        r = {
            "employees": employees, "employees_prev2": None if too_young else emp_p2,
            "revenue": None if no_finance else round(rev * 1000, 1),
            "revenue_prev2": None if (no_finance or too_young) else round(rev_p2 * 1000, 1),
            "net_profit": None if no_finance else round(rev * margin * 1000, 1),
            "output_value": None if no_finance else round(rev * (0.75 if sec in "ABCDEF" else 0.15) * 1000, 1),
            "investment": round(invest * employees * 1000 * k, 1),
            "products_count": products,
            "export_value": round(exp_v, 1) if exp_v is not None else (0.0 if not exporter else None),
            "export_prev2": None if too_young else (round(exp_p2, 1) if exp_p2 is not None else (0.0 if not exporter else None)),
            "import_value": round(imp * k, 1),
            "export_countries": countries if exporter else 0, "export_hs_count": hs if exporter else 0,
            "avg_wage": None if no_labor else round(wage * k * 1000, 1),
            "avg_tenure_years": None if no_labor else round(min(staj, year - founded + 1), 2),
            "turnover_rate": None if no_labor else round(turnover, 4),
            "higher_edu_share": None if no_labor else round(edu, 4),
            "women_count": None if no_labor else min(employees, int(round(women * employees / emp))),
            "mgmt_count": None if no_labor else max(1, int(round(mgmt * employees / emp))),
            "women_mgmt_count": None if no_labor else min(max(1, int(round(mgmt * employees / emp))), women_mgmt),
            "head_female": None if no_labor else head_female,
            "gender_pay_ratio": None if (no_labor or employees < 6 or pay_ratio is None) else round(pay_ratio, 3),
            "youth_share": None if no_labor else round(youth, 4),
            "disabled_count": None if (no_labor or employees < 20) else int(round((disabled or 0) * employees / emp)),
            "reports_due": reports_due, "reports_on_time": on_time,
            "tax_debt": tax_debt, "tax_debt_amount": round(tax_amount, 1) if tax_amount else None,
            "founded_year": founded,
        }
        return r

    rows = {}
    if founded <= 2023:
        rows[2023] = row(2023, rev23, rev23 / (1 + rev_g_old) ** 2, emp23, max(1, int(round(emp23 / (1 + emp_g_old) ** 2))),
                         exp23, exp21, 1 / 1.2)
    if founded <= 2025:
        rows[2025] = row(2025, revenue, rev23, emp, emp23, export, export_prev2, 1.0)
    if 2023 in rows:
        # 2024: 2023 va 2025 orasida geometrik interpolyatsiya
        a, b = rows[2023], rows[2025]
        mid = {}
        for key, v in b.items():
            u = a.get(key)
            if isinstance(v, bool) or v is None or u is None or isinstance(u, bool):
                mid[key] = v
            elif isinstance(v, int):
                mid[key] = int(round(math.sqrt(max(u, 0) * max(v, 0)))) if u > 0 and v > 0 else int(round((u + v) / 2))
            else:
                mid[key] = round(math.sqrt(u * v), 4) if u > 0 and v > 0 else round((u + v) / 2, 4)
        rev24 = math.sqrt(rev23 * revenue)
        mid["revenue_prev2"] = None if (no_finance or founded > 2022) else round(rev24 / (1 + rev_g) ** 2 * 1000, 1)
        mid["employees_prev2"] = None if founded > 2022 else max(1, int(round(mid["employees"] / (1 + emp_g) ** 2)))
        mid["founded_year"] = founded
        rows[2024] = mid
    elif founded == 2024:
        rows[2024] = row(2024, revenue / (1 + rev_g), None, max(1, int(round(emp / (1 + emp_g)))), None,
                         export / (1 + 0.1) if export else None, None, 1 / 1.1)
    return {"profile": profile, "q": q, "rows": rows}
