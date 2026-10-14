"""U-17: eng yaqin pochta bo'limi, sevimlilar, qidiruv/saralash."""
from decimal import Decimal

from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.book_market.api.extras import haversine_km
from apps.book_market.models import Book, BookFavorite, BookOption, PostalLocation


class BookExtrasTests(APITestCase):
    def setUp(self):
        PostalLocation.objects.create(lat=41.31, lng=69.28, name="Toshkent", index="100000")
        PostalLocation.objects.create(lat=39.65, lng=66.96, name="Samarqand", index="140000")
        PostalLocation.objects.create(lat=40.78, lng=72.34, name="Andijon", index="170000")
        self.user = User.objects.create_user(username="reader", password="x")
        self.b1 = Book.objects.create(name_uz="Statistik yilnoma", name_ru="Ежегодник", name_cry="Й", year=2023)
        self.b2 = Book.objects.create(name_uz="Demografiya", name_ru="Демография", name_cry="Д", year=2025)
        BookOption.objects.create(book=self.b1, book_type="print", price=Decimal("50000"))
        BookOption.objects.create(book=self.b2, book_type="print", price=Decimal("20000"))

    def test_nearest_ordering(self):
        r = self.client.get("/api/books/postal-location/nearest/", {"lat": 39.7, "lng": 67.0, "limit": 2}).data
        self.assertEqual([p["name"] for p in r], ["Samarqand", "Toshkent"])
        self.assertLess(r[0]["distance_km"], 10)
        self.assertEqual(self.client.get("/api/books/postal-location/nearest/").status_code, 400)
        self.assertAlmostEqual(haversine_km(41.31, 69.28, 39.65, 66.96), 270, delta=15)

    def test_favorites_are_per_user(self):
        self.client.force_authenticate(self.user)
        self.client.post("/api/books/favorites/", {"book": self.b1.id}, format="json")
        self.client.post("/api/books/favorites/", {"book": self.b1.id}, format="json")  # takror — bitta
        self.assertEqual(self.client.get("/api/books/favorites/").data, [self.b1.id])
        other = User.objects.create_user(username="reader2", password="x")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.get("/api/books/favorites/").data, [])
        self.client.force_authenticate(self.user)
        self.client.delete(f"/api/books/favorites/?book={self.b1.id}")
        self.assertFalse(BookFavorite.objects.exists())

    def test_search_and_sort(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user.tokens['access']}")
        r = self.client.get("/api/books/books-list/", {"q": "ежегод"})
        self.assertEqual([b["id"] for b in r.data["results"]], [self.b1.id])
        r = self.client.get("/api/books/books-list/", {"book_type": "print", "ordering": "price"})
        self.assertEqual([b["id"] for b in r.data["results"]], [self.b2.id, self.b1.id])
        r = self.client.get("/api/books/books-list/", {"ordering": "new"})
        self.assertEqual(r.data["results"][0]["id"], self.b2.id)
