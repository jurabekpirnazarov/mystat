"""S-12: hisobot yo'riqnomalari (108 shakl) va namunaviy PDF; K-05 uchun demo korxonalarni KTUT'ga bog'lash."""
from pathlib import Path

from django.conf import settings
from django.db.models import Count

from apps.additional_services.models import Ktut, KtutReportList, ReportGuide, ReportList
from apps.common.pdf import render_pdf
from apps.common.synthetic import registered_ids
from apps.organizations.models import Organization

from . import DEMO_PREFIX, Seeder
from .demo_users import demo_users

DETAILED = 20
SAMPLE_DIR = "demo/report_samples"
LEGAL_BASIS = "\"Rasmiy statistika to'g'risida\"gi O'zbekiston Respublikasi Qonuni; Statistika agentligining hisobot shakllarini tasdiqlash to'g'risidagi buyrug'i (namuna matn)"
PERIOD = {"monthly": "har oy", "quarterly": "har chorakda", "yearly": "har yili"}

# Shakl nomidagi kalit so'z -> tarmoqqa xos maslahat
TOPIC_TIPS = [
    ("fermer", "Ekin maydonlari gektarda, hosil sentnerda ko'rsatiladi; chorva bosh soni hisobot davri oxiriga olinadi."),
    ("qurilish", "Ishga tushirilgan ob'ektlar dalolatnomasi sanasi bo'yicha, quvvatlar o'lchov birligi shakl ko'rsatmasidagidek."),
    ("suv", "Yetkazilgan suv hajmi ming m³ da, hisoblagich ko'rsatkichlari asosida; yo'qotishlar alohida qatorda."),
    ("transport", "Yuk va yo'lovchi aylanmasi tonna-km va yo'lovchi-km da; o'z ehtiyoji uchun tashish alohida."),
    ("havo", "Parvozlar soni va tashilgan yo'lovchilar reys hujjatlari asosida, tranzit yo'lovchilar alohida."),
    ("savdo", "Tovar aylanmasi QQS bilan, amaldagi narxlarda; komissiya savdosi alohida qatorda."),
    ("sanoat", "Mahsulot hajmi natura va qiymat ko'rinishida; o'z ehtiyoji uchun ishlatilgan mahsulot kiritiladi."),
    ("mehnat", "Xodimlar soni o'rtacha ro'yxatdagi son bo'yicha; o'rindoshlar alohida ko'rsatiladi."),
]
GENERIC_TIP = "Ko'rsatkichlar buxgalteriya hisobi ma'lumotlari asosida, shakl ko'rsatmasidagi o'lchov birliklarida to'ldiriladi."


def _tip(report):
    text = f"{report.type_uz} {report.formsname_uz}".lower()
    return next((tip for key, tip in TOPIC_TIPS if key in text), GENERIC_TIP)


def _texts(report, companies, detailed):
    period = PERIOD.get(report.report_type, "belgilangan muddatda")
    srok = (report.srok_uz or "").replace("_x000D_", " ").strip()
    summary = (f"{report.type_uz} — {report.formsname_uz.strip()}. Bu shaklni KTUT bo'yicha unga biriktirilgan "
               f"korxonalar topshiradi (bazada {companies} ta korxona). Hisobot {period} topshiriladi; muddat: {srok}.")
    steps = [
        "1. Shaklning amaldagi tahririni va to'ldirish ko'rsatmasini yuklab oling.",
        "2. Titul varag'ida STIR, KTUT kodi, OKED va manzilni korxona ma'lumotnomasi bilan solishtiring.",
        f"3. Hisobot davri ma'lumotlarini to'ldiring. {_tip(report)}",
        "4. Bo'limlar o'rtasidagi nazorat bog'lanishlarini (jami = qatorlar yig'indisi) tekshiring.",
        "5. Rahbar va bosh buxgalter imzosi bilan elektron shaklda yuboring, qabul qilinganlik tasdig'ini saqlang.",
    ]
    if detailed:
        steps.insert(3, "3a. O'tgan davr hisoboti bilan taqqoslang: 30% dan katta o'zgarish bo'lsa izohda sababini yozing.")
    errors = [
        "- Hisobot davri noto'g'ri tanlangan (oylik o'rniga yig'ma ko'rsatkich).",
        "- O'lchov birligi chalkashligi (so'm o'rniga ming so'm).",
        "- Nazorat bog'lanishlari bajarilmagan, jami qatori qo'lda yozilgan.",
        "- Muddatdan kechikish — ma'muriy javobgarlikka sabab bo'lishi mumkin.",
    ]
    return summary, "\n".join(steps), "\n".join(errors)


def _sample_pdf(report, summary, steps):
    blocks = [
        ("h1", f"{report.type_uz}: namunaviy to'ldirilgan shakl"),
        ("p", report.formsname_uz.strip()),
        ("p", f"Korxona: {DEMO_PREFIX} Namuna MChJ, STIR 000000000, KTUT 00000000, hisobot davri: 2025-yil."),
        ("h2", "Qisqacha"), ("p", summary),
        ("h2", "To'ldirish qadamlari"), *[("p", line) for line in steps.splitlines()],
        ("h2", "1-bo'lim. Asosiy ko'rsatkichlar (namuna raqamlar)"),
        ("p", "Qator 101 - Jami: 1 250,0"), ("p", "Qator 102 - shu jumladan, asosiy faoliyat: 1 080,5"),
        ("p", "Qator 103 - boshqa faoliyat: 169,5"),
        ("p", "Bu hujjat namuna. Raqamlar o'ylab topilgan va haqiqiy hisobot emas."),
    ]
    rel = f"{SAMPLE_DIR}/{report.id}.pdf"
    path = Path(settings.MEDIA_ROOT) / rel
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_bytes(render_pdf(blocks))
    return rel


class ReportGuidesSeeder(Seeder):
    name = "report_guides"
    depends_on = ("demo_users",)

    def seed(self):
        reports = list(ReportList.objects.annotate(companies=Count("ktuts")).order_by("-companies", "id"))
        for rank, report in enumerate(reports):
            detailed = rank < DETAILED
            summary, steps, errors = _texts(report, report.companies, detailed)
            if ReportGuide.objects.filter(report=report).exclude(pk__in=registered_ids(ReportGuide)).exists():
                continue  # admin kiritgan real yo'riqnoma bor — tegilmaydi
            guide = self.make(ReportGuide, f"guide:{report.id}", report=report, summary_uz=summary, steps_uz=steps,
                              common_errors_uz=errors, legal_basis=LEGAL_BASIS)
            if detailed and not guide.sample_file:
                guide.sample_file.name = _sample_pdf(report, summary, steps)
                guide.save(update_fields=["sample_file"])
        self._link_demo_companies(reports)

    def _link_demo_companies(self, reports):
        """Demo korxonalarni KTUT'ga qo'shib, oylik/choraklik/yillik shakllarga bog'laydi (K-05)."""
        picks = []
        for kind in ("monthly", "quarterly", "yearly"):
            picks += [r for r in reports if r.report_type == kind and r.deadline][:2]
        orgs = Organization.objects.filter(user__in=demo_users().values()).order_by("tin")
        for org in orgs:
            existing = Ktut.objects.filter(inn=org.tin).first()
            if existing and str(existing.pk) not in registered_ids(Ktut):
                continue  # real KTUT yozuvi — o'zgartirilmaydi
            ktut = existing or self.make(Ktut, f"ktut:{org.tin}", inn=org.tin, okpo=f"9{org.tin[-7:]}", name=org.name)
            for report in picks:
                if not KtutReportList.objects.filter(ktut=ktut, reportlist=report).exists():
                    self.make(KtutReportList, f"ktut-report:{org.tin}:{report.id}", ktut=ktut, reportlist=report)
