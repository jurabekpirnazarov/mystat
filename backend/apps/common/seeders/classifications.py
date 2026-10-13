"""S-03: statistik klassifikatorlar (kategoriya + klassifikator hujjatlari).

Model kodlar daraxti emas, balki klassifikator hujjatlari ro'yxati (nom, xalqaro analog,
tasdiqlovchi hujjat). Kod daraxti tashqi reyestrdan `services/classify-item/` orqali olinadi.
"""
from datetime import date

from apps.additional_services.models.staticclassification_model import (
    StatisticClassification,
    StatisticClassificationCategory,
)

from . import DEMO_PREFIX, Seeder

# (kategoriya, [(nom_uz, nom_ru, nom_cry, analog, slug), ...])
DATA = [
    ("Iqtisodiy faoliyat turlari", [
        ("Iqtisodiy faoliyat turlari klassifikatori (IFUT)", "Классификатор видов экономической деятельности (ОКЭД)",
         "Иқтисодий фаолият турлари классификатори (ИФУТ)", "NACE Rev.2 / ISIC Rev.4", "ifut"),
        ("Iqtisodiyot tarmoqlari klassifikatori", "Классификатор отраслей экономики",
         "Иқтисодиёт тармоқлари классификатори", "ISIC Rev.4", "itk"),
        ("Institutsional sektorlar klassifikatori", "Классификатор институциональных секторов",
         "Институционал секторлар классификатори", "SNA 2008", "isk"),
    ]),
    ("Mahsulotlar va xizmatlar", [
        ("Faoliyat turlari bo'yicha mahsulotlar klassifikatori (MFTK)", "Классификатор продукции по видам деятельности (КПВЭД)",
         "Фаолият турлари бўйича маҳсулотлар классификатори (МФТК)", "CPA 2.1", "mftk"),
        ("Tashqi iqtisodiy faoliyat tovar nomenklaturasi", "Товарная номенклатура внешнеэкономической деятельности",
         "Ташқи иқтисодий фаолият товар номенклатураси", "HS 2022", "tif-tn"),
        ("Xalqaro savdo standart klassifikatori", "Стандартная международная торговая классификация",
         "Халқаро савдо стандарт классификатори", "SITC Rev.4", "sitc"),
        ("Sanoat mahsulotlari klassifikatori (SKP)", "Статистический классификатор продукции (СКП)",
         "Саноат маҳсулотлари классификатори (СКП)", "PRODCOM", "skp"),
    ]),
    ("Hududlar", [
        ("Ma'muriy-hududiy birliklar belgilash tizimi (MHOBT)", "Система обозначений административно-территориальных образований (СОАТО)",
         "Маъмурий-ҳудудий бирликлар белгилаш тизими (МҲОБТ)", "NUTS", "soato"),
        ("Dunyo mamlakatlari klassifikatori", "Классификатор стран мира",
         "Дунё мамлакатлари классификатори", "ISO 3166-1", "countries"),
    ]),
    ("Mulkchilik shakllari", [
        ("Mulkchilik shakllari klassifikatori (MShK)", "Классификатор форм собственности (КФС)",
         "Мулкчилик шакллари классификатори (МШК)", "SNA 2008", "mshk"),
        ("Davlat boshqaruvi organlari klassifikatori (DBOK)", "Классификатор органов государственного управления (СООГУ)",
         "Давлат бошқаруви органлари классификатори (ДБОК)", "COFOG", "dbok"),
    ]),
    ("Tashkiliy-huquqiy shakllar", [
        ("Tashkiliy-huquqiy shakllar klassifikatori (THShK)", "Классификатор организационно-правовых форм (КОПФ)",
         "Ташкилий-ҳуқуқий шакллар классификатори (ТҲШК)", "ELF (ISO 20275)", "thshk"),
        ("Korxona va tashkilotlarning umumdavlat klassifikatori (KTUT)", "Общегосударственный классификатор предприятий и организаций (ОКПО)",
         "Корхона ва ташкилотларнинг умумдавлат классификатори (КТУТ)", "—", "ktut"),
    ]),
    ("Kasblar va ta'lim", [
        ("Kasblar klassifikatori", "Классификатор занятий",
         "Касблар классификатори", "ISCO-08", "isco"),
        ("Ta'lim darajalari klassifikatori", "Классификатор уровней образования",
         "Таълим даражалари классификатори", "ISCED 2011", "isced"),
        ("Valyutalar klassifikatori", "Классификатор валют",
         "Валюталар классификатори", "ISO 4217", "currency"),
    ]),
]


class ClassificationsSeeder(Seeder):
    name = "classifications"

    def seed(self):
        n = 0
        for c_index, (category_name, items) in enumerate(DATA):
            category = self.make(StatisticClassificationCategory, f"category:{c_index}",
                                 name=f"{DEMO_PREFIX} {category_name}")
            for name_uz, name_ru, name_cry, analog, slug in items:
                n += 1
                self.make(
                    StatisticClassification, f"item:{slug}",
                    category=category,
                    name_uz=name_uz, name_ru=name_ru, name_cry=name_cry,
                    analog_uz=analog, analog_ru=analog, analog_cry=analog,
                    confirm_document=f"{DEMO_PREFIX} Statistika qo'mitasi qarori №{100 + n}",
                    date=date(2019 + n % 6, 1 + n % 12, 1 + (n * 3) % 27),
                    slug=slug,
                )
