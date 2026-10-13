from django.contrib.contenttypes.models import ContentType
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.notifications.models import Notification


class NotificationApiTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="n_user", password="x")
        self.other = User.objects.create_user(username="n_other", password="x")
        ct = ContentType.objects.get_for_model(User)
        common = dict(content_type=ct, object_id=1, message="m")
        self.mine_unread = Notification.objects.create(recipient=self.user, title="a", notification_type="contract_created", **common)
        self.mine_read = Notification.objects.create(recipient=self.user, title="b", is_read=True, **common)
        self.foreign = Notification.objects.create(recipient=self.other, title="c", **common)
        self.client.force_authenticate(self.user)

    def test_list_contains_only_own(self):
        response = self.client.get(reverse("notifications:notification-list"))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual({n["id"] for n in response.data}, {self.mine_unread.id, self.mine_read.id})
        self.assertIn("group", response.data[0])
        self.assertIn("is_synthetic", response.data[0])

    def test_filters(self):
        url = reverse("notifications:notification-list")
        self.assertEqual([n["id"] for n in self.client.get(url, {"is_read": "false"}).data], [self.mine_unread.id])
        self.assertEqual([n["id"] for n in self.client.get(url, {"group": "contract"}).data], [self.mine_unread.id])
        self.assertEqual(len(self.client.get(url, {"limit": "1"}).data), 1)

    def test_unread_count(self):
        response = self.client.get(reverse("notifications:notification-unread-count"))
        self.assertEqual(response.data, {"count": 1})

    def test_mark_one_as_read(self):
        url = reverse("notifications:notification-detail", args=[self.mine_unread.id])
        response = self.client.patch(url, {"is_read": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.mine_unread.refresh_from_db()
        self.assertTrue(self.mine_unread.is_read)

    def test_cannot_mark_foreign_notification(self):
        url = reverse("notifications:notification-detail", args=[self.foreign.id])
        response = self.client.patch(url, {"is_read": True}, format="json")
        self.assertEqual(response.status_code, status.HTTP_404_NOT_FOUND)
        self.foreign.refresh_from_db()
        self.assertFalse(self.foreign.is_read)

    def test_mark_all_as_read_touches_only_own(self):
        self.client.patch(reverse("notifications:notification-list"))
        self.assertFalse(Notification.objects.filter(recipient=self.user, is_read=False).exists())
        self.foreign.refresh_from_db()
        self.assertFalse(self.foreign.is_read)
