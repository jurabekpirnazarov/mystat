"""KR-01: SIAT sinxronlash Celery vazifasi (Celery Beat, har kuni kechasi).

Ma'lumot yangilansa: prognoz (data_until o'zgargan bo'lsa) qayta o'qitiladi va salohiyat indeksi qayta hisoblanadi
(SCORING_MODEL.md KR-16, KR-26).
"""
import logging

from celery import shared_task

logger = logging.getLogger(__name__)


@shared_task
def sync_siat_task(force=False):
    from .sync import run_sync

    log = run_sync(force=force, trigger="beat")
    if log.updated or force:
        refresh_models_task.delay()
    return {"updated": log.updated, "unchanged": log.unchanged, "failed": log.failed}


@shared_task
def refresh_models_task(force_forecast=False):
    """Prognoz (o'zgargan bo'lsa) → salohiyat indeksi. Prognoz xatosi indeks hisobini to'xtatmaydi."""
    from .forecast.train import train_all
    from .scoring import store

    try:
        train_all(force=force_forecast)
    except Exception:  # noqa: BLE001 — eski prognoz qoladi, admin xabar oladi (train_all ichida)
        logger.exception("Prognozni yangilab bo'lmadi")
    count = store.compute_all()
    store.report()
    return {"scores": count}
