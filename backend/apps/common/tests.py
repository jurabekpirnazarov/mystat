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
