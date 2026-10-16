"""KORXONA_SCORING.md KR-38: korxonalar scoringi tekshiruv hisoboti.

    python manage.py validate_company_scoring

(a) presetlar orasida sinf o'zgarishi ulushi (standart presetga nisbatan);
(b) vaznlar ±20% tasodifan o'zgartirilganda sinfi o'zgaradigan korxonalar ulushi (saqlangan ustun baholaridan,
    to'liqlik o'zgarmaydi deb olinadi; 20 ta tasodifiy variant, seed qat'iy);
(c) adolat: hudud, OKED bo'limi va o'lcham sinfi bo'yicha o'rtacha ball umumiy o'rtachadan farqi
    (> `warn_diff` ball — ogohlantirish; "yirik" sinf alohida izoh bilan, ular kam va kuchli);
(d) sinflar taqsimoti 4.6 jadvali bilan.
Natija `CompanyScoringReport` ga yoziladi (admin'da).
"""
import json
import random
from collections import Counter, defaultdict

from django.core.management.base import BaseCommand
from django.db.models import Avg, Count

TARGET = {"A": 7.6, "B": 28.1, "C": 41.6, "D": 15.4, "E": 2.8, "": 4.5}
WARN_DIFF = 5.0
ITERATIONS = 20


def build_report():
    from apps.analytics.company_scoring import api, config
    from apps.analytics.models import CompanyScoringReport, EnterpriseScore

    cfg = config.get()
    year = api.latest_year(cfg)
    if year is None:
        return None
    base = EnterpriseScore.objects.filter(model_version=cfg["version"], year=year)
    default = cfg["default_preset"]
    warnings = []

    # (a) presetlar orasida sinf o'zgarishi
    klass = defaultdict(dict)
    for stir, preset, k in base.values_list("stir", "preset", "klass").iterator(chunk_size=20000):
        klass[stir][preset] = k
    preset_change = {}
    for preset in cfg["presets"]:
        if preset == default:
            continue
        pairs = [(v[default], v.get(preset)) for v in klass.values() if default in v and preset in v]
        preset_change[preset] = round(sum(1 for a, b in pairs if a != b) / len(pairs) * 100, 1) if pairs else None

    # (b) vaznlar ±20%
    rows = list(base.filter(preset=default).exclude(klass="").values_list("klass", "pillars", "flags"))
    weights = cfg["presets"][default]["weights"]
    cap = cfg["params"]["cap_tax_debt"]
    rnd = random.Random(20261016)
    changed = Counter()
    for _ in range(ITERATIONS):
        w = {p: v * rnd.uniform(0.8, 1.2) for p, v in weights.items()}
        for i, (k, pillars, flags) in enumerate(rows):
            num = den = 0.0
            for p, v in (pillars or {}).items():
                if isinstance(v, (int, float)):
                    num += w.get(p, 0) * v
                    den += w.get(p, 0)
            if not den:
                continue
            overall = round(num / den, 2)
            if "soliq_qarzi" in (flags or []):
                overall = min(overall, cap)
            if config.klass_of(cfg, overall) != k:
                changed[i] += 1
    jitter_share = round(len(changed) / len(rows) * 100, 1) if rows else None
    jitter_avg = round(sum(changed.values()) / (len(rows) * ITERATIONS) * 100, 1) if rows else None

    # (c) adolat
    scored = base.filter(preset=default).exclude(klass="")
    mean = scored.aggregate(a=Avg("overall"))["a"] or 0
    fairness = {}
    for field, label in (("region_code", "hudud"), ("oked_section", "OKED bo'limi"), ("size_class", "o'lcham sinfi")):
        groups = []
        for r in scored.values(field).annotate(n=Count("id"), m=Avg("overall")).order_by(field):
            diff = round(r["m"] - mean, 2)
            groups.append({"key": r[field], "n": r["n"], "mean": round(r["m"], 2), "diff": diff})
            if abs(diff) > WARN_DIFF:
                note = " (yirik korxonalar kam va kuchli — kutilgan)" if field == "size_class" and r[field] == "large" else ""
                warnings.append(f"{label} {r[field]}: o'rtacha ball umumiydan {diff:+.1f} ga farq qiladi{note}")
        fairness[field] = groups

    # (d) sinflar taqsimoti
    total = base.filter(preset=default).count()
    counts = dict(base.filter(preset=default).values_list("klass").annotate(n=Count("id")))
    distribution = [{"klass": k or "—", "share": round(counts.get(k, 0) / total * 100, 1) if total else 0,
                     "target": t} for k, t in TARGET.items()]
    for d in distribution:
        if abs(d["share"] - d["target"]) > 5:
            warnings.append(f"Sinf {d['klass']}: ulush {d['share']}%, mo'ljal {d['target']}%")

    report = {"year": year, "companies": total, "mean": round(mean, 2),
              "preset_class_change_pct": preset_change,
              "weight_jitter": {"iterations": ITERATIONS, "changed_any_pct": jitter_share, "changed_avg_pct": jitter_avg},
              "fairness": fairness, "distribution": distribution, "warnings": warnings}
    CompanyScoringReport.objects.create(model_version=cfg["version"], report=report)
    return report


class Command(BaseCommand):
    help = "Korxonalar scoringi tekshiruv hisoboti (KR-38)"

    def handle(self, *args, **options):
        report = build_report()
        if report is None:
            self.stdout.write(self.style.WARNING("Ballar hisoblanmagan: avval compute_company_scores"))
            return
        self.stdout.write(json.dumps({k: v for k, v in report.items() if k != "fairness"}, ensure_ascii=False, indent=2))
        for w in report["warnings"]:
            self.stdout.write(self.style.WARNING(f"! {w}"))
        if not report["warnings"]:
            self.stdout.write(self.style.SUCCESS("Ogohlantirish yo'q"))
