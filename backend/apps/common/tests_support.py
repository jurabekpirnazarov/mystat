from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.book_market.models import Book
from apps.common.models import Contact, ContactReply, QuestionAnswer


class GlobalSearchTests(APITestCase):
    def setUp(self):
        QuestionAnswer.objects.create(question_uz="Shartnoma qanday imzolanadi?", question_ru="r", question_cry="c",
                                      answer_uz="<p>DIDOX orqali</p>", answer_ru="r", answer_cry="c")
        Book.objects.create(name_uz="Shartnomalar statistikasi", name_ru="r", name_cry="c")

    def groups(self, q):
        return {g["type"]: g["items"] for g in self.client.get("/api/common/search/", {"q": q}).data["groups"]}

    def test_short_query_returns_nothing(self):
        self.assertEqual(self.client.get("/api/common/search/", {"q": "s"}).data["groups"], [])

    def test_guest_does_not_get_login_only_sources(self):
        groups = self.groups("shartnoma")
        self.assertIn("faq", groups)
        self.assertNotIn("books", groups)
        self.assertEqual(groups["faq"][0]["subtitle"], "DIDOX orqali")

    def test_authenticated_user_gets_books(self):
        user = User.objects.create_user(username="s_user", password="x")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user.tokens['access']}")
        self.assertIn("books", self.groups("shartnoma"))


class AssistantTests(APITestCase):
    def setUp(self):
        self.faq = QuestionAnswer.objects.create(
            question_uz="Xizmat narxlari qanday belgilanadi?", question_ru="r", question_cry="c",
            answer_uz="<p>Narx BHM asosida hisoblanadi.</p>", answer_ru="r", answer_cry="c")
        QuestionAnswer.objects.create(question_uz="Elektron imzo bilan ishlash", question_ru="r", question_cry="c",
                                      answer_uz="ERI", answer_ru="r", answer_cry="c")

    def test_matches_question_with_different_word_forms(self):
        data = self.client.post("/api/common/assistant/", {"message": "xizmatlarning narxi qancha?"}, format="json").data
        self.assertTrue(data["found"])
        self.assertEqual(data["answers"][0]["id"], self.faq.id)
        self.assertEqual(data["answers"][0]["answer"], "Narx BHM asosida hisoblanadi.")

    def test_no_match(self):
        data = self.client.post("/api/common/assistant/", {"message": "ob-havo"}, format="json").data
        self.assertFalse(data["found"])

    def test_empty_message(self):
        self.assertEqual(self.client.post("/api/common/assistant/", {"message": " "}, format="json").status_code, 400)


class SupportChatTests(APITestCase):
    def test_guest_flow_with_token(self):
        bad = self.client.post("/api/common/support/", {"text": "Salom"}, format="json")
        self.assertEqual(bad.status_code, status.HTTP_400_BAD_REQUEST)  # ism/telefon kerak

        start = self.client.post("/api/common/support/", {"text": "Salom", "name": "Ali", "phone_number": "998901234567"},
                                 format="json").data
        contact = Contact.objects.get(pk=start["id"])
        self.assertTrue(contact.is_chat)
        ContactReply.objects.create(contact=contact, text="Assalomu alaykum, qanday yordam beray?")

        url = f"/api/common/support/{start['id']}/"
        self.assertEqual(self.client.get(url).status_code, status.HTTP_404_NOT_FOUND)  # tokensiz
        self.assertEqual(self.client.get(url, {"token": "wrong"}).status_code, status.HTTP_404_NOT_FOUND)
        thread = self.client.get(url, {"token": start["token"]}).data
        self.assertEqual([m["from_operator"] for m in thread["messages"]], [False, True])

        follow = self.client.post(f"{url}?token={start['token']}", {"text": "Rahmat"}, format="json")
        self.assertEqual(follow.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(follow.data["messages"]), 3)

    def test_logged_in_user_reads_own_thread_without_token(self):
        user = User.objects.create_user(username="chat_user", password="x", first_name="Vali")
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {user.tokens['access']}")
        start = self.client.post("/api/common/support/", {"text": "Savol"}, format="json").data
        self.assertEqual(Contact.objects.get(pk=start["id"]).name, "Vali")
        self.assertEqual(self.client.get(f"/api/common/support/{start['id']}/").status_code, status.HTTP_200_OK)
