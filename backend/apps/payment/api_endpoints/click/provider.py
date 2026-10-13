from django.utils.translation import gettext_lazy as _
from django.utils import timezone
from django.contrib.contenttypes.models import ContentType

from apps.book_market.models import OrderBook
from apps.payment.api_endpoints.click.helpers import parse_merchant_trans_id
from apps.payment.models import Order, Provider, Transaction, TransactionStatus

import logging
logger = logging.getLogger('apps.payment')

class ClickProvider:
    def __init__(self, data):
        self.data = data
        self.click_trans_id = self.data.get("click_trans_id", None)
        self.service_id = self.data.get("service_id", None)
        self.click_paydoc_id = self.data.get("click_paydoc_id", None)
        self.order_id = self.data.get("merchant_trans_id", None)
        self.amount = self.data.get("amount", None)
        self.action = self.data.get("action", None)
        self.error = self.data.get("error", None)
        self.error_note = self.data.get("error_note", None)
        self.sign_time = self.data.get("sign_time", None)
        self.sign_string = self.data.get("sign_string", None)
        self.merchant_prepare_id = self.data.get("merchant_prepare_id", None) if self.action == 1 else ""
        self.kind, self.pk, self.transaction_id = parse_merchant_trans_id(self.order_id)
        self.payable = self._get_payable()
        self.success_response = {"error": "0", "error_note": "Success"}
        self.transaction_found = False
        self.transaction = None
        self._has_txn = False

    def prepare(self):
        if self.action != 0:
            return {"error": "-3", "error_note": _("Action not found")}
        if not self.payable:
            return {"error": "-5", "error_note": _("Order does not exist")}

        ok, err = self._check_payable_status()
        if not ok: return err

        ok, err = self._can_prepare_transaction()
        if not ok: return err

        ok, err = self._is_valid_amount()
        if not ok: return err

        return self.success_response

    def complete(self):
        if self.action != 1:
            return {"error": "-3", "error_note": _("Action not found")}
        if not self.payable:
            return {"error": "-5", "error_note": _("Order does not exist")}

        ok, err = self._check_payable_status()
        if not ok: return err

        ok, err = self._can_complete_transaction()
        if not ok: return err

        ok, err = self._is_valid_amount()
        if not ok: return err

        self._mark_paid()
        return self.success_response

    def _can_prepare_transaction(self):
        txn = self._get_or_create_transaction()
        self.transaction = txn
        self._has_txn = True
        return self._check_transaction_status()

    def _can_complete_transaction(self):
        try:
            logger.info(f"Attempting to complete transaction: {self.merchant_prepare_id}")
            txn = Transaction.objects.get(id=self.merchant_prepare_id)
            logger.info(f"Found transaction: {txn}")
            self.transaction = txn
            self._has_txn = True
            logger.info(f"Transaction details: {type(txn.transaction_id)}, {type(self.click_trans_id)}, {txn.transaction_id}, {txn.status}, {txn.amount}, {txn.transaction_id == self.click_trans_id}")
            if int(txn.transaction_id) != self.click_trans_id:
                return False, {"error": "-8", "error_note": _("Transaction ID not match")}
        except Transaction.DoesNotExist:
            return False, {"error": "-7", "error_note": _("Transaction not found")}
        return self._check_transaction_status()

    def _get_or_create_transaction(self):
        ct = ContentType.objects.get_for_model(self.payable.__class__)
        txn, _ = Transaction.objects.get_or_create(
            content_type=ct,
            object_id=self.payable.pk,
            transaction_id=self.click_trans_id,
            defaults={"amount": self.amount, "status": TransactionStatus.WAITING},
        )
        return txn

    def _check_transaction_status(self):
        if self.transaction.status == TransactionStatus.PAID:
            return False, {"error": "-4", "error_note": _("Already paid")}
        if self.transaction.status in (TransactionStatus.CANCELED, TransactionStatus.FAILED):
            return False, {"error": "-9", "error_note": _("Transaction cancelled or failed")}
        return True, self.success_response

    def _is_valid_amount(self):
        order_amount = getattr(self.payable, "total_amount", getattr(self.payable, "amount", None))
        if self.amount != order_amount:
            return False, {"error": "-2", "error_note": _("Incorrect parameter amount")}
        return True, self.success_response

    def _get_payable(self):
        if self.kind == "book":
            return OrderBook.objects.filter(id=self.pk).first()
        return Order.objects.filter(id=self.pk).first()

    def _check_payable_status(self):
        if getattr(self.payable, "is_canceled", False):
            return False, {"error": "-9", "error_note": _("Order cancelled")}
        if getattr(self.payable, "is_paid", False):
            return False, {"error": "-4", "error_note": _("Already paid")}
        return True, self.success_response

    def _mark_paid(self):
        if not self.payable.is_paid:
            self.payable.is_paid = True
            self.payable.save(update_fields=["is_paid"])

        if self.transaction and self.transaction.status != TransactionStatus.PAID:
            self.transaction.status = TransactionStatus.PAID
            self.transaction.paid_at = timezone.now()
            self.transaction.save(update_fields=["status", "paid_at"])

    @property
    def has_transaction(self):
        return self._has_txn