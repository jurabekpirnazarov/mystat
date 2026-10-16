"""KR-15: `scoring.yaml` ni o'qish va sxema bo'yicha tekshirish.

Xato konfiguratsiya (noma'lum manba, yo'nalish, ustun yoki qoida ko'rsatkichi) ishga tushishdayoq `ConfigError`
beradi — noto'g'ri baho jimgina hisoblanib ketmasligi uchun.
"""
import os
from functools import lru_cache

import yaml

from ..catalog import DEFAULT_GROUPS, DEFAULT_INDICATORS, DERIVED, EXTRA_SOURCES

PATH = os.path.join(os.path.dirname(__file__), "scoring.yaml")
PILLARS = ("A", "B", "C", "D", "E")
LEVELS = ("region", "district")
DIRECTIONS = ("+", "-")
TRANSFORMS = ("log", "none")
ROLES = ("score", "context", "rule")
OPS = (">=", "<=", "negative_streak")
LANGS = ("uz", "ru", "en")


class ConfigError(ValueError):
    pass


def known_sources():
    """Sinxronlanadigan yoki hisoblanadigan SiatIndicator kalitlari."""
    return ({str(i) for i in DEFAULT_INDICATORS} | {str(i) for i in EXTRA_SOURCES} | set(DERIVED)
            | set(DEFAULT_GROUPS))


def _require(cond, message):
    if not cond:
        raise ConfigError(message)


def _names(obj, where):
    _require(isinstance(obj, dict) and all(obj.get(lang) for lang in LANGS), f"{where}: uz, ru, en nomlari kerak")


def validate(cfg):
    _require(isinstance(cfg, dict), "scoring.yaml: lug'at kutilgan")
    _require(str(cfg.get("version") or ""), "version kerak")
    params = cfg.get("params") or {}
    for key in ("coverage_min", "coverage_full", "z_clip", "score_scale", "max_lag", "strong_pct", "weak_pct",
                "rank_iterations", "rank_jitter", "rank_seed", "lq_high", "lq_low", "peers", "peers_min_common"):
        _require(isinstance(params.get(key), (int, float)), f"params.{key} son bo'lishi kerak")
    _require(0 < params["coverage_min"] <= params["coverage_full"] <= 1, "coverage_min ≤ coverage_full ≤ 1")

    sources = known_sources()
    indicators = cfg.get("indicators") or {}
    _require(indicators, "indicators bo'sh")
    for key, ind in indicators.items():
        where = f"indicators.{key}"
        _names(ind.get("name"), where)
        _names(ind.get("unit"), f"{where}.unit")
        src = ind.get("source") or {}
        _require(str(src.get("key")) in sources, f"{where}: noma'lum manba {src.get('key')!r}")
        _require(ind.get("level") in LEVELS, f"{where}: level — region yoki district")
        _require(ind.get("role") in ROLES, f"{where}: role — {', '.join(ROLES)}")
        if ind["role"] == "score":
            _require(ind.get("direction") in DIRECTIONS, f"{where}: direction — '+' yoki '-'")
            _require(ind.get("transform") in TRANSFORMS, f"{where}: transform — log yoki none")
        avg = src.get("avg_years", 1)
        _require(isinstance(avg, int) and 1 <= avg <= 5, f"{where}: avg_years 1..5")

    pillars = cfg.get("pillars") or {}
    _require(tuple(pillars) == PILLARS, f"pillars: aynan {', '.join(PILLARS)}")
    used = set()
    for key, pillar in pillars.items():
        _names(pillar.get("name"), f"pillars.{key}")
        members = pillar.get("indicators") or []
        _require(members, f"pillars.{key}: ko'rsatkich yo'q")
        for member in members:
            _require(member in indicators, f"pillars.{key}: noma'lum ko'rsatkich {member!r}")
            _require(indicators[member]["role"] == "score", f"pillars.{key}: {member} role=score bo'lishi kerak")
            _require(member not in used, f"{member} ikki ustunda")
            used.add(member)

    presets = cfg.get("presets") or {}
    _require("balanced" in presets, "presets.balanced (standart) kerak")
    for key, preset in presets.items():
        _names(preset.get("name"), f"presets.{key}")
        for level in LEVELS:
            weights = preset.get(level)
            _require(isinstance(weights, list) and len(weights) == len(PILLARS)
                     and all(isinstance(w, (int, float)) and w >= 0 for w in weights) and sum(weights) > 0,
                     f"presets.{key}.{level}: 5 ta manfiy bo'lmagan vazn")

    for code, rule in (cfg.get("rules") or {}).items():
        where = f"rules.{code}"
        _names(rule.get("title"), where)
        _names(rule.get("why"), f"{where}.why")
        _require(set(rule.get("levels") or ()) <= set(LEVELS) and rule.get("levels"), f"{where}: levels")
        if rule.get("sector"):
            continue
        for cond in rule.get("when") or []:
            _require(cond.get("indicator") in indicators, f"{where}: noma'lum ko'rsatkich {cond.get('indicator')!r}")
            _require(cond.get("op") in OPS, f"{where}: op — {', '.join(OPS)}")
            if cond["op"] != "negative_streak":
                _require(isinstance(cond.get("pct"), (int, float)) and 0 <= cond["pct"] <= 100, f"{where}: pct 0..100")
        _require(rule.get("when"), f"{where}: shart yo'q")
    return cfg


@lru_cache(maxsize=1)
def load(path=PATH):
    with open(path, encoding="utf-8") as fh:
        return validate(yaml.safe_load(fh))


def pillar_of(cfg):
    return {member: key for key, pillar in cfg["pillars"].items() for member in pillar["indicators"]}


def scored(cfg, level):
    """Shu darajada bahoga kiradigan ko'rsatkichlar: tumanda faqat tuman kesimidagilar (2.1 — meros taqiqlangan)."""
    return [key for pillar in cfg["pillars"].values() for key in pillar["indicators"]
            if level == "region" or cfg["indicators"][key]["level"] == "district"]


def weights_for(cfg, level, preset="balanced", custom=None):
    """-> {ustun: vazn}. Tumanda viloyat ustunlari (A, D, E) har doim 0."""
    raw = list(custom) if custom is not None else cfg["presets"][preset][level]
    if level == "district":
        raw = [0 if p in ("A", "D", "E") else w for p, w in zip(PILLARS, raw)]
        if not sum(raw):
            raw = cfg["presets"]["balanced"]["district"]
    return dict(zip(PILLARS, (float(w) for w in raw)))


def parse_weights(text):
    """`25,25,15,25,10` -> [25.0, ...]; noto'g'ri bo'lsa ValueError."""
    parts = [p for p in str(text).split(",")]
    if len(parts) != len(PILLARS):
        raise ValueError("weights: 5 ta son kerak")
    values = [float(p) for p in parts]
    if any(v < 0 or v != v for v in values) or sum(values) <= 0:
        raise ValueError("weights: manfiy bo'lmagan, yig'indisi > 0")
    return values
