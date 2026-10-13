from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.organizations.models import Organization


class OrganizationListViewTests(APITestCase):
    url = reverse("organizations:organization-list")

    def setUp(self):
        self.owner = User.objects.create_user(username="org_owner", password="x")
        self.other = User.objects.create_user(username="org_other", password="x")
        self.org = Organization.objects.create(user=self.owner, name="Owner LLC", tin="900000001")
        Organization.objects.create(user=self.other, name="Other LLC", tin="900000002")

    def _ids(self, response):
        return [row["id"] for row in response.data["results"]]

    def test_user_sees_only_own_organization(self):
        self.client.force_authenticate(self.owner)
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._ids(response), [self.org.id])

    def test_user_without_organization_gets_empty_list(self):
        self.client.force_authenticate(User.objects.create_user(username="no_org", password="x"))
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._ids(response), [])

    def test_guest_gets_empty_list(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(self._ids(response), [])

    def test_staff_sees_all(self):
        self.client.force_authenticate(User.objects.create_superuser(username="admin_t", password="x"))
        response = self.client.get(self.url)
        self.assertEqual(len(self._ids(response)), 2)
