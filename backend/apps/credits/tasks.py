from celery import shared_task


@shared_task
def expire_credits_task():
    """KR-40: muddati o'tgan grant qoldiqlarini yopish (Celery Beat, har kecha)."""
    from .service import expire_due

    return expire_due()
