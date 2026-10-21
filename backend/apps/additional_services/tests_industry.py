"""Sanoat ishlab chiqaruvchilari (/industry, #901): toifa daraxti bo'yicha ro'yxat, sonlar, qidiruv, til."""
from django.contrib.auth import get_user_model
from django.test import TestCase
from rest_framework.test import APIClient

from apps.additional_services.models import IndustrialProduct, IndustrialProductCategory, Skp

User = get_user_model()
BASE = "/api/additional-services/industrial-products/"


class IndustrialProductTreeTests(TestCase):
    def setUp(self):
        self.root = IndustrialProductCategory.objects.create(name_uz="Sanoat", name_ru="Промышленность")
        self.mid = IndustrialProductCategory.objects.create(name_uz="Ko'mir", name_ru="Уголь", parent=self.root)
        self.leaf = IndustrialProductCategory.objects.create(name_uz="Lignit", name_ru="Лигнит", parent=self.mid)
        self.empty = IndustrialProductCategory.objects.create(name_uz="Bo'sh", name_ru="Пусто", parent=self.root)
        self.skp = Skp.objects.create(code="510100", name_uz="Toshko'mir", name_ru="Уголь каменный", name_cyr="Тошкўмир")
        self.p1 = IndustrialProduct.objects.create(category=self.leaf, skp=self.skp, name="Alfa MChJ", inn="300000001",
                                                   adress_uz="Toshkent sh.", adress_ru="г. Ташкент", soato_uz="Olmazor", phone="901")
        self.p2 = IndustrialProduct.objects.create(category=self.mid, skp=self.skp, name="Beta AJ", inn="300000002")
        IndustrialProduct.objects.create(category=self.leaf, skp=self.skp, name="Nofaol", inn="300000003", is_active=False)
        self.client = APIClient()
        self.client.force_authenticate(User.objects.create_user(username="u", password="x"))

    def test_login_required(self):
        self.assertEqual(APIClient().get(f"{BASE}{self.root.id}/").status_code, 401)

    def test_includes_all_descendants(self):
        """Ilgari faqat toifaning o'zi qidirilardi: ildiz toifada 0 ta chiqardi."""
        r = self.client.get(f"{BASE}{self.root.id}/").json()
        self.assertEqual(r["count"], 2)  # nofaol qator hisobga olinmaydi
        self.assertEqual(self.client.get(f"{BASE}{self.mid.id}/").json()["count"], 2)
        self.assertEqual(self.client.get(f"{BASE}{self.leaf.id}/").json()["count"], 1)
        self.assertEqual(self.client.get(f"{BASE}{self.empty.id}/").json()["count"], 0)

    def test_search_and_paging(self):
        self.assertEqual(self.client.get(f"{BASE}{self.root.id}/", {"search": "alfa"}).json()["count"], 1)
        self.assertEqual(self.client.get(f"{BASE}{self.root.id}/", {"search": "3000000"}).json()["count"], 2)  # STIR boshi
        page2 = self.client.get(f"{BASE}{self.root.id}/", {"limit": 1, "offset": 1}).json()
        self.assertEqual((page2["count"], len(page2["results"])), (2, 1))

    def test_localized_fields(self):
        row = self.client.get(f"{BASE}{self.leaf.id}/").json()["results"][0]
        self.assertEqual((row["adress"], row["soato"], row["skp"]["name"]), ("Toshkent sh.", "Olmazor", "Toshko'mir"))
        row = self.client.get(f"{BASE}{self.leaf.id}/", {"lang": "ru"}).json()["results"][0]
        self.assertEqual((row["adress"], row["skp"]["name"]), ("г. Ташкент", "Уголь каменный"))
        # tanlangan tilda bo'sh bo'lsa uz'ga qaytadi
        self.assertEqual(self.client.get(f"{BASE}{self.leaf.id}/", {"lang": "cry"}).json()["results"][0]["soato"], "Olmazor")

    def test_category_counts_roll_up(self):
        res = self.client.get("/api/additional-services/industrial-product-categories/").json()
        roots = res["results"] if isinstance(res, dict) else res
        root = next(c for c in roots if c["id"] == self.root.id)
        self.assertEqual(root["product_count"], 2)
        by_id = {c["id"]: c["product_count"] for c in root["children"]}
        self.assertEqual(by_id, {self.mid.id: 2, self.empty.id: 0})
        self.assertEqual(root["children"][0]["children"][0]["product_count"], 1)
