"""S-15: fuqarolar uchun kontent va namuna ma'lumot to'plamlari."""
import math
from datetime import date, timedelta
from decimal import Decimal

from django.utils import timezone

from apps.citizens.content import ARTICLES, GLOSSARY, SURVEYS
from apps.citizens.models import (Article, CitizenQuestion, ConsumerPrice, FavoriteIndicator, GlossaryTerm, NameStat,
                                  SalaryDistribution, Survey, SurveyAnswer, SurveyQuestion, SurveyResponse)
from apps.common.models import Region, Sector
from apps.common.text import uz_latin_to_cyrillic

from . import Seeder, days_ago
from .demo_users import demo_users

SALARY_YEARS = range(2020, 2026)
# 2025-yil respublika medianasi, ming so'm (namuna darajalar)
SECTOR_MEDIAN = {"A": 2600, "B": 9000, "C": 4500, "D": 7000, "E": 3800, "F": 4700, "G": 3900, "H": 5200, "I": 3200,
                 "J": 8500, "K": 11000, "L": 4200, "M": 6800, "N": 3600, "P": 3100, "Q": 3300, "R": 2900, "S": 3000}
SALARY_REGION = {"1726": 1.5, "1727": 1.1, "1712": 1.08}

# (kalit, nom, birlik, 2026-sentabr respublika narxi so'm, oylik tebranish)
PRODUCTS = [
    ("bread", "Non", "dona", 3500, 0.01), ("beef", "Mol go'shti", "kg", 110000, 0.015),
    ("mutton", "Qo'y go'shti", "kg", 120000, 0.015), ("chicken", "Tovuq go'shti", "kg", 38000, 0.02),
    ("rice", "Guruch", "kg", 16000, 0.02), ("flour", "Un", "kg", 7500, 0.015), ("sugar", "Shakar", "kg", 13000, 0.02),
    ("oil", "O'simlik yog'i", "litr", 22000, 0.015), ("eggs", "Tuxum", "10 dona", 16000, 0.04),
    ("milk", "Sut", "litr", 11000, 0.01), ("kefir", "Qatiq", "litr", 12000, 0.01), ("butter", "Sariyog'", "kg", 90000, 0.015),
    ("cheese", "Pishloq", "kg", 75000, 0.01), ("potato", "Kartoshka", "kg", 6000, 0.08), ("onion", "Piyoz", "kg", 4000, 0.1),
    ("carrot", "Sabzi", "kg", 4000, 0.1), ("tomato", "Pomidor", "kg", 12000, 0.15), ("cucumber", "Bodring", "kg", 10000, 0.15),
    ("apple", "Olma", "kg", 14000, 0.06), ("tea", "Ko'k choy", "100 g", 9000, 0.005), ("pasta", "Makaron", "kg", 11000, 0.01),
    ("salt", "Tuz", "kg", 3000, 0.005), ("petrol", "Benzin AI-92", "litr", 10500, 0.008),
    ("methane", "Metan", "m³", 4600, 0.005), ("soap", "Sovun", "dona", 6000, 0.008),
]
SEASONAL = {"potato", "onion", "carrot", "tomato", "cucumber", "apple"}
PRICE_MONTHS = 36

BOYS = ("Muhammad Muhammadali Abdulloh Ali Umar Yusuf Ibrohim Muhammadamin Muhammadyusuf Abubakr Usmon Imron Asadbek "
        "Sardor Jasur Javohir Bekzod Shohruh Doniyor Islom Ismoil Ahmad Hasan Husan Azizbek Akbar Akmal Amir Bobur "
        "Behruz Diyorbek Elbek Eldor Farrux Firdavs Hamza Iskandar Jahongir Jamshid Kamron Komil Laziz Mirzo Mustafo "
        "Nodir Nurbek Odil Otabek Ozod Rustam Sanjar Sarvar Shahzod Sherzod Temur Ulug'bek Umid Xurshid Yahyo Zafar "
        "Zohid Abdulaziz Abdurahmon Alisher Anvar Aziz Bahodir Davron Dilshod Humoyun Ilhom Jaloliddin Kamol Lochin "
        "Mehroj Muslim Nurmuhammad Oybek Ravshan Samandar Shamsiddin Sulton Tohir Xondamir Yorqin Zubayr Asilbek "
        "Muhammadqodir Abdulbosit Amirxon Mironshoh Bilol Solih Zayd Ayub").split()
GIRLS = ("Oisha Mohinur Robiya Muslima Sumayya Fotima Hadicha Zahro Mubina Sevinch Shahzoda Madina Malika Marjona "
         "Nilufar Dilnoza Gulnoza Zarina Kamola Laylo Mohira Nigora Nodira Oydin Ruxshona Sabina Sarvinoz Shahnoza "
         "Sitora Soliha Yasmina Zilola Aziza Barno Dildora Feruza Gulruh Hilola Iroda Jasmina Komila Lola Maftuna "
         "Mavluda Mehribon Munisa Nasiba Nozima Parizoda Rayhona Sabrina Saida Shirin Shoira Surayyo Umida Yulduz Zebo "
         "Asal Asila Bonu Charos Diyora Durdona Farangiz Gulshan Hulkar Intizor Jamila Kumush Latofat Mahliyo Maryam "
         "Nafisa Nurjahon Oyshabonu Rahima Ruqiya Sadoqat Samira Sohiba Tamanno Xonzoda Zuhra Ominaxon Mohlaroyim "
         "Gulchehra Dilafruz Nargiza Sabohat Ziyoda Muxlisa Imona Safiya Asmo").split()
NAME_YEARS = range(2015, 2026)
REGION_WEIGHT = {"1718": 1.6, "1730": 1.5, "1710": 1.4, "1703": 1.3, "1714": 1.25, "1726": 1.2, "1727": 1.2,
                 "1722": 1.1, "1735": 0.8, "1733": 0.8, "1706": 0.8, "1708": 0.6, "1712": 0.45, "1724": 0.4}

CITIZEN_QA = [
    ("population", "Tumanimizda nechta maktab bor va o'quvchilar soni qanday o'zgargan?",
     "Umumta'lim maktablari soni va o'quvchilar soni ta'lim statistikasi to'plamida tumanlar kesimida e'lon qilinadi. Namuna javob: so'nggi 5 yilda o'quvchilar soni barqaror oshgan."),
    ("prices", "Nega rasmiy inflyatsiya mening xarajatlarim o'sishidan past?",
     "Rasmiy indeks o'rtacha oila savati bo'yicha hisoblanadi. Agar xarajatlaringizda tez qimmatlashayotgan mahsulotlar ulushi katta bo'lsa, shaxsiy inflyatsiyangiz yuqori bo'ladi. \"Narxlar\" sahifasidagi savat kalkulyatorini sinab ko'ring."),
    ("economy", "Viloyatimizda qaysi tarmoq eng ko'p ish o'rni yaratadi?",
     "Bandlik tarmoqlar kesimida mehnat statistikasida beriladi. Hududiy profil sahifasida asosiy ko'rsatkichlarni ko'rishingiz mumkin (namuna javob)."),
    ("social", "Shahrimizda o'rtacha umr ko'rish davomiyligi qancha?",
     "Kutilayotgan umr davomiyligi viloyatlar kesimida demografik to'plamda e'lon qilinadi. Tumanlar bo'yicha hisoblash aholi soni kichikligi sababli o'tkazilmaydi (namuna javob)."),
    ("other", "Statistik ma'lumotni Excel formatida qayerdan olsa bo'ladi?",
     "Ochiq jadvallar yonida \"Yuklab olish (CSV/XLSX)\" tugmasi bor. Dasturchilar uchun ochiq API mavjud — \"Dasturchilar\" sahifasiga qarang."),
]


def _first_of_month(d):
    return d.replace(day=1)


def _shift_month(d, months):
    m = d.month - 1 + months
    return d.replace(year=d.year + m // 12, month=m % 12 + 1, day=1)




class CitizensSeeder(Seeder):
    name = "citizens"
    depends_on = ("demo_users",)

    def seed(self):
        regions = list(Region.objects.order_by("code"))
        self._salaries(regions)
        self._prices(regions)
        self._names(regions)
        self._content()
        self._surveys(regions)
        self._questions(regions)
        self._favorites(regions)

    def _salaries(self, regions):
        sectors = {s.code: s for s in Sector.objects.filter(parent__isnull=True, code__in=SECTOR_MEDIAN)}
        items = []
        for region in regions:
            rf = SALARY_REGION.get(region.code, self.rnd.uniform(0.78, 1.05))
            for code, median_2025 in SECTOR_MEDIAN.items():
                if code not in sectors:
                    continue
                sf = self.rnd.uniform(0.9, 1.1)
                for year in SALARY_YEARS:
                    median = median_2025 * rf * sf / (1.16 ** (2025 - year)) * self.rnd.uniform(0.97, 1.03)
                    row = {k: Decimal(f"{median * m:.1f}") for k, m in
                           (("median", 1), ("mean", 1.27), ("p25", 0.68), ("p75", 1.45), ("p90", 2.15))}
                    items.append((f"salary:{region.code}:{code}:{year}",
                                  dict(region=region, sector=sectors[code], year=year, **row)))
        self.bulk(SalaryDistribution, items)

    def _prices(self, regions):
        last = _first_of_month(date.today().replace(day=1) - timedelta(days=1))
        months = [_shift_month(last, -i) for i in reversed(range(PRICE_MONTHS))]
        items = []
        for key, label, unit, price_now, vol in PRODUCTS:
            # orqaga: oyiga ~0.8% inflyatsiya + mahsulotga xos tebranish (+ sabzavotda mavsumiylik)
            series, p = [], float(price_now)
            for m in reversed(months):
                season = 1 + (0.25 * math.cos((m.month - 2) / 12 * 2 * math.pi) if key in SEASONAL else 0)
                series.append((m, p * season))
                p /= 1 + 0.008 + self.rnd.gauss(0, vol / 3)
            series.reverse()
            for region in regions:
                rf = 1.12 if region.code == "1726" else self.rnd.uniform(0.9, 1.06)
                missing = self.rnd.random() < 0.03  # ba'zi hududda kuzatuv yo'q — "Ma'lumot yo'q" holati
                if missing:
                    continue
                for m, base in series:
                    price = round(base * rf * self.rnd.uniform(0.98, 1.02) / 50) * 50
                    items.append((f"price:{key}:{region.code}:{m:%Y-%m}", dict(
                        product=key, product_name=label, unit=unit, region=region, month=m, price=Decimal(price))))
        self.bulk(ConsumerPrice, items)

    def _names(self, regions):
        items = []
        for gender, names in (("M", BOYS), ("F", GIRLS)):
            for rank, name in enumerate(names):
                base = 2600 / (rank + 1) ** 0.85
                trend = self.rnd.uniform(-0.06, 0.08)
                for year in NAME_YEARS:
                    yf = (1 + trend) ** (year - 2020)
                    for region in regions:
                        count = int(base * yf * REGION_WEIGHT.get(region.code, 1) / 14 * self.rnd.uniform(0.75, 1.25))
                        if count < 1:
                            continue
                        items.append((f"name:{gender}:{name}:{year}:{region.code}", dict(
                            name=name, name_cyr=uz_latin_to_cyrillic(name), gender=gender, year=year,
                            region=region, count=count)))
        self.bulk(NameStat, items)

    def _content(self):
        articles = {}
        start = date.today() - timedelta(days=len(ARTICLES) * 9)
        for i, a in enumerate(ARTICLES):
            existing = Article.objects.filter(slug=a["slug"]).first()
            articles[a["slug"]] = existing or self.make(
                Article, f"article:{a['slug']}", slug=a["slug"], topic=a["topic"], reading_minutes=a["minutes"],
                title_uz=a["title_uz"], title_ru=a["title_ru"], title_cry=uz_latin_to_cyrillic(a["title_uz"]),
                summary_uz=a["summary_uz"], summary_ru=a["summary_ru"], summary_cry=uz_latin_to_cyrillic(a["summary_uz"]),
                body_uz=a["body_uz"], body_ru="", body_cry=uz_latin_to_cyrillic(a["body_uz"]),
                related=a["related"], published_at=start + timedelta(days=i * 9))
        for slug, term_uz, term_ru, def_uz, def_ru, example, article in GLOSSARY:
            if GlossaryTerm.objects.filter(slug=slug).exists() and not self._is_ours(GlossaryTerm, slug):
                continue
            self.make(GlossaryTerm, f"term:{slug}", slug=slug, term_uz=term_uz, term_ru=term_ru,
                      term_cry=uz_latin_to_cyrillic(term_uz), definition_uz=def_uz, definition_ru=def_ru,
                      definition_cry=uz_latin_to_cyrillic(def_uz), example_uz=example,
                      article=articles.get(article) if article else None)

    def _is_ours(self, model, slug):
        from apps.common.models import SyntheticRecord
        return SyntheticRecord.objects.filter(seed_key=f"{self.name}:term:{slug}").exists()

    def _surveys(self, regions):
        ages = [a for a, _ in SurveyResponse.AGE_GROUPS]
        for n, s in enumerate(SURVEYS):
            survey = Survey.objects.filter(slug=s["slug"]).first() or self.make(
                Survey, f"survey:{s['slug']}", slug=s["slug"], title_uz=s["title_uz"], title_ru=s["title_ru"],
                title_cry=uz_latin_to_cyrillic(s["title_uz"]), description_uz=s["description_uz"],
                is_active=n != 3, closes_at=date.today() + timedelta(days=30) if n != 3 else date.today() - timedelta(days=5))
            questions = []
            for order, (kind, text, options) in enumerate(s["questions"]):
                questions.append(self.make(
                    SurveyQuestion, f"question:{s['slug']}:{order}", survey=survey, order=order, kind=kind,
                    text_uz=text, text_cry=uz_latin_to_cyrillic(text),
                    options=[{"id": oid, "text_uz": t, "text_cry": uz_latin_to_cyrillic(t)} for oid, t in options]))
            total = 300 + (n * 170) % 500
            if SurveyResponse.objects.filter(survey=survey, is_sample=True).count() >= total:
                continue
            responses = []
            for i in range(total):
                responses.append((f"response:{s['slug']}:{i}", dict(
                    survey=survey, region=self.rnd.choice(regions), age_group=self.rnd.choice(ages), is_sample=True)))
            self.bulk(SurveyResponse, responses)
            created = SurveyResponse.objects.filter(survey=survey, is_sample=True).order_by("id")
            answers = []
            for i, resp in enumerate(created):
                for q in questions:
                    if q.kind == "scale":
                        value = min(q.scale_max, max(1, round(self.rnd.gauss(3.4, 1.0))))
                    elif q.kind == "multi":
                        value = sorted({self.rnd.choice(q.options)["id"] for _ in range(self.rnd.randint(1, 3))})
                    else:
                        weights = [len(q.options) - k for k in range(len(q.options))]
                        value = [self.rnd.choices([o["id"] for o in q.options], weights=weights)[0]]
                    answers.append((f"answer:{resp.pk}:{q.pk}", dict(response=resp, question=q, value=value)))
            self.bulk(SurveyAnswer, answers)

    def _questions(self, regions):
        users = demo_users()
        citizens = [users[n] for n in sorted(users) if n.startswith("demo_jismoniy")]
        employee = users.get("demo_employee")
        if not citizens:
            return
        for i in range(20):
            category, text, answer = CITIZEN_QA[i % len(CITIZEN_QA)]
            answered = i % 4 != 3
            q = self.make(CitizenQuestion, f"citizen-question:{i}", user=citizens[i % len(citizens)], category=category,
                          region=regions[i % len(regions)], question=text, allow_publish=i % 3 != 0,
                          answer=answer if answered else "", answered_by=employee if answered else None,
                          status="answered" if answered else "new",
                          answered_at=timezone.now() - timedelta(days=i) if answered else None)
            self.backdate(q, "created_at", days_ago(i * 2 + 1))

    def _favorites(self, regions):
        users = demo_users()
        samples = [("cpi", "Inflyatsiya (ISN)", {}), ("prices", "Non narxi", {"product": "bread"}),
                   ("salary", "Ish haqi: ta'lim", {"sector": "P"}), ("names", "Ism: Muhammad", {"name": "Muhammad"})]
        for n in sorted(users):
            if not (n.startswith("demo_jismoniy") or n == "demo_tadqiqotchi"):
                continue
            user = users[n]
            region = user.location.region if user.location_id else regions[0]
            items = [("region", f"Hududim: {region.name}", {"region": region.id})] + samples
            for k, (kind, title, params) in enumerate(items):
                self.make(FavoriteIndicator, f"favorite:{n}:{k}", user=user, kind=kind, title=title, params=params)
