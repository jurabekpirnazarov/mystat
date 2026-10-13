import requests
from django.utils.encoding import smart_str, smart_bytes
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
import hashlib
import hmac
from django.conf import settings

def send_message(chat_id: int, text: str) -> dict:
    url = f"https://api.telegram.org/bot{settings.TELEGRAM_BOT_TOKEN}/sendMessage"
    payload = {
        "chat_id": chat_id,
        "text": text,
        "parse_mode": "HTML"
    }
    response = requests.post(url, json=payload)
    return response.json()


class TelegramTokenManager:
    """User ID asosida token yaratish va tekshirish"""
    
    @staticmethod
    def generate_token(user_id):
        """
        User ID asosida token yaratish
        """
        # User ID ni encode qilish
        uidb64 = urlsafe_base64_encode(smart_bytes(user_id))
        
        # Qo'shimcha security uchun hash yaratish (ixtiyoriy)
        secret_key = getattr(settings, 'SECRET_KEY', 'default-secret')
        signature = hmac.new(
            secret_key.encode(),
            f"{user_id}".encode(),
            hashlib.sha256
        ).hexdigest()[:8]  # Faqat birinchi 8 ta belgi
        
        # Token: uidb64 + signature
        token = f"{uidb64}{signature}"
        return token
    
    @staticmethod
    def decode_token(token):
        """
        Token'dan user ID ni olish
        """
        try:
            # Signature'ni ajratib olish (oxirgi 8 ta belgi)
            uidb64_part = token[:-8]
            signature_part = token[-8:]
            
            # User ID ni decode qilish
            user_id = smart_str(urlsafe_base64_decode(uidb64_part))
            
            # Signature tekshirish (qo'shimcha security)
            secret_key = getattr(settings, 'SECRET_KEY', 'default-secret')
            expected_signature = hmac.new(
                secret_key.encode(),
                f"{user_id}".encode(),
                hashlib.sha256
            ).hexdigest()[:8]
            
            if signature_part == expected_signature:
                return int(user_id)
            else:
                return None
                
        except Exception as e:
            return None
        

def get_district_by_soato(soato: str):
    from apps.common.models import District
    try:
        return District.objects.get(code=soato[4:7], region__code=soato[:4])
    except District.DoesNotExist:
        return None
    

def get_sector_first_parent_by_code(code: str):
    from apps.common.models import Sector
    print("get_sector_first_parent_by_code code:", code, code[:2])
    try:
        sector = Sector.objects.get(code=code[:2])
        return sector.parent
    except Sector.DoesNotExist:
        return None