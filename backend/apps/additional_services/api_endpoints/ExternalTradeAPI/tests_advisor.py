import io
import zipfile
from unittest import mock

from django.test import SimpleTestCase

from . import advisor


def _block(total, top, change=None, reliable=True):
    return {"total": total, "prev_total": None, "change_pct": change, "top": top, "warnings": [], "countries_count": 40,
            "yoy_reliable": reliable}


def _snap(reliable=True):
    top_e = [{"name": "Rossiya", "value": 500, "share": 40.0, "change_pct": 25.0 if reliable else None},
             {"name": "Qozog'iston", "value": 300, "share": 20.0, "change_pct": -20.0 if reliable else None},
             {"name": "Xitoy", "value": 200, "share": 15.0, "change_pct": None}]
    top_i = [{"name": "Xitoy", "value": 900, "share": 35.0, "change_pct": None}]
    return {
        "year": 2024, "period_label": "yanvar–dekabr", "hs": None, "unit": advisor.UNIT,
        "export": _block(1000.0, top_e, 10.0 if reliable else None, reliable), "import": _block(2000.0, top_i, 5.0 if reliable else None, reliable),
        "balance": -1000.0, "turnover": 3000.0, "coverage_pct": 50.0,
        "export_top3_share": 75.0, "import_top3_share": 35.0,
        "dynamics": [{"year": 2024, "export": 1000, "import": 2000, "period": "yanvar–dekabr"}],
        "warnings": [] if reliable else ["2023-yil ma'lumoti to'liq emas"],
    }


class RulesAdviceTests(SimpleTestCase):
    def test_flags_concentration_and_deficit(self):
        a = advisor.rules_advice(_snap())
        self.assertTrue(any("bog'liq" in r for r in a["risks"]))
        self.assertTrue(any("qoplaydi" in r for r in a["risks"]))
        self.assertTrue(any("Rossiya" in o for o in a["opportunities"]))
        self.assertTrue(any("diversifikatsiya" in r for r in a["recommendations"]))

    def test_unreliable_yoy_makes_no_growth_claims(self):
        a = advisor.rules_advice(_snap(reliable=False))
        text = " ".join(a["summary"] + a["risks"] + a["opportunities"])
        self.assertNotIn("%  ", text)
        self.assertTrue(any("to'liq emas" in x for x in a["summary"]))
        self.assertFalse(any("o'sgan" in o for o in a["opportunities"]))


class AiAdviceTests(SimpleTestCase):
    def test_ai_output_is_cleaned(self):
        out = {"summary": ["a", "", "b"], "risks": "yo'q", "opportunities": ["x"] * 9, "recommendations": ["r"], "answer": " javob "}
        with mock.patch("apps.common.llm.chat_json", return_value=out):
            res = advisor.ai_advice(_snap(), "savol")
        self.assertEqual(res["summary"], ["a", "b"])
        self.assertEqual(res["risks"], [])
        self.assertEqual(len(res["opportunities"]), 5)
        self.assertEqual(res["answer"], "javob")

    def test_ai_failure_returns_none(self):
        with mock.patch("apps.common.llm.chat_json", return_value=None):
            self.assertIsNone(advisor.ai_advice(_snap(), ""))


class DocxTests(SimpleTestCase):
    def test_docx_is_valid_and_contains_numbers(self):
        advice = {**advisor.rules_advice(_snap()), "answer": "Javob matni", "source": "rules"}
        data = advisor.build_docx(_snap(), advice, "Savol matni")
        with zipfile.ZipFile(io.BytesIO(data)) as z:
            xml = z.read("word/document.xml").decode("utf-8")
        self.assertIn("Tashqi savdo tahlili", xml)
        self.assertIn("Savol matni", xml)
        self.assertIn("Javob matni", xml)
        self.assertIn("Rossiya", xml)
