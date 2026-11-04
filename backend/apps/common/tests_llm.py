from unittest import mock

from django.test import SimpleTestCase, override_settings

from apps.common import llm

CATALOG = [{"n": 301, "t": "Tashqi savdo", "d": "eksport"}, {"n": 501, "t": "ISN kalkulyatori", "d": "narx"}]


def _resp(content):
    r = mock.Mock()
    r.raise_for_status.return_value = None
    r.json.return_value = {"choices": [{"message": {"content": content}}]}
    return r


@override_settings(LLM_BASE_URL="http://llm.test/v1", LLM_API_KEY="k", LLM_MODEL="m", LLM_TIMEOUT=5)
class LlmSuggestTests(SimpleTestCase):
    def test_filters_unknown_numbers_and_parses_wrapped_json(self):
        with mock.patch("apps.common.llm.requests.post", return_value=_resp('Mana: {"services":[999,501,301,501],"answer":"Narx uchun."}')):
            out = llm.suggest_services("narx", CATALOG)
        self.assertEqual(out["services"], [501, 301])
        self.assertEqual(out["answer"], "Narx uchun.")

    def test_invalid_json_returns_none(self):
        with mock.patch("apps.common.llm.requests.post", return_value=_resp("tushunmadim")):
            self.assertIsNone(llm.suggest_services("x", CATALOG))

    def test_network_error_returns_none(self):
        import requests
        with mock.patch("apps.common.llm.requests.post", side_effect=requests.ConnectionError("down")):
            self.assertIsNone(llm.suggest_services("x", CATALOG))

    @override_settings(LLM_BASE_URL="")
    def test_disabled_without_url(self):
        self.assertIsNone(llm.suggest_services("x", CATALOG))

    def test_clean_catalog_drops_garbage(self):
        out = llm.clean_catalog([{"n": "12", "t": "a" * 500}, {"n": "abc"}, "x", {"t": "no n"}])
        self.assertEqual(len(out), 1)
        self.assertEqual(out[0]["n"], 12)
        self.assertEqual(len(out[0]["t"]), 80)


class ChatTextTests(SimpleTestCase):
    @override_settings(LLM_BASE_URL="http://llm.test/v1", LLM_API_KEY="k", LLM_MODEL="m", LLM_TIMEOUT=5)
    def test_chat_text_returns_trimmed_text(self):
        with mock.patch("apps.common.llm.requests.post", return_value=_resp("  Salom!  ")):
            self.assertEqual(llm.chat_text("sys", [{"role": "user", "content": "hi"}]), "Salom!")

    @override_settings(LLM_BASE_URL="")
    def test_chat_text_disabled(self):
        self.assertIsNone(llm.chat_text("sys", [{"role": "user", "content": "hi"}]))
