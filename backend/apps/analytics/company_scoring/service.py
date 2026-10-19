"""KORXONA_SCORING.md KR-31: `EnterpriseIndicator` -> dvigatel -> `EnterpriseScore` (barcha presetlar).

Standart preset — har yil uchun, og'ir JSON (ustunlar, ko'rsatkichlar, tavsiyalar) bilan; qolgan presetlar — faqat
oxirgi yil uchun, ball va sinf (ustunlar presetga bog'liq emas). Tugagach API keshi tozalanadi.
"""
import csv
import io
import json
import math
import time

import pandas as pd
from django.core.cache import cache
from django.db import connection, transaction
from django.utils import timezone

from . import config, engine, explain

CACHE_VERSION_KEY = "company_scores:version"
FIELDS = [f for f in engine.NUMERIC_FIELDS] + ["stir", "year", "oked_section", "oked_division", "region__code",
                                                 "district__code", "is_synthetic", "sources"]


def cache_version():
    return cache.get(CACHE_VERSION_KEY) or 1


def bump_cache():
    try:
        cache.incr(CACHE_VERSION_KEY)
    except ValueError:
        cache.set(CACHE_VERSION_KEY, 2, None)
    # KR-37: xarita qatlami (`ind=company-score`) SIAT karta keshida
    from apps.siat.sync import bump_cache as bump_map_cache

    bump_map_cache()


def load_frame(stirs=None):
    from ..models import EnterpriseIndicator

    from apps.common.synthetic import registered_ids

    qs = EnterpriseIndicator.objects.filter(is_peer=False, year__gte=config.get()["params"]["first_year"])
    if stirs is not None:
        qs = qs.filter(stir__in=stirs)
    df = pd.DataFrame.from_records(list(qs.values(*FIELDS, "pk")), columns=FIELDS + ["pk"])
    # S-01 reyestridagi qatorlar (S-10 demo korxonalari) ham sintetik
    registered = registered_ids(EnterpriseIndicator)
    df["is_synthetic"] = df["is_synthetic"] | df["pk"].astype(str).isin(registered)
    df = df.rename(columns={"region__code": "region_code"})
    df["district_soato"] = [r + d if r and d else "" for r, d in zip(df["region_code"].fillna(""), df["district__code"].fillna(""))]
    for col in ("head_female", "tax_debt"):
        df[col] = df[col].map({True: 1.0, False: 0.0})
    df["oked_division"] = df["oked_division"].fillna("").astype(str)
    return df.reset_index(drop=True)


def _r(v, digits=4):
    if v is None:
        return None
    try:
        f = float(v)
    except (TypeError, ValueError):
        return None
    return None if math.isnan(f) else round(f, digits)


def data_source(is_synthetic, sources, demo):
    real = any(v == "real" for k, v in (sources or {}).items() if not k.startswith("_"))
    if is_synthetic or demo:
        return "mixed" if real else "synthetic"
    return "real"


def indicators_json(cfg, row):
    out = {}
    for code in cfg["indicators"]:
        s = _r(row.get(f"s_{code}"), 2)
        v = _r(row.get(f"v_{code}"))
        if s is None and v is None:
            if not row.get(f"a_{code}", True):
                out[code] = {"na": True}
            continue
        out[code] = {"v": v, "s": s, "m": _r(row.get(f"med_{code}"))}
    out["_rec"] = engine.recommendations(cfg, row)
    return out


def compute_all(cfg=None, stdout=None):
    """Barcha korxonalar × presetlar. -> yozilgan qatorlar soni."""
    from ..models import EnterpriseScore

    cfg = cfg or config.get()
    t0 = time.monotonic()
    df = load_frame()
    if df.empty:
        EnterpriseScore.objects.filter(model_version=cfg["version"]).delete()
        bump_cache()
        return 0
    res = engine.compute(df, cfg)
    latest = int(df["year"].max())
    default = cfg["default_preset"]
    pillars = list(cfg["pillars"])
    objs = []
    records = res.to_dict("records")
    for i, row in enumerate(records):
        src = df.at[i, "sources"] or {}
        base = dict(stir=df.at[i, "stir"], year=int(df.at[i, "year"]), model_version=cfg["version"],
                    peer_group=row["peer_group"], peer_size=int(row["peer_size"]), size_class=row["size_class"],
                    oked_section=df.at[i, "oked_section"] or "", region_code=df.at[i, "region_code"] or "",
                    district_soato=df.at[i, "district_soato"] or "",
                    data_source=data_source(bool(df.at[i, "is_synthetic"]), src, "_scoring" in src))
        for preset in cfg["presets"]:
            if preset != default and base["year"] != latest:
                continue
            extra = {}
            overall = _r(row.get(f"overall_{preset}"), 2)
            if preset == default:
                pil = {p: _r(row.get(f"P_{p}"), 2) if row.get(f"appl_{p}") else "na" for p in pillars}
                inds = indicators_json(cfg, row)
                if overall is not None:   # KR-45: ball tarkibi (13.3) va sezgirlik (13.4)
                    contrib = explain.contribution(cfg, pil, row["flags"], default)
                    inds["_contrib"], inds["_sens"] = contrib, explain.sensitivity(cfg, contrib)
                extra = {"pillars": pil, "indicators": inds, "flags": row["flags"]}
            objs.append(EnterpriseScore(preset=preset, overall=overall, klass=row.get(f"klass_{preset}") or "",
                                        coverage=_r(row.get(f"coverage_{preset}")) or 0.0, **base, **extra))
    t1 = time.monotonic()
    with transaction.atomic():
        EnterpriseScore.objects.filter(model_version=cfg["version"]).delete()
        if connection.vendor == "postgresql":
            _copy(objs)
        else:
            EnterpriseScore.objects.bulk_create(objs, batch_size=5000)
    bump_cache()
    if stdout:
        stdout.write(f"  hisob {t1 - t0:.1f} s, yozish {time.monotonic() - t1:.1f} s, {len(objs)} qator")
    return len(objs)


COPY_FIELDS = ("stir", "year", "preset", "model_version", "overall", "klass", "coverage", "peer_group", "peer_size",
               "oked_section", "region_code", "district_soato", "size_class", "pillars", "indicators", "flags",
               "data_source", "computed_at")


NULL = r"\N"   # bo'sh satr ("" sinf) NULL bilan adashmasin


def _copy(objs):
    """PostgreSQL COPY — `bulk_create` dan ~10 baravar tez (65 ming korxona × 5 preset 2 daqiqadan tez, KR-31)."""
    from ..models import EnterpriseScore

    now = timezone.now().isoformat()
    buf = io.StringIO()
    w = csv.writer(buf)
    for o in objs:
        w.writerow([o.stir, o.year, o.preset, o.model_version, NULL if o.overall is None else o.overall, o.klass,
                    o.coverage, o.peer_group, o.peer_size, o.oked_section, o.region_code, o.district_soato,
                    o.size_class, json.dumps(o.pillars or {}), json.dumps(o.indicators or {}), json.dumps(o.flags or []),
                    o.data_source, now])
    buf.seek(0)
    table = EnterpriseScore._meta.db_table
    with connection.cursor() as cur:
        cur.cursor.copy_expert(f"COPY {table} ({', '.join(COPY_FIELDS)}) FROM STDIN WITH (FORMAT csv, NULL '{NULL}')", buf)
