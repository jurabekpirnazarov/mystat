from django.utils.translation import gettext_lazy as _
from drf_yasg.utils import swagger_auto_schema
from rest_framework.response import Response

from apps.common.models import  SiteSettings
from apps.payment.api_endpoints.click.provider import ClickProvider
from apps.payment.models import Provider, TransactionStatus
from apps.payment.service import TransactionBehavior
from apps.payment.views import PaymentView

from ..auth import authentication
from .serializers import (
    ClickCompleteSerializer,
)

import logging

logger = logging.getLogger('apps.payment')



class ClickCompleteAPIView(PaymentView):
    TYPE = "complete"
    PROVIDER = Provider.CLICK  # type: ignore

    @swagger_auto_schema(request_body=ClickCompleteSerializer)
    def post(self, request, *args, **kwargs):
        check_auth = authentication(request)
        print(check_auth)
        if not check_auth:
            return Response({"error": "-1", "error_note": _("SIGN CHECK FAILED!")})
        serializer = ClickCompleteSerializer(data=request.data, many=False)
        serializer.is_valid(raise_exception=True)
        logger.info(f"Click complete data: {serializer.validated_data}")
        click_provider = ClickProvider(serializer.validated_data)
        response = click_provider.complete()
        logger.info(f"Click complete response: {response}")
        response["fiscal_items"] = list()

        if click_provider.has_transaction:
            transaction = click_provider.transaction
        else:
            transaction = None

        response["click_trans_id"] = serializer.validated_data.get("click_trans_id", None)
        response["merchant_trans_id"] = serializer.validated_data.get("merchant_trans_id", None)
        response["merchant_prepare_id"] = serializer.validated_data.get("merchant_prepare_id", None)
        response["merchant_confirm_id"] = serializer.validated_data.get("merchant_prepare_id", None)

        if response["error"] == "0":
            transaction = click_provider.transaction
            if transaction is None:
                response = {"error": "-7", "error_note": _("Transaction not found")}
                return Response(response)

            TransactionBehavior(transaction).apply()
            self.add_fiscal_data(response, transaction)
            return Response(response)

        if transaction and transaction.status == TransactionStatus.WAITING:
            transaction.status = TransactionStatus.FAILED
            transaction.save()

        return Response(response)

    @staticmethod
    def add_fiscal_data(response, transaction):
        response["received_cash"] = 0
        response["received_ecash"] = 0
        response["received_card"] = transaction.amount * 100

        product_name = str(transaction.payable.id)
        setting = SiteSettings.load()
        response["fiscal_items"].append(
            {
                "Name": product_name,
                "SPIC": str(setting.tax_spic),
                "GoodPrice": transaction.amount * 100,
                "Units": 1,
                "Amount": 1,
                "code": str(setting.tax_service_code),
                "PackageCode": str(setting.tax_package_code),
                "VAT": transaction.amount * setting.tax_nds,
                "VATPercent": setting.tax_nds,
                "CommissionInfo": {"TIN": str(setting.tax_tin)},
            }
        )
