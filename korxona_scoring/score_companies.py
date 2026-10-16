"""KORXONA_SCORING.md 4-bo'lim: namunaviy hisoblash (sof Python, pandas'siz — ilova dvigatelidan mustaqil).

    python korxona_scoring/score_companies.py                  # namuna_korxonalar.csv -> namuna_scoring.csv

Ilova (`backend/apps/analytics/company_scoring/engine.py`, pandas) shu formulalarni takrorlaydi; KR-31 testi ikkala
natijani ±0.5 ball aniqlikda solishtiradi. Parametrlar, presetlar va chegaralar `company_scoring.yaml` dan.
"""
import argparse
import csv
import math
from collections import defaultdict
from pathlib import Path

import yaml

HERE = Path(__file__).resolve().parent
CFG_PATH = HERE.parent / "backend" / "apps" / "analytics" / "company_scoring.yaml"


def num(row, key):
    v = row.get(key)
    if v in (None, ""):
        return None
    if isinstance(v, bool):
        return 1.0 if v else 0.0
    return float(v)


def ratio(a, b):
    return a / b if a is not None and b is not None and b > 0 else None


def cagr(now, before):
    return (now / before) ** 0.5 - 1 if now is not None and before is not None and now > 0 and before > 0 else None


def clip(x, lo, hi):
    return None if x is None else min(max(x, lo), hi)


def median(xs):
    xs = sorted(xs)
    if not xs:
        return None
    m = len(xs) // 2
    return xs[m] if len(xs) % 2 else (xs[m - 1] + xs[m]) / 2


def pct_map(items):
    """[(kalit, qiymat)] -> {kalit: (o'rtacha rang − 0.5) / n × 100}."""
    items = sorted(items, key=lambda kv: kv[1])
    n, out, i = len(items), {}, 0
    while i < n:
        j = i
        while j + 1 < n and items[j + 1][1] == items[i][1]:
            j += 1
        rank = (i + j) / 2 + 1
        for k in range(i, j + 1):
            out[items[k][0]] = (rank - 0.5) / n * 100
        i = j + 1
    return out


def raw_values(row, code, p, wage_median):
    """2.1 jadvali bo'yicha ko'rsatkichning xom qiymati (kichrayishdan oldin)."""
    emp = num(row, "employees")
    if code == "m_rev_growth":
        return cagr(num(row, "revenue"), num(row, "revenue_prev2"))
    if code == "m_rpe":
        r = ratio(num(row, "revenue"), emp)
        return r / 1000 if r is not None else None
    if code == "m_margin":
        return ratio(num(row, "net_profit"), num(row, "revenue"))
    if code == "o_emp_growth":
        return cagr(emp, num(row, "employees_prev2"))
    if code == "o_invest_pe":
        r = ratio(num(row, "investment"), emp)
        return r / 1000 if r is not None else None
    if code == "o_products":
        return num(row, "products_count")
    if code == "t_export_share":
        e, rev = num(row, "export_value"), num(row, "revenue")
        return min(e * p["usd_rate"] / rev, 1.0) if e is not None and rev and rev > 0 else None
    if code == "t_countries":
        return num(row, "export_countries")
    if code == "t_hs":
        return num(row, "export_hs_count")
    if code == "t_export_growth":
        e, e2 = num(row, "export_value"), num(row, "export_prev2")
        if e is not None and e > 0 and (e2 is None or e2 == 0):
            return p["new_exporter_growth"]
        return cagr(e, e2)
    if code == "t_balance":
        e, i = num(row, "export_value"), num(row, "import_value") or 0.0
        return e / (e + i) if e is not None and e + i > 0 else None
    if code == "x_staj":
        return num(row, "avg_tenure_years")
    if code == "x_turnover":
        return num(row, "turnover_rate")
    if code == "x_wage_rel":
        w = num(row, "avg_wage")
        m = wage_median.get((row["year"], row["region_code"], row["oked_section"]))
        return w / m if w is not None and m else None
    if code == "x_edu":
        return num(row, "higher_edu_share")
    if code == "i_women":
        return ratio(num(row, "women_count"), emp)
    if code == "i_mgmt":
        return ratio(num(row, "women_mgmt_count"), num(row, "mgmt_count"))
    if code == "i_pay_gap":
        r = num(row, "gender_pay_ratio")
        return clip((r - 0.5) / 0.5 * 100, 0, 100) if r is not None else None
    if code == "i_youth":
        return num(row, "youth_share")
    if code == "i_disab":
        d = ratio(num(row, "disabled_count"), emp)
        return clip(d / 0.03 * 100, 0, 100) if d is not None else None
    if code == "s_reports":
        r = ratio(num(row, "reports_on_time"), num(row, "reports_due"))
        return clip(r * 100, 0, 100) if r is not None else None
    if code == "s_tax":
        t = num(row, "tax_debt")
        return None if t is None else (1 - t) * 100
    if code == "s_age":
        f = num(row, "founded_year")
        return None if f is None else min(max(row["year"] - f + 1, 0), 10) * 10
    raise KeyError(code)


def applies(row, cond):
    emp = num(row, "employees") or 0
    if cond is None:
        return True
    if cond == "has_history":
        f = num(row, "founded_year")
        return not (f is not None and f > row["year"] - 2)
    if cond == "producing":
        return row["oked_section"] in ("A", "B", "C")
    if cond == "employees_6":
        return emp >= 6
    if cond == "employees_20":
        return emp >= 20
    if cond == "reports_due":
        return num(row, "reports_due") != 0
    raise KeyError(cond)


def size_class(cfg, emp):
    for c in cfg["size_classes"]:
        if c["max"] is None or emp <= c["max"]:
            return c["key"]


def score(rows, cfg):
    p = cfg["params"]
    for r in rows:
        r["year"] = int(r["year"])
    # Tengdoshlar guruhi (4.1)
    n1, n2, n3 = defaultdict(int), defaultdict(int), defaultdict(int)
    for r in rows:
        r["_size"] = size_class(cfg, num(r, "employees") or 1)
        n1[(r["year"], r["oked_section"], r["_size"])] += 1
        n2[(r["year"], r["oked_section"])] += 1
        n3[r["year"]] += 1
    for r in rows:
        k1, k2 = (r["year"], r["oked_section"], r["_size"]), (r["year"], r["oked_section"])
        r["_level"] = 1 if n1[k1] >= p["min_peer"] else 2 if n2[k2] >= p["min_peer"] else 3
        r["_keys"] = {1: k1, 2: k2, 3: (r["year"],)}

    wages = defaultdict(list)
    for r in rows:
        w = num(r, "avg_wage")
        if w is not None:
            wages[(r["year"], r["region_code"], r["oked_section"])].append(w)
    wage_median = {k: median(v) for k, v in wages.items()}

    trad = cfg["tradable"]
    for r in rows:
        r["_tradable"] = r["oked_section"] in trad["sections"] or str(r.get("oked_division")) in [str(d) for d in trad["divisions"]]
        e = num(r, "export_value")
        r["_exporter"] = e is not None and e > 0
    exp_n = defaultdict(int)
    for r in rows:
        if r["_exporter"] and r["_tradable"]:
            exp_n[(r["year"], r["oked_section"])] += 1

    scores = {id(r): {} for r in rows}
    for code, ind in cfg["indicators"].items():
        vals = {}
        for r in rows:
            ok = applies(r, ind.get("applies"))
            if ind["kind"] == "trade":
                ok = ok and r["_tradable"]
            r.setdefault("_appl", {})[code] = ok
            v = raw_values(r, code, p, wage_median) if ok else None
            vals[id(r)] = v
        if "shrink" in ind:      # 4.3
            sums = defaultdict(lambda: [0.0, 0])
            for r in rows:
                v = vals[id(r)]
                if v is not None:
                    s = sums[(r["year"], r["oked_section"])]
                    s[0] += v
                    s[1] += 1
            for r in rows:
                v = vals[id(r)]
                if v is None:
                    continue
                s = sums[(r["year"], r["oked_section"])]
                m = s[0] / s[1]
                n = num(r, ind["shrink"]) or 0
                vals[id(r)] = (n * v + p["shrink_k"] * m) / (n + p["shrink_k"])
        if code == "i_mgmt":
            for r in rows:
                v, h = vals[id(r)], num(r, "head_female")
                vals[id(r)] = None if v is None or h is None else 0.5 * h + 0.5 * v
        if ind["kind"] == "absolute":
            for r in rows:
                v = vals[id(r)]
                scores[id(r)][code] = None if v is None else clip(v, 0, 100)
            continue
        if ind["kind"] == "trade":
            eligible = [r for r in rows if r["_exporter"] and vals[id(r)] is not None]
            level_of = lambda r: 2 if exp_n[(r["year"], r["oked_section"])] >= p["min_peer"] else 3
        else:
            eligible = [r for r in rows if vals[id(r)] is not None]
            level_of = lambda r: r["_level"]
        maps = {}
        for lvl in (1, 2, 3):
            groups = defaultdict(list)
            for r in eligible:
                groups[r["_keys"][lvl]].append((id(r), vals[id(r)]))
            maps[lvl] = {}
            for items in groups.values():
                maps[lvl].update(pct_map(items))
        for r in rows:
            s = maps[level_of(r)].get(id(r)) if (ind["kind"] != "trade" or r["_exporter"]) else None
            if s is not None and ind["direction"] == "-":
                s = 100 - s
            scores[id(r)][code] = s

    out = []
    for r in rows:
        sc = scores[id(r)]
        pil = {}
        frac = {}
        for pcode in cfg["pillars"]:
            if pcode == "T":
                continue
            codes = [c for c, i in cfg["indicators"].items() if i["pillar"] == pcode]
            avail = [sc[c] for c in codes if sc[c] is not None]
            appl = [c for c in codes if r["_appl"][c]]
            pil[pcode] = sum(avail) / len(avail) if avail else None
            frac[pcode] = (len([c for c in appl if sc[c] is not None]) / len(appl)) if appl else None
        tcodes = [c for c, i in cfg["indicators"].items() if i["pillar"] == "T"]
        if r["_tradable"]:
            known = num(r, "export_value") is not None
            if r["_exporter"]:
                ts = [sc[c] for c in tcodes if sc[c] is not None]
                pil["T"] = p["exporter_base"] + p["exporter_span"] * (sum(ts) / len(ts)) / 100 if ts else None
            else:
                pil["T"] = p["no_export_score"] if known else None
            frac["T"] = 1.0 if known else 0.0
        else:
            pil["T"], frac["T"] = None, None
        res = {"stir": r["stir"], "year": r["year"], "peer_level": r["_level"],
               **{f"P_{k}": (round(v, 4) if v is not None else "") for k, v in pil.items()}}
        tax = num(r, "tax_debt") == 1
        for name, preset in cfg["presets"].items():
            w = preset["weights"]
            cov_num = cov_den = num_ = den = 0.0
            for pcode in cfg["pillars"]:
                if frac.get(pcode) is None:
                    continue
                cov_num += w.get(pcode, 0) * frac[pcode]
                cov_den += w.get(pcode, 0)
                if pil.get(pcode) is not None:
                    num_ += w.get(pcode, 0) * pil[pcode]
                    den += w.get(pcode, 0)
            coverage = cov_num / cov_den if cov_den else 0.0
            overall = num_ / den if den else None
            if overall is not None and tax:
                overall = min(overall, p["cap_tax_debt"])
            if coverage < p["coverage_min"]:
                overall = None
            if overall is not None:
                overall = round(overall, 2)      # sinf yaxlitlangan balldan (UI'dagi raqam bilan bir xil)
            klass = ""
            if overall is not None:
                klass = next(c["key"] for c in cfg["classes"] if overall >= c["min"])
            res[f"overall_{name}"] = round(overall, 2) if overall is not None else ""
            res[f"klass_{name}"] = klass
            res[f"coverage_{name}"] = round(coverage, 4)
        out.append(res)
    return out


def main(inp=HERE / "namuna_korxonalar.csv", out=HERE / "namuna_scoring.csv"):
    cfg = yaml.safe_load(open(CFG_PATH, encoding="utf-8"))
    with open(inp, encoding="utf-8") as f:
        rows = list(csv.DictReader(f))
    result = score(rows, cfg)
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.DictWriter(f, fieldnames=list(result[0]))
        w.writeheader()
        w.writerows(result)
    return result


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--inp", default=str(HERE / "namuna_korxonalar.csv"))
    ap.add_argument("--out", default=str(HERE / "namuna_scoring.csv"))
    args = ap.parse_args()
    res = main(args.inp, args.out)
    preset = "muvozanatli"
    klasses = defaultdict(int)
    for r in res:
        klasses[r[f"klass_{preset}"] or "—"] += 1
    total = len(res)
    print(f"{total} korxona -> {args.out}")
    print(", ".join(f"{k}: {v / total * 100:.1f}%" for k, v in sorted(klasses.items())))
