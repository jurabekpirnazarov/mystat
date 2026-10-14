"""Global qidiruv (U-10) va FAQ asosidagi yordamchi (U-11).

Login talab qiladigan manbalar (kitoblar, klassifikatorlar) mehmonga qaytarilmaydi.
Tashqi LLM ishlatilmaydi (ISH_REJASI OS-06).
"""
import html
import re

from django.db.models import Q
from django.utils.html import strip_tags

MIN_QUERY = 2
PER_GROUP = 5

_APOSTROPHES = re.compile(r"[‘’ʼʻ`´']")
_NON_WORD = re.compile(r"[^\w\s]", re.UNICODE)
# Juda umumiy so'zlar — moslik bahosiga ta'sir qilmasin
STOP_WORDS = {
    "qanday", "qanaqa", "nima", "nimalar", "qachon", "qayerda", "kerak", "mumkin", "uchun", "bilan", "haqida",
    "bormi", "yoki", "va", "ham", "men", "biz", "siz", "bu", "shu", "qilish", "qilinadi", "tartibi", "tarzda",
    "как", "что", "где", "когда", "для", "или", "это",
}


def plain(text):
    return " ".join(html.unescape(strip_tags(text or "")).split())


def normalize(text):
    text = _APOSTROPHES.sub("", (text or "").lower())
    return _NON_WORD.sub(" ", text)


def stems(text):
    """O'zbek tili qo'shimchalariga chidamli bo'lishi uchun so'z boshidagi 5 harf."""
    return {w[:5] for w in normalize(text).split() if len(w) >= 3 and w not in STOP_WORDS}


def case_variants(q):
    """Baza `C` collation'da: UPPER() kirill harflarini o'zgartirmaydi, shuning uchun `icontains`
    kirillchada katta-kichik harfni farqlaydi. Asosiy variantlar bilan qidiramiz."""
    return {q, q.lower(), q.upper(), q.capitalize(), q.title()}


def ci_contains(fields, q):
    cond = Q()
    for f in fields:
        for v in case_variants(q):
            cond |= Q(**{f"{f}__icontains": v})
    return cond


def _contains(fields, q):
    return ci_contains(fields, q)



def global_search(query, user):
    from apps.additional_services.models import ReportList
    from apps.additional_services.models.staticclassification_model import StatisticClassification
    from apps.book_market.models import Book
    from apps.common.models import QuestionAnswer
    from apps.services.models import Service

    q = (query or "").strip()
    if len(q) < MIN_QUERY:
        return []

    groups = []

    services = Service.objects.filter(_contains(["name_uz", "name_ru", "name_cry"], q), is_active=True)[:PER_GROUP]
    groups.append(("services", "Xizmatlar", [
        {"id": s.id, "title": s.name_uz, "subtitle": "Xizmat",
         "url": f"/{s.slug}" if s.slug and not s.slug.startswith("http") else "/services"}
        for s in services
    ]))

    faq = QuestionAnswer.objects.filter(
        _contains(["question_uz", "question_ru", "question_cry", "answer_uz"], q), is_active=True)[:PER_GROUP]
    groups.append(("faq", "Ko'p so'raladigan savollar", [
        {"id": f.id, "title": f.question_uz, "subtitle": plain(f.answer_uz)[:120], "url": f"/questions#faq-{f.id}"}
        for f in faq
    ]))

    reports = ReportList.objects.filter(
        _contains(["formsname_uz", "formsname", "type_uz", "type"], q), is_active=True)[:PER_GROUP]
    groups.append(("reports", "Hisobot shakllari", [
        {"id": r.id, "title": r.type_uz or r.type, "subtitle": (r.formsname_uz or r.formsname)[:120], "url": "/report-calendar"}
        for r in reports
    ]))

    if user and user.is_authenticated:
        books = Book.objects.filter(_contains(["name_uz", "name_ru", "name_cry"], q), is_active=True)[:PER_GROUP]
        groups.append(("books", "Nashrlar", [
            {"id": b.id, "title": b.name_uz, "subtitle": f"{b.year}-yil" if b.year else "Nashr", "url": "/books"}
            for b in books
        ]))
        classifications = StatisticClassification.objects.filter(
            _contains(["name_uz", "name_ru", "name_cry", "analog_uz"], q), is_active=True)[:PER_GROUP]
        groups.append(("classifications", "Klassifikatorlar", [
            {"id": c.id, "title": c.name_uz, "subtitle": c.analog_uz, "url": "/statistical-classifications"}
            for c in classifications
        ]))

    from apps.citizens.models import Article, GlossaryTerm
    articles = Article.objects.filter(_contains(["title_uz", "summary_uz", "title_ru"], q), is_published=True)[:PER_GROUP]
    groups.append(("articles", "Maqolalar", [
        {"id": a.id, "title": a.title_uz, "subtitle": a.summary_uz[:120], "url": f"/learn/{a.slug}"} for a in articles]))
    terms = GlossaryTerm.objects.filter(_contains(["term_uz", "term_ru", "definition_uz"], q))[:PER_GROUP]
    groups.append(("glossary", "Lug'at", [
        {"id": t.id, "title": t.term_uz, "subtitle": t.definition_uz[:120], "url": f"/glossary#{t.slug}"} for t in terms]))

    return [{"type": t, "label": label, "items": items} for t, label, items in groups if items]


def assistant_answer(message, limit=3):
    """FAQ bo'yicha eng mos javoblar (so'z o'zaklari kesishmasi). -> {answers, links, found}"""
    from apps.common.models import QuestionAnswer
    from apps.services.models import Service

    asked = stems(message)
    if not asked:
        return {"found": False, "answers": [], "links": []}

    scored = []
    for faq in QuestionAnswer.objects.filter(is_active=True):
        question = stems(f"{faq.question_uz} {faq.question_ru} {faq.question_cry}")
        answer = stems(plain(faq.answer_uz))
        score = 3 * len(asked & question) + len(asked & answer)
        if score >= 3:
            scored.append((score, faq))
    scored.sort(key=lambda x: (-x[0], x[1].id))

    links = []
    for service in Service.objects.filter(is_active=True):
        if asked & stems(service.name_uz) and service.slug and not service.slug.startswith("http"):
            links.append({"title": service.name_uz, "url": f"/{service.slug}"})

    answers = [
        {"id": faq.id, "question": faq.question_uz, "answer": plain(faq.answer_uz), "url": f"/questions#faq-{faq.id}"}
        for _, faq in scored[:limit]
    ]
    return {"found": bool(answers or links), "answers": answers, "links": links[:3]}
