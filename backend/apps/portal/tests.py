from django.contrib.auth import get_user_model
from django.core.cache import cache
from django.test import TestCase, override_settings
from rest_framework.test import APIClient

from .models import PageFeedback, ServiceReview, ServiceUsage, TypoReport

User = get_user_model()


@override_settings(DEBUG=False)
class PortalApiTests(TestCase):
    def setUp(self):
        cache.clear()
        self.client = APIClient()
        self.user = User.objects.create_user(username="ali", password="x", first_name="Ali", last_name="Valiyev")

    def test_usage_and_stats(self):
        self.assertEqual(self.client.post("/api/portal/services/302/use/").status_code, 201)
        self.client.post("/api/portal/services/302/use/")
        ServiceUsage.objects.create(service_number=302, is_synthetic=True)  # production'da hisobga olinmaydi
        data = self.client.get("/api/portal/services/302/stats/").json()
        self.assertEqual(data["usage_count"], 2)
        self.assertFalse(data["is_sample"])
        self.assertEqual(self.client.get("/api/portal/services/5/stats/").status_code, 404)

    def test_review_one_per_user_and_moderation(self):
        self.assertEqual(self.client.post("/api/portal/services/302/reviews/", {"score": 5}).status_code, 401)
        self.client.force_authenticate(self.user)
        r = self.client.post("/api/portal/services/302/reviews/", {"score": 4, "comment": "Yaxshi"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertTrue(r.json()["moderation"])
        r = self.client.post("/api/portal/services/302/reviews/", {"score": 2}, format="json")
        self.assertEqual(r.status_code, 200)  # takroriy baho yangilanadi
        self.assertEqual(ServiceReview.objects.filter(service_number=302).count(), 1)
        review = ServiceReview.objects.get()
        self.assertEqual(review.author_name, "ALI V.")
        stats = self.client.get("/api/portal/services/302/stats/").json()
        self.assertEqual((stats["rating_avg"], stats["rating_count"], stats["distribution"]["2"]), (2, 1, 1))
        # matni yo'q yoki moderatsiyadan o'tmagan sharh ro'yxatda ko'rinmaydi
        self.assertEqual(self.client.get("/api/portal/services/302/reviews/").json()["count"], 0)
        self.assertEqual(self.client.post("/api/portal/services/302/reviews/", {"score": 9}, format="json").status_code, 400)

    def test_review_vote(self):
        author = User.objects.create_user(username="vali", password="x")
        review = ServiceReview.objects.create(service_number=302, score=5, comment="Zo'r", is_published=True, user=author)
        self.assertEqual(self.client.post(f"/api/portal/reviews/{review.id}/vote/", {"helpful": True}, format="json").status_code, 401)
        self.client.force_authenticate(self.user)
        r = self.client.post(f"/api/portal/reviews/{review.id}/vote/", {"helpful": True}, format="json")
        self.assertEqual(r.json(), {"helpful": 1, "unhelpful": 0, "my_vote": True})
        r = self.client.post(f"/api/portal/reviews/{review.id}/vote/", {"helpful": False}, format="json")  # ovoz o'zgaradi
        self.assertEqual(r.json(), {"helpful": 0, "unhelpful": 1, "my_vote": False})
        item = self.client.get("/api/portal/services/302/reviews/").json()["results"][0]
        self.assertEqual((item["unhelpful"], item["my_vote"]), (1, False))
        self.client.force_authenticate(author)
        self.assertEqual(self.client.post(f"/api/portal/reviews/{review.id}/vote/", {"helpful": True}, format="json").status_code, 400)

    def test_services_stats_list(self):
        ServiceUsage.objects.create(service_number=101)
        ServiceReview.objects.create(service_number=101, score=5, user=self.user)
        items = self.client.get("/api/portal/services/stats/").json()["items"]
        self.assertEqual(items["101"], {"usage": 1, "rating": 5, "ratings": 1})

    def test_page_feedback_once_per_day(self):
        body = {"path": "/spheres/1", "liked": True}
        self.assertEqual(self.client.post("/api/portal/page-feedback/", body, format="json").status_code, 201)
        self.assertEqual(self.client.post("/api/portal/page-feedback/", body, format="json").status_code, 409)
        self.assertEqual(self.client.post("/api/portal/page-feedback/", {"path": "x", "liked": 1}, format="json").status_code, 400)
        self.assertEqual(self.client.get("/api/portal/page-feedback/", {"path": "/spheres/1"}).json(), {"likes": 1, "dislikes": 0})
        self.assertEqual(PageFeedback.objects.count(), 1)

    def test_typo_report(self):
        r = self.client.post("/api/portal/typo-report/", {"path": "/about", "text": "statistka"}, format="json")
        self.assertEqual(r.status_code, 201)
        self.assertEqual(self.client.post("/api/portal/typo-report/", {"path": "/about"}, format="json").status_code, 400)
        self.assertEqual(TypoReport.objects.get().selected_text, "statistka")

    @override_settings(FORM_THROTTLE_RATE="2/hour")
    def test_spam_throttled(self):
        for _ in range(2):
            self.client.post("/api/portal/typo-report/", {"path": "/a", "text": "x"}, format="json")
        self.assertEqual(self.client.post("/api/portal/typo-report/", {"path": "/a", "text": "x"}, format="json").status_code, 429)


@override_settings(DEBUG=True)
class PortalSampleTests(TestCase):
    def setUp(self):
        cache.clear()

    def test_synthetic_visible_in_demo(self):
        ServiceUsage.objects.create(service_number=101, is_synthetic=True)
        data = APIClient().get("/api/portal/services/101/stats/").json()
        self.assertEqual(data["usage_count"], 1)
        self.assertTrue(data["is_sample"])
