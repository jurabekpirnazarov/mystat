"""KORXONA_SCORING.md KR-33: korxona bali API'si (`/api/analytics/company-scores/`).

GET company-scores/?stir=a,b,c&preset=          — ro'yxatlar uchun (≤100 STIR, bitta so'rov)
GET company-scores/<stir>/?preset=&year=        — kartochka: ustunlar, ko'rsatkich baholari, bayroqlar, guruh
GET company-scores/me/?preset=&year=            — o'z korxonasi: + o'z qiymatlari, guruh medianasi, tavsiyalar
GET company-scores/distribution/?oked=&region=&district=&preset=   — agregat (sinflar, o'rtacha, ustun medianalari)
GET company-scores/methodology/                 — ko'rsatkichlar, vaznlar, chegaralar

Begona korxonaning xom qiymatlari (tushum, foyda, ish haqi, soliq qarzi summasi) hech qachon qaytmaydi — faqat ball,
sinf, ustunlar, ko'rsatkich baholari (0–100) va bayroq nomi (S-10, K-02 qoidasi). OS-18: `DEBUG=False` va
`SiteSettings.company_score_public=False` bo'lsa begona STIR uchun 404 (xodim/admin va `distribution/` bundan mustasno).
"""
import statistics

from django.conf import settings
from django.core.cache import cache
from django.db.models import Avg, Count, Max
from django.http import Http404
from drf_spectacular.types import OpenApiTypes
from drf_spectacular.utils import OpenApiParameter, extend_schema
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from . import config
from .service import cache_version

MAX_STIRS = 100
CACHE_TTL = 24 * 3600
TAG = ["Korxona bali"]
P_PRESET = OpenApiParameter("preset", str, description="Vazn preseti (yoki `csp`): muvozanatli, hamkor, bank, eksport, ijtimoiy")
P_LANG = OpenApiParameter("lang", str, enum=["uz", "ru", "cry"])
DISCLAIMER = {"uz": "Taxminiy baho, rasmiy baho emas.", "ru": "Оценочный балл, не официальная оценка.",
              "cry": "Тахминий баҳо, расмий баҳо эмас."}
SAMPLE_NOTE = {"uz": "Namuna ma'lumot: ball sintetik ko'rsatkichlardan hisoblangan.",
               "ru": "Демонстрационные данные: балл рассчитан по синтетическим показателям.",
               "cry": "Намуна маълумот: балл синтетик кўрсаткичлардан ҳисобланган."}


class BadRequest(Exception):
    pass


def lang_of(request):
    lang = {"uzc": "cry", "cyr": "cry"}.get(request.query_params.get("lang", "uz"), request.query_params.get("lang", "uz"))
    return lang if lang in ("uz", "ru", "cry") else "uz"


def resolve_preset(cfg, params):
    preset = params.get("preset") or params.get("csp") or cfg["default_preset"]
    if preset not in cfg["presets"]:
        raise BadRequest(f"preset noma'lum: {preset}")
    return preset


def _cached(key, build):
    key = f"company_scores:{cache_version()}:{key}"
    data = cache.get(key)
    if data is None:
        data = build()
        cache.set(key, data, CACHE_TTL)
    return data


def is_public():
    if settings.DEBUG:
        return True
    from apps.common.models import SiteSettings

    return bool(SiteSettings.objects.filter(pk=1).values_list("company_score_public", flat=True).first())


def can_see(request, stir):
    user = getattr(request, "user", None)
    if is_public() or (user and user.is_authenticated and user.is_staff):
        return True
    org = getattr(user, "organization", None) if user and user.is_authenticated else None
    return bool(org and org.tin == stir)


def latest_year(cfg):
    from ..models import EnterpriseScore

    return EnterpriseScore.objects.filter(model_version=cfg["version"]).aggregate(y=Max("year"))["y"]


def is_synthetic(data_source):
    return settings.DEBUG and data_source != "real"


def size_label(cfg, key, lang):
    c = next((c for c in cfg["size_classes"] if c["key"] == key), None)
    return config.tr(c["name"], lang) if c else key


def peer_label(cfg, group, size, lang):
    """"C bo'lim, kichik korxonalar, 412 ta" (4.1)."""
    words = {"uz": ("bo'lim", "korxonalar", "Respublika bo'yicha barcha korxonalar", "ta"),
             "ru": ("раздел", "предприятия", "Все предприятия республики", ""),
             "cry": ("бўлим", "корхоналар", "Республика бўйича барча корхоналар", "та")}[lang]
    if group == "all":
        return f"{words[2]}, {size} {words[3]}".strip()
    if ":" in group:
        sec, cls = group.split(":")
        return f"{sec} {words[0]}, {size_label(cfg, cls, lang)} {words[1]}, {size} {words[3]}".strip()
    return f"{group} {words[0]}, {size} {words[3]}".strip()


def pillar_list(cfg, pillars, lang):
    return [{"key": p, "name": config.tr(cfg["pillars"][p]["name"], lang),
             "score": None if pillars.get(p) == "na" else pillars.get(p), "applicable": pillars.get(p) != "na"}
            for p in cfg["pillars"]]


def klass_info(cfg, klass, lang):
    c = next((c for c in cfg["classes"] if c["key"] == klass), None)
    return {"key": klass or "", "name": config.tr(c["name"], lang) if c else
            {"uz": "Ma'lumot yetarli emas", "ru": "Недостаточно данных", "cry": "Маълумот етарли эмас"}[lang]}


def short(score, base, cfg, lang, full=False):
    """Ro'yxat/badge uchun ixcham obyekt. KR-39: ro'yxatlarda faqat 0-daraja (umumiy ball, sinf, to'liqlik) —
    ustunlar va bayroqlar faqat `full=True` (ochilgan kartochka yoki o'z korxonasi)."""
    data = {"stir": score.stir, "year": score.year, "preset": score.preset, "overall": score.overall,
            "klass": score.klass, "klass_name": klass_info(cfg, score.klass, lang)["name"], "coverage": score.coverage,
            "partial": score.overall is not None and score.coverage < cfg["params"]["coverage_full"],
            "data_source": score.data_source, "is_synthetic": is_synthetic(score.data_source)}
    if full:
        data["pillars"] = {p: (None if v == "na" else v) for p, v in (base.pillars if base else {}).items()}
        data["flags"] = base.flags if base else []
    return data


def _rows(cfg, stirs, preset, year):
    from ..models import EnterpriseScore

    default = cfg["default_preset"]
    qs = EnterpriseScore.objects.filter(model_version=cfg["version"], year=year, stir__in=stirs,
                                        preset__in={preset, default})
    by = {}
    for s in qs:
        by.setdefault(s.stir, {})[s.preset] = s
    return by


class CompanyScoresView(APIView):
    """Ro'yxatlar uchun batch: bitta so'rov, N+1 yo'q."""

    permission_classes = (AllowAny,)

    @extend_schema(tags=TAG, operation_id="company_scores_batch", summary="Korxona ballari (ro'yxatlar uchun, ≤100 STIR)",
                   parameters=[OpenApiParameter("stir", str, required=True, description="Vergul bilan, ko'pi bilan 100"),
                               P_PRESET, P_LANG], responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT})
    def get(self, request):
        cfg = config.get()
        try:
            preset = resolve_preset(cfg, request.query_params)
        except BadRequest as exc:
            return Response({"detail": str(exc)}, status=400)
        stirs = [s.strip() for s in (request.query_params.get("stir") or "").split(",") if s.strip()]
        if not stirs:
            return Response({"detail": "stir kerak"}, status=400)
        if len(stirs) > MAX_STIRS:
            return Response({"detail": f"ko'pi bilan {MAX_STIRS} ta STIR"}, status=400)
        lang = lang_of(request)
        visible = [s for s in dict.fromkeys(stirs) if can_see(request, s)]
        year = latest_year(cfg)

        def build():
            by = _rows(cfg, visible, preset, year)
            return {s: short(rows[preset], rows.get(cfg["default_preset"]), cfg, lang)
                    for s, rows in by.items() if preset in rows}
        key = f"list:{preset}:{lang}:{year}:{','.join(sorted(visible))}"
        items = _cached(key, build) if visible else {}
        return Response({"preset": preset, "year": year, "model_version": cfg["version"], "items": items,
                         "disclaimer": DISCLAIMER[lang]})


def detail_payload(cfg, stir, preset, year, lang, own=False):
    from ..models import EnterpriseIndicator, EnterpriseScore

    qs = EnterpriseScore.objects.filter(model_version=cfg["version"], stir=stir)
    years = sorted(set(qs.filter(preset=cfg["default_preset"]).values_list("year", flat=True)))
    if not years:
        raise Http404("Korxona bali yo'q")
    year = year if year in years else years[-1]
    base = qs.filter(year=year, preset=cfg["default_preset"]).first()
    score = qs.filter(year=year, preset=preset).first() or base
    indicators = []
    for code, ind in cfg["indicators"].items():
        d = (base.indicators or {}).get(code)
        if d is None:
            continue
        item = {"code": code, "name": config.tr(ind["name"], lang), "pillar": ind["pillar"], "kind": ind["kind"],
                "score": d.get("s"), "applicable": not d.get("na")}
        if own:      # o'z korxonasi: xom qiymat va guruh medianasi
            item.update({"value": d.get("v"), "median": d.get("m"), "unit": ind.get("unit", ""), "fmt": ind.get("fmt")})
        indicators.append(item)
    sources = {}
    row = EnterpriseIndicator.objects.filter(stir=stir, year=year).values("sources").first()
    if row:
        sources = {k: v for k, v in (row["sources"] or {}).items() if not k.startswith("_")}
    dynamics = list(qs.filter(preset=cfg["default_preset"]).order_by("year").values("year", "overall", "klass"))
    data = {
        **short(score, base, cfg, lang, full=True), "klass_info": klass_info(cfg, score.klass, lang),
        "pillars_detail": pillar_list(cfg, base.pillars or {}, lang),
        "peer_group": base.peer_group, "peer_size": base.peer_size,
        "peer_label": peer_label(cfg, base.peer_group, base.peer_size, lang),
        "flags_detail": [{"code": f, "name": config.tr(cfg["flags"][f], lang)} for f in base.flags or []],
        "indicators": indicators, "years": years, "dynamics": dynamics,
        "real_fields": sorted(k for k, v in sources.items() if v == "real"),
        "presets": [{"key": k, "name": config.tr(v["name"], lang)} for k, v in cfg["presets"].items()],
        "model_version": cfg["version"], "disclaimer": DISCLAIMER[lang],
        "sample_note": SAMPLE_NOTE[lang] if is_synthetic(score.data_source) else None,
    }
    if own:
        data["recommendations"] = recommendations(cfg, base, stir, year, lang)
    return data


def _fmt(value, kind):
    if value is None:
        return "—"
    if kind == "pct":
        return f"{value * 100:.0f}%"
    if kind == "int":
        return f"{value:.0f}"
    if kind == "ratio":
        return f"{value:.2f}"
    if kind == "mln":
        return f"{value:,.0f} mln so'm".replace(",", " ")
    if kind == "score":
        return f"{value:.0f}"
    return f"{value:.1f}"


def recommendations(cfg, base, stir, year, lang):
    """4.9: shablon matnlar o'z qiymati va guruh medianasi bilan (faqat o'z korxonasi uchun)."""
    from ..models import EnterpriseIndicator

    templates = cfg.get("recommendations", {})
    row = EnterpriseIndicator.objects.filter(stir=stir, year=year).first()
    out = []
    for code in (base.indicators or {}).get("_rec", []):
        tpl = templates.get(code) or templates["default"]
        ind = cfg["indicators"].get(code, {})
        d = (base.indicators or {}).get(code, {})
        fmt = ind.get("fmt")
        if code == "i_disab" and row and row.employees:
            value = _fmt((row.disabled_count or 0) / row.employees, "pct")
        elif code == "i_pay_gap" and row and row.gender_pay_ratio is not None:
            value = _fmt(row.gender_pay_ratio, "pct")
        else:
            value = _fmt(d.get("v"), fmt)
        due = row.reports_due if row else None
        late = (row.reports_due or 0) - (row.reports_on_time or 0) if row else None
        text = config.tr(tpl, lang).format(name=config.tr(ind.get("name", {"uz": code}), lang), value=value,
                                           median=_fmt(d.get("m"), fmt), due=due, late=late,
                                           cap=cfg["params"]["cap_tax_debt"])
        out.append({"code": code, "text": text, "link": tpl.get("link"), "score": d.get("s")})
    return out


class CompanyScoreDetailView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(tags=TAG, operation_id="company_scores_detail", summary="Korxona bali kartochkasi (xom qiymatlarsiz)",
                   parameters=[P_PRESET, OpenApiParameter("year", int), P_LANG],
                   responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT})
    def get(self, request, stir):
        cfg = config.get()
        try:
            preset = resolve_preset(cfg, request.query_params)
        except BadRequest as exc:
            return Response({"detail": str(exc)}, status=400)
        if not can_see(request, stir):
            raise Http404("Korxona bali yo'q")
        year = request.query_params.get("year")
        year = int(year) if year and year.isdigit() else None
        lang = lang_of(request)
        data = _cached(f"detail:{stir}:{preset}:{year}:{lang}", lambda: detail_payload(cfg, stir, preset, year, lang))
        return Response(gate_detail(request.user, stir, data))


LEVEL0_KEYS = ("stir", "year", "preset", "overall", "klass", "klass_name", "klass_info", "coverage", "partial",
               "data_source", "is_synthetic", "years", "presets", "model_version", "disclaimer", "sample_note")


def gate_detail(user, stir, data):
    """KR-39: ochilmagan korxona — faqat 0-daraja + `locked` va ochish narxi; ustunlar, bayroqlar, guruh — 1-daraja
    (`basis`), ko'rsatkichlar baholari va dinamika — 2-daraja (`deep`). Ochilmagan qism javobga umuman kirmaydi."""
    from apps.credits import service as credits

    wallet = credits.wallet_of(user)
    unlocks = credits.active_unlocks(wallet, stir) if wallet else {}
    if credits.can_view(user, stir, "deep", wallet=wallet, unlocks=unlocks):
        return {**data, "locked": False, "level": "deep"}
    scored = data.get("overall") is not None
    opts = credits.unlock_options(user, stir, scored, wallet=wallet, unlocks=unlocks)
    if credits.can_view(user, stir, "basis", wallet=wallet, unlocks=unlocks):
        out = {k: v for k, v in data.items() if k not in ("indicators", "dynamics")}
        return {**out, "locked": False, "level": "basis", "unlock_options": [opts["options"]["deep"]]}
    out = {k: data[k] for k in LEVEL0_KEYS if k in data}
    return {**out, "locked": True, "level": "general", "unlock_options": list(opts["options"].values()),
            "profile_url": f"/company/{stir}"}


class MyCompanyScoreView(APIView):
    permission_classes = (IsAuthenticated,)

    @extend_schema(tags=TAG, summary="O'z korxonasi bali: o'z qiymatlari, guruh medianasi, tavsiyalar",
                   parameters=[P_PRESET, OpenApiParameter("year", int), P_LANG],
                   responses={200: OpenApiTypes.OBJECT, 404: OpenApiTypes.OBJECT})
    def get(self, request):
        cfg = config.get()
        org = getattr(request.user, "organization", None)
        if org is None:
            return Response({"detail": "Korxona profili topilmadi.", "code": "no_organization"}, status=404)
        try:
            preset = resolve_preset(cfg, request.query_params)
        except BadRequest as exc:
            return Response({"detail": str(exc)}, status=400)
        year = request.query_params.get("year")
        year = int(year) if year and year.isdigit() else None
        return Response(detail_payload(cfg, org.tin, preset, year, lang_of(request), own=True))


def _quantile(values, q):
    xs = sorted(values)
    pos = (len(xs) - 1) * q
    lo, hi = int(pos), min(int(pos) + 1, len(xs) - 1)
    return xs[lo] + (xs[hi] - xs[lo]) * (pos - lo)


def distribution_payload(cfg, preset, year, lang, filters):
    from ..models import EnterpriseScore

    qs = EnterpriseScore.objects.filter(model_version=cfg["version"], year=year, preset=preset, **filters)
    total = qs.count()
    scored = qs.exclude(klass="")
    n = scored.count()
    counts = dict(scored.values_list("klass").annotate(c=Count("id")))
    sources = dict(qs.values_list("data_source").annotate(c=Count("id")))
    base = EnterpriseScore.objects.filter(model_version=cfg["version"], year=year, preset=cfg["default_preset"],
                                          **filters).exclude(klass="").values_list("pillars", flat=True)
    pill = {p: [] for p in cfg["pillars"]}
    for pillars in base.iterator(chunk_size=5000):
        for p, v in (pillars or {}).items():
            if isinstance(v, (int, float)):
                pill[p].append(v)
    enough = n >= cfg["params"]["min_group_region"]
    bins = [0] * 10
    for v in scored.values_list("overall", flat=True).iterator(chunk_size=10000):
        bins[min(int(v // 10), 9)] += 1
    return {
        "year": year, "preset": preset, "total": total, "scored": n, "enough": enough,
        "mean": round(scored.aggregate(a=Avg("overall"))["a"] or 0, 1) if enough else None,
        "classes": [{"key": c["key"], "name": config.tr(c["name"], lang), "count": counts.get(c["key"], 0),
                     "share": round(counts.get(c["key"], 0) / n * 100, 1) if n else 0} for c in cfg["classes"]],
        "ab_share": round((counts.get("A", 0) + counts.get("B", 0)) / n * 100, 1) if n else None,
        "insufficient": total - n,
        "pillars": [{"key": p, "name": config.tr(cfg["pillars"][p]["name"], lang),
                     "median": round(statistics.median(v), 1) if v else None,
                     "p25": round(_quantile(v, 0.25), 1) if v else None,
                     "p75": round(_quantile(v, 0.75), 1) if v else None} for p, v in pill.items()],
        "histogram": [{"from": i * 10, "to": i * 10 + 10, "count": c} for i, c in enumerate(bins)],
        "data_source": ("real" if sources.get("real", 0) == total else
                        "synthetic" if set(sources) <= {"synthetic"} else "mixed") if total else "real",
        "is_synthetic": settings.DEBUG and not sources.get("real"),
        "disclaimer": DISCLAIMER[lang],
    }


class CompanyScoreDistributionView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(tags=TAG, summary="Korxona ballari taqsimoti (hudud/tarmoq agregati)",
                   parameters=[OpenApiParameter("oked", str, description="OKED bo'limi (A..U)"),
                               OpenApiParameter("region", str, description="Viloyat SOATO (4 xona)"),
                               OpenApiParameter("district", str, description="Tuman SOATO (7 xona)"),
                               OpenApiParameter("size", str, enum=["micro", "small", "medium", "large"]),
                               OpenApiParameter("year", int), P_PRESET, P_LANG],
                   responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT})
    def get(self, request):
        cfg = config.get()
        try:
            preset = resolve_preset(cfg, request.query_params)
        except BadRequest as exc:
            return Response({"detail": str(exc)}, status=400)
        params = request.query_params
        filters = {}
        if params.get("oked"):
            filters["oked_section"] = params["oked"][:1].upper()
        if params.get("region"):
            filters["region_code"] = params["region"][:4]
        if params.get("district"):
            filters["district_soato"] = params["district"][:7]
        if params.get("size") in {c["key"] for c in cfg["size_classes"]}:
            filters["size_class"] = params["size"]
        year = params.get("year")
        year = int(year) if year and year.isdigit() else latest_year(cfg)
        if year is None:
            raise Http404("Korxona ballari hisoblanmagan")
        lang = lang_of(request)
        key = f"dist:{preset}:{year}:{lang}:{sorted(filters.items())}"
        return Response(_cached(key, lambda: distribution_payload(cfg, preset, year, lang, filters)))


def methodology_payload(cfg, lang):
    return {
        "version": cfg["version"], "params": cfg["params"],
        "pillars": [{"key": p, "name": config.tr(v["name"], lang),
                     "indicators": [{"code": c, "name": config.tr(i["name"], lang), "kind": i["kind"],
                                     "direction": i["direction"], "applies": i.get("applies"), "unit": i.get("unit", "")}
                                    for c, i in cfg["indicators"].items() if i["pillar"] == p]}
                    for p, v in cfg["pillars"].items()],
        "presets": [{"key": k, "name": config.tr(v["name"], lang), "weights": v["weights"]} for k, v in cfg["presets"].items()],
        "default_preset": cfg["default_preset"],
        "classes": [{"key": c["key"], "name": config.tr(c["name"], lang), "min": c["min"]} for c in cfg["classes"]],
        "size_classes": [{"key": c["key"], "name": config.tr(c["name"], lang), "max": c["max"]} for c in cfg["size_classes"]],
        "tradable": cfg["tradable"],
        "flags": [{"code": k, "name": config.tr(v, lang)} for k, v in cfg["flags"].items()],
        "disclaimer": DISCLAIMER[lang],
    }


class CompanyScoreMethodologyView(APIView):
    permission_classes = (AllowAny,)

    @extend_schema(tags=TAG, summary="Korxona bali metodologiyasi (company_scoring.yaml)", parameters=[P_LANG],
                   responses={200: OpenApiTypes.OBJECT})
    def get(self, request):
        lang = lang_of(request)
        return Response(_cached(f"methodology:{lang}", lambda: methodology_payload(config.get(), lang)))


class CompanyProfileView(APIView):
    """KR-45: korxona profili — bo'limlar bitta javobda, har biri ma'lumot yoki `{locked, unlock}`."""

    permission_classes = (AllowAny,)

    @extend_schema(tags=TAG, operation_id="company_profile", summary="Korxona profili (bepul qism + qulflangan bo'limlar)",
                   parameters=[P_PRESET, P_LANG], responses={200: OpenApiTypes.OBJECT, 400: OpenApiTypes.OBJECT,
                                                             404: OpenApiTypes.OBJECT})
    def get(self, request, stir):
        from .profile import profile_payload

        cfg = config.get()
        try:
            preset = resolve_preset(cfg, request.query_params)
        except BadRequest as exc:
            return Response({"detail": str(exc)}, status=400)
        return Response(profile_payload(request, stir.strip(), preset, lang_of(request)))
