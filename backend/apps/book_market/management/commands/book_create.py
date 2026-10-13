# myapp/management/commands/book_create.py

from django.core.management.base import BaseCommand
import json
from pathlib import Path
from decimal import Decimal, InvalidOperation
from django.conf import settings
from apps.book_market.models import Book  # model nomini o'zgartiring

def to_decimal(value):
    """
    String yoki number qiymatni Decimal ga aylantiradi.
    Bo'sh string yoki 'NULL' bo'lsa None qaytaradi.
    """
    try:
        if value is None or str(value).strip().upper() == "NULL" or str(value).strip() == "":
            return None
        return Decimal(value)
    except InvalidOperation:
        return None

class Command(BaseCommand):
    help = 'Load books data from JSON and create Book objects per year'

    def handle(self, *args, **kwargs):
        json_path = Path(settings.MEDIA_ROOT) / "books/prices.json"

        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for item in data:
            name = item.get('name_uz')
            description = item.get('description_uz') or item.get('description')
            image_url = item.get('picture_url')

            # Asosiy price va disk_price uchun Book yaratish
            Book.objects.create(
                name=name,
                price=to_decimal(item.get('price')),
                year=None,  # Standart yil yo'q
                image_url=image_url,
                description=description
            )

            Book.objects.create(
                    name=f"{name} (Disk Price)",
                    price=to_decimal(item.get('disk_price')),
                    year=None,
                    image_url=image_url,
                    description=description
                )

            # Har bir e_price_YEAR uchun alohida Book yaratish
            for key, value in item.items():
                if key.startswith('e_price_') and value:
                    year_str = key.split('_')[-1]
                    try:
                        year = int(year_str)
                        Book.objects.create(
                            name=name,
                            price=to_decimal(value),
                            year=year,
                            image_url=image_url,
                            description=description
                        )
                    except ValueError:
                        continue

        self.stdout.write(self.style.SUCCESS('All books imported successfully!'))
