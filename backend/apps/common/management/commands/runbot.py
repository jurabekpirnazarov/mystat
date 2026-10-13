
import logging
import asyncio
from django.core.management.base import BaseCommand
from django.conf import settings
from apps.accounts.models import User
from apps.common.telegram_bot import TelegramBot 

# Logging sozlamalari
logging.basicConfig(
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s', 
    level=logging.INFO
)
logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Telegram Bot ishga tushirish'
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--token',
            type=str,
            help='Bot token (ixtiyoriy, settings.py dan olinadi)',
        )
    
    def handle(self, *args, **options):
        # Token olish
        token = options.get('token') or getattr(settings, 'TELEGRAM_BOT_TOKEN', None)
        
        if not token:
            self.stdout.write(
                self.style.ERROR(
                    'Bot token topilmadi! settings.py da TELEGRAM_BOT_TOKEN o\'rnatgan '
                    'yoki --token argument bilan bering'
                )
            )
            return
        
        bot = TelegramBot(token)
        
        self.stdout.write(
            self.style.SUCCESS('🤖 Telegram Bot ishga tushmoqda...')
        )
        
        try:
            # Botni ishga tushirish
            bot.run()
        except KeyboardInterrupt:
            self.stdout.write(
                self.style.WARNING('Bot to\'xtatildi')
            )
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Bot xatosi: {e}')
            )
