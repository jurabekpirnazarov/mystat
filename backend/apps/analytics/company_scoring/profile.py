"""KORXONA_SCORING.md KR-45: korxona profili — `GET /api/analytics/company-profile/<stir>/?preset=&lang=`.

Bitta javobda 13.2 bo'limlari. Har bo'lim yo ma'lumot, yo `{locked: true, unlock: {...narx, sabab}}` — ochilmagan
bo'lim ma'lumoti backend'dan umuman yuborilmaydi (KR-39, `credits.service.can_view`):

    general — bepul: rekvizitlar, mahsulotlar soni, umumiy ball va sinf, to'liqlik, "Namuna"
    basis   — 1 kredit (30 kun): 6 ustun, ball tarkibi (13.3), bayroqlar ta'siri, tengdoshlar va o'rin, presetlar
    deep    — 3 kredit (basis ochilgan bo'lsa 2), Tarif 60+: ko'rsatkichlar o'rni, dinamika, kuchli/zaif, sezgirlik
              (13.4), o'xshash 5 korxona, hududiy kontekst, OKED×hudud taqsimoti, PDF
    watch   — Tarif 90 va korporativ (KR-43 bilan ishga tushadi)

Begona korxonaning xom qiymatlari (tushum, foyda, ish haqi, soliq qarzi summasi) hech bir bo'limda yo'q (OS-22):
chuqur tahlil "guruhdagi o'rni" (0–100) orqali beriladi. Xodimlar soni faqat oraliq ("11–50") ko'rinishida.
"""
import math

from django.conf import settings
from django.http import Http404

from apps.credits import service as credits

from . import config, explain
from .api import (DISCLAIMER, SAMPLE_NOTE, _cached, can_see, distribution_payload, is_synthetic, klass_info,
                  latest_year, peer_label, pillar_list)

SIMILAR_N = 5

KLASS_MEANING = {
    "A": "Tengdoshlari orasida eng kuchli korxonalardan biri: ko'pchilik yo'nalishda guruhdan yuqori.",
    "B": "Ko'p yo'nalishda guruh o'rtachasidan yaxshi, sezilarli zaif tomoni kam.",
    "C": "Guruh o'rtachasi atrofida: kuchli va zaif tomonlari aralash.",
    "D": "Bir nechta yo'nalishda guruhdan past; e'tibor talab qiladigan tomonlari bor.",
    "E": "Ko'p yo'nalishda guruhdan ancha past yoki jiddiy bayroqlar bor.",
    "": "Ma'lumot yetarli emas: ishonchli ball hisoblash uchun ko'rsatkichlar kam.",
}
OWNERSHIP = {"private": "Xususiy", "state": "Davlat ulushi bor", "foreign": "Xorijiy kapital ishtirokida"}
SECTION_TEXT = {
    "basis": {"title": "Ball nimaga asoslangan",
              "summary": "6 ustun radari, ball tarkibi (har ustun necha ball qo'shdi yoki ayirdi), bayroqlar ta'siri, "
                         "tengdoshlar orasidagi o'rin, vazn presetlari."},
    "deep": {"title": "Chuqur tahlil",
             "summary": "Har ko'rsatkich bo'yicha guruhdagi o'rni, 2023–2025 dinamikasi, kuchli va zaif tomonlar, "
                        "\"nima bo'lsa\" sezgirligi, o'xshash korxonalar, hududiy kontekst, PDF."},
    "watch": {"title": "Kuzatish",
              "summary": "Sinf o'zgarsa yoki yangi bayroq chiqsa xabarnoma. Tarif 90 va korporativ tarifda."},
}


# --- Umumiy yordamchilar -------------------------------------------------------------------------------------------

def _scores(cfg, stir):
    from ..models import EnterpriseScore

    return EnterpriseScore.objects.filter(model_version=cfg["version"], stir=stir)


def is_scored(stir):
    """Ochish mumkinmi: oxirgi yilda standart preset bo'yicha ball bor (to'liqlik ≥ coverage_min)."""
    cfg = config.get()
    year = latest_year(cfg)
    return bool(year and _scores(cfg, stir).filter(year=year, preset=cfg["default_preset"],
                                                    overall__isnull=False).exists())


def _name_of(stir):
    from apps.additional_services.models import Ktut
    from apps.organizations.models import Organization

    from ..company_card import clean_okpo

    row = Ktut.objects.filter(inn=stir).values("name", "okpo").first()
    if row:
        return row["name"], clean_okpo(row["okpo"])
    org = Organization.objects.filter(tin=stir).values_list("name", flat=True).first()
    return org, None


def _section_name(code):
    from apps.common.models import Sector

    if not code:
        return None
    name = Sector.objects.filter(parent__isnull=True, code=code).values_list("name_uz", "name").first()
    text = (name and (name[0] or name[1]) or "").strip()
    return text[:1].upper() + text[1:].lower() if text else None


def _employees_range(cfg, size_class):
    bounds, lo = {}, 1
    for c in cfg["size_classes"]:
        bounds[c["key"]] = f"{lo}–{c['max']}" if c["max"] else f"{lo}+"
        lo = (c["max"] or 0) + 1
    return bounds.get(size_class)


def _products(stir):
    from apps.additional_services.models import IndustrialProduct

    return IndustrialProduct.objects.filter(inn=stir).count()


def _position(ind_kind, score):
    if score is None:
        return "none"
    limit = 60 if ind_kind == "absolute" else 50
    return "above" if score >= limit else "below"


# --- Bo'limlar -----------------------------------------------------------------------------------------------------

def general_section(cfg, stir, base, score, lang):
    from ..models import EnterpriseIndicator

    name, okpo = _name_of(stir)
    ind = (EnterpriseIndicator.objects.filter(stir=stir, is_peer=False).select_related("region", "district")
           .order_by("-year").first())
    from apps.additional_services.api_endpoints.PartnersAPI import legal_form

    sources = {k: v for k, v in ((ind.sources if ind else {}) or {}).items() if not k.startswith("_")}
    klass = score.klass if score else ""
    region = ind.region.name if ind and ind.region_id else None
    district = ind.district.name if ind and ind.district_id else None
    # IHAMKOR_MUQOBIL IH-01: sanoat reyestrida real manzil bo'lsa, hudud undan (sintetik namuna o'rniga)
    from apps.additional_services.api_endpoints.PartnersAPI import region_by_address
    from apps.additional_services.models import IndustrialProduct
    from apps.analytics.geo import REGION_NAME_UZ

    real = (IndustrialProduct.objects.filter(inn=stir, is_active=True).exclude(adress_uz__isnull=True)
            .exclude(adress_uz="").order_by("-updated_at").values("adress_uz", "soato_uz").first())
    if real:
        code = region_by_address(real["adress_uz"])
        region = REGION_NAME_UZ.get(code) if code else None
        district = real["soato_uz"] or None
        sources = {**sources, "region": "real"}
    return {
        "name": name, "stir": stir, "okpo": okpo,
        "legal_form": (legal_form(name) or {}).get("name") if name else None,
        "oked_section": ind.oked_section if ind else None,
        "oked_name": _section_name(ind.oked_section) if ind else None,
        "oked_division": (ind.oked_division or None) if ind else None,
        "region": region, "district": district,
        "region_is_real": bool(real),
        "ownership": OWNERSHIP.get(ind.ownership) if ind else None,
        "founded_year": ind.founded_year if ind else None,
        "employees_range": _employees_range(cfg, base.size_class) if base else None,
        "products_count": _products(stir),
        "score": None if score is None else {
            "overall": score.overall, "klass": klass, "klass_name": klass_info(cfg, klass, lang)["name"],
            "meaning": KLASS_MEANING.get(klass, ""), "coverage": score.coverage,
            "partial": score.overall is not None and score.coverage < cfg["params"]["coverage_full"],
            "year": score.year, "data_source": score.data_source, "is_synthetic": is_synthetic(score.data_source)},
        # Rekvizitlarning manbasi: KTUT'da OKED, hudud va mulkchilik yo'q — demo muhitda ular ham namuna
        "real_fields": sorted(k for k, v in sources.items() if v == "real"),
        "requisites_synthetic": bool(ind) and settings.DEBUG and sources.get("oked_section") != "real",
    }


def _rank(cfg, score):
    """Tengdoshlar guruhidagi o'rin (tanlangan preset, shu yil). -> (o'rin, baholanganlar soni)."""
    from ..models import EnterpriseScore

    if score is None or score.overall is None:
        return None, None
    qs = EnterpriseScore.objects.filter(model_version=cfg["version"], year=score.year, preset=score.preset,
                                        peer_group=score.peer_group, overall__isnull=False)
    if score.peer_group == "all":
        qs = qs.filter(peer_group="all")
    return qs.filter(overall__gt=score.overall).count() + 1, qs.count()


def contribution_for(cfg, base, preset):
    stored = (base.indicators or {}).get("_contrib")
    if preset == cfg["default_preset"] and stored:
        return stored
    return explain.contribution(cfg, base.pillars or {}, base.flags or [], preset)


def _named_contrib(cfg, contrib, lang):
    if not contrib:
        return None
    names = {p: config.tr(v["name"], lang) for p, v in cfg["pillars"].items()}
    return {**contrib, "pillars": [{**r, "name": names[r["key"]]} for r in contrib["pillars"]]}


def basis_section(cfg, stir, base, score, preset, lang):
    contrib = _named_contrib(cfg, contribution_for(cfg, base, preset), lang)
    flags = []
    for f in base.flags or []:
        effect = {"soliq_qarzi": (f"Ball {cfg['params']['cap_tax_debt']} bilan cheklangan"
                                  + (f" ({contrib['cap']:+.1f})" if contrib and contrib.get("cap") else "")),
                  "hisobot_intizomi_past": "Ball \"Intizom\" ustuni orqali pasaygan",
                  "zarar_bilan_ishlagan": "Faqat belgi: ballga alohida ta'sir qilmaydi"}.get(f, "")
        flags.append({"code": f, "name": config.tr(cfg["flags"][f], lang), "effect": effect})
    rank, ranked = _rank(cfg, score)
    indicators = []
    for code, ind in cfg["indicators"].items():
        d = (base.indicators or {}).get(code)
        if not d or d.get("na"):
            continue
        indicators.append({"code": code, "name": config.tr(ind["name"], lang), "pillar": ind["pillar"],
                           "kind": ind["kind"], "position": _position(ind["kind"], d.get("s"))})
    return {
        "locked": False,
        "pillars": pillar_list(cfg, base.pillars or {}, lang),
        "contribution": contrib,
        "flags": flags,
        "peer_group": base.peer_group, "peer_size": base.peer_size,
        "peer_label": peer_label(cfg, base.peer_group, base.peer_size, lang),
        "rank": rank, "ranked": ranked,
        "indicators": indicators,
    }


def _similar(cfg, base, lang):
    """Shu tengdoshlar guruhida ustunlar vektori bo'yicha eng yaqin 5 ta (Evklid masofa). Faqat ball va sinf."""
    from ..models import EnterpriseScore

    def build():
        mine = {p: v for p, v in (base.pillars or {}).items() if isinstance(v, (int, float))}
        if not mine:
            return []
        rows = (EnterpriseScore.objects.filter(model_version=cfg["version"], year=base.year, preset=base.preset,
                                               peer_group=base.peer_group, overall__isnull=False)
                .exclude(stir=base.stir).values_list("stir", "pillars", "overall", "klass", "data_source"))
        scored = []
        for stir, pillars, overall, klass, src in rows.iterator(chunk_size=5000):
            pillars = pillars or {}
            dist = 0.0
            for p, v in mine.items():
                other = pillars.get(p)
                # Ustun bahosi yo'q bo'lsa — eng katta farq (50) deb olinadi, o'xshash sanalmasin
                dist += (v - other) ** 2 if isinstance(other, (int, float)) else 50.0 ** 2
            scored.append((math.sqrt(dist), stir, overall, klass, src))
        scored.sort()
        top = scored[:SIMILAR_N]
        names = _names([s for _, s, *_ in top])
        return [{"stir": s, "name": names.get(s), "overall": o, "klass": k,
                 "klass_name": klass_info(cfg, k, lang)["name"], "is_synthetic": is_synthetic(src)}
                for _, s, o, k, src in top]
    return _cached(f"similar:{base.stir}:{base.year}:{lang}", build)


def _names(stirs):
    from apps.additional_services.models import Ktut

    return dict(Ktut.objects.filter(inn__in=stirs).values_list("inn", "name"))


def _region_context(cfg, base):
    """`SCORING_MODEL.md` hudud indeksi (oxirgi haqiqiy yil, "balanced") va tarmoq ixtisosi."""
    from apps.siat.models import TerritoryScore

    if not base.region_code:
        return None
    qs = TerritoryScore.objects.filter(level="region", preset="balanced", is_forecast=False).exclude(score__isnull=True)
    row = qs.filter(soato=base.region_code).order_by("-period").first()
    if row is None:
        return None
    total = qs.filter(period=row.period).count()
    from apps.common.models import Region

    sectors = [{"label": s.get("label"), "lq": s.get("lq")} for s in (row.details or {}).get("sectors", [])[:3]]
    return {"region": Region.objects.filter(code=base.region_code).values_list("name", flat=True).first(),
            "soato": base.region_code, "year": row.period, "score": row.score, "rank": row.rank, "of": total,
            "sectors": sectors, "link": f"/regions/{base.region_code}"}


def deep_section(cfg, stir, base, score, preset, lang):
    indicators = []
    for code, ind in cfg["indicators"].items():
        d = (base.indicators or {}).get(code)
        if not d or d.get("na"):
            continue
        indicators.append({"code": code, "name": config.tr(ind["name"], lang), "pillar": ind["pillar"],
                           "kind": ind["kind"], "direction": ind["direction"], "score": d.get("s"),
                           "position": _position(ind["kind"], d.get("s"))})
    ranked = sorted((i for i in indicators if i["score"] is not None), key=lambda i: i["score"])
    dyn = list(_scores(cfg, stir).filter(preset=cfg["default_preset"]).order_by("year")
               .values("year", "overall", "klass", "pillars"))
    dynamics = [{"year": r["year"], "overall": r["overall"], "klass": r["klass"],
                 "pillars": {p: (v if isinstance(v, (int, float)) else None) for p, v in (r["pillars"] or {}).items()}}
                for r in dyn]
    contrib = contribution_for(cfg, base, preset)
    sens = ((base.indicators or {}).get("_sens") if preset == cfg["default_preset"] else None) \
        or explain.sensitivity(cfg, contrib)
    by_preset = {s.preset: s for s in _scores(cfg, stir).filter(year=base.year)}
    presets = [{"key": k, "name": config.tr(v["name"], lang), "overall": by_preset[k].overall if k in by_preset else None,
                "klass": by_preset[k].klass if k in by_preset else ""} for k, v in cfg["presets"].items()]
    filters = {"oked_section": base.oked_section} if base.oked_section else {}
    if base.region_code:
        filters["region_code"] = base.region_code
    dist = _cached(f"dist:{preset}:{base.year}:{lang}:{sorted(filters.items())}",
                   lambda: distribution_payload(cfg, preset, base.year, lang, filters))
    return {
        "locked": False,
        "indicators": indicators,
        "strengths": list(reversed(ranked[-3:])), "weaknesses": ranked[:3],
        "dynamics": dynamics,
        "sensitivity": sens, "presets": presets,
        "similar": _similar(cfg, base, lang),
        "region_context": _region_context(cfg, base),
        "distribution": {"filters": filters, "classes": dist["classes"], "mean": dist["mean"], "scored": dist["scored"],
                         "enough": dist["enough"], "histogram": dist["histogram"], "is_synthetic": dist["is_synthetic"]},
        "pdf": True,
    }


def locked(level, opts):
    return {"locked": True, **SECTION_TEXT[level], "unlock": opts["options"].get(level)}


def profile_payload(request, stir, preset, lang):
    cfg = config.get()
    user = request.user
    if not can_see(request, stir):
        raise Http404("Korxona topilmadi")
    year = latest_year(cfg)
    qs = _scores(cfg, stir)
    base = qs.filter(year=year, preset=cfg["default_preset"]).first() if year else None
    score = (qs.filter(year=year, preset=preset).first() or base) if year else None
    name, _okpo = _name_of(stir)
    if base is None and name is None:
        raise Http404("Korxona topilmadi")

    wallet = credits.wallet_of(user)
    unlocks = credits.active_unlocks(wallet, stir) if wallet else {}
    scored = bool(base and base.overall is not None)
    opts = credits.unlock_options(user, stir, scored, wallet=wallet, unlocks=unlocks)
    view = {lvl: scored and credits.can_view(user, stir, lvl, wallet=wallet, unlocks=unlocks) for lvl in credits.LEVELS}

    data = {
        "stir": stir, "preset": preset, "year": year, "model_version": cfg["version"],
        "presets": [{"key": k, "name": config.tr(v["name"], lang)} for k, v in cfg["presets"].items()],
        "general": general_section(cfg, stir, base, score, lang),
        "access": {"authenticated": bool(user and user.is_authenticated), "owner": credits.is_owner(user, stir),
                   "privileged": credits.is_privileged(user, stir), "plan": opts["plan"], "balance": opts["balance"],
                   "unlocks": {lvl: u.expires_at for lvl, u in unlocks.items()}, "scored": scored},
        "basis": basis_section(cfg, stir, base, score, preset, lang) if view["basis"] else locked("basis", opts),
        "deep": deep_section(cfg, stir, base, score, preset, lang) if view["deep"] else locked("deep", opts),
        "watch": {"locked": True, **SECTION_TEXT["watch"], "min_plan": "s90", "available": False,
                  "note": "Kuzatuv xizmati tez orada ishga tushadi."},
        "is_synthetic": bool(base and is_synthetic(base.data_source)),
        "sample_note": SAMPLE_NOTE[lang] if base and is_synthetic(base.data_source) else None,
        "disclaimer": DISCLAIMER[lang],
    }
    if not scored:
        for lvl in credits.LEVELS:
            if data[lvl].get("locked"):
                data[lvl]["insufficient"] = True
    return data
