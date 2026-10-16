"""KORXONA_SCORING.md KR-29: `company_scoring.yaml` ni o'qish va tekshirish (xato bo'lsa ishga tushishda ConfigError)."""
from functools import lru_cache
from pathlib import Path

import yaml

PATH = Path(__file__).resolve().parent.parent / "company_scoring.yaml"
KINDS = ("peer", "absolute", "trade")
LANGS = ("uz", "ru", "cry")


class ConfigError(ValueError):
    pass


def _require(cond, message):
    if not cond:
        raise ConfigError(message)


def validate(cfg):
    from . import engine

    for key in ("version", "params", "pillars", "indicators", "presets", "classes", "default_preset", "size_classes"):
        _require(key in cfg, f"company_scoring.yaml: '{key}' yo'q")
    pillars = set(cfg["pillars"])
    for code, ind in cfg["indicators"].items():
        where = f"indicators.{code}"
        _require(ind.get("pillar") in pillars, f"{where}: noma'lum ustun {ind.get('pillar')!r}")
        _require(ind.get("kind") in KINDS, f"{where}: kind {KINDS} dan biri bo'lishi kerak")
        _require(ind.get("direction") in ("+", "-"), f"{where}: direction '+' yoki '-'")
        has_value, has_field = "value" in ind, "field" in ind
        _require(has_value != has_field, f"{where}: 'value' yoki 'field' dan bittasi")
        if has_value:
            _require(ind["value"] in engine.VALUE_FUNCS, f"{where}: noma'lum value {ind['value']!r}")
        else:
            _require(ind["field"] in engine.NUMERIC_FIELDS, f"{where}: noma'lum maydon {ind['field']!r}")
        if "applies" in ind:
            _require(ind["applies"] in engine.CONDITIONS, f"{where}: noma'lum shart {ind['applies']!r}")
        if "shrink" in ind:
            _require(ind["shrink"] in engine.NUMERIC_FIELDS, f"{where}: shrink maydoni noma'lum")
        _require(isinstance(ind.get("name"), dict) and "uz" in ind["name"], f"{where}: name.uz kerak")
        if ind["kind"] == "trade":
            _require(ind["pillar"] == "T", f"{where}: trade ko'rsatkich faqat T ustunida")
    for name, preset in cfg["presets"].items():
        weights = preset.get("weights") or {}
        _require(set(weights) <= pillars, f"presets.{name}: noma'lum ustun")
        _require(all(isinstance(w, (int, float)) and w >= 0 for w in weights.values()), f"presets.{name}: manfiy vazn")
        _require(sum(weights.values()) > 0, f"presets.{name}: vaznlar yig'indisi 0")
    _require(cfg["default_preset"] in cfg["presets"], "default_preset presetlarda yo'q")
    mins = [c["min"] for c in cfg["classes"]]
    _require(mins == sorted(mins, reverse=True) and mins[-1] == 0, "classes: chegaralar kamayuvchi, oxirgisi 0")
    p = cfg["params"]
    for key in ("min_peer", "shrink_k", "no_export_score", "cap_tax_debt", "coverage_min", "coverage_full"):
        _require(key in p, f"params.{key} yo'q")
    _require(0 < p["coverage_min"] <= p["coverage_full"] <= 1, "params: 0 < coverage_min <= coverage_full <= 1")
    return cfg


def load(path=PATH):
    with open(path, encoding="utf-8") as f:
        return validate(yaml.safe_load(f))


@lru_cache(maxsize=1)
def get():
    return load()


def tr(obj, lang):
    """{'uz','ru','cry'} -> tilga mos matn ('uzc' ham 'cry' deb qabul qilinadi)."""
    if not isinstance(obj, dict):
        return obj
    lang = "cry" if lang in ("uzc", "cry") else lang
    return obj.get(lang) or obj.get("uz", "")


def klass_of(cfg, score):
    if score is None:
        return ""
    for c in cfg["classes"]:
        if score >= c["min"]:
            return c["key"]
    return cfg["classes"][-1]["key"]


def size_class(cfg, employees):
    for c in cfg["size_classes"]:
        if c["max"] is None or employees <= c["max"]:
            return c["key"]
    return cfg["size_classes"][-1]["key"]
