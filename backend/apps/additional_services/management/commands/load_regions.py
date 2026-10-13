from django.core.management.base import BaseCommand
import json
from pathlib import Path
from ...models import Region

class Command(BaseCommand):
    help = 'Load regions data from JSON into the Region model'

    def handle(self, *args, **kwargs):
        # JSON ma'lumotlari NOM_SORT bo'yicha tartiblangan
        regions_data = [
            {
                "soato": "1700",
                "name_uz_lat": "O'zbekiston Respublikasi",
                "name_ru": "Республика Узбекистан",
                "name_en": "Republic of Uzbekistan",
                "name_uz_cyr": "Ўзбекистон Республикаси",
            },
            {
                "soato": "1735",
                "name_uz_lat": "Qoraqalpog'iston Respublikasi",
                "name_ru": "Республика Каракалпакстан",
                "name_en": "Republic of Karakalpakstan",
                "name_uz_cyr": "Қорақалпоғистон Республикаси",
                "nom_sort": "01"
            },
            {
                "soato": "1703",
                "name_uz_lat": "Andijon",
                "name_ru": "Андижанская",
                "name_en": "Andijan",
                "name_uz_cyr": "Андижон",
                "nom_sort": "02"
            },
            {
                "soato": "1706",
                "name_uz_lat": "Buxoro",
                "name_ru": "Бухарская",
                "name_en": "Bukhara",
                "name_uz_cyr": "Бухоро",
                "nom_sort": "03"
            },
            {
                "soato": "1708",
                "name_uz_lat": "Jizzax",
                "name_ru": "Джизакская",
                "name_en": "Jizzakh",
                "name_uz_cyr": "Жиззах",
                "nom_sort": "04"
            },
            {
                "soato": "1710",
                "name_uz_lat": "Qashqadaryo",
                "name_ru": "Кашкадарьинская",
                "name_en": "Kashkadarya",
                "name_uz_cyr": "Қашқадарё",
                "nom_sort": "05"
            },
            {
                "soato": "1712",
                "name_uz_lat": "Navoiy",
                "name_ru": "Навоийская",
                "name_en": "Navoi",
                "name_uz_cyr": "Навоий",
                "nom_sort": "06"
            },
            {
                "soato": "1714",
                "name_uz_lat": "Namangan",
                "name_ru": "Наманганская",
                "name_en": "Namangan",
                "name_uz_cyr": "Наманган",
                "nom_sort": "07"
            },
            {
                "soato": "1718",
                "name_uz_lat": "Samarqand",
                "name_ru": "Самаркандская",
                "name_en": "Samarkand",
                "name_uz_cyr": "Самарқанд",
                "nom_sort": "08"
            },
            {
                "soato": "1722",
                "name_uz_lat": "Surxondaryo",
                "name_ru": "Сурхандарьинская",
                "name_en": "Surkhandarya",
                "name_uz_cyr": "Сурхондарё",
                "nom_sort": "09"
            },
            {
                "soato": "1724",
                "name_uz_lat": "Sirdaryo",
                "name_ru": "Сырдарьинская",
                "name_en": "Syrdarya",
                "name_uz_cyr": "Сирдарё",
                "nom_sort": "10"
            },
            {
                "soato": "1727",
                "name_uz_lat": "Toshkent viloyati",
                "name_ru": "Ташкентская",
                "name_en": "Tashkent Region",
                "name_uz_cyr": "Тошкент в.",
                "nom_sort": "11"
            },
            {
                "soato": "1730",
                "name_uz_lat": "Farg'ona",
                "name_ru": "Ферганская",
                "name_en": "Fergana",
                "name_uz_cyr": "Фарғона",
                "nom_sort": "12"
            },
            {
                "soato": "1733",
                "name_uz_lat": "Xorazm",
                "name_ru": "Хорезмская",
                "name_en": "Khorezm",
                "name_uz_cyr": "Хоразм",
                "nom_sort": "13"
            },
            {
                "soato": "1726",
                "name_uz_lat": "Toshkent sh.",
                "name_ru": "г.Ташкент",
                "name_en": "Tashkent City",
                "name_uz_cyr": "Тошкент ш.",
                "nom_sort": "14"
            },
            {
                "soato": "1740",
                "name_uz_lat": "Respublika darajasidagi tashkilotlar",
                "name_ru": "МИНИСТЕРСТВА РЕСПУБ. ЗНАЧЕНИЯ",
                "name_en": "Ministries of Republic Significance",
                "name_uz_cyr": "Республика даражасидаги ташкилотлар",
                "nom_sort": "15"
            }
        ]

        # JSON faylini saqlash
        json_path = Path('regions.json')
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(regions_data, f, ensure_ascii=False, indent=4)

        # Ma'lumotlarni Region modeliga yuklash
        for region_data in regions_data:
            Region.objects.update_or_create(
                soato=region_data['soato'],
                defaults={
                    'name_uz_lat': region_data['name_uz_lat'],
                    'name_ru': region_data['name_ru'],
                    'name_en': region_data['name_en'],
                    'name_uz_cyr': region_data['name_uz_cyr']
                }
            )

        self.stdout.write(self.style.SUCCESS(f'Successfully loaded {len(regions_data)} regions into the database.'))