"""MG-10 (foydalanish soni, baho va sharhlar) va MG-11 (sahifa fikri, matndagi xato) endpoint'lari.

Hammasi `/api/portal/` ostida. O'qish mehmonga ochiq; baho qoldirish — login bilan; yozuvchi ochiq endpoint'lar IP
bo'yicha cheklangan. Natijalar 5 daqiqa keshlanadi, yozuvdan keyin xizmat keshi tozalanadi.
"""
import hashlib
from datetime import timedelta

from django.conf import settings
from django.core.cache import cache
from django.db.models import Avg, Count, Q
from django.db.models.functions import TruncMonth
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.accounts.throttles import FormRateThrottle

from .models import PageFeedback, ServiceReview, ServiceReviewVote, ServiceUsage, TypoReport
from .throttles import UsageRateThrottle

CACHE_TTL = 300
PERIODS = {"month": 30, "year": 365}


def _visible(model):
    """Sintetik qatorlar faqat DEBUG=True da (demo muhit) hisobga olinadi."""
    qs = model.objects.all()
    return qs if settings.DEBUG else qs.filter(is_synthetic=False)


def _valid_number(n):
    return 100 <= n < 2000


def _bad_number():
    return Response({"detail": "Xizmat raqami noto'g'ri"}, status=status.HTTP_404_NOT_FOUND)


def _stats_key(n, period, debug):
    return f"portal:service-stats:{n}:{period}:{debug}"


def _list_key(debug):
    return f"portal:services-stats:{debug}"


def _clear_service_cache(number):
    for debug in (0, 1):
        cache.delete(_list_key(debug))
        for period in ("all", "year", "month"):
            cache.delete(_stats_key(number, period, debug))


def _author(user):
    first = (user.first_name or user.username or "").strip()
    last = (user.last_name or "").strip()
    return f"{first} {last[:1]}.".upper() if last else first.upper()


def _client_key(request):
    ident = FormRateThrottle().get_ident(request) or ""
    return hashlib.sha256(f"{settings.SECRET_KEY}:{ident}".encode()).hexdigest()[:32]


def _has_sample(*querysets):
    return settings.DEBUG and any(qs.filter(is_synthetic=True).exists() for qs in querysets)


class ServicesStatsView(APIView):
    """GET — barcha xizmatlar bo'yicha qisqa ko'rsatkich: {raqam: {usage, rating, ratings}} (kartochkalar uchun)."""
    permission_classes = [AllowAny]

    def get(self, request):
        key = _list_key(int(settings.DEBUG))
        data = cache.get(key)
        if data is None:
            usage = dict(_visible(ServiceUsage).values("service_number").annotate(n=Count("id"))
                         .values_list("service_number", "n"))
            ratings = {r["service_number"]: r for r in
                       _visible(ServiceReview).values("service_number").annotate(avg=Avg("score"), n=Count("id"))}
            items = {}
            for num in set(usage) | set(ratings):
                r = ratings.get(num)
                items[str(num)] = {"usage": usage.get(num, 0),
                                   "rating": round(r["avg"], 2) if r else None,
                                   "ratings": r["n"] if r else 0}
            data = {"items": items, "is_sample": _has_sample(ServiceUsage.objects, ServiceReview.objects)}
            cache.set(key, data, CACHE_TTL)
        return Response(data)


class ServiceStatsView(APIView):
    """GET ?period=all|year|month — foydalanish soni, o'rtacha baho, 1–5 taqsimot, oxirgi 12 oy dinamikasi."""
    permission_classes = [AllowAny]

    def get(self, request, number):
        if not _valid_number(number):
            return _bad_number()
        period = request.query_params.get("period", "all")
        period = period if period in PERIODS else "all"
        key = _stats_key(number, period, int(settings.DEBUG))
        data = cache.get(key)
        if data is None:
            usage = _visible(ServiceUsage).filter(service_number=number)
            reviews = _visible(ServiceReview).filter(service_number=number)
            since = timezone.now() - timedelta(days=PERIODS[period]) if period in PERIODS else None
            usage_p = usage.filter(created_at__gte=since) if since else usage
            agg = reviews.aggregate(avg=Avg("score"), n=Count("id"))
            dist = dict(reviews.values("score").annotate(n=Count("id")).values_list("score", "n"))
            year_ago = (timezone.now() - timedelta(days=365)).replace(day=1)
            monthly = [{"month": r["m"].strftime("%Y-%m"), "count": r["n"]} for r in
                       usage.filter(created_at__gte=year_ago).annotate(m=TruncMonth("created_at"))
                       .values("m").annotate(n=Count("id")).order_by("m")]
            first = usage.order_by("created_at").values_list("created_at", flat=True).first()
            data = {
                "service_number": number,
                "period": period,
                "usage_count": usage_p.count(),
                "usage_total": usage.count(),
                "since": first.date().isoformat() if first else None,
                "rating_avg": round(agg["avg"], 2) if agg["avg"] is not None else None,
                "rating_count": agg["n"],
                "comment_count": reviews.filter(is_published=True).exclude(comment="").count(),
                "distribution": {str(i): dist.get(i, 0) for i in range(1, 6)},
                "monthly": monthly,
                "is_sample": _has_sample(usage, reviews),
            }
            cache.set(key, data, CACHE_TTL)
        return Response(data)


class ServiceUseView(APIView):
    """POST — xizmatning asosiy amali bajarildi (pasportdagi "Xizmatdan foydalanish" / "Ariza yuborish")."""
    permission_classes = [AllowAny]
    throttle_classes = [UsageRateThrottle]

    def post(self, request, number):
        if not _valid_number(number):
            return _bad_number()
        ServiceUsage.objects.create(service_number=number,
                                    user=request.user if request.user.is_authenticated else None)
        _clear_service_cache(number)
        return Response(status=status.HTTP_201_CREATED)


def _review_json(r, request, my_votes=None):
    return {
        "id": r.id,
        "author": r.author_name or "—",
        "score": r.score,
        "comment": r.comment if r.is_published else "",
        "created_at": r.created_at.isoformat(),
        "is_sample": r.is_synthetic,
        "is_mine": bool(request.user.is_authenticated and r.user_id == request.user.id),
        "helpful": getattr(r, "n_helpful", 0),
        "unhelpful": getattr(r, "n_unhelpful", 0),
        "my_vote": (my_votes or {}).get(r.id),
    }


class ServiceReviewsView(APIView):
    """GET ?ordering=recent|high|low&limit= — e'lon qilingan sharhlar; POST {score, comment} — o'z bahosi (login)."""

    def get_permissions(self):
        return [IsAuthenticated()] if self.request.method == "POST" else [AllowAny()]

    def get_throttles(self):
        return [FormRateThrottle()] if self.request.method == "POST" else []

    def get(self, request, number):
        if not _valid_number(number):
            return _bad_number()
        order = {"high": ("-score", "-created_at"), "low": ("score", "-created_at")}.get(
            request.query_params.get("ordering"), ("-created_at",))
        try:
            limit = max(1, min(int(request.query_params.get("limit", 10)), 50))
        except ValueError:
            limit = 10
        qs = (_visible(ServiceReview).filter(service_number=number, is_published=True).exclude(comment="")
              .annotate(n_helpful=Count("votes", filter=Q(votes__helpful=True)),
                        n_unhelpful=Count("votes", filter=Q(votes__helpful=False))))
        page = list(qs.order_by(*order)[:limit])
        my_votes = {}
        if request.user.is_authenticated:
            my_votes = dict(ServiceReviewVote.objects.filter(user=request.user, review__in=page)
                            .values_list("review_id", "helpful"))
        mine = None
        if request.user.is_authenticated:
            own = ServiceReview.objects.filter(service_number=number, user=request.user).first()
            mine = {"score": own.score, "comment": own.comment, "is_published": own.is_published} if own else None
        return Response({"count": qs.count(),
                         "results": [_review_json(r, request, my_votes) for r in page],
                         "my_review": mine})

    def post(self, request, number):
        if not _valid_number(number):
            return _bad_number()
        try:
            score = int(request.data.get("score"))
        except (TypeError, ValueError):
            score = 0
        if not 1 <= score <= 5:
            return Response({"score": "1 dan 5 gacha baho kiriting"}, status=status.HTTP_400_BAD_REQUEST)
        comment = str(request.data.get("comment") or "").strip()[:1000]
        # Matn o'zgarsa qayta moderatsiyaga tushadi (OS-MG-07); baho darhol hisobga olinadi
        review, created = ServiceReview.objects.update_or_create(
            service_number=number, user=request.user,
            defaults={"score": score, "comment": comment, "author_name": _author(request.user), "is_published": False},
        )
        _clear_service_cache(number)
        return Response({"score": review.score, "comment": review.comment, "is_published": review.is_published,
                         "moderation": bool(comment)},
                        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class ReviewVoteView(APIView):
    """POST {helpful: true|false} — sharhga "Foydali / Foydasiz" ovozi (login). O'z sharhiga ovoz berilmaydi."""
    permission_classes = [IsAuthenticated]
    throttle_classes = [FormRateThrottle]

    def post(self, request, review_id):
        review = _visible(ServiceReview).filter(pk=review_id, is_published=True).first()
        helpful = request.data.get("helpful")
        if review is None:
            return Response({"detail": "Sharh topilmadi"}, status=status.HTTP_404_NOT_FOUND)
        if not isinstance(helpful, bool):
            return Response({"helpful": "true yoki false kerak"}, status=status.HTTP_400_BAD_REQUEST)
        if review.user_id == request.user.id:
            return Response({"detail": "O'z sharhingizga ovoz berib bo'lmaydi"}, status=status.HTTP_400_BAD_REQUEST)
        ServiceReviewVote.objects.update_or_create(review=review, user=request.user, defaults={"helpful": helpful})
        c = review.votes.aggregate(yes=Count("id", filter=Q(helpful=True)), no=Count("id", filter=Q(helpful=False)))
        return Response({"helpful": c["yes"], "unhelpful": c["no"], "my_vote": helpful})


class PageFeedbackView(APIView):
    """GET ?path= — "Ha"/"Yo'q" soni; POST {path, liked, comment, lang} — bir sahifaga bir manzildan kuniga bir marta."""
    permission_classes = [AllowAny]

    def get_throttles(self):
        return [FormRateThrottle()] if self.request.method == "POST" else []

    def get(self, request):
        path = (request.query_params.get("path") or "/")[:300]
        agg = PageFeedback.objects.filter(path=path).aggregate(
            likes=Count("id", filter=Q(liked=True)), dislikes=Count("id", filter=Q(liked=False)))
        return Response(agg)

    def post(self, request):
        path = str(request.data.get("path") or "")[:300]
        liked = request.data.get("liked")
        if not path.startswith("/") or not isinstance(liked, bool):
            return Response({"detail": "path va liked (true/false) kerak"}, status=status.HTTP_400_BAD_REQUEST)
        key = _client_key(request)
        day_ago = timezone.now() - timedelta(days=1)
        if PageFeedback.objects.filter(path=path, client_key=key, created_at__gte=day_ago).exists():
            return Response({"detail": "Bu sahifa uchun fikringiz bugun qabul qilingan"}, status=status.HTTP_409_CONFLICT)
        PageFeedback.objects.create(path=path, liked=liked, comment=str(request.data.get("comment") or "")[:500],
                                    lang=str(request.data.get("lang") or "")[:5], client_key=key)
        return Response(status=status.HTTP_201_CREATED)


class TypoReportView(APIView):
    """POST {path, text, comment, lang} — belgilangan matndagi xato (Ctrl+Enter)."""
    permission_classes = [AllowAny]
    throttle_classes = [FormRateThrottle]

    def post(self, request):
        path = str(request.data.get("path") or "")[:300]
        text = str(request.data.get("text") or "").strip()[:1000]
        if not path.startswith("/") or not text:
            return Response({"detail": "path va text kerak"}, status=status.HTTP_400_BAD_REQUEST)
        TypoReport.objects.create(path=path, selected_text=text, comment=str(request.data.get("comment") or "")[:500],
                                  lang=str(request.data.get("lang") or "")[:5])
        return Response(status=status.HTTP_201_CREATED)
