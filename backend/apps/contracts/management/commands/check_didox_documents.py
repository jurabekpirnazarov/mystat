from django.core.management.base import BaseCommand
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType
from datetime import timedelta
import logging

from apps.common.models import SiteSettings
from apps.contracts.utils import create_didox_client
from apps.contracts.models import Contract
from apps.notifications.models import Notification
from apps.common.utils import send_message

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'DIDOX dan imzo kutayotgan hujjatlar egalariga telegram orqali ogohlantirish yuborish'

    def add_arguments(self, parser):
        parser.add_argument(
            '--force',
            action='store_true',
            help='Barcha hujjatlarni tekshirish (sanasiz)',
        )

    def handle(self, *args, **options):
        try:
            self.stdout.write(
                self.style.SUCCESS('DIDOX hujjatlari tekshiruvi boshlandi...')
            )
            
            # SiteSettings dan oxirgi tekshiruv sanasini olish
            site_settings = SiteSettings.load()
            last_update = site_settings.last_didox_update
            
            # Agar force parametri berilgan bo'lsa yoki oxirgi tekshiruv sanasi bo'lmasa
            if options['force'] or not last_update:
                last_update_str = None
                self.stdout.write("Barcha hujjatlar tekshirilmoqda...")
            else:
                # Oxirgi tekshiruvdan 1 soat oldingi sanani olish (xatoliklarni oldini olish uchun)
                check_from = last_update - timedelta(hours=1)
                last_update_str = check_from.strftime('%Y-%m-%d')
                self.stdout.write(f"Tekshiruv sanasi: {last_update_str} dan keyin")

            # DIDOX client yaratish
            client = create_didox_client()
            
            # Imzo kutayotgan hujjatlarni olish
            response = client.get_all_documents_full_process(
                last_updated_at=last_update_str
            )
            
            if not response.success:
                self.stdout.write(
                    self.style.ERROR(f'DIDOX dan ma\'lumot olishda xatolik: {response.error}')
                )
                return
            
            documents = response.data.get('data', [])
            processed_count = 0
            notification_count = 0
            
            self.stdout.write(f'Jami {len(documents)} ta hujjat topildi')
            
            for doc in documents:
                try:
                    # Hujjat ma'lumotlarini olish
                    doc_id = doc.get('doc_id')
                    partner_tin = doc.get('partnerTin')
                    contract_number = doc.get('contract_number')
                    doc_name = doc.get('name')
                    doc_status = doc.get('doc_status')
                    partner_company = doc.get('partnerCompany', '')
                    total_sum = doc.get('total_sum', 0)
                    doc_date = doc.get('doc_date')
                    
                    # Status tekshirish (1 - imzo kutilmoqda)
                    if doc_status != 1:
                        continue
                    
                    # Contract'ni topishga harakat qilish
                    contract = None
                    if contract_number:
                        try:
                            contract = Contract.objects.get(contract_number=contract_number)
                        except Contract.DoesNotExist:
                            self.stdout.write(f"Shartnoma topilmadi: {contract_number}")
                            continue
                    
                    if not contract:
                        continue
                    
                    # Foydalanuvchining telegram chat_id ni tekshirish
                    if not hasattr(contract.user, 'telegram_chat_id') or not contract.user.telegram_chat_id:
                        self.stdout.write(f"Foydalanuvchi {contract.user.username} uchun telegram_chat_id topilmadi")
                        continue
                    
                    # Avval yuborilgan bildirishnoma borligini tekshirish (oxirgi 24 soat ichida)
                    content_type = ContentType.objects.get_for_model(Contract)
                    recent_notification = Notification.objects.filter(
                        recipient=contract.user,
                        notification_type='document_pending',
                        content_type=content_type,
                        object_id=contract.id,
                        created_at__gte=timezone.now() - timedelta(hours=24)
                    ).first()
                    
                    if recent_notification:
                        self.stdout.write(f"Yaqinda bildirishnoma yuborilgan: {contract_number}")
                        continue
                    
                    # Bildirishnoma matnini tayyorlash
                    message = self._prepare_message(
                        contract=contract,
                        doc_name=doc_name,
                        partner_company=partner_company,
                        total_sum=total_sum,
                        doc_date=doc_date,
                        doc_id=doc_id
                    )
                    
                    # Bildirishnoma yaratish
                    notification = Notification.objects.create(
                        recipient=contract.user,
                        title="📄 Hujjat imzolash kutilmoqda",
                        message=message,
                        notification_type='document_pending',
                        content_type=content_type,
                        object_id=contract.id,
                        extra_data={
                            'doc_id': doc_id,
                            'contract_number': contract_number,
                            'partner_tin': partner_tin,
                            'doc_status': doc_status
                        }
                    )
                    
                    # Telegram orqali yuborish
                    success = self._send_telegram_notification(contract.user, message, notification)
                    
                    if success:
                        notification_count += 1
                        self.stdout.write(
                            self.style.SUCCESS(f"Bildirishnoma yuborildi: {contract.user.username}")
                        )
                    
                    processed_count += 1
                    
                except Exception as e:
                    self.stdout.write(
                        self.style.ERROR(f'Hujjat ishlov berishda xatolik {doc.get("doc_id", "unknown")}: {str(e)}')
                    )
                    logger.error(f'Error processing document: {str(e)}', exc_info=True)
                    continue
            
            # Oxirgi tekshiruv sanasini yangilash
            site_settings.last_didox_update = timezone.now()
            site_settings.save(update_fields=['last_didox_update'])
            
            self.stdout.write(
                self.style.SUCCESS(
                    f'Tekshiruv tugadi. Jami: {processed_count} ta hujjat, '
                    f'{notification_count} ta bildirishnoma yuborildi'
                )
            )
            
        except Exception as e:
            self.stdout.write(
                self.style.ERROR(f'Umumiy xatolik: {str(e)}')
            )
            logger.error(f'Command execution error: {str(e)}', exc_info=True)

    def _prepare_message(self, contract, doc_name, partner_company, total_sum, doc_date, doc_id):
        """Bildirishnoma matnini tayyorlash"""
        
        # DIDOX URL yaratish
        site_settings = SiteSettings.load()
        didox_client_url = site_settings.didox_client_url or "https://web.goodsign.uz"
        didox_url = f"{didox_client_url}/documents/{doc_id}"
        
        # Paket narxini olish
        package_price = getattr(contract.package, "price", None)
        price_text = f"💰 Narxi: {package_price:,} so'm" if package_price else ""
        
        # Summa ma'lumoti
        sum_text = f"💵 Summa: {total_sum:,} so'm" if total_sum else ""
        
        message = (
            f"⏳ Hujjatingiz imzolashni kutmoqda!\n\n"
            f"📄 Hujjat: {doc_name}\n"
            f"🆔 Shartnoma: {contract.contract_number}\n"
            f"🏢 Hamkor: {partner_company}\n"
            f"📅 Sana: {doc_date}\n"
            f"{price_text}\n"
            f"{sum_text}\n\n"
            f"🔗 <a href='{didox_url}'>Hujjatni imzolash</a>\n\n"
            f"⚠️ Iltimos, hujjatni o'z vaqtida imzolang!"
        )
        
        return message

    def _send_telegram_notification(self, user, message, notification):
        """Telegram orqali bildirishnoma yuborish"""
        chat_id = getattr(user, 'telegram_chat_id', None)
        if not chat_id:
            notification.telegram_status = 'failed'
            notification.error_message = 'Telegram chat_id topilmadi'
            notification.save()
            return False
        
        # Xabarni yuborish
        response = send_message(chat_id=chat_id, text=message)
        
        if response.get('ok'):
            notification.telegram_status = 'sent'
            notification.sent_at = timezone.now()
            notification.telegram_message_id = str(response.get('result', {}).get('message_id', ''))
            notification.save()
            return True
        else:
            error_msg = response.get('description', 'Noma\'lum xatolik')
            notification.telegram_status = 'failed'
            notification.error_message = error_msg
            notification.save()
            logger.error(f'Telegram send error for user {user.username}: {error_msg}')
            return False
        