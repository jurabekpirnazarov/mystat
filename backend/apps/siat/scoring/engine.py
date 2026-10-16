"""KR-16: salohiyat indeksi — sof funksiyalar (Django'siz test qilinadi). Formula SCORING_MODEL.md 3.2.

    x' = log(x) (transform=log) yoki x
    z  = (x' − mean) / sd           — faqat qiymati bor tengdoshlar bo'yicha
    z  = −z (yo'nalish "−"), clip(±z_clip)
    s  = clip(50 + scale·z, 0, 100) — 50 = tengdoshlar o'rtachasi
    ustun = Σ w_i·s_i / Σ w_i (bor ko'rsatkichlar), indeks = Σ W_P·ustun_P / Σ W_P (bor ustunlar)

Yetishmagan qiymat to'ldirilmaydi (imputatsiya yo'q): vazn qolganlariga qayta taqsimlanadi, to'liqlik alohida.
"""
import math

import numpy as np


def _mean_sd(xs):
    n = len(xs)
    mean = sum(xs) / n
    sd = math.sqrt(sum((x - mean) ** 2 for x in xs) / n)
    return mean, sd


def percentiles(values):
    """{kod: qiymat} -> {kod: 0..100}; eng kichik 0, eng katta 100, tenglar o'rtacha o'rin oladi."""
    items = [(code, v) for code, v in values.items() if v is not None]
    n = len(items)
    if n == 0:
        return {}
    if n == 1:
        return {items[0][0]: 50.0}
    ordered = sorted(items, key=lambda kv: kv[1])
    result, i = {}, 0
    while i < n:
        j = i
        while j + 1 < n and ordered[j + 1][1] == ordered[i][1]:
            j += 1
        pct = (i + j) / 2 / (n - 1) * 100
        for k in range(i, j + 1):
            result[ordered[k][0]] = round(pct, 1)
        i = j + 1
    return result


def ranks(values, higher_is_better=True):
    """{kod: qiymat} -> {kod: o'rin} (1 = eng yaxshi, tenglar bir xil o'rin)."""
    items = [(code, v) for code, v in values.items() if v is not None]
    ordered = sorted(items, key=lambda kv: kv[1], reverse=higher_is_better)
    result, prev, rank = {}, None, 0
    for pos, (code, v) in enumerate(ordered, start=1):
        if v != prev:
            rank, prev = pos, v
        result[code] = rank
    return result


def normalize(values, direction="+", transform="none", clip=2.5, scale=20):
    """{kod: qiymat|None} -> {kod: {"z", "s", "pct", "rank"}} — faqat qiymati borlar uchun.

    `pct` va `rank` yo'nalish hisobga olingan holda (ishsizlik past bo'lsa percentil yuqori, o'rin 1-ga yaqin).
    """
    xs = {}
    for code, v in values.items():
        if v is None or (isinstance(v, float) and math.isnan(v)):
            continue
        if transform == "log":
            if v <= 0:
                continue
            xs[code] = math.log(v)
        else:
            xs[code] = float(v)
    if not xs:
        return {}
    sign = -1.0 if direction == "-" else 1.0
    mean, sd = _mean_sd(list(xs.values()))
    oriented = {code: sign * x for code, x in xs.items()}
    pct = percentiles(oriented)
    rank = ranks(oriented, higher_is_better=True)
    result = {}
    for code, x in xs.items():
        z = 0.0 if len(xs) < 3 or sd == 0 else sign * (x - mean) / sd
        z = max(-clip, min(clip, z))
        s = max(0.0, min(100.0, 50 + scale * z))
        result[code] = {"z": round(z, 4), "s": round(s, 2), "pct": pct[code], "rank": rank[code]}
    return result


def pillar_scores(indicator_scores, pillars, indicator_weights=None):
    """indicator_scores: {ko'rsatkich: {kod: s}}; pillars: {ustun: [ko'rsatkichlar]}.

    -> {kod: {ustun: baho|None}}, hamda {kod: {ustun: ustun ichidagi mavjud vazn ulushi 0..1}}.
    """
    codes = {code for scores in indicator_scores.values() for code in scores}
    weights = indicator_weights or {}
    result, present = {}, {}
    for code in codes:
        result[code], present[code] = {}, {}
        for pillar, members in pillars.items():
            total = sum(weights.get(m, 1.0) for m in members)
            num = den = 0.0
            for m in members:
                s = indicator_scores.get(m, {}).get(code)
                if s is None:
                    continue
                w = weights.get(m, 1.0)
                num += w * s
                den += w
            result[code][pillar] = round(num / den, 2) if den else None
            present[code][pillar] = den / total if total else 0.0
    return result, present


def composite(pillars_by_code, weights):
    """{kod: {ustun: baho}} va {ustun: W} -> {kod: indeks|None}. Ustun bahosi yo'q bo'lsa vazn qayta taqsimlanadi."""
    result = {}
    for code, pillars in pillars_by_code.items():
        num = den = 0.0
        for pillar, w in weights.items():
            score = pillars.get(pillar)
            if w <= 0 or score is None:
                continue
            num += w * score
            den += w
        result[code] = round(num / den, 2) if den else None
    return result


def coverage(present_by_code, weights):
    """To'liqlik: Σ W_P · (ustundagi mavjud vazn ulushi) / Σ W_P (W_P > 0 bo'lgan ustunlar)."""
    total = sum(w for w in weights.values() if w > 0)
    if not total:
        return {code: 0.0 for code in present_by_code}
    return {code: round(sum(w * present.get(p, 0.0) for p, w in weights.items() if w > 0) / total, 3)
            for code, present in present_by_code.items()}


def rank_range(pillars_by_code, weights, eligible, iterations=500, jitter=0.2, seed=0, low_q=10, high_q=90):
    """Vaznlar `iterations` marta ×U(1−jitter, 1+jitter) ga o'zgartiriladi, har safar o'rin hisoblanadi.

    -> {kod: (past, yuqori)} — o'rinlarning 10- va 90-percentili (butun son). Faqat `eligible` hududlar
    reytingda qatnashadi. Seed qat'iy — natija deterministik.
    """
    codes = [c for c in sorted(eligible) if c in pillars_by_code]
    keys = [p for p, w in weights.items() if w > 0]
    if not codes or not keys:
        return {}
    scores = np.array([[np.nan if pillars_by_code[c].get(p) is None else pillars_by_code[c][p] for p in keys]
                       for c in codes], dtype=float)
    base = np.array([weights[p] for p in keys], dtype=float)
    mask = ~np.isnan(scores)
    filled = np.where(mask, scores, 0.0)
    rng = np.random.default_rng(seed)
    factors = rng.uniform(1 - jitter, 1 + jitter, size=(iterations, len(keys)))
    w = factors * base                                   # (iter, P)
    num = filled @ w.T                                   # (codes, iter)
    den = mask.astype(float) @ w.T
    with np.errstate(invalid="ignore", divide="ignore"):
        idx = num / den
    # O'rin: o'zidan katta indeksli hududlar soni + 1 (tenglar bir xil o'rin)
    places = (idx[None, :, :] > idx[:, None, :]).sum(axis=1) + 1   # (codes, iter)
    lo = np.percentile(places, low_q, axis=1, method="lower")
    hi = np.percentile(places, high_q, axis=1, method="higher")
    return {c: (int(lo[i]), int(hi[i])) for i, c in enumerate(codes)}


def distances(z_by_code, min_common=5):
    """z-vektorlar orasidagi Evklid masofasi (umumiy ko'rsatkichlar soniga normallangan).

    z_by_code: {kod: {ko'rsatkich: z}} -> {kod: [(boshqa kod, masofa), ...]} — o'sish tartibida, o'zi kirmaydi.
    """
    result = {}
    codes = list(z_by_code)
    for a in codes:
        za = z_by_code[a]
        row = []
        for b in codes:
            if a == b:
                continue
            common = [k for k in za if k in z_by_code[b]]
            if len(common) < min_common:
                continue
            d = math.sqrt(sum((za[k] - z_by_code[b][k]) ** 2 for k in common) / len(common))
            row.append((b, round(d, 4)))
        row.sort(key=lambda t: (t[1], t[0]))
        result[a] = row
    return result
