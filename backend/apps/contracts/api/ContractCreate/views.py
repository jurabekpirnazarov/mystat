import logging

from rest_framework import status, serializers
from rest_framework.response import Response
from rest_framework.generics import CreateAPIView
from rest_framework.decorators import action

from django.db import transaction
from django.utils import timezone

from apps.accounts.permissions import IsAuthenticated


from .serializers import ContractCreateSerializer, ContractDetailSerializer
from ...models import Contract

from apps.common.utils import send_message

logger = logging.getLogger(__name__)



class ContractCreateView(CreateAPIView):
    """Create new contract through DIDOX"""
    serializer_class = ContractCreateSerializer
    permission_classes = (IsAuthenticated,)

    def create(self, request, *args, **kwargs):
        # """Create new contract"""
        # try:
        serializer = self.get_serializer(data=request.data, context={'request': request})
        serializer.is_valid(raise_exception=True)

        contract = serializer.save()

        response_serializer = ContractDetailSerializer(contract)
        response_data = {
            'success': True,
            'message': "Shartnoma muvaffaqiyatli yaratildi",
            'data': response_serializer.data
        }

        contract_id = contract.id
        contract_url = response_serializer.data.get("contract_url", "")
        contract_number = contract.contract_number
        didox_url = response_serializer.data.get("didox_contract_data", {}).get("pending_document", {}).get("document_json", {}).get("url", "")
        package_price = getattr(contract.package, "price", None)
        price_text = f"💰 Narxi: {package_price:,} so'm" if package_price else ""

        message = (
            f"✅ Shartnoma muvaffaqiyatli yaratildi!\n"
            f"🆔 ID: {contract_id}\n"
            f"📄 Raqam: {contract_number}\n"
            f"{price_text}\n\n"
            f"🔗 <a href='{contract_url}'>Kontrakt</a>\n"
            f"📝 <a href='{didox_url}'>Didox hujjat</a>\n"
        )

        branch = contract.branch
        accountant = branch.bugalter if branch else None
        if accountant is None:
            logger.warning(
                "Contract %s: branch yoki buxgalter yo'q, buxgalterga Telegram xabar yuborilmadi", contract_id
            )

        recipients = [request.user.telegram_chat_id, accountant.telegram_chat_id if accountant else None]
        transaction.on_commit(lambda: self._notify(recipients, message, contract_id))

        return Response(response_data, status=status.HTTP_201_CREATED)

    @staticmethod
    def _notify(chat_ids, message, contract_id):
        """Telegram xatosi shartnoma yaratish javobini buzmasligi kerak."""
        for chat_id in chat_ids:
            if not chat_id:
                continue
            try:
                send_message(chat_id=chat_id, text=message)
            except Exception:
                logger.warning("Contract %s: Telegram xabar yuborilmadi (chat_id=%s)", contract_id, chat_id, exc_info=True)
            
        # except serializers.ValidationError as e:
        #     logger.error(f"Validation error in contract creation: {str(e)}")
        #     return Response({
        #         'success': False,
        #         'message': "Ma'lumotlarda xatolik mavjud",
        #         'errors': e.detail
        #     }, status=status.HTTP_400_BAD_REQUEST)
            
        # except Exception as e:
        #     logger.error(f"Unexpected error in contract creation: {str(e)}")
        #     return Response({
        #         'success': False,
        #         'message': "Shartnoma yaratishda xatolik yuz berdi",
        #         'error': str(e)
        #     }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

