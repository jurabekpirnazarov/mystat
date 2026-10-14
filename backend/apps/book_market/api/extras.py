"""U-17: kitob sevimlilari va eng yaqin pochta bo'limi (to'lov oqimiga tegilmaydi)."""
import math

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.book_market.models import Book, BookFavorite, PostalLocation


def haversine_km(lat1, lng1, lat2, lng2):
    r = 6371.0
    p1, p2 = math.radians(lat1), math.radians(lat2)
    dp, dl = math.radians(lat2 - lat1), math.radians(lng2 - lng1)
    a = math.sin(dp / 2) ** 2 + math.cos(p1) * math.cos(p2) * math.sin(dl / 2) ** 2
    return 2 * r * math.asin(math.sqrt(a))


class NearestPostalView(APIView):
    """GET /api/books/postal-location/nearest/?lat=&lng=&limit=5 — koordinata saqlanmaydi, faqat hisoblanadi."""
    permission_classes = (AllowAny,)

    def get(self, request):
        try:
            lat = float(request.query_params["lat"])
            lng = float(request.query_params["lng"])
            limit = max(1, min(int(request.query_params.get("limit", 5)), 20))
        except (KeyError, ValueError):
            return Response({"detail": "lat va lng kerak"}, status=400)
        if not (-90 <= lat <= 90 and -180 <= lng <= 180):
            return Response({"detail": "Koordinata noto'g'ri"}, status=400)
        points = PostalLocation.objects.filter(is_active=True).values("id", "name", "index", "lat", "lng")
        ranked = sorted(({**p, "distance_km": round(haversine_km(lat, lng, p["lat"], p["lng"]), 2)} for p in points),
                        key=lambda p: p["distance_km"])
        return Response(ranked[:limit])


class BookFavoritesView(APIView):
    """GET — sevimli kitob id'lari; POST {book} — qo'shish; DELETE ?book= — olib tashlash."""
    permission_classes = (IsAuthenticated,)

    def get(self, request):
        return Response(list(BookFavorite.objects.filter(user=request.user).values_list("book_id", flat=True)))

    def post(self, request):
        book = Book.objects.filter(pk=request.data.get("book")).first()
        if book is None:
            return Response({"detail": "Kitob topilmadi"}, status=404)
        BookFavorite.objects.get_or_create(user=request.user, book=book)
        return Response({"book": book.id, "favorite": True}, status=201)

    def delete(self, request):
        BookFavorite.objects.filter(user=request.user, book_id=request.query_params.get("book")).delete()
        return Response(status=204)
