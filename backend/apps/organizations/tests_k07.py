"""K-07 korxona pasporti va matn tozalash."""
from decimal import Decimal

from rest_framework.test import APITestCase

from apps.accounts.models import User
from apps.analytics.models import EnterpriseIndicator
from apps.common.models import District, Region, Sector
from apps.common.text import fix_lookalikes, sector_label
from apps.organizations.models import Organization


class PassportTests(APITestCase):
    url = "/api/organizations/me/passport/"

    def setUp(self):
        self.user = User.objects.create_user(username="pp", password="x")
        region = Region.objects.create(name="R", code="9901")
        self.org = Organization.objects.create(user=self.user, name="PP LLC", tin="900000444",
                                               district=District.objects.create(name="T", region=region, code="1"))
        self.client.force_authenticate(self.user)

    def test_empty_blocks_are_null(self):
        data = self.client.get(self.url).data
        self.assertEqual(data["basic"]["tin"], "900000444")
        for block in ("products", "reports", "indicators", "contracts", "package", "trade"):
            self.assertIsNone(data[block], block)

    def test_indicators_block(self):
        EnterpriseIndicator.objects.create(stir="900000444", year=2025, oked_section="C", region=self.org.district.region,
                                           revenue=Decimal(10), employees=3, output_value=Decimal(5))
        data = self.client.get(self.url).data
        self.assertEqual(data["indicators"][0]["employees"], 3)
        self.assertEqual(data["indicators_source"], "real")  # reyestrda emas — real

    def test_without_organization(self):
        self.client.force_authenticate(User.objects.create_user(username="pp2", password="x"))
        self.assertEqual(self.client.get(self.url).status_code, 404)


class TextTests(APITestCase):
    def test_fix_lookalikes(self):
        self.assertEqual(fix_lookalikes("ISHLАB CHIQАRАDIGАN"), "ISHLAB CHIQARADIGAN")  # kirill А
        self.assertEqual(fix_lookalikes("Тошкент"), "Тошкент")  # kirill matn o'zgarmaydi
        self.assertEqual(sector_label(Sector(code="C", name_uz="ISHLАB CHIQАRАDIGАN SАNOАT ")), "C · Ishlab chiqaradigan sanoat")
