"""Prognoz qilinadigan ko'rsatkichlar (SCORING_MODEL.md 10.2).

kind: "level" — musbat hajm/daraja (log fazoda modellanadi, o'sish sur'ati bashorat qilinadi);
      "rate"  — foiz/indeks (farq fazosida: y(t+h) − y(t)).
panel: True — tuman ko'rsatkichi, global panel modeli (tumanlar bitta jadvalda) sinab ko'riladi.
break_jump: ixtiyoriy — bir yilda f-fazodagi o'zgarish shundan katta bo'lsa, metodologik uzilish (masalan, 1409 da
            2023–2024 yillarda oilaviy va xususiy MTTlar hisobga qo'shilgan, son 4–8 baravar oshgan). Uzilishdan
            o'tadigan oynalar orqaga sinovga kirmaydi, prognoz esa uzilishdan keyingi qatordan qilinadi.
"""
import math


INDICATORS = {
    "246": {"source": ("246", ""), "levels": ("district", "region"), "kind": "level", "panel": True},
    "247": {"source": ("247", ""), "levels": ("district", "region"), "kind": "level", "panel": True},
    "500": {"source": ("500", ""), "levels": ("district", "region"), "kind": "level", "panel": True},
    "1875": {"source": ("1875", ""), "levels": ("district", "region"), "kind": "rate", "panel": True},
    "660": {"source": ("660", ""), "levels": ("region",), "kind": "level", "panel": False},
    "1299": {"source": ("1299", ""), "levels": ("region",), "kind": "level", "panel": False},
    "658": {"source": ("658", ""), "levels": ("region",), "kind": "rate", "panel": False},
    "1409": {"source": ("1409", ""), "levels": ("region",), "kind": "level", "panel": False,
             "break_jump": math.log(2.5)},
    "industry-total": {"source": ("industry-by-activity", "B, C, D, E"), "levels": ("region",), "kind": "level",
                       "panel": False},
    "investment-total": {"source": ("investment-by-activity", "*"), "levels": ("region",), "kind": "level",
                         "panel": False},
}

# Kartadagi hosila ko'rsatkichlar prognozi aholi prognozidan hisoblanadi
DERIVED_FROM_POPULATION = ("d-density", "d-pop-growth", "d-rural-share")

HORIZONS = (1, 2, 3)
SCENARIO_YEARS = 5
COVID_YEAR = 2020         # orqaga sinovda: shu yil oyna ichida yoki boshida (2021 tiklanishi) bo'lsa — alohida bo'lak
FIRST_ORIGIN = 2018
MIN_TRAIN_YEARS = 5
SELECT_MARGIN = 0.10      # murakkab usul oddiy trenddan kamida 10% yaxshi bo'lishi kerak
WINSOR = (1, 99)
SEED = 20261015
KEEP_VERSIONS = 3
# 80% oraliq kalibrovkasi (10.5, KR-25): dum percentili shu ro'yxatdan "bitta origin'ni chiqarib" qamrov 80% ga eng
# yaqin bo'ladigani tanlanadi; dum 0 da ham qamrov past bo'lsa — oraliq SCALES bo'yicha kengaytiriladi.
INTERVAL_TARGET = 80.0
INTERVAL_TAILS = (20, 17.5, 15, 12.5, 10, 7.5, 5, 2.5, 1, 0)
INTERVAL_SCALES = (1.0, 1.25, 1.5, 2.0, 3.0)
INTERVAL_OK = (70.0, 90.0)
INTERVAL_MIN_POINTS = 10  # kamroq bo'lsa — eng yaqin kalibrlangan horizontdan √(h/h') bilan
INTERVAL_SMALL = 30       # bundan kam nuqtada qamrov tekshiruvi statistik jihatdan zaif (hisobotda belgilanadi)

# "Maqsadli ssenariy" (10.5, P2): foydalanuvchi bitta omilni o'zgartiradi, panel modeli (M3) orqali boshqa tuman
# ko'rsatkichlari prognozi qanday o'zgarishi ko'rsatiladi. Bu bog'liqlik, sabab-oqibat emas. O'qitish vaqtida
# oldindan hisoblanadi (so'rov vaqtida model ishlamaydi). Bayroq o'chirilsa — hisoblanmaydi va API 404 qaytaradi.
WHAT_IF_ENABLED = True
WHAT_IF = {
    # Ishsizlik darajasi va uning o'zgarishi birga siljiydi (o'tgan yil darajasi d ga o'zgarsa, o'zgarish ham d ga)
    "unemployment": {"features": ("unemployment", "unemployment_chg"), "floor": {"unemployment": 0.0}, "deltas": (-3, -2, -1, 1, 2), "unit": "p.p.",
                     "targets": ("246", "247", "500")},
}
