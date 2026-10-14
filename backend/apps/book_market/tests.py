from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.book_market.models import Book, BookOption
from apps.common.models import District, Region
from apps.services.models import (
    PackageService,
    PackageServiceItem,
    ServicePackage,
    UserServicePackage,
    UserServicePackageItemUse,
)


class EBookLimitTests(APITestCase):
    """Paket limiti: e-kitob yuklash (Q-05)."""

    def setUp(self):
        region = Region.objects.create(name="R", code="1")
        district = District.objects.create(name="D", region=region, code="11")
        self.user = User.objects.create_user(username="ebook_user", password="x")
        package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")
        self.ps = PackageService.objects.create(name_uz="E-kitob", name_ru="E", name_cry="E")
        self.psi = PackageServiceItem.objects.create(package=package, package_service=self.ps, name_uz="e",
                                                     name_ru="e", name_cry="e", limit=2)
        self.usp = UserServicePackage.objects.create(region=region, district=district, year=2026, month=1,
                                                     service=package, created_by_user=self.user)
        self.books = []
        for i in range(3):
            book = Book.objects.create(name_uz=f"Kitob {i}", name_ru="K", name_cry="K")
            BookOption.objects.create(book=book, book_type="electron", price=0)
            self.books.append(book)
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.user.tokens['access']}")

    def download(self, book, user=None):
        if user:
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user.tokens['access']}")
        return self.client.post(f"/api/books/e-book/download/{book.id}?package_service_id={self.ps.id}")

    def test_guest_gets_401(self):
        self.client.credentials()
        self.assertEqual(self.download(self.books[0]).status_code, status.HTTP_401_UNAUTHORIZED)

    def test_user_without_package(self):
        other = User.objects.create_user(username="no_pkg", password="x")
        self.assertEqual(self.download(self.books[0], user=other).status_code, status.HTTP_404_NOT_FOUND)

    def test_counts_usage_and_stops_at_limit(self):
        self.assertEqual(self.download(self.books[0]).status_code, status.HTTP_201_CREATED)
        self.assertEqual(self.download(self.books[1]).status_code, status.HTTP_201_CREATED)
        response = self.download(self.books[2])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["used_count"], 2)
        self.assertEqual(UserServicePackageItemUse.objects.filter(usp=self.usp, is_success=True).count(), 2)

    def test_same_book_is_not_counted_twice(self):
        self.download(self.books[0])
        response = self.download(self.books[0])
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(UserServicePackageItemUse.objects.filter(usp=self.usp).count(), 1)


class PackageExpiryTests(EBookLimitTests):
    """B-07: muddati o'tgan paket bilan foydalanib bo'lmaydi; eski (muddatsiz) paketlar ishlayveradi."""

    def test_new_package_gets_expiry_from_duration(self):
        from datetime import timedelta
        self.assertEqual(self.usp.expires_at, self.usp.starts_at + timedelta(days=self.usp.service.duration_days))

    def test_expired_package_is_forbidden(self):
        from datetime import date
        UserServicePackage.objects.filter(pk=self.usp.pk).update(expires_at=date(2020, 1, 1))
        response = self.download(self.books[0])
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertFalse(UserServicePackageItemUse.objects.filter(usp=self.usp).exists())

    def test_package_without_expiry_still_works(self):
        UserServicePackage.objects.filter(pk=self.usp.pk).update(starts_at=None, expires_at=None)
        self.assertEqual(self.download(self.books[0]).status_code, status.HTTP_201_CREATED)
