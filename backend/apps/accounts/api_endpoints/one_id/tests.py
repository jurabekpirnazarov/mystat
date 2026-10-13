from unittest import skip
from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User


# Boshqa loyihadan ko'chirilgan: apps.users va 'users-api' namespace bu loyihada yo'q.
# ISH_REJASI.md Q-05 da shu loyihaning OneID view'iga moslab qayta yoziladi.
@skip("Eskirgan test: apps.users / users-api ga tayanadi")
class OneIdLoginViewTestCase(APITestCase):
    def setUp(self):
        # Create a test user
        self.user = User.objects.create_user(
            username="testuser",
            pinfl="12345678901234",
            password="testpassword",
        )
        self.valid_code = "valid_code"
        self.invalid_code = "invalid_code"
        self.access_token = "test_access_token"
        self.url = reverse("users-api:oneid-login")

    @patch("apps.users.api.user.one_id.views.OneIdLoginView.get_auth_data")
    @patch("apps.users.api.user.one_id.views.OneIdLoginView.get_access_token")
    def test_get_with_valid_code(self, mock_get_access_token, mock_get_auth_data):
        mock_get_auth_data.return_value = {
            "pin": self.user.pinfl,
            "user_id": self.user.username,
            "full_name": f"{self.user.first_name} {self.user.last_name}",
        }
        # Mock the access token retrieval
        mock_get_access_token.return_value = self.access_token

        response = self.client.get(self.url, {"code": self.valid_code})
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)

    @patch("apps.users.api.user.one_id.views.OneIdLoginView.get_access_token")
    def test_get_with_invalid_code(self, mock_get_access_token):
        mock_get_access_token.return_value = None

        response = self.client.get(self.url, {"code": self.invalid_code})
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
        self.assertEqual(response.data["message"], "Could not fetch access token")

    def test_get_without_code(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Code is not provided")

    @patch("apps.users.api.user.one_id.views.OneIdLoginView.get_auth_data")
    def test_post_with_valid_access_token(self, mock_get_auth_data):
        # Mock the auth data retrieval
        mock_get_auth_data.return_value = {
            "pin": self.user.pinfl,
            "user_id": self.user.username,
            "full_name": f"{self.user.first_name} {self.user.last_name}",
        }

        response = self.client.post(self.url, {"access_token": self.access_token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertIn("refresh", response.data)

    @patch("apps.users.api.user.one_id.views.OneIdLoginView.get_auth_data")
    def test_post_with_invalid_access_token(self, mock_get_auth_data):
        # Mock the auth data retrieval failure
        mock_get_auth_data.return_value = None

        response = self.client.post(self.url, {"access_token": "invalid_access_token"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertEqual(response.data["detail"], "Can't receive auth_data from server")

    @patch("apps.users.api.user.one_id.views.OneIdLoginView.get_auth_data")
    def test_post_with_missing_access_token(self, mock_get_auth_data):
        # Mock the auth data retrieval failure
        mock_get_auth_data.return_value = {
            "pin": self.user.pinfl,
            "error": "Invalid access token",
        }
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
