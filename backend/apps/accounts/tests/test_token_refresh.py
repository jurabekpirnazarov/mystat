from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

# Frontend (src/api/apiUrls.ts) aynan shu yo'lni chaqiradi — slash'siz.
REFRESH_URL = "/api/accounts/TokenRefresh"


class TokenRefreshTests(APITestCase):
    def setUp(self):
        self.tokens = User.objects.create_user(username="refresh_user", password="x").tokens

    def test_refresh_returns_new_pair(self):
        response = self.client.post(REFRESH_URL, {"refresh": self.tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    def test_rotated_refresh_token_cannot_be_reused(self):
        self.client.post(REFRESH_URL, {"refresh": self.tokens["refresh"]}, format="json")
        response = self.client.post(REFRESH_URL, {"refresh": self.tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_trailing_slash_is_not_routed(self):
        response = self.client.post(REFRESH_URL + "/", {"refresh": self.tokens["refresh"]}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)

    def test_new_access_token_passes_custom_is_authenticated(self):
        """Yangilangan token bilan `permissions.IsAuthenticated` endpoint'lari 403 bermasligi kerak."""
        for _ in range(2):
            response = self.client.post(REFRESH_URL, {"refresh": self.tokens["refresh"]}, format="json")
            self.tokens = response.data
            self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {self.tokens['access']}")
            self.assertEqual(self.client.get("/api/contracts/").status_code, status.HTTP_200_OK)
