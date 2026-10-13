from celery import shared_task
from django.core.management import call_command
import logging

logger = logging.getLogger(__name__)


@shared_task(bind=True)
def check_didox_documents_task(self, force=False):
    """
    DIDOX hujjatlarini tekshirish va bildirishnoma yuborish - Celery task
    """
    try:
        logger.info("DIDOX hujjatlari tekshiruvi boshlandi (Celery task)")
        
        if force:
            call_command('check_didox_documents', '--force')
        else:
            call_command('check_didox_documents')
        
        logger.info("DIDOX hujjatlari tekshiruvi muvaffaqiyatli tugadi")
        return {"status": "success", "message": "DIDOX tekshiruvi tugadi"}
        
    except Exception as e:
        logger.error(f"DIDOX tekshiruv taskida xatolik: {str(e)}", exc_info=True)
        raise self.retry(countdown=60, max_retries=3, exc=e)


@shared_task
def periodic_didox_check():
    """
    Muntazam DIDOX tekshiruvi uchun task (Celery Beat bilan ishlatish)
    """
    return check_didox_documents_task.delay(force=False)