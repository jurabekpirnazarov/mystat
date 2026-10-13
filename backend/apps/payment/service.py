from django.utils import timezone
from apps.payment.models import TransactionStatus


class TransactionBehavior:
    def __init__(self, transaction):
        self.transaction = transaction
        self.order = transaction.payable

    def apply(self):
        self.apply_transaction()
        self.apply_order()

    def apply_transaction(self):
        self.transaction.status = TransactionStatus.PAID
        self.transaction.paid_at = timezone.now()
        self.transaction.save()

    def apply_order(self):
        if self.order:
            self.order.is_paid = True
            self.order.save()

    def cancel(self):
        if self.transaction:
            self.transaction.status = TransactionStatus.CANCELED
            self.transaction.cancel_time = timezone.now()
            self.transaction.save()
