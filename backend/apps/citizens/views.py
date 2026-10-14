"""Fuqarolar bo'limi API'si (FQ-04..FQ-10). Hammasi bepul; yozish amallari login talab qiladi."""
from collections import defaultdict
from decimal import Decimal

from django.core.cache import cache
from django.db import IntegrityError, transaction
from django.db.models import Avg, Count, Q, Sum
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import serializers, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.models import Region, Sector
from apps.common.synthetic import table_source
from apps.common.text import sector_label

from .models import (Article, CitizenQuestion, ConsumerPrice, FavoriteIndicator, GlossaryTerm, NameStat,
                     SalaryDistribution, Survey, SurveyAnswer, SurveyResponse)
from .text import name_search_key

LANGS = ("uz", "ru", "cry")
STAFF_ROLES = ("employee", "manager", "admin")


def _lang(request):
    lang = request.query_params.get("lang", "uz")
    return lang if lang in LANGS else "uz"


def _tr(obj, field, lang):
    """Tarjima bo'lmasa o'zbekchaga qaytadi."""
    return getattr(obj, f"{field}_{lang}", "") or getattr(obj, f"{field}_uz")


# ---------------------------------------------------------------- FQ-05 ish haqi
class SalaryView(APIView):
    """GET /api/citizens/salary/?region=&sector=&year= — taqsimot, hududlar taqqoslash, yillar dinamikasi.

    Foydalanuvchi kiritgan maosh serverga yuborilmaydi: persentil brauzerda hisoblanadi.
    """
    permission_classes = (AllowAny,)

    def get(self, request):
        qs = SalaryDistribution.objects.all()
        years = sorted(qs.values_list("year", flat=True).distinct())
        if not years:
            return Response({"detail": "Ma'lumot yo'q", "years": []}, status=404)
        try:
            year = int(request.query_params.get("year") or years[-1])
            region_id = int(request.query_params.get("region") or 0) or None
            sector_id = int(request.query_params.get("sector") or 0) or None
        except ValueError:
            return Response({"detail": "Parametrlar noto'g'ri"}, status=400)

        def agg(q):
            row = q.aggregate(median=Avg("median"), mean=Avg("mean"), p25=Avg("p25"), p75=Avg("p75"), p90=Avg("p90"))
            return {k: round(float(v), 1) if v is not None else None for k, v in row.items()}

        sel = qs.filter(year=year)
        if region_id:
            sel = sel.filter(region_id=region_id)
        if sector_id:
            sel = sel.filter(sector_id=sector_id)
        by_region = qs.filter(year=year, **({"sector_id": sector_id} if sector_id else {})).values(
            "region_id", "region__name", "region__code").annotate(median=Avg("median")).order_by("-median")
        trend_qs = qs.filter(**({"region_id": region_id} if region_id else {}), **({"sector_id": sector_id} if sector_id else {}))
        trend = trend_qs.values("year").annotate(median=Avg("median"), p25=Avg("p25"), p75=Avg("p75")).order_by("year")
        return Response({
            "year": year, "years": years, "unit": "ming so'm",
            "distribution": agg(sel),
            "by_region": [{"region_id": r["region_id"], "region": r["region__name"], "code": r["region__code"],
                           "median": round(float(r["median"]), 1)} for r in by_region],
            "trend": [{k: (round(float(v), 1) if k != "year" else v) for k, v in t.items()} for t in trend],
            "regions": [{"id": r.id, "name": r.name} for r in Region.objects.order_by("code")],
            "sectors": [{"id": s.id, "code": s.code, "name": sector_label(s, with_code=False)} for s in
                        Sector.objects.filter(pk__in=qs.values("sector_id").distinct()).order_by("code")],
            "data_source": table_source(SalaryDistribution),
        })


# ---------------------------------------------------------------- FQ-06 narxlar
def _price_months():
    return sorted(ConsumerPrice.objects.values_list("month", flat=True).distinct())


class PriceProductsView(APIView):
    """GET /api/citizens/prices/ — mahsulotlar: oxirgi respublika o'rtacha narxi, oylik o'zgarish, 12 oylik qator."""
    permission_classes = (AllowAny,)

    def get(self, request):
        region = request.query_params.get("region")
        key = f"citizens:prices:{region or 'all'}"
        data = cache.get(key)
        if data is None:
            qs = ConsumerPrice.objects.all()
            if region and region.isdigit():
                qs = qs.filter(region_id=int(region))
            months = _price_months()[-12:]
            rows = qs.filter(month__in=months).values("product", "product_name", "unit", "month").annotate(price=Avg("price"))
            series = defaultdict(dict)
            meta = {}
            for r in rows:
                series[r["product"]][r["month"]] = float(r["price"])
                meta[r["product"]] = (r["product_name"], r["unit"])
            products = []
            for product, points in series.items():
                ordered = [points.get(m) for m in months]
                last = ordered[-1]
                prev = ordered[-2] if len(ordered) > 1 else None
                year_ago = ordered[0]
                products.append({
                    "product": product, "name": meta[product][0], "unit": meta[product][1],
                    "price": round(last) if last else None,
                    "change_month_pct": round((last - prev) / prev * 100, 1) if last and prev else None,
                    "change_year_pct": round((last - year_ago) / year_ago * 100, 1) if last and year_ago else None,
                    "series": [round(v) if v else None for v in ordered],
                })
            products.sort(key=lambda p: p["name"])
            data = {"months": [m.isoformat() for m in months], "products": products,
                    "data_source": table_source(ConsumerPrice)}
            cache.set(key, data, 600)
        return Response(data)


class PriceRegionsView(APIView):
    """GET /api/citizens/prices/regions/?product=bread — oxirgi oyda hududlar bo'yicha narx (yo'q hudud — null)."""
    permission_classes = (AllowAny,)

    def get(self, request):
        product = request.query_params.get("product", "")
        months = _price_months()
        if not months or not ConsumerPrice.objects.filter(product=product).exists():
            return Response({"detail": "Mahsulot topilmadi"}, status=404)
        last = months[-1]
        prices = {r["region_id"]: float(r["price"]) for r in
                  ConsumerPrice.objects.filter(product=product, month=last).values("region_id", "price")}
        return Response({"product": product, "month": last.isoformat(), "regions": [
            {"region_id": r.id, "region": r.name, "code": r.code, "price": prices.get(r.id)}
            for r in Region.objects.order_by("code")]})


class BasketSerializer(serializers.Serializer):
    items = serializers.ListField(child=serializers.DictField(), min_length=1, max_length=40)
    region = serializers.IntegerField(required=False)


class BasketView(APIView):
    """POST /api/citizens/prices/basket/ {items:[{product, qty}], region?} — savat narxining oylik dinamikasi.

    Savatning o'zi brauzerda saqlanadi; bu yerda faqat hisoblanadi, bazaga yozilmaydi.
    """
    permission_classes = (AllowAny,)

    def post(self, request):
        s = BasketSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        qty = {}
        for item in s.validated_data["items"]:
            try:
                q = Decimal(str(item.get("qty", 0)))
            except Exception:
                return Response({"detail": "qty son bo'lishi kerak"}, status=400)
            if q > 0:
                qty[str(item.get("product"))] = q
        qs = ConsumerPrice.objects.filter(product__in=qty)
        if s.validated_data.get("region"):
            qs = qs.filter(region_id=s.validated_data["region"])
        rows = qs.values("product", "month").annotate(price=Avg("price"))
        totals, covered = defaultdict(Decimal), defaultdict(set)
        for r in rows:
            totals[r["month"]] += Decimal(r["price"]) * qty[r["product"]]
            covered[r["month"]].add(r["product"])
        months = sorted(totals)
        return Response({"series": [{"month": m.isoformat(), "total": round(float(totals[m])),
                                     "complete": len(covered[m]) == len(qty)} for m in months],
                         "missing_products": sorted(set(qty) - {p for c in covered.values() for p in c})})


# ---------------------------------------------------------------- FQ-07 maqolalar va lug'at
class ArticleListView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        lang = _lang(request)
        qs = Article.objects.filter(is_published=True)
        if request.query_params.get("topic"):
            qs = qs.filter(topic=request.query_params["topic"])
        return Response({"topics": [{"code": c, "name": str(n)} for c, n in Article.TOPICS], "results": [
            {"slug": a.slug, "topic": a.topic, "title": _tr(a, "title", lang), "summary": _tr(a, "summary", lang),
             "reading_minutes": a.reading_minutes, "published_at": a.published_at,
             "cover": a.cover.url if a.cover else None} for a in qs]})


class ArticleDetailView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, slug):
        lang = _lang(request)
        a = get_object_or_404(Article, slug=slug, is_published=True)
        body = getattr(a, f"body_{lang}", "")
        return Response({"slug": a.slug, "topic": a.topic, "title": _tr(a, "title", lang), "summary": _tr(a, "summary", lang),
                         "body": body or a.body_uz, "body_lang": lang if body else "uz", "reading_minutes": a.reading_minutes,
                         "published_at": a.published_at, "related": a.related,
                         "terms": [{"slug": t.slug, "term": _tr(t, "term", lang)} for t in a.terms.all()]})


class GlossaryView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        lang = _lang(request)
        qs = GlossaryTerm.objects.select_related("article")
        q = (request.query_params.get("q") or "").strip()
        if q:
            from apps.common.search import ci_contains
            qs = qs.filter(ci_contains(("term_uz", "term_ru", "term_cry", "definition_uz"), q))
        return Response([{"slug": t.slug, "term": _tr(t, "term", lang), "definition": _tr(t, "definition", lang),
                          "example": t.example_uz, "article": t.article.slug if t.article else None} for t in qs])


# ---------------------------------------------------------------- FQ-08 so'rovnomalar
def _survey_is_open(s):
    return s.is_active and (s.closes_at is None or s.closes_at >= timezone.localdate())


class SurveyListView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request):
        lang = _lang(request)
        answered = set()
        if request.user.is_authenticated:
            answered = set(SurveyResponse.objects.filter(user=request.user).values_list("survey_id", flat=True))
        qs = Survey.objects.annotate(n=Count("responses"))
        return Response([{"slug": s.slug, "title": _tr(s, "title", lang), "description": s.description_uz,
                          "is_open": _survey_is_open(s), "closes_at": s.closes_at, "responses": s.n,
                          "answered": s.id in answered} for s in qs])


class SurveyDetailView(APIView):
    permission_classes = (AllowAny,)

    def get(self, request, slug):
        lang = _lang(request)
        s = get_object_or_404(Survey, slug=slug)
        answered = request.user.is_authenticated and SurveyResponse.objects.filter(survey=s, user=request.user).exists()
        return Response({"slug": s.slug, "title": _tr(s, "title", lang), "description": s.description_uz,
                         "is_open": _survey_is_open(s), "answered": answered,
                         "age_groups": [a for a, _ in SurveyResponse.AGE_GROUPS],
                         "regions": [{"id": r.id, "name": r.name} for r in Region.objects.order_by("code")],
                         "questions": [{"id": q.id, "text": _tr(q, "text", lang), "kind": q.kind, "scale_max": q.scale_max,
                                        "options": [{"id": o["id"], "text": o.get(f"text_{lang}") or o["text_uz"]} for o in q.options]}
                                       for q in s.questions.all()]})


class SurveyAnswerView(APIView):
    """POST /api/citizens/surveys/<slug>/answer/ {region, age_group, answers: {question_id: value}} — bitta foydalanuvchi bitta javob."""
    permission_classes = (IsAuthenticated,)

    def post(self, request, slug):
        s = get_object_or_404(Survey, slug=slug)
        if not _survey_is_open(s):
            return Response({"detail": "So'rovnoma yopilgan."}, status=400)
        answers = request.data.get("answers") or {}
        questions = {q.id: q for q in s.questions.all()}
        cleaned = {}
        for qid, q in questions.items():
            value = answers.get(str(qid), answers.get(qid))
            valid_ids = {o["id"] for o in q.options}
            if q.kind == "scale":
                if not isinstance(value, int) or not 1 <= value <= q.scale_max:
                    return Response({"detail": f"{q.text_uz}: 1..{q.scale_max} oralig'ida baho kerak"}, status=400)
            else:
                value = value if isinstance(value, list) else [value]
                if not value or not set(value) <= valid_ids or (q.kind == "single" and len(value) != 1):
                    return Response({"detail": f"{q.text_uz}: variant tanlang"}, status=400)
            cleaned[q] = value
        region = Region.objects.filter(pk=request.data.get("region")).first()
        age = request.data.get("age_group") if request.data.get("age_group") in dict(SurveyResponse.AGE_GROUPS) else ""
        try:
            with transaction.atomic():
                resp = SurveyResponse.objects.create(survey=s, user=request.user, region=region, age_group=age)
                SurveyAnswer.objects.bulk_create([SurveyAnswer(response=resp, question=q, value=v) for q, v in cleaned.items()])
        except IntegrityError:
            return Response({"detail": "Siz bu so'rovnomada allaqachon qatnashgansiz."}, status=409)
        return Response({"ok": True}, status=201)


class SurveyResultsView(APIView):
    """GET /api/citizens/surveys/<slug>/results/?region=&age_group= — namuna va haqiqiy javoblar alohida sanaladi."""
    permission_classes = (AllowAny,)

    def get(self, request, slug):
        lang = _lang(request)
        s = get_object_or_404(Survey, slug=slug)
        if not s.results_public:
            return Response({"detail": "Natijalar e'lon qilinmagan."}, status=403)
        responses = SurveyResponse.objects.filter(survey=s)
        if request.query_params.get("region"):
            responses = responses.filter(region_id=request.query_params["region"])
        if request.query_params.get("age_group"):
            responses = responses.filter(age_group=request.query_params["age_group"])
        counts = responses.aggregate(sample=Count("id", filter=Q(is_sample=True)), real=Count("id", filter=Q(is_sample=False)))
        answers = SurveyAnswer.objects.filter(response__in=responses).values("question_id", "value")
        tally = defaultdict(lambda: defaultdict(int))
        for a in answers:
            values = a["value"] if isinstance(a["value"], list) else [a["value"]]
            for v in values:
                tally[a["question_id"]][str(v)] += 1
        result = []
        for q in s.questions.all():
            if q.kind == "scale":
                options = [{"id": str(i), "text": str(i)} for i in range(1, q.scale_max + 1)]
            else:
                options = [{"id": o["id"], "text": o.get(f"text_{lang}") or o["text_uz"]} for o in q.options]
            total = sum(tally[q.id].values()) or 1
            result.append({"id": q.id, "text": _tr(q, "text", lang), "kind": q.kind, "options": [
                {**o, "count": tally[q.id][o["id"]], "share": round(tally[q.id][o["id"]] / total * 100, 1)} for o in options]})
        return Response({"slug": s.slug, "title": _tr(s, "title", lang), "sample_responses": counts["sample"],
                         "real_responses": counts["real"], "questions": result})


# ---------------------------------------------------------------- FQ-09 ismlar
def _name_index():
    idx = cache.get("citizens:name_index")
    if idx is None:
        idx = defaultdict(set)
        for name, cyr in NameStat.objects.values_list("name", "name_cyr").distinct():
            idx[name_search_key(name)].add(name)
            idx[name_search_key(cyr)].add(name)
        idx = {k: sorted(v) for k, v in idx.items()}
        cache.set("citizens:name_index", idx, 3600)
    return idx


class NameStatsView(APIView):
    """GET /api/citizens/names/?q=Muhammad — yillar bo'yicha, hududlar bo'yicha, jins. 3 harfdan kam — natija yo'q."""
    permission_classes = (AllowAny,)

    def get(self, request):
        q = (request.query_params.get("q") or "").strip()
        if len(q) < 3:
            return Response({"detail": "Kamida 3 harf kiriting.", "results": []}, status=400)
        names = _name_index().get(name_search_key(q), [])
        if not names:
            suggestions = [n[0] for k, n in _name_index().items() if k.startswith(name_search_key(q))][:8]
            return Response({"name": None, "suggestions": sorted(set(suggestions)), "data_source": table_source(NameStat)})
        name = names[0]
        qs = NameStat.objects.filter(name=name)
        by_year = qs.values("year").annotate(count=Sum("count")).order_by("year")
        last_year = by_year.last()["year"] if by_year else None
        by_region = qs.filter(year=last_year).values("region_id", "region__name", "region__code").annotate(count=Sum("count"))
        gender = qs.values("gender").annotate(count=Sum("count"))
        rank = None
        if last_year:
            g = max(gender, key=lambda r: r["count"])["gender"]
            totals = (NameStat.objects.filter(year=last_year, gender=g).values("name").annotate(c=Sum("count")).order_by("-c"))
            rank = next((i + 1 for i, r in enumerate(totals) if r["name"] == name), None)
        return Response({"name": name, "name_cyr": qs.first().name_cyr, "by_year": list(by_year),
                         "by_region": [{"region_id": r["region_id"], "region": r["region__name"], "code": r["region__code"],
                                        "count": r["count"]} for r in by_region],
                         "gender": {r["gender"]: r["count"] for r in gender}, "rank": rank, "year": last_year,
                         "data_source": table_source(NameStat)})


class TopNamesView(APIView):
    """GET /api/citizens/names/top/?year=&gender=M|F — yilning eng ommabop 10 ismi."""
    permission_classes = (AllowAny,)

    def get(self, request):
        years = sorted(NameStat.objects.values_list("year", flat=True).distinct())
        if not years:
            return Response({"years": [], "results": []})
        raw = request.query_params.get("year") or ""
        year = int(raw) if raw.isdigit() and int(raw) in years else years[-1]
        gender = request.query_params.get("gender", "M") if request.query_params.get("gender") in ("M", "F") else "M"
        rows = NameStat.objects.filter(year=year, gender=gender).values("name").annotate(count=Sum("count")).order_by("-count")[:10]
        return Response({"year": year, "years": years, "gender": gender, "results": list(rows),
                         "data_source": table_source(NameStat)})


# ---------------------------------------------------------------- FQ-10 fuqaro savoli
class QuestionSerializer(serializers.ModelSerializer):
    region_name = serializers.CharField(source="region.name", read_only=True, default=None)
    category_label = serializers.CharField(source="get_category_display", read_only=True)
    status_label = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = CitizenQuestion
        fields = ("id", "category", "category_label", "region", "region_name", "question", "allow_publish", "answer",
                  "status", "status_label", "created_at", "answered_at")
        read_only_fields = ("answer", "status", "created_at", "answered_at")


def _is_staff(user):
    return bool(user.is_staff or getattr(user, "role", None) in STAFF_ROLES)


class QuestionListView(APIView):
    """GET — o'z savollari (xodim ?scope=staff — hammasi); POST — yangi savol."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        qs = CitizenQuestion.objects.select_related("region")
        qs = qs if (_is_staff(request.user) and request.query_params.get("scope") == "staff") else qs.filter(user=request.user)
        return Response(QuestionSerializer(qs[:200], many=True).data)

    def post(self, request):
        s = QuestionSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        s.save(user=request.user)
        return Response(s.data, status=201)


class QuestionAnswerView(APIView):
    """PATCH /api/citizens/questions/<id>/ {answer, status} — faqat xodim."""
    permission_classes = (IsAuthenticated,)

    def patch(self, request, pk):
        if not _is_staff(request.user):
            return Response({"detail": "Faqat xodim javob beradi."}, status=403)
        q = get_object_or_404(CitizenQuestion, pk=pk)
        answer = (request.data.get("answer") or "").strip()
        new_status = request.data.get("status") or ("answered" if answer else q.status)
        if new_status not in dict(CitizenQuestion.STATUSES):
            return Response({"detail": "Noto'g'ri holat"}, status=400)
        if new_status == "answered" and not answer:
            return Response({"detail": "Javob matni kerak"}, status=400)
        q.answer, q.status, q.answered_by, q.answered_at = answer, new_status, request.user, timezone.now()
        q.save()
        from django.contrib.contenttypes.models import ContentType
        from apps.notifications.models import Notification
        Notification.objects.create(recipient=q.user, title="Savolingizga javob berildi" if new_status == "answered" else "Savolingiz ko'rib chiqildi",
                                    message=q.question[:120], notification_type="info",
                                    content_type=ContentType.objects.get_for_model(q), object_id=q.pk)
        return Response(QuestionSerializer(q).data)


class PublicAnswersView(APIView):
    """GET /api/citizens/answers/?q= — javob berilgan va fuqaro rozilik bergan savollar (ochiq baza)."""
    permission_classes = (AllowAny,)

    def get(self, request):
        qs = CitizenQuestion.objects.filter(status="answered", allow_publish=True).select_related("region")
        q = (request.query_params.get("q") or "").strip()
        if q:
            from apps.common.search import ci_contains
            qs = qs.filter(ci_contains(("question", "answer"), q))
        return Response([{"id": x.id, "category": x.get_category_display(), "region": x.region.name if x.region else None,
                          "question": x.question, "answer": x.answer, "answered_at": x.answered_at} for x in qs[:100]])


# ---------------------------------------------------------------- FQ-04 sevimlilar va kabinet
class FavoriteSerializer(serializers.ModelSerializer):
    class Meta:
        model = FavoriteIndicator
        fields = ("id", "kind", "title", "params", "created_at")
        read_only_fields = ("id", "created_at")


class FavoriteListView(APIView):
    permission_classes = (IsAuthenticated,)
    MAX = 30

    def get(self, request):
        return Response(FavoriteSerializer(FavoriteIndicator.objects.filter(user=request.user), many=True).data)

    def post(self, request):
        s = FavoriteSerializer(data=request.data)
        s.is_valid(raise_exception=True)
        if FavoriteIndicator.objects.filter(user=request.user).count() >= self.MAX:
            return Response({"detail": f"Ko'pi bilan {self.MAX} ta"}, status=400)
        existing = FavoriteIndicator.objects.filter(user=request.user, kind=s.validated_data["kind"],
                                                    params=s.validated_data.get("params") or {}).first()
        if existing:
            return Response(FavoriteSerializer(existing).data)
        s.save(user=request.user)
        return Response(s.data, status=201)


class FavoriteDetailView(APIView):
    permission_classes = (IsAuthenticated,)

    def delete(self, request, pk):
        deleted, _ = FavoriteIndicator.objects.filter(user=request.user, pk=pk).delete()
        return Response(status=204 if deleted else 404)


class CitizenSummaryView(APIView):
    """GET /api/citizens/me/summary/ — fuqaro kabineti bloklari (FQ-04)."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        from apps.book_market.models import OrderBook
        user = request.user
        region = user.location.region if getattr(user, "location_id", None) else None
        return Response({
            "user": {"name": user.full_name, "type": user.user_type},
            "region": {"id": region.id, "name": region.name} if region else None,
            "favorites": FavoriteSerializer(FavoriteIndicator.objects.filter(user=user)[:12], many=True).data,
            "questions": QuestionSerializer(CitizenQuestion.objects.filter(user=user)[:5], many=True).data,
            "surveys_answered": SurveyResponse.objects.filter(user=user).count(),
            "open_surveys": Survey.objects.filter(is_active=True).exclude(responses__user=user).count(),
            "book_orders": list(OrderBook.objects.filter(user=user).order_by("-id").values("id", "status", "total_amount", "created_at")[:5]),
        })

