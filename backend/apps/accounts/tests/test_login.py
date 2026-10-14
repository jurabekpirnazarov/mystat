from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

LOGIN_URL = "/api/accounts/login/"


class LoginTests(APITestCase):
    def setUp(self):
        User.objects.create_user(username="legal_user", password="Correct-pass1", user_type="legal_entity")

    def test_login_returns_tokens(self):
        response = self.client.post(LOGIN_URL, {"username": "legal_user", "password": "Correct-pass1"}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data["data"]["tokens"])
        self.assertIn("refresh", response.data["data"]["tokens"])

    def test_wrong_password(self):
        response = self.client.post(LOGIN_URL, {"username": "legal_user", "password": "Wrong-pass1"}, format="json")
        # authentication_classes=[] bo'lgani uchun AuthenticationFailed -> 403
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertNotIn("data", response.data)

    def test_profile_requires_token_and_hides_password(self):
        self.assertEqual(self.client.get("/api/accounts/profile/").status_code, status.HTTP_401_UNAUTHORIZED)
        tokens = self.client.post(LOGIN_URL, {"username": "legal_user", "password": "Correct-pass1"}, format="json").data["data"]["tokens"]
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        response = self.client.get("/api/accounts/profile/")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertNotIn("password", str(response.data))
