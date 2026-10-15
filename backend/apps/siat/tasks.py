"""KR-01: SIAT sinxronlash Celery vazifasi (Celery Beat, har kuni kechasi)."""
from celery import shared_task


@shared_task
def sync_siat_task(force=False):
    from .sync import run_sync

    log = run_sync(force=force, trigger="beat")
    return {"updated": log.updated, "unchanged": log.unchanged, "failed": log.failed}
