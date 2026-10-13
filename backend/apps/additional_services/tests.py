from rest_framework.test import APITestCase


class StatisticClassificationApiTests(APITestCase):
    def setUp(self):
        from apps.accounts.models import User
        from apps.additional_services.models.staticclassification_model import (
            StatisticClassification, StatisticClassificationCategory,
        )
        self.cat_a = StatisticClassificationCategory.objects.create(name="A")
        cat_b = StatisticClassificationCategory.objects.create(name="B")
        common = dict(name_ru="r", name_cry="c", analog_ru="", analog_cry="", confirm_document="doc")
        StatisticClassification.objects.create(category=self.cat_a, name_uz="Kasblar", analog_uz="ISCO-08", **common)
        StatisticClassification.objects.create(category=cat_b, name_uz="Valyutalar", analog_uz="ISO 4217", **common)
        user = User.objects.create_user(username="cls_user", password="x")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user.tokens['access']}")

    def test_filter_by_category_and_search(self):
        url = "/api/additional-services/statistic-classification"
        by_cat = self.client.get(url, {"category": self.cat_a.id}).data["results"]
        self.assertEqual([r["name_uz"] for r in by_cat], ["Kasblar"])
        by_search = self.client.get(url, {"search": "4217"}).data["results"]
        self.assertEqual([r["name_uz"] for r in by_search], ["Valyutalar"])

    def test_categories_with_counts(self):
        data = self.client.get("/api/additional-services/statistic-classification/categories/").data
        self.assertEqual([(c["name"], c["items_count"]) for c in data], [("A", 1), ("B", 1)])
