"""FQ-02..FQ-10 va S-15 API testlari."""
from datetime import date
from decimal import Decimal

from django.core.cache import cache
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.analytics.models import RegionIndicator
from apps.common.models import District, Region, Sector

from .models import (Article, CitizenQuestion, ConsumerPrice, GlossaryTerm, NameStat, SalaryDistribution, Survey,
                     SurveyQuestion, SurveyResponse)
from .text import name_search_key


class Base(APITestCase):
    def setUp(self):
        cache.clear()
        self.region = Region.objects.create(name="Toshkent sh.", code="1726")
        self.region2 = Region.objects.create(name="Samarqand v.", code="1718")
        self.user = User.objects.create_user(username="citizen", password="x", user_type="individual")
        self.staff = User.objects.create_user(username="cit_staff", password="x", role="employee")


class NameTests(Base):
    def setUp(self):
        super().setUp()
        for year, n in ((2024, 100), (2025, 120)):
            NameStat.objects.create(name="Muhammad", name_cyr="Муҳаммад", gender="M", year=year, region=self.region, count=n)
        NameStat.objects.create(name="Ali", name_cyr="Али", gender="M", year=2025, region=self.region, count=50)

    def test_latin_and_cyrillic_give_same_result(self):
        a = self.client.get("/api/citizens/names/", {"q": "Muhammad"}).data
        b = self.client.get("/api/citizens/names/", {"q": "Мухаммад"}).data
        c = self.client.get("/api/citizens/names/", {"q": "муҳаммад"}).data
        self.assertEqual(a["name"], "Muhammad")
        self.assertEqual(a["by_year"], b["by_year"])
        self.assertEqual(b["name"], c["name"])
        self.assertEqual(a["rank"], 1)

    def test_short_query_rejected(self):
        self.assertEqual(self.client.get("/api/citizens/names/", {"q": "Mu"}).status_code, 400)

    def test_key(self):
        self.assertEqual(name_search_key("Мухаммад"), name_search_key("Muhammad"))
        self.assertEqual(name_search_key("Ulug'bek"), name_search_key("Улуғбек"))


class SurveyTests(Base):
    def setUp(self):
        super().setUp()
        self.survey = Survey.objects.create(slug="s1", title_uz="S", is_active=True)
        self.q1 = SurveyQuestion.objects.create(survey=self.survey, order=0, text_uz="Q1", kind="single",
                                                options=[{"id": "a", "text_uz": "A"}, {"id": "b", "text_uz": "B"}])
        self.q2 = SurveyQuestion.objects.create(survey=self.survey, order=1, text_uz="Q2", kind="scale", scale_max=5)
        SurveyResponse.objects.create(survey=self.survey, is_sample=True)

    def test_one_answer_per_user_and_counts(self):
        self.client.force_authenticate(self.user)
        url = "/api/citizens/surveys/s1/answer/"
        body = {"region": self.region.id, "age_group": "25-34", "answers": {str(self.q1.id): ["a"], str(self.q2.id): 4}}
        self.assertEqual(self.client.post(url, body, format="json").status_code, 201)
        self.assertEqual(self.client.post(url, body, format="json").status_code, 409)
        res = self.client.get("/api/citizens/surveys/s1/results/").data
        self.assertEqual((res["sample_responses"], res["real_responses"]), (1, 1))
        option_a = next(o for o in res["questions"][0]["options"] if o["id"] == "a")
        self.assertEqual(option_a["count"], 1)

    def test_validation(self):
        self.client.force_authenticate(self.user)
        url = "/api/citizens/surveys/s1/answer/"
        bad = {"answers": {str(self.q1.id): ["zzz"], str(self.q2.id): 4}}
        self.assertEqual(self.client.post(url, bad, format="json").status_code, 400)
        bad = {"answers": {str(self.q1.id): ["a"], str(self.q2.id): 9}}
        self.assertEqual(self.client.post(url, bad, format="json").status_code, 400)

    def test_closed_survey(self):
        self.survey.closes_at = date(2000, 1, 1)
        self.survey.save()
        self.client.force_authenticate(self.user)
        r = self.client.post("/api/citizens/surveys/s1/answer/", {"answers": {}}, format="json")
        self.assertEqual(r.status_code, 400)


class QuestionTests(Base):
    def test_citizen_to_staff_to_public(self):
        self.client.force_authenticate(self.user)
        qid = self.client.post("/api/citizens/questions/", {"category": "population", "region": self.region.id,
                                                              "question": "Tumanimizda nechta maktab bor?",
                                                              "allow_publish": True}, format="json").data["id"]
        self.assertEqual(self.client.patch(f"/api/citizens/questions/{qid}/", {"answer": "x"}, format="json").status_code, 403)
        self.assertEqual(self.client.get("/api/citizens/answers/").data, [])
        self.client.force_authenticate(self.staff)
        self.assertIn(qid, [q["id"] for q in self.client.get("/api/citizens/questions/", {"scope": "staff"}).data])
        self.client.patch(f"/api/citizens/questions/{qid}/", {"answer": "42 ta (namuna)"}, format="json")
        public = self.client.get("/api/citizens/answers/").data
        self.assertEqual([p["id"] for p in public], [qid])
        self.assertNotIn("citizen", str(public))  # ism chiqmaydi

    def test_without_consent_not_public(self):
        q = CitizenQuestion.objects.create(user=self.user, question="Savol", allow_publish=False, status="answered", answer="J")
        self.assertNotIn(q.id, [p["id"] for p in self.client.get("/api/citizens/answers/").data])


class DataTests(Base):
    def test_salary_and_basket(self):
        sector = Sector.objects.create(code="P", name_uz="Ta'lim")
        SalaryDistribution.objects.create(region=self.region, sector=sector, year=2025, mean=Decimal(5000), median=Decimal(4000),
                                          p25=Decimal(3000), p75=Decimal(6000), p90=Decimal(9000))
        data = self.client.get("/api/citizens/salary/").data
        self.assertEqual(data["distribution"]["median"], 4000.0)
        self.assertEqual(data["by_region"][0]["region"], "Toshkent sh.")
        for m, price in ((date(2025, 8, 1), 1000), (date(2025, 9, 1), 1100)):
            ConsumerPrice.objects.create(product="bread", product_name="Non", unit="dona", region=self.region, month=m, price=price)
        basket = self.client.post("/api/citizens/prices/basket/", {"items": [{"product": "bread", "qty": 10}]}, format="json").data
        self.assertEqual([s["total"] for s in basket["series"]], [10000, 11000])
        products = self.client.get("/api/citizens/prices/").data["products"]
        self.assertEqual(products[0]["change_month_pct"], 10.0)
        regions = self.client.get("/api/citizens/prices/regions/", {"product": "bread"}).data["regions"]
        self.assertIsNone(next(r for r in regions if r["region_id"] == self.region2.id)["price"])  # ma'lumot yo'q

    def test_articles_glossary_languages(self):
        a = Article.objects.create(slug="inf", topic="prices", title_uz="Inflyatsiya", title_ru="Инфляция",
                                   summary_uz="S", body_uz="Matn", published_at=date(2026, 1, 1))
        GlossaryTerm.objects.create(slug="inflation", term_uz="Inflyatsiya", term_ru="Инфляция", definition_uz="T", article=a)
        self.assertEqual(self.client.get("/api/citizens/articles/", {"lang": "ru"}).data["results"][0]["title"], "Инфляция")
        detail = self.client.get("/api/citizens/articles/inf/", {"lang": "ru"}).data
        self.assertEqual((detail["body"], detail["body_lang"]), ("Matn", "uz"))  # tarjima yo'q — o'zbekcha
        self.assertEqual(self.client.get("/api/citizens/glossary/", {"q": "инфл"}).data[0]["slug"], "inflation")

    def test_favorites_and_summary(self):
        self.client.force_authenticate(self.user)
        f = self.client.post("/api/citizens/favorites/", {"kind": "cpi", "title": "CPI", "params": {}}, format="json")
        self.assertEqual(f.status_code, 201)
        again = self.client.post("/api/citizens/favorites/", {"kind": "cpi", "title": "CPI", "params": {}}, format="json")
        self.assertEqual(again.data["id"], f.data["id"])  # takror qo'shilmaydi
        summary = self.client.get("/api/citizens/me/summary/").data
        self.assertEqual(len(summary["favorites"]), 1)
        other = User.objects.create_user(username="cit2", password="x")
        self.client.force_authenticate(other)
        self.assertEqual(self.client.delete(f"/api/citizens/favorites/{f.data['id']}/").status_code, 404)


class RegionProfileTests(Base):
    def test_profile_cards_and_comparison(self):
        for region, salary in ((self.region, 9000), (self.region2, 5000)):
            RegionIndicator.objects.create(region=region, indicator="avg_salary", year=2025, value=salary, unit="ming so'm")
            RegionIndicator.objects.create(region=region, indicator="avg_salary", year=2024, value=salary * 0.9, unit="ming so'm")
        District.objects.create(name="Chilonzor", region=self.region, code="1")
        data = self.client.get(f"/api/common/regions/{self.region.id}/profile/").data
        card = data["cards"][0]
        self.assertEqual(card["key"], "avg_salary")
        self.assertEqual(card["republic"], 7000.0)
        self.assertEqual(card["vs_average_pct"], round((9000 - 7000) / 7000 * 100, 1))
        self.assertEqual(card["assessment"], "good")
        self.assertEqual(data["districts_count"], 1)
        m = self.client.get("/api/common/regions/map/", {"indicator": "avg_salary"}).data
        self.assertEqual({i["code"]: i["value"] for i in m["items"]}["1718"], 5000.0)

    def test_cpi_series_chain(self):
        from apps.additional_services.models.priceindex_model import PriceIndex
        PriceIndex.objects.create(id="1", year=date(2025, 1, 1), values=Decimal("101"))
        PriceIndex.objects.create(id="2", year=date(2025, 2, 1), values=Decimal("102"))
        series = self.client.get("/api/additional-services/cpi/series/").data["series"]
        self.assertEqual(series[-1]["index"], round(100 * 1.01 * 1.02, 4))  # oylik indekslar ko'paytmasi
