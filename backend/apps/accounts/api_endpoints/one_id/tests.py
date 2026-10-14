from unittest.mock import patch

from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User

VIEW = "apps.accounts.api_endpoints.one_id.views.OneIdLoginView"


class OneIdLoginViewTestCase(APITestCase):
    """OneID (egov.uz SSO) oqimi; tashqi so'rovlar mock qilinadi."""

    def setUp(self):
        self.user = User.objects.create_user(username="oneid_user", pinfl="12345678901234", password="x")
        self.url = reverse("accounts:oneid-login")

    @patch(f"{VIEW}.get_access_token", return_value="test_access_token")
    def test_get_with_valid_code_redirects(self, _):
        response = self.client.get(self.url, {"code": "valid"})
        self.assertEqual(response.status_code, status.HTTP_302_FOUND)
        self.assertIn("/api/accounts/login/oneid/access_token/test_access_token", response["Location"])

    @patch(f"{VIEW}.get_access_token", return_value=None)
    def test_get_with_invalid_code(self, _):
        response = self.client.get(self.url, {"code": "invalid"})
        self.assertEqual(response.status_code, status.HTTP_406_NOT_ACCEPTABLE)
        self.assertEqual(response.data["message"], "Could not fetch access token")

    def test_get_without_code(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["message"], "Code is not provided")

    @patch(f"{VIEW}.get_auth_data", return_value={"pin": "12345678901234", "user_id": "oneid_user"})
    def test_post_existing_user_by_pinfl(self, _):
        response = self.client.post(self.url, {"access_token": "t"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)
        self.assertEqual(User.objects.filter(pinfl="12345678901234").count(), 1)

    @patch(f"{VIEW}.get_auth_data", return_value={"pin": "98765432109876", "user_id": "new_oneid",
                                                  "first_name": "Ali", "sur_name": "Valiyev"})
    def test_post_creates_new_individual_user(self, _):
        response = self.client.post(self.url, {"access_token": "t"})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        user = User.objects.get(pinfl="98765432109876")
        self.assertEqual((user.username, user.first_name, user.last_name), ("new_oneid", "Ali", "Valiyev"))

    @patch(f"{VIEW}.get_auth_data", return_value=None)
    def test_post_with_invalid_access_token(self, _):
        response = self.client.post(self.url, {"access_token": "bad"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_without_access_token(self):
        response = self.client.post(self.url, {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    @patch(f"{VIEW}.get_auth_data", return_value={"user_id": "x"})
    def test_post_without_pinfl(self, _):
        response = self.client.post(self.url, {"access_token": "t"})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
