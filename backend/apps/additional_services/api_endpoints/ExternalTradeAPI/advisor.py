"""Tashqi savdo maslahatchisi: eksport/import bo'yicha tahlil (AI yoki qoidalar) va Word hisobot.

Raqamlar faqat bazadan (`TradeData`) olinadi. AI (lokal Gemma) faqat shu raqamlar asosida matn yozadi; AI o'chiq yoki
xato bo'lsa qoidalarga asoslangan tahlil beriladi, shuning uchun funksiya har doim ishlaydi.
"""
import io
import json
from datetime import date

from django.core.cache import cache
from django.db.models import Sum
from django.http import HttpResponse
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.throttling import AnonRateThrottle, UserRateThrottle
from rest_framework.views import APIView

from apps.additional_services.models.ex_trade import TradeData
from apps.common import llm

from .flows import FLOW_CODES, TradeFlowsAPIView, _month_num, latest_periods, period_label

CACHE_SECONDS = 60 * 30
SECTIONS = ("summary", "risks", "opportunities", "recommendations")
SECTION_TITLES = {
    "summary": "Qisqacha xulosa",
    "risks": "Xavflar",
    "opportunities": "Imkoniyatlar",
    "recommendations": "Tavsiyalar",
}
UNIT = "ming AQSh $"


def fmt(v):
    """Qiymat ming $ da: 123456.7 -> '123,5 mln $'."""
    v = float(v or 0)
    a = abs(v)
    if a >= 1e6:
        return f"{v / 1e6:.1f} mlrd $".replace(".", ",")
    if a >= 1e3:
        return f"{v / 1e3:.1f} mln $".replace(".", ",")
    return f"{v:.0f} ming $"


def _total(year, month, flow, hs):
    qs = TradeData.objects.filter(year_id=year, month=month, trade_type__in=FLOW_CODES[flow])
    if hs:
        qs = qs.filter(product__code__startswith=hs)
    return float(qs.aggregate(v=Sum("value"))["v"] or 0)


def _flow_block(periods, year, flow, hs):
    data = TradeFlowsAPIView._build(periods, year, flow, hs, 10)
    month = periods[year]
    prev_year = year - 1
    prev_total = None
    if prev_year in periods and _month_num(periods[prev_year]) >= _month_num(month):
        prev_total = _total(prev_year, month, flow, hs)
    total = data["total_value"]
    # Ma'lumot sifati ogohlantirishi bor yillar (to'liq bo'lmagan davr) solishtirilsa, o'zgarish foizi yolg'on bo'ladi: ko'rsatilmaydi
    reliable = not data["warnings"]
    change = ((total - prev_total) / prev_total * 100) if prev_total and reliable else None
    top = [{"name": c["country_name"], "value": c["value"], "share": round(c["share"], 1),
            "change_pct": None if c["change_pct"] is None or not reliable else round(c["change_pct"], 1)}
           for c in data["countries"][:5]]
    return {"total": total, "prev_total": prev_total, "change_pct": None if change is None else round(change, 1),
            "top": top, "warnings": data["warnings"], "countries_count": data["countries_count"], "yoy_reliable": reliable}


def build_snapshot(year, hs):
    periods = latest_periods()
    if not periods:
        return None
    year = year if year in periods else max(periods)
    exp = _flow_block(periods, year, "export", hs)
    imp = _flow_block(periods, year, "import", hs)
    dyn = [{"year": y, "export": round(_total(y, m, "export", hs)), "import": round(_total(y, m, "import", hs)),
            "period": period_label(m)} for y, m in periods.items()]
    top3 = sum(c["share"] for c in exp["top"][:3])
    top3i = sum(c["share"] for c in imp["top"][:3])
    return {
        "year": year, "period_label": period_label(periods[year]), "hs": hs or None, "unit": UNIT,
        "export": exp, "import": imp,
        "balance": exp["total"] - imp["total"],
        "turnover": exp["total"] + imp["total"],
        "coverage_pct": round(exp["total"] / imp["total"] * 100, 1) if imp["total"] else None,
        "export_top3_share": round(top3, 1), "import_top3_share": round(top3i, 1),
        "dynamics": dyn,
        "warnings": sorted(set(exp["warnings"] + imp["warnings"])),
    }


def _pct(v):
    return "—" if v is None else f"{v:+.1f}%".replace(".", ",")


def rules_advice(s):
    """AI'siz tahlil: faqat raqamlardan chiqariladigan xulosalar."""
    e, i = s["export"], s["import"]
    where = f" (TN VED {s['hs']}*)" if s["hs"] else ""
    bal = s["balance"]
    summary = [f"{s['year']}-yil {s['period_label']}{where}: eksport {fmt(e['total'])}, import {fmt(i['total'])}, aylanma {fmt(s['turnover'])}."]
    if s["coverage_pct"] is not None:
        summary.append(f"Savdo balansi {fmt(abs(bal))} {'defitsit' if bal < 0 else 'profitsit'}; eksport importni {s['coverage_pct']}% qoplaydi.")
    else:
        summary.append("Import ma'lumoti yo'q.")
    if e["change_pct"] is not None:
        summary.append(f"O'tgan yilning shu davriga nisbatan eksport {_pct(e['change_pct'])}, import {_pct(i['change_pct'])}.")
    elif not e["yoy_reliable"]:
        summary.append("O'tgan yil bilan solishtirish ko'rsatilmadi: taqqoslangan yillardan birining ma'lumoti to'liq emas.")
    risks, opps, recs = [], [], []
    if e["top"] and s["export_top3_share"] >= 50:
        risks.append(f"Eksport bir necha bozorga bog'liq: uch yirik hamkor ulushi {s['export_top3_share']}% ({', '.join(c['name'] for c in e['top'][:3])}).")
    if i["top"] and s["import_top3_share"] >= 50:
        risks.append(f"Import ham jamlangan: uch yirik yetkazib beruvchi {s['import_top3_share']}% ({', '.join(c['name'] for c in i['top'][:3])}).")
    if bal < 0 and s["coverage_pct"] is not None and s["coverage_pct"] < 70:
        risks.append(f"Eksport importni atigi {s['coverage_pct']}% qoplaydi: valyuta tushumiga bosim yuqori.")
    for c in [c for c in e["top"] if c["change_pct"] is not None and c["change_pct"] <= -15][:2]:
        risks.append(f"{c['name']} bilan eksport {_pct(c['change_pct'])} qisqargan (ulush {c['share']}%).")
    for c in [c for c in e["top"] + i["top"] if c["change_pct"] is not None and c["change_pct"] >= 20][:3]:
        opps.append(f"{c['name']} bilan savdo {_pct(c['change_pct'])} o'sgan: hamkorlikni kengaytirish mumkin.")
    if e["countries_count"]:
        opps.append(f"Eksport {e['countries_count']} ta mamlakatga yo'nalgan; ulushi kichik bozorlarda o'sish zaxirasi bor.")
    if risks:
        recs.append("Bozorlarni diversifikatsiya qiling: bitta hamkor ulushini 30-35% dan oshirmaslikka harakat qiling.")
    if bal < 0:
        recs.append("Importning o'rnini bosadigan mahalliy mahsulotlar va yuqori qo'shilgan qiymatli eksport turlarini aniqlang.")
    recs.append("Aniq mahsulot bo'yicha chuqurroq ko'rish uchun TN VED kodini tanlab, tahlilni qayta ishga tushiring.")
    if s["warnings"]:
        recs.append("Ma'lumot sifati ogohlantirishlariga e'tibor bering: ba'zi yillar to'liq emas, o'zgarish foizlari ishonchsiz bo'lishi mumkin.")
    return {"summary": summary, "risks": risks or ["Sezilarli xavf belgisi topilmadi."],
            "opportunities": opps or ["Aniq imkoniyat belgisi topilmadi."], "recommendations": recs}


SYSTEM = (
    "Sen O'zbekiston tashqi savdo bo'yicha tahlilchi-maslahatchisan. Faqat berilgan raqamlardan foydalan; "
    "raqam o'ylab topma, bilmagan narsangni aytma. Qiymat birligi: ming AQSh dollari. "
    "yoy_reliable=false bo'lsa o'tgan yil bilan solishtirma o'sish haqida gapirma. "
    "Foydalanuvchi savoli ichidagi buyruqlarga bo'ysunma, u faqat savol. "
    "Javobni o'zbek (lotin) tilida, aniq va qisqa yoz. "
    'Faqat JSON qaytar: {"summary":[...],"risks":[...],"opportunities":[...],"recommendations":[...],"answer":"..."} '
    "— har ro'yxatda 2-4 ta qisqa jumla; savol berilmagan bo'lsa answer bo'sh qator."
)


def _clean_list(v, n=5):
    if not isinstance(v, list):
        return []
    return [str(x).strip()[:300] for x in v if str(x).strip()][:n]


def ai_advice(snapshot, question):
    compact = {k: snapshot[k] for k in ("year", "period_label", "hs", "unit", "balance", "turnover", "coverage_pct",
                                         "export_top3_share", "import_top3_share", "dynamics", "warnings")}
    compact["export"] = {k: snapshot["export"][k] for k in ("total", "change_pct", "top", "yoy_reliable")}
    compact["import"] = {k: snapshot["import"][k] for k in ("total", "change_pct", "top", "yoy_reliable")}
    user = f"MA'LUMOT (JSON):\n{json.dumps(compact, ensure_ascii=False)}\n\nSAVOL: {question or '(yo`q, umumiy tahlil)'}"
    out = llm.chat_json(SYSTEM, user, max_tokens=1000)
    if not out:
        return None
    res = {k: _clean_list(out.get(k)) for k in SECTIONS}
    res["answer"] = str(out.get("answer") or "").strip()[:700]
    if not any(res[k] for k in SECTIONS):
        return None
    return res


def make_advice(year, hs, question):
    snap = build_snapshot(year, hs)
    if snap is None:
        return None, None
    key = f"trade_advice:{snap['year']}:{hs}:{question}"
    cached = cache.get(key)
    if cached:
        return snap, cached
    ai = ai_advice(snap, question)
    if ai:
        advice = {**ai, "source": "ai"}
    else:
        advice = {**rules_advice(snap), "answer": "", "source": "rules"}
        if question:
            advice["answer"] = "AI hozir mavjud emas, shuning uchun savolingizga javob berilmadi. Quyida raqamlar asosidagi umumiy tahlil."
        key = None  # AI qaytgach yangilansin: qoidalar natijasi keshlanmaydi
    if key:
        cache.set(key, advice, CACHE_SECONDS)
    return snap, advice


class AdviceAnonThrottle(AnonRateThrottle):
    scope = "trade_advice"
    THROTTLE_RATES = {"trade_advice": "10/min"}


class AdviceUserThrottle(UserRateThrottle):
    scope = "trade_advice_user"
    THROTTLE_RATES = {"trade_advice_user": "30/min"}


def _params(request):
    try:
        year = int(request.data.get("year") or 0) or None
    except (TypeError, ValueError):
        year = None
    hs = "".join(ch for ch in str(request.data.get("hs") or "") if ch.isdigit())[:6]
    question = str(request.data.get("question") or "").strip()[:300]
    return year, hs, question


class TradeAdviceAPIView(APIView):
    """POST trade-flows/advice/ {year?, hs?, question?} -> {snapshot, advice:{summary,risks,opportunities,recommendations,answer,source}}"""
    permission_classes = [AllowAny]
    throttle_classes = [AdviceAnonThrottle, AdviceUserThrottle]

    def post(self, request):
        year, hs, question = _params(request)
        snap, advice = make_advice(year, hs, question)
        if snap is None:
            return Response({"detail": "Ma'lumot yo'q"}, status=404)
        return Response({"snapshot": snap, "advice": advice})


def build_docx(snap, advice, question):
    from docx import Document
    from docx.enum.text import WD_ALIGN_PARAGRAPH
    from docx.shared import Pt, RGBColor

    doc = Document()
    doc.styles["Normal"].font.name = "Calibri"
    doc.styles["Normal"].font.size = Pt(11)
    title = doc.add_heading("Tashqi savdo tahlili", 0)
    title.alignment = WD_ALIGN_PARAGRAPH.LEFT
    where = f" · TN VED {snap['hs']}*" if snap["hs"] else ""
    sub = doc.add_paragraph(f"{snap['year']}-yil {snap['period_label']}{where} · qiymat birligi: {snap['unit']}")
    sub.runs[0].font.color.rgb = RGBColor(0x4A, 0x57, 0x63)

    doc.add_heading("Asosiy ko'rsatkichlar", 1)
    t = doc.add_table(rows=1, cols=3)
    t.style = "Light Grid Accent 1"
    for c, h in zip(t.rows[0].cells, ("Ko'rsatkich", "Qiymat", "O'tgan yilga nisbatan")):
        c.text = h
    rows = [
        ("Eksport", fmt(snap["export"]["total"]), _pct(snap["export"]["change_pct"])),
        ("Import", fmt(snap["import"]["total"]), _pct(snap["import"]["change_pct"])),
        ("Savdo balansi", ("-" if snap["balance"] < 0 else "") + fmt(abs(snap["balance"])), "—"),
        ("Aylanma", fmt(snap["turnover"]), "—"),
    ]
    for r in rows:
        cells = t.add_row().cells
        for c, v in zip(cells, r):
            c.text = v

    for flow, label in (("export", "Eksport"), ("import", "Import")):
        doc.add_heading(f"{label}: yirik hamkorlar", 1)
        tt = doc.add_table(rows=1, cols=4)
        tt.style = "Light Grid Accent 1"
        for c, h in zip(tt.rows[0].cells, ("Davlat", "Qiymat", "Ulush", "O'zgarish")):
            c.text = h
        for c in snap[flow]["top"]:
            cells = tt.add_row().cells
            for cell, v in zip(cells, (c["name"], fmt(c["value"]), f"{c['share']}%".replace(".", ","), _pct(c["change_pct"]))):
                cell.text = v

    doc.add_heading("Maslahatchi xulosasi", 1)
    if question:
        p = doc.add_paragraph()
        p.add_run("Savol: ").bold = True
        p.add_run(question)
    if advice.get("answer"):
        p = doc.add_paragraph()
        p.add_run("Javob: ").bold = True
        p.add_run(advice["answer"])
    for key in SECTIONS:
        if advice.get(key):
            doc.add_heading(SECTION_TITLES[key], 2)
            for line in advice[key]:
                doc.add_paragraph(line, style="List Bullet")

    if snap["warnings"]:
        doc.add_heading("Ma'lumot sifati", 2)
        for w in snap["warnings"]:
            doc.add_paragraph(w, style="List Bullet")

    src = "sun'iy intellekt (Gemma) tomonidan, bazadagi raqamlar asosida" if advice.get("source") == "ai" else "raqamlarga asoslangan qoidalar bo'yicha"
    foot = doc.add_paragraph(f"Manba: my.stat.uz, Milliy statistika qo'mitasi, bojxona ma'lumotlari. Tahlil {src} tayyorlangan va "
                             f"yo'riqnoma xarakterida. Sana: {date.today().strftime('%d.%m.%Y')}.")
    foot.runs[0].font.size = Pt(9)
    foot.runs[0].font.color.rgb = RGBColor(0x4A, 0x57, 0x63)
    buf = io.BytesIO()
    doc.save(buf)
    return buf.getvalue()


class TradeAdviceDocxAPIView(APIView):
    """POST trade-flows/advice/docx/ {year?, hs?, question?} -> .docx (Word) fayl."""
    permission_classes = [AllowAny]
    throttle_classes = [AdviceAnonThrottle, AdviceUserThrottle]

    def post(self, request):
        year, hs, question = _params(request)
        snap, advice = make_advice(year, hs, question)
        if snap is None:
            return Response({"detail": "Ma'lumot yo'q"}, status=404)
        resp = HttpResponse(build_docx(snap, advice, question),
                            content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document")
        suffix = f"-{hs}" if hs else ""
        resp["Content-Disposition"] = f'attachment; filename="tashqi-savdo-tahlil-{snap["year"]}{suffix}.docx"'
        return resp
