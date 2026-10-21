"""MYGOV_DIZAYN.md MG-10: xizmat pasportlari uchun namuna foydalanish soni va baholar (faqat DEBUG=True).

Qatorlar `is_synthetic=True` bilan partiya qilib yoziladi (S-01 reyestrida bitta `portal:batch` yozuvi), `--flush`
shu ustun bo'yicha o'chiradi. Production'da (DEBUG=False) API sintetik qatorlarni hisobga olmaydi.
"""
from datetime import timedelta

from django.contrib.contenttypes.models import ContentType
from django.db import transaction
from django.utils import timezone

from apps.common.models import SyntheticRecord
from apps.portal.models import ServiceReview, ServiceUsage

from . import Seeder

BATCH_KEY = "portal:batch"

# frontend/src/config/serviceCatalog.ts dagi "live" xizmatlar raqamlari; ommaboplari ko'proq foydalanadi
NUMBERS = [101, 102, 103, 104, 105, 106, 107, 108, 201, 202, 203, 204, 301, 302, 303, 401, 402, 403, 404, 501, 502,
           601, 602, 603, 701, 702, 801, 802, 901, 1001, 1002, 1003, 1101, 1102, 1103, 1104, 1201, 1202, 1203, 1204,
           1301, 1302, 1303, 1304, 1401, 1402, 1403, 1404]
POPULAR = {101, 102, 201, 301, 302, 401, 501, 601, 701, 801, 1001, 1201}

NAMES = ["ABDULLA I.", "XILOLAXON A.", "SARDOR Q.", "MALIKA T.", "JASUR A.", "DILNOZA R.", "BOBUR Y.", "NODIRA S.",
         "OTABEK M.", "GULNOZA K.", "SHERZOD B.", "ZARINA U.", "AZIZ K.", "FERUZA N.", "ULUG'BEK H.", "MADINA O."]
COMMENTS = {
    5: ["Juda qulay, ma'lumot tez chiqdi", "Hamma narsa tushunarli, rahmat", "Kerakli raqamlarni bir daqiqada topdim",
        "Hisobot tayyorlashda katta yordam bo'ldi"],
    4: ["Yaxshi, lekin filtrlar ko'proq bo'lsa yaxshi bo'lardi", "Foydali xizmat, eksport qulay"],
    3: ["Ishlaydi, lekin interfeysni soddalashtirish kerak"],
    2: ["Ma'lumot kech yangilanadi"],
    1: ["Kerakli ko'rsatkichni topa olmadim"],
}


class PortalSeeder(Seeder):
    name = "portal"

    def seed(self):
        if ServiceUsage.objects.filter(is_synthetic=True).exists():
            self.log("  portal: namuna allaqachon bor — o'tkazib yuborildi")
            self.stats[(ServiceUsage._meta.label, "existed")] += 1
            return
        now = timezone.now()
        usages, reviews = [], []
        for num in NUMBERS:
            n_use = self.rnd.randint(400, 1500) if num in POPULAR else self.rnd.randint(40, 400)
            for _ in range(n_use):
                usages.append(ServiceUsage(service_number=num, is_synthetic=True))
            n_rev = self.rnd.randint(60, 200) if num in POPULAR else self.rnd.randint(20, 80)
            for _ in range(n_rev):
                score = self.rnd.choices([5, 4, 3, 2, 1], weights=[70, 16, 6, 3, 5])[0]
                comment = self.rnd.choice(COMMENTS[score]) if self.rnd.random() < 0.25 else ""
                reviews.append(ServiceReview(service_number=num, score=score, comment=comment, is_published=True,
                                             author_name=self.rnd.choice(NAMES), is_synthetic=True))
        with transaction.atomic():
            ServiceUsage.objects.bulk_create(usages, batch_size=5000)
            ServiceReview.objects.bulk_create(reviews, batch_size=5000)
            # auto_now_add sanalarini oxirgi 18 oyga yoyish
            for model in (ServiceUsage, ServiceReview):
                ids = list(model.objects.filter(is_synthetic=True).values_list("id", flat=True))
                buckets = {}
                for pk in ids:
                    buckets.setdefault(self.rnd.randint(0, 540), []).append(pk)
                for days, pks in buckets.items():
                    model.objects.filter(pk__in=pks).update(created_at=now - timedelta(days=days, hours=self.rnd.randint(0, 23)))
            ct = ContentType.objects.get_for_model(ServiceUsage)
            SyntheticRecord.objects.get_or_create(seed_key=BATCH_KEY, defaults={"content_type": ct, "object_id": "batch"})
        self.stats[(ServiceUsage._meta.label, "created")] += len(usages)
        self.stats[(ServiceReview._meta.label, "created")] += len(reviews)

    @classmethod
    def flush_batch(cls, dry_run=False):
        usage = ServiceUsage.objects.filter(is_synthetic=True)
        reviews = ServiceReview.objects.filter(is_synthetic=True)
        counts = {ServiceUsage._meta.label: usage.count(), ServiceReview._meta.label: reviews.count()}
        if dry_run:
            return counts
        with transaction.atomic():
            usage.delete()
            reviews.delete()
            SyntheticRecord.objects.filter(seed_key=BATCH_KEY).delete()
        return counts
