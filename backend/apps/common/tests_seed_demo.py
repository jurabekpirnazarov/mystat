import shutil
import tempfile
from io import StringIO

from django.apps import apps
from django.core.management import CommandError, call_command
from django.test import TestCase, override_settings

from apps.accounts.models import User
from apps.common.models import District, Region, SyntheticRecord
from apps.contracts.models import Contract
from apps.organizations.models import Organization
from apps.services.models import PackageService, PackageServiceItem, Service, ServicePackage, ServiceRequests


def table_counts():
    # SiteSettings — singleton, birinchi `package.price` da avtomatik yaratiladi (real bazada doim bor)
    return {m._meta.label: m._base_manager.count() for m in apps.get_models() if m._meta.label != "common.SiteSettings"}


TEMP_MEDIA = tempfile.mkdtemp(prefix="mystat-seed-")


@override_settings(DEBUG=True, MEDIA_ROOT=TEMP_MEDIA)
class SeedDemoTests(TestCase):
    @classmethod
    def tearDownClass(cls):
        super().tearDownClass()
        shutil.rmtree(TEMP_MEDIA, ignore_errors=True)

    @classmethod
    def setUpTestData(cls):
        # "Real" ma'lumotnomalar (seed_demo ularni faqat o'qiydi)
        region = Region.objects.create(name="Toshkent", code="1726")
        for i in range(3):
            District.objects.create(name=f"Tuman {i}", region=region, code=f"17{i}")
        owner = User.objects.create_user(username="real_owner", password="x")
        org = Organization.objects.create(user=owner, name="Statistika", tin="200000001")
        for i in range(3):
            Service.objects.create(name_uz=f"Xizmat {i}", name_ru="S", name_cry="S", contact="998000000000", organization=org)
        package = ServicePackage.objects.create(name_uz="Tarif", name_ru="T", name_cry="T")
        ps = PackageService.objects.create(name_uz="E-kitob", name_ru="E", name_cry="E")
        PackageServiceItem.objects.create(package=package, package_service=ps, name_uz="a", name_ru="a", name_cry="a", limit=10)

    def seed(self, *args):
        out = StringIO()
        call_command("seed_demo", *args, stdout=out)
        return out.getvalue()

    def test_creates_data_and_is_idempotent(self):
        self.seed()
        first = SyntheticRecord.objects.count()
        self.assertGreater(first, 50)
        self.assertTrue(User.objects.filter(username="demo_yuridik_1").exists())
        self.assertTrue(Contract.objects.filter(contract_number__startswith="DEMO-").exists())

        output = self.seed()
        self.assertEqual(SyntheticRecord.objects.count(), first)
        self.assertNotRegex(output, r"\s[1-9]\d*\s+\d+\n")  # "yaratildi" ustunida 0 dan boshqa son yo'q

    def test_flush_restores_original_counts(self):
        before = table_counts()
        self.seed()
        self.seed("--flush")
        after = table_counts()
        changed = {k: (before[k], after[k]) for k in before if before[k] != after[k]}
        self.assertEqual(changed, {})

    def test_flush_only_removes_selected_seeder(self):
        self.seed()
        self.seed("--flush", "--only", "notifications")
        self.assertFalse(SyntheticRecord.objects.filter(seed_key__startswith="notifications:").exists())
        self.assertTrue(SyntheticRecord.objects.filter(seed_key__startswith="demo_users:").exists())

    def test_dry_run_writes_nothing(self):
        before = table_counts()
        self.seed("--dry-run")
        self.assertEqual(table_counts(), before)

    def test_flush_refuses_to_cascade_into_real_rows(self):
        self.seed()
        contract = Contract.objects.filter(contract_number__startswith="DEMO-").first()
        real = ServiceRequests.objects.create(
            contract=contract, service=Service.objects.first(), assigned_to_user=User.objects.get(username="real_owner"),
        )
        with self.assertRaises(CommandError):
            self.seed("--flush")
        self.assertTrue(ServiceRequests.objects.filter(pk=real.pk).exists())
        self.assertTrue(Contract.objects.filter(pk=contract.pk).exists())

    @override_settings(DEBUG=False)
    def test_refuses_without_debug(self):
        before = table_counts()
        with self.assertRaises(CommandError):
            self.seed()
        self.assertEqual(table_counts(), before)
