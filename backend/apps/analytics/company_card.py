"""IHAMKOR_MUQOBIL.md IH-01, IH-02, IH-03, IH-04 (havola), IH-08: "Kontragent kartasi" — bepul, faqat real manbalar.

GET /api/analytics/company-card/<stir>/     — pasport, xulosa belgilari, statistik intizom, ishlab chiqarish
GET /api/analytics/company-card/search/?q=  — STIR yoki nom bo'yicha qidiruv (`/check` sahifasi)

Manbalar (IHAMKOR_MUQOBIL 0-bo'lim):
- KTUT (`Ktut`): STIR, OKPO, nom — statistik hisobot topshiruvchilar ro'yxati (~65 ming), to'liq registr emas.
  Holat, sana, OKED, manzil unda yo'q.
- Majburiy statistik hisobotlar (`KtutReportList` → `ReportList`): real. "O'z vaqtida topshirilgan %" — manba yo'q
  (`submitted-report` namuna), shuning uchun hisoblanmaydi va `timely_share: null`.
- Sanoat ishlab chiqarish reyestri (`IndustrialProduct`): real tuman, manzil, mahsulot turlari (~39 ming korxona).
  Telefon javobga kirmaydi (PartnersAPI qoidasi bilan bir xil).
Scoring bali — faqat `can_see` ruxsat bersa (OS-18) va doim namuna/real belgisi bilan; karta usiz ham ishlaydi.
Har blokda `source` va `as_of`: foydalanuvchi qaysi raqam qayerdan kelganini ko'radi.
"""
import re

from django.db.models import Count, Max
from django.http import Http404

from apps.additional_services.api_endpoints.PartnersAPI import legal_form, region_by_address
from apps.additional_services.models import IndustrialProduct, Ktut, KtutReportList, ReportList
from apps.analytics.geo import REGION_NAME_UZ
from apps.common.search import ci_contains

STIR_RE = re.compile(r"^\d{9}$")
MASS_ADDRESS_MIN = 10          # bitta manzilda shuncha va undan ko'p korxona — "ommaviy manzil" belgisi
PERIODICITY = {"monthly": "Oylik", "quarterly": "Choraklik", "yearly": "Yillik"}
SRC_KTUT = "KTUT (korxona va tashkilotlarning yagona davlat registri)"
SRC_REPORTS = "Statistik hisobotlar ro'yxati (KTUT bo'yicha)"
SRC_INDUSTRY = "Sanoat mahsulotlari ishlab chiqaruvchilari reyestri"
SEARCH_LIMIT = 20


def _clean(text):
    return re.sub(r"\s+", " ", (text or "").replace("_x000D_", " ")).strip()


def clean_okpo(value):
    """KTUT'dagi OKPO Excel importidan "29903881.0" ko'rinishida kelgan bo'lishi mumkin."""
    text = str(value or "").strip()
    return re.sub(r"\.0+$", "", text) or None


def _as_of(value):
    return value.date().isoformat() if value else None


def _industry_rows(stir):
    return IndustrialProduct.objects.filter(inn=stir, is_active=True)


def passport(stir, ktut, industry):
    """IH-01. Hudud va manzil faqat sanoat reyestridan (KTUT'da yo'q); bo'lmasa `null` — o'ylab topilmaydi."""
    first = industry.order_by("-updated_at").first()
    name = (ktut.name if ktut else None) or (first.name if first else None)
    address = first.adress_uz if first else None
    region_code = region_by_address(address) if address else None
    return {
        "name": name, "stir": stir, "okpo": clean_okpo((ktut.okpo if ktut else None) or (first.okpo if first else None)),
        "legal_form": legal_form(name)["name"] if name else None,
        "region": REGION_NAME_UZ.get(region_code) if region_code else None,
        "district": first.soato_uz if first else None,
        "address": address,
        "in_ktut": ktut is not None,
        "sources": {"requisites": SRC_KTUT if ktut else SRC_INDUSTRY, "address": SRC_INDUSTRY if first else None},
        "as_of": _as_of(industry.aggregate(m=Max("updated_at"))["m"]) if first else None,
        "missing": [label for label, ok in (("Faoliyat holati", False), ("Ro'yxatdan o'tgan sana", False),
                                            ("OKED", False), ("Manzil", bool(address)))
                    if not ok],
    }


def discipline(ktut):
    """IH-03: majburiy statistik hisobotlar. O'z vaqtida topshirish ulushi uchun real manba yo'q."""
    if ktut is None:
        return {"available": False, "reports_count": 0, "forms": [], "by_periodicity": {}, "timely_share": None,
                "note": "Korxona statistik hisobot topshiruvchilar ro'yxatida yo'q.", "source": SRC_REPORTS}
    ids = KtutReportList.objects.filter(ktut=ktut).values_list("reportlist_id", flat=True)
    reports = list(ReportList.objects.filter(id__in=ids, is_active=True).order_by("report_type", "id"))
    by = {}
    for r in reports:
        label = PERIODICITY.get(r.report_type, "Boshqa")
        by[label] = by.get(label, 0) + 1
    return {
        "available": True, "reports_count": len(reports), "by_periodicity": by,
        "forms": [{"id": r.id, "form": _clean(r.type_uz or r.type), "title": _clean(r.formsname_uz or r.formsname),
                   "periodicity": PERIODICITY.get(r.report_type, ""), "deadline_rule": _clean(r.srok_uz or r.srok)}
                  for r in reports],
        "timely_share": None,
        "timely_note": "O'z vaqtida topshirilgan hisobotlar ulushi hozircha hisoblanmaydi: topshirish ma'lumoti "
                       "portalga ulanmagan.",
        "source": SRC_REPORTS,
    }


def production(industry):
    """Ishlab chiqarilgan mahsulot turlari (sanoat reyestri)."""
    rows = list(industry.select_related("skp", "category").order_by("skp__code"))
    if not rows:
        return {"available": False, "products_count": 0, "products": [], "categories": [], "source": SRC_INDUSTRY}
    cats = {}
    for r in rows:
        cat = (r.category.name_uz or r.category.name_ru) if r.category_id else None
        if cat:
            cats[cat] = cats.get(cat, 0) + 1
    return {
        "available": True, "products_count": len(rows),
        "products": [{"code": r.skp.code, "name": _clean(r.skp.name_uz or r.skp.name_ru)} for r in rows[:30]],
        "categories": [{"name": k, "count": v} for k, v in sorted(cats.items(), key=lambda x: -x[1])],
        "source": SRC_INDUSTRY,
        "as_of": _as_of(industry.aggregate(m=Max("updated_at"))["m"]),
    }


def same_address_count(address, stir):
    """Bir xil manzildagi boshqa korxonalar soni (sanoat reyestri ichida, aniq mos kelish)."""
    if not address:
        return 0
    return (IndustrialProduct.objects.filter(adress_uz=address).exclude(inn=stir)
            .values("inn").distinct().count())


def badges(pas, disc, prod, neighbours):
    """IH-02: xulosa belgilari. Faqat ma'lumot bor belgilar; har birida manba. Ton: good / info / warn."""
    out = []
    # Bazadagi `Ktut` — to'liq davlat registri emas, statistik hisobot topshiruvchilar ro'yxati (~65 ming). Unda
    # yo'qlik salbiy belgi emas, shuning uchun "topilmadi" belgisi qo'yilmaydi (korxonani nohaq shubhali qilmaslik).
    if pas["in_ktut"]:
        out.append({"code": "reporter", "text": "Statistik hisobot topshiruvchi", "tone": "good", "source": SRC_KTUT})
    if prod["available"]:
        out.append({"code": "producer", "text": f"Ishlab chiqaruvchi · {prod['products_count']} mahsulot turi",
                    "tone": "good", "source": SRC_INDUSTRY})
    if disc["available"]:
        n = disc["reports_count"]
        out.append({"code": "reports", "text": f"{n} ta majburiy statistik hisobot" if n else "Majburiy statistik hisobot yo'q",
                    "tone": "info", "source": SRC_REPORTS})
    if neighbours >= MASS_ADDRESS_MIN:
        out.append({"code": "mass_address", "text": f"Ommaviy manzil: yana {neighbours} korxona",
                    "tone": "warn", "source": SRC_INDUSTRY,
                    "hint": "Bir manzilda ko'p korxona ro'yxatda. Bu o'z-o'zidan qoidabuzarlik emas (biznes-markaz "
                            "bo'lishi mumkin), lekin tekshirishga arziydi."})
    elif neighbours:
        out.append({"code": "shared_address", "text": f"Bu manzilda yana {neighbours} korxona", "tone": "info",
                    "source": SRC_INDUSTRY})
    return out


def score_block(request, stir):
    """Ball faqat OS-18 ruxsat bersa; namuna bo'lsa belgisi bilan. Xatoda karta ballsiz ishlaydi."""
    from .company_scoring import api as score_api, config as score_config

    if not score_api.can_see(request, stir):
        return None
    cfg = score_config.get()
    year = score_api.latest_year(cfg)
    if not year:
        return None
    by = score_api._rows(cfg, [stir], cfg["default_preset"], year).get(stir, {})
    row = by.get(cfg["default_preset"])
    return score_api.short(row, row, cfg, "uz") if row else None


def build_card(request, stir):
    if not STIR_RE.match(stir or ""):
        raise Http404("STIR 9 ta raqamdan iborat bo'lishi kerak")
    ktut = Ktut.objects.filter(inn=stir).first()
    industry = _industry_rows(stir)
    if ktut is None and not industry.exists():
        raise Http404("Korxona topilmadi")
    pas = passport(stir, ktut, industry)
    disc = discipline(ktut)
    prod = production(industry)
    neighbours = same_address_count(pas["address"], stir)
    return {
        "stir": stir, "passport": pas, "badges": badges(pas, disc, prod, neighbours),
        "discipline": disc, "production": prod, "score": score_block(request, stir),
        "links": {"profile": f"/company/{stir}", "certificate": f"/stat-codes?stir={stir}"},
        "note": "Karta rasmiy statistik manbalardan yig'iladi va kontragent haqida yakuniy xulosa emas. "
                "Soliq, sud va xarid ma'lumotlari hozircha kiritilmagan.",
    }


def search(q):
    """IH-08: STIR boshlanishi yoki nom bo'yicha; KTUT va sanoat reyestri birlashtiriladi (STIR bo'yicha takrorsiz)."""
    q = (q or "").strip()
    if len(q) < 3:
        return []
    if q.isdigit():
        ktut = list(Ktut.objects.filter(inn__startswith=q).order_by("inn").values("inn", "name")[:SEARCH_LIMIT])
        ind = list(IndustrialProduct.objects.filter(inn__startswith=q).values("inn").annotate(n=Count("id"))
                   .values("inn", "name", "soato_uz", "n").order_by("inn")[:SEARCH_LIMIT])
    else:
        ktut = list(Ktut.objects.filter(ci_contains(["name"], q)).order_by("name").values("inn", "name")[:SEARCH_LIMIT])
        ind = list(IndustrialProduct.objects.filter(ci_contains(["name"], q)).values("inn")
                   .annotate(n=Count("id")).values("inn", "name", "soato_uz", "n").order_by("name")[:SEARCH_LIMIT])
    out = {}
    for r in ktut:
        out[r["inn"]] = {"stir": r["inn"], "name": r["name"], "district": None, "products": 0, "in_ktut": True}
    for r in ind:
        if not r["inn"]:
            continue
        row = out.setdefault(r["inn"], {"stir": r["inn"], "name": r["name"], "district": None, "products": 0,
                                        "in_ktut": False})
        row["district"] = row["district"] or r["soato_uz"]
        row["products"] += r["n"]
    return list(out.values())[:SEARCH_LIMIT]
