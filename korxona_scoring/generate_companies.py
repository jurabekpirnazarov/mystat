"""KORXONA_SCORING.md 3-bo'lim: namunaviy soxta korxonalar generatori (Django'siz).

    python korxona_scoring/generate_companies.py            # 3000 korxona -> namuna_korxonalar.csv
    python korxona_scoring/generate_companies.py --n 500 --out /tmp/k.csv

Mantiq ilova bilan bitta: `backend/apps/analytics/company_scoring/generator.py` (ilovadagi seeder ham shuni
chaqiradi). Farqi: bu skript STIR va profilni o'zi o'ylab topadi (STIR `3…` — soxta), ilova esa real KTUT STIR'lari
uchun yozadi. Qiymatlar taxminiy, rasmiy statistika emas.
"""
import argparse
import csv
import importlib.util
from pathlib import Path

HERE = Path(__file__).resolve().parent
GEN_PATH = HERE.parent / "backend" / "apps" / "analytics" / "company_scoring" / "generator.py"

COLUMNS = ["stir", "year", "oked_section", "oked_division", "region_code", "ownership", "founded_year", "employees",
           "employees_prev2", "revenue", "revenue_prev2", "net_profit", "output_value", "investment", "products_count",
           "export_value", "export_prev2", "import_value", "export_countries", "export_hs_count", "avg_wage",
           "avg_tenure_years", "turnover_rate", "higher_edu_share", "women_count", "mgmt_count", "women_mgmt_count",
           "head_female", "gender_pay_ratio", "youth_share", "disabled_count", "reports_due", "reports_on_time",
           "tax_debt", "tax_debt_amount"]


def load_generator():
    spec = importlib.util.spec_from_file_location("company_generator", GEN_PATH)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module


def fmt(v):
    if v is None:
        return ""
    if isinstance(v, bool):
        return "1" if v else "0"
    return str(v)


def main(n=3000, out=HERE / "namuna_korxonalar.csv", years=(2025,)):
    gen = load_generator()
    rows = []
    for i in range(n):
        stir = f"3{i:08d}"
        result = gen.generate(stir)
        prof = result["profile"]
        for year in years:
            r = result["rows"].get(year)
            if r is None:
                continue
            rows.append({"stir": stir, "year": year, **prof, **r})
    with open(out, "w", newline="", encoding="utf-8") as f:
        w = csv.writer(f)
        w.writerow(COLUMNS)
        for r in rows:
            w.writerow([fmt(r.get(c)) for c in COLUMNS])
    return len(rows)


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("--n", type=int, default=3000)
    ap.add_argument("--out", default=str(HERE / "namuna_korxonalar.csv"))
    args = ap.parse_args()
    print(f"{main(args.n, args.out)} qator -> {args.out}")
