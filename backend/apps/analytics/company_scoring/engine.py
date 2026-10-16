"""KORXONA_SCORING.md 4-bo'lim: hisoblash dvigateli (pandas, Django'siz).

Kirish — har qator bitta korxona × yil (`EnterpriseIndicator` maydonlari + `stir`, `year`, `oked_section`,
`oked_division`, `region_code`); chiqish — har qator uchun ko'rsatkich baholari, ustunlar, to'liqlik, bayroqlar va
har preset bo'yicha umumiy ball va sinf. Tengdoshlar faqat shu yil ichida solishtiriladi.

Namunaviy mustaqil implementatsiya — `korxona_scoring/score_companies.py` (sof Python); test ikkalasini solishtiradi.
"""
import numpy as np
import pandas as pd

from .config import klass_of

NUMERIC_FIELDS = (
    "revenue", "revenue_prev2", "net_profit", "employees", "employees_prev2", "avg_wage", "export_value",
    "export_prev2", "import_value", "export_countries", "export_hs_count", "avg_tenure_years", "turnover_rate",
    "higher_edu_share", "women_count", "mgmt_count", "women_mgmt_count", "head_female", "gender_pay_ratio",
    "youth_share", "disabled_count", "investment", "products_count", "reports_due", "reports_on_time", "tax_debt",
    "founded_year", "output_value",
)


def _num(df, col):
    return pd.to_numeric(df[col], errors="coerce").astype(float) if col in df else pd.Series(np.nan, index=df.index)


def _cagr(now, before):
    ok = (now > 0) & (before > 0)
    return ((now / before.where(ok)) ** 0.5 - 1).where(ok)


def _rev_growth(df, p):
    return _cagr(_num(df, "revenue"), _num(df, "revenue_prev2"))


def _rpe(df, p):
    emp = _num(df, "employees")
    return (_num(df, "revenue") / emp.where(emp > 0)) / 1000


def _margin(df, p):
    rev = _num(df, "revenue")
    return _num(df, "net_profit") / rev.where(rev > 0)


def _emp_growth(df, p):
    return _cagr(_num(df, "employees"), _num(df, "employees_prev2"))


def _invest_pe(df, p):
    emp = _num(df, "employees")
    return (_num(df, "investment") / emp.where(emp > 0)) / 1000


def _export_share(df, p):
    rev = _num(df, "revenue")
    return (_num(df, "export_value") * p["usd_rate"] / rev.where(rev > 0)).clip(upper=1.0)


def _export_growth(df, p):
    now, before = _num(df, "export_value"), _num(df, "export_prev2")
    g = _cagr(now, before)
    return g.where(~((now > 0) & (before.fillna(0) == 0)), p["new_exporter_growth"])


def _trade_balance(df, p):
    exp, imp = _num(df, "export_value"), _num(df, "import_value").fillna(0)
    total = exp + imp
    return (exp / total.where(total > 0))


def _wage_rel(df, p):
    wage = _num(df, "avg_wage")
    median = wage.groupby([df["year"], df["region_code"], df["oked_section"]]).transform("median")
    return wage / median.where(median > 0)


def _women_share(df, p):
    emp = _num(df, "employees")
    return _num(df, "women_count") / emp.where(emp > 0)


def _women_mgmt(df, p):
    mgmt = _num(df, "mgmt_count")
    return _num(df, "women_mgmt_count") / mgmt.where(mgmt > 0)


def _pay_gap_score(df, p):
    return ((_num(df, "gender_pay_ratio") - 0.5) / 0.5 * 100).clip(0, 100)


def _disab_score(df, p):
    emp = _num(df, "employees")
    return (_num(df, "disabled_count") / emp.where(emp > 0) / 0.03 * 100).clip(0, 100)


def _reports_score(df, p):
    due = _num(df, "reports_due")
    return (_num(df, "reports_on_time") / due.where(due > 0) * 100).clip(0, 100)


def _tax_score(df, p):
    return (1 - _num(df, "tax_debt")) * 100


def _age_score(df, p):
    age = df["year"].astype(float) - _num(df, "founded_year") + 1
    return (age.clip(lower=0, upper=10) * 10).where(age.notna())


VALUE_FUNCS = {
    "rev_growth": _rev_growth, "rpe": _rpe, "margin": _margin, "emp_growth": _emp_growth, "invest_pe": _invest_pe,
    "export_share": _export_share, "export_growth": _export_growth, "trade_balance": _trade_balance,
    "wage_rel": _wage_rel, "women_share": _women_share, "women_mgmt": _women_mgmt, "pay_gap_score": _pay_gap_score,
    "disab_score": _disab_score, "reports_score": _reports_score, "tax_score": _tax_score, "age_score": _age_score,
}
# Kichrayishdan keyingi birlashtirish: rahbariyatda ayollar = 0.5 × rahbar ayol + 0.5 × ulush (2.1 jadval)
POST = {"women_mgmt": lambda df, x: 0.5 * _num(df, "head_female") + 0.5 * x}

CONDITIONS = {
    "has_history": lambda df, cfg: ~(_num(df, "founded_year") > df["year"].astype(float) - 2),
    "producing": lambda df, cfg: df["oked_section"].isin(["A", "B", "C"]),
    "employees_6": lambda df, cfg: _num(df, "employees") >= 6,
    "employees_20": lambda df, cfg: _num(df, "employees") >= 20,
    "reports_due": lambda df, cfg: ~(_num(df, "reports_due") == 0),
}


def tradable(df, cfg):
    t = cfg["tradable"]
    return df["oked_section"].isin(t["sections"]) | df["oked_division"].astype(str).isin([str(d) for d in t["divisions"]])


def size_classes(cfg, employees):
    bounds = [c["max"] for c in cfg["size_classes"][:-1]]
    keys = [c["key"] for c in cfg["size_classes"]]
    idx = np.searchsorted(np.array(bounds, dtype=float), employees.fillna(1).to_numpy(dtype=float), side="left")
    return pd.Series(np.array(keys)[idx], index=employees.index)


def peer_groups(df, cfg):
    """4.1: bo'lim × o'lcham; < min_peer bo'lsa bo'lim; u ham kam bo'lsa — respublika (shu yilning barcha korxonalari).
    -> (kalit matni, hajm, daraja 1|2|3, darajalar kalitlari [[yil, k1], [yil, bo'lim], [yil]], o'lcham sinfi)."""
    minp = cfg["params"]["min_peer"]
    size = size_classes(cfg, _num(df, "employees"))
    sec = df["oked_section"].astype(str)
    k1 = sec + ":" + size
    keys = [[df["year"], k1], [df["year"], sec], [df["year"]]]
    n1, n2, n3 = (df["year"].groupby(k).transform("size") for k in keys)
    level = pd.Series(np.where(n1 >= minp, 1, np.where(n2 >= minp, 2, 3)), index=df.index)
    label = pd.Series(np.where(level == 1, k1, np.where(level == 2, sec, "all")), index=df.index)
    n = pd.Series(np.where(level == 1, n1, np.where(level == 2, n2, n3)), index=df.index).astype(int)
    return label, n, level, keys, size


def leveled(values, level, keys):
    """Har qator o'z darajasidagi butun populyatsiyaga nisbatan: (percentil, mediana)."""
    pct = pd.Series(np.nan, index=values.index)
    med = pd.Series(np.nan, index=values.index)
    for lvl, k in enumerate(keys, start=1):
        mask = level == lvl
        if not mask.any():
            continue
        pct = pct.where(~mask, percentile(values, k))
        med = med.where(~mask, values.groupby(k).transform("median"))
    return pct, med


def percentile(values, keys):
    """O'rtacha rang bo'yicha percentil (tenglar teng baho): (rang − 0.5) / n × 100, faqat qiymati bor qatorlar."""
    ranks = values.groupby(keys).rank(method="average")
    n = values.notna().groupby(keys).transform("sum")
    return ((ranks - 0.5) / n * 100).where(values.notna())


class _Columns(dict):
    """Ustunlarni yig'ib, oxirida bitta DataFrame qiladi (har ustunni alohida qo'shish pandas'da sekin)."""

    def __init__(self, index):
        super().__init__()
        self.index = index

    def __setitem__(self, key, value):
        super().__setitem__(key, value if isinstance(value, pd.Series) else pd.Series(value, index=self.index))

    def cols(self, keys):
        return pd.DataFrame({k: self[k] for k in keys}, index=self.index)

    def frame(self):
        return pd.DataFrame(dict(self), index=self.index)


def compute(df, cfg):
    """-> natija DataFrame (indeks — kirish indeksi). Ustunlar: v_/s_/a_/med_<kod>, P_<ustun>, frac_<ustun>,
    appl_<ustun>, peer_group, peer_size, size_class, flags, va har preset uchun overall_/coverage_/klass_<preset>."""
    p = cfg["params"]
    df = df.copy()
    out = _Columns(df.index)
    group, gsize, level, keys, size = peer_groups(df, cfg)
    out["peer_group"], out["peer_size"], out["size_class"] = group, gsize, size
    trade_ok = tradable(df, cfg)
    exporter = _num(df, "export_value") > 0
    # Eksportchilar ichida bo'lim bo'yicha; bo'limda eksportchi kam bo'lsa — shu yilning barcha eksportchilari
    exp_n = (exporter & trade_ok).groupby([df["year"], df["oked_section"]]).transform("sum")
    exp_level = pd.Series(np.where(exp_n >= p["min_peer"], 2, 3), index=df.index)

    pillars = {code: [] for code in cfg["pillars"]}
    for code, ind in cfg["indicators"].items():
        raw = VALUE_FUNCS[ind["value"]](df, p) if "value" in ind else _num(df, ind["field"])
        applies = CONDITIONS[ind["applies"]](df, cfg) if "applies" in ind else pd.Series(True, index=df.index)
        applies = applies.fillna(True).astype(bool)
        x = raw.where(applies)
        if "shrink" in ind:       # 4.3: (n·x + k·m_bo'lim) / (n + k)
            n = _num(df, ind["shrink"]).fillna(0)
            m = x.groupby([df["year"], df["oked_section"]]).transform("mean")
            x = ((n * x + p["shrink_k"] * m) / (n + p["shrink_k"])).where(x.notna())
        if ind.get("value") in POST:
            x = POST[ind["value"]](df, x)
        if ind["kind"] == "trade":
            applies = applies & trade_ok
            s, med = leveled(x.where(exporter & applies), exp_level, keys)
        elif ind["kind"] == "peer":
            s, med = leveled(x, level, keys)
        else:
            s, med = x.clip(0, 100), pd.Series(np.nan, index=df.index)
        if ind["direction"] == "-":
            s = 100 - s
        out[f"v_{code}"], out[f"s_{code}"], out[f"a_{code}"], out[f"med_{code}"] = x, s, applies, med
        pillars[ind["pillar"]].append(code)

    for pil, codes in pillars.items():
        if pil == "T":
            continue
        scores = out.cols([f"s_{c}" for c in codes])
        appl = out.cols([f"a_{c}" for c in codes]).sum(axis=1)
        avail = (scores.notna() & out.cols([f"a_{c}" for c in codes]).to_numpy()).sum(axis=1)
        out[f"P_{pil}"] = scores.mean(axis=1)
        out[f"appl_{pil}"] = appl > 0
        out[f"frac_{pil}"] = (avail / appl.where(appl > 0)).fillna(0)

    # 4.4: tashqi savdo ustuni
    tcodes = pillars.get("T", [])
    known = _num(df, "export_value").notna()
    tmean = out.cols([f"s_{c}" for c in tcodes]).mean(axis=1) if tcodes else pd.Series(np.nan, index=df.index)
    out["P_T"] = np.where(trade_ok & exporter, p["exporter_base"] + p["exporter_span"] * tmean / 100,
                          np.where(trade_ok & known, p["no_export_score"], np.nan))
    out["P_T"] = out["P_T"].astype(float)
    out["appl_T"] = trade_ok
    out["frac_T"] = (trade_ok & known).astype(float)

    # Bayroqlar (4.5)
    tax = _num(df, "tax_debt") == 1
    due = _num(df, "reports_due")
    low_reports = (_num(df, "reports_on_time") / due.where(due > 0)) < p["reports_low"]
    loss = _num(df, "net_profit") < 0
    out["flags"] = [[f for f, on in (("soliq_qarzi", a), ("hisobot_intizomi_past", b), ("zarar_bilan_ishlagan", c)) if on]
                    for a, b, c in zip(tax, low_reports, loss)]

    for name, preset in cfg["presets"].items():
        w = preset["weights"]
        num = pd.Series(0.0, index=df.index)
        den = pd.Series(0.0, index=df.index)
        cov_num = pd.Series(0.0, index=df.index)
        cov_den = pd.Series(0.0, index=df.index)
        for pil in cfg["pillars"]:
            wp = float(w.get(pil, 0))
            appl = out[f"appl_{pil}"].astype(bool)
            cov_num += np.where(appl, wp * out[f"frac_{pil}"], 0.0)
            cov_den += np.where(appl, wp, 0.0)
            has = appl & out[f"P_{pil}"].notna()
            num += np.where(has, wp * out[f"P_{pil}"].fillna(0), 0.0)
            den += np.where(has, wp, 0.0)
        coverage = (cov_num / cov_den.where(cov_den > 0)).fillna(0)
        overall = (num / den.where(den > 0))
        overall = overall.where(~tax, overall.clip(upper=p["cap_tax_debt"]))
        overall = overall.where(coverage >= p["coverage_min"])
        out[f"coverage_{name}"] = coverage.round(4)
        out[f"overall_{name}"] = overall.round(2)
        out[f"klass_{name}"] = [klass_of(cfg, None if pd.isna(v) else v) for v in out[f"overall_{name}"]]
    return out.frame()


def recommendations(cfg, row):
    """4.9: percentili `rec_peer_below` dan past tengdosh ko'rsatkichlar va bahosi `rec_abs_below` dan past mutlaq
    ko'rsatkichlar; eng pasti `rec_max` tasi. row — compute() natijasining bitta qatori. -> [kod, ...]"""
    p = cfg["params"]
    cand = []
    for code, ind in cfg["indicators"].items():
        s = row.get(f"s_{code}")
        if s is None or pd.isna(s) or not row.get(f"a_{code}", True) or ind.get("recommend") is False:
            continue
        limit = p["rec_abs_below"] if ind["kind"] == "absolute" else p["rec_peer_below"]
        if s < limit:
            cand.append((s, code))
    # Savdoga yaroqli, lekin eksport yo'q (T = no_export_score) — "eksport yo'q" tavsiyasi
    if row.get("appl_T") and row.get("P_T") == p["no_export_score"]:
        cand.append((float(p["no_export_score"]), "no_export"))
    cand.sort()
    return [c for _, c in cand[:p["rec_max"]]]
