from django.core.management.base import BaseCommand
import json
from pathlib import Path
from apps.book_market.models import PostalLocation
from django.conf import settings

class Command(BaseCommand):
    help = 'Load location data from JSON into the PostalLocation model'

    def handle(self, *args, **kwargs):
        json_path = Path(settings.BASE_DIR) / "datas/locations.json"
        with open(json_path, 'r', encoding='utf-8') as f:
            data = json.load(f)

        for location in data:
            PostalLocation.objects.create(
                lat=location['lat'],
                lng=location['lng'],
                name=location['name'],
                index=location['index'],
                is_active=location.get('is_active', True)
            )