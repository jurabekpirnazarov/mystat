"""KORXONA_SCORING.md 13.3–13.4: ball tarkibi (izohlanuvchanlik) va "nima bo'lsa" sezgirligi (Django'siz).

Umumiy ball mavjud ustunlar bahosining vaznli o'rtachasi bo'lgani uchun aniq bo'laklarga ajraladi:

    w_P      = W_P / Σ_{P mavjud} W_P
    hissa(P) = w_P · (ustun(P) − 50)
    umumiy   = 50 + Σ hissa(P)                         # cheklovdan oldin aniq teng
    cheklov  = min(0, CAP_TAX_DEBT − umumiy)  soliq qarzi bo'lsa — alohida qator

Hisob faqat shu yerda (frontend qayta hisoblamaydi). Standart preset uchun natija `EnterpriseScore.indicators`
JSON'ida `_contrib`/`_sens` kalitlarida saqlanadi (KR-31), boshqa presetlar uchun API so'rovda shu funksiyani chaqiradi.
"""
from .config import klass_of

BASE = 50.0
STEP = 10.0          # 13.4: "shu ustun 10 ball oshsa"


def _num(v):
    return float(v) if isinstance(v, (int, float)) and not isinstance(v, bool) else None


def contribution(cfg, pillars, flags, preset):
    """-> {"base", "pillars": [{key, applicable, score, weight, share, contribution}], "raw", "cap", "total"} yoki
    None (birorta ham baholangan ustun yo'q). `pillars` — {"M": 61.2, "T": "na", "O": None, ...}."""
    weights = cfg["presets"][preset]["weights"]
    avail = {p: _num(pillars.get(p)) for p in cfg["pillars"] if _num(pillars.get(p)) is not None}
    total_w = sum(float(weights.get(p, 0)) for p in avail)
    if not avail or total_w <= 0:
        return None
    rows = []
    for p in cfg["pillars"]:
        v = pillars.get(p)
        w = float(weights.get(p, 0))
        if v == "na":
            rows.append({"key": p, "applicable": False, "score": None, "weight": w, "share": 0.0, "contribution": 0.0})
        elif p not in avail:
            rows.append({"key": p, "applicable": True, "score": None, "weight": w, "share": 0.0, "contribution": 0.0})
        else:
            share = w / total_w
            rows.append({"key": p, "applicable": True, "score": round(avail[p], 2), "weight": w,
                         "share": round(share, 4), "contribution": round(share * (avail[p] - BASE), 2)})
    raw = BASE + sum(float(weights.get(p, 0)) / total_w * (v - BASE) for p, v in avail.items())
    cap = 0.0
    if "soliq_qarzi" in (flags or []):
        cap = min(0.0, float(cfg["params"]["cap_tax_debt"]) - raw)
    return {"base": BASE, "pillars": rows, "raw": round(raw, 2), "cap": round(cap, 2) if cap else None,
            "total": round(raw + cap, 2), "preset": preset, "tax_debt": "soliq_qarzi" in (flags or [])}


def sensitivity(cfg, contrib):
    """13.4: har ustun 10 ball oshsa umumiy ball va sinf qanday o'zgaradi; keyingi sinfgacha qancha yetishmaydi va
    qaysi 2 ustun eng tez yetkazadi. -> dict yoki None."""
    if not contrib:
        return None
    cap = float(cfg["params"]["cap_tax_debt"])
    has_tax = contrib.get("tax_debt", False)
    total, raw = contrib["total"], contrib["raw"]
    klass = klass_of(cfg, total)
    rows = []
    for r in contrib["pillars"]:
        if r["score"] is None or r["share"] <= 0:
            continue
        step = min(STEP, 100.0 - r["score"])
        new = raw + r["share"] * step
        if has_tax:
            new = min(new, cap)
        rows.append({"key": r["key"], "step": round(step, 2), "delta": round(new - total, 2), "new_total": round(new, 2),
                     "new_klass": klass_of(cfg, new), "per_point": round(r["share"], 4),
                     "room": round(100.0 - r["score"], 2)})
    # Keyingi sinf
    higher = sorted((c for c in cfg["classes"] if c["min"] > total), key=lambda c: c["min"])
    nxt = None
    if higher:
        target = higher[0]
        gap = target["min"] - total
        blocked = has_tax and target["min"] > cap
        fastest = []
        if not blocked:
            for r in sorted(rows, key=lambda r: r["per_point"], reverse=True):
                need = gap / r["per_point"] if r["per_point"] else None
                fastest.append({"key": r["key"], "points_needed": round(need, 1) if need is not None else None,
                                "reachable": need is not None and need <= r["room"]})
                if len(fastest) == 2:
                    break
        nxt = {"klass": target["key"], "min": target["min"], "gap": round(gap, 2), "blocked_by_tax": blocked,
               "fastest": fastest}
    return {"klass": klass, "pillars": rows, "next": nxt}
