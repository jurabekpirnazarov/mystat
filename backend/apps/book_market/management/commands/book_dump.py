import json
from django.core.management.base import BaseCommand
from apps.book_market.models import Book

class Command(BaseCommand):
    help = 'Dump all Book data into JSON'

    def handle(self, *args, **kwargs):
        books_data = [
            {
                'id': book.id,
                'name': book.name,
                'price': str(book.price) if book.price else None,
                'year': book.year,
                'image_url': book.image_url.url if book.image_url else None,
                'description': book.description
            }
            for book in Book.objects.all()
        ]

        json_path = 'books_dump.json'
        with open(json_path, 'w', encoding='utf-8') as f:
            json.dump(books_data, f, ensure_ascii=False, indent=4)

        self.stdout.write(self.style.SUCCESS(f'Book data successfully dumped to {json_path}'))
