"""KORXONA_SCORING.md KR-31: korxona ballarini qayta hisoblash (Celery)."""
from celery import shared_task


@shared_task
def compute_company_scores_task():
    from .company_scoring.service import compute_all

    return {"rows": compute_all()}
