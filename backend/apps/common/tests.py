from django.test import TestCase, override_settings

from apps.common.models import QuestionAnswer, SyntheticRecord
from apps.common.synthetic import get_or_create_synthetic, is_synthetic, synthetic_ids


class SyntheticRegistryTests(TestCase):
    defaults = {"question_uz": "[DEMO] savol", "answer_uz": "javob"}

    def test_get_or_create_is_idempotent(self):
        first, created1 = get_or_create_synthetic(QuestionAnswer, "faq:1", self.defaults)
        second, created2 = get_or_create_synthetic(QuestionAnswer, "faq:1", self.defaults)
        self.assertTrue(created1)
        self.assertFalse(created2)
        self.assertEqual(first.pk, second.pk)
        self.assertEqual(SyntheticRecord.objects.count(), 1)

    def test_recreates_when_object_was_deleted(self):
        obj, _ = get_or_create_synthetic(QuestionAnswer, "faq:2", self.defaults)
        QuestionAnswer.objects.filter(pk=obj.pk).delete()
        new, created = get_or_create_synthetic(QuestionAnswer, "faq:2", self.defaults)
        self.assertTrue(created)
        self.assertNotEqual(obj.pk, new.pk)

    @override_settings(DEBUG=True)
    def test_flags_only_synthetic_objects(self):
        real = QuestionAnswer.objects.create(**self.defaults)
        demo, _ = get_or_create_synthetic(QuestionAnswer, "faq:3", self.defaults)
        self.assertEqual(synthetic_ids(QuestionAnswer), {str(demo.pk)})
        self.assertTrue(is_synthetic(demo))
        self.assertFalse(is_synthetic(real))

    @override_settings(DEBUG=False)
    def test_flags_are_off_in_production(self):
        demo, _ = get_or_create_synthetic(QuestionAnswer, "faq:4", self.defaults)
        self.assertEqual(synthetic_ids(QuestionAnswer), set())
        self.assertFalse(is_synthetic(demo))


class PlatformStatTests(TestCase):
    def test_real_counts_and_shape(self):
        from django.core.cache import cache
        from apps.accounts.models import User
        from apps.common.models import District, Region
        from apps.services.models import (PackageService, PackageServiceItem, ServicePackage,
                                          UserServicePackage, UserServicePackageItemUse)
        cache.clear()
        legal = User.objects.create_user(username="ps_legal", password="x", user_type="legal_entity")
        User.objects.create_user(username="ps_ind", password="x")
        region = Region.objects.create(name="R", code="1")
        district = District.objects.create(name="D", region=region, code="11")
        package = ServicePackage.objects.create(name_uz="P", name_ru="P", name_cry="P")
        ps = PackageService.objects.create(name_uz="<p>E-kitob</p>", name_ru="E", name_cry="E")
        psi = PackageServiceItem.objects.create(package=package, package_service=ps, name_uz="a", name_ru="a", name_cry="a", limit=5)
        usp = UserServicePackage.objects.create(region=region, district=district, year=2026, month=1, service=package, created_by_user=legal)
        UserServicePackageItemUse.objects.create(usp=usp, psi=psi, is_success=True)

        data = self.client.get("/api/common/platform-stat/?stat_type=monthly").json()
        self.assertEqual(data["service_stats"], [{"label": "E-kitob", "info": {"physical": 0, "legal": 1, "all": 1}}])
        self.assertEqual(data["user_stats"]["main"]["total"], 2)
        self.assertEqual(data["user_stats"]["main"]["new"], 2)
        self.assertEqual(len(data["user_stats"]["chart_data"]["values"]), 6)
        # Ikki marta chaqirilganda bir xil (avval random edi)
        self.assertEqual(self.client.get("/api/common/platform-stat/?stat_type=monthly").json(), data)
