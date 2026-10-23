from celery import shared_task


@shared_task
def expire_credits_task():
    """KR-40: muddati o'tgan grant qoldiqlarini yopish (Celery Beat, har kecha)."""
    from .service import expire_due

    return expire_due()


@shared_task
def activate_paid_packages_task():
    """KR-41/OS-20: to'liq to'langan StatCoin shartnomalarini faollashtirish (Celery Beat, har 10 daqiqada)."""
    from .packages import activate_paid_contracts

    return len(activate_paid_contracts())


@shared_task
def grant_monthly_statcoin_task():
    """KR-41: faol oylik tarif paketlariga joriy oy StatCoin'ini berish (Celery Beat, har kuni)."""
    from .packages import grant_due_monthly

    return grant_due_monthly()
