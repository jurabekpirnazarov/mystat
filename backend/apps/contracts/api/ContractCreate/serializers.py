import requests, uuid, os, logging, asyncio, json
from django.conf import settings
from rest_framework import serializers
from django.utils import timezone
from django.db import transaction
from django.conf import settings

from apps.accounts.views import UZ_MONTHS
from apps.common.models import SiteSettings
from ...models import Contract
from apps.accounts.models import User
from apps.services.models import Service, ServicePackage
from apps.services.pricing import package_price
from ...utils import  create_didox_client, DidoxAPIError
from ..utils import generate_financial_report, num_to_words_uz
from ...template_parts import load_template_parts

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)




def _region_name(org):
    if org and org.district_id and org.district.region_id:
        return org.district.region.name
    return 'Toshkent'


def build_template_context(user, org, service_package, contract_number, price):
    """007 shartnoma shabloni o'zgaruvchilari (yaratish va K-08 oldindan ko'rish uchun umumiy)."""
    return {
        'contractNum': contract_number,
        'day': timezone.now().day,
        'month': UZ_MONTHS.get(timezone.now().month, ''),
        'city': _region_name(org),
        'region': org.branch.region.name if org.branch and getattr(org.branch, 'region', None) else _region_name(org),
        'shefName': getattr(org.branch, 'director_name', '') if org.branch else '',
        'orgName': org.name if org else '',
        'directorName': getattr(org, 'director_name', None) or user.full_name,
        'serviceName': service_package.name if service_package else 'Konsalting xizmati',
        'serviceValue': f"{float(price):,.2f}",
        'servicePercent': '12',
        'serviceAmount': f"{float(price) * 0.12:,.2f}",
        'serviceOverallScore': f"{float(price) * 1.12:,.2f}",
        'amountNum': f"{float(price):,.2f}",
        'amountChar': num_to_words_uz(str(int(price))),
        'ijrochi': user.full_name if user else ''
    }


class ContractCreateSerializer(serializers.Serializer):
    service_package_id = serializers.IntegerField(required=True)
    # K-01: foydalanuvchi rekvizitlarni ko'rib tasdiqlamaguncha shartnoma yaratilmaydi
    requisites_confirmed = serializers.BooleanField(required=True)
    document_type = serializers.ChoiceField(
        choices=[('000', 'Standard'), ('007', 'Free-form')],
        default='007',
        required=False
    )
    parts = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True,
        help_text="Parts for 007 document: [{'title': 'Section title', 'body': 'Section content'}]"
    )

    class Meta:
        fields = ['service_package_id', 'requisites_confirmed', 'document_type', 'parts']

    def validate_requisites_confirmed(self, value):
        if not value:
            raise serializers.ValidationError("Rekvizitlarni tekshirib tasdiqlang.")
        return value

    def validate_service_package_id(self, value):
        """Validate service package exists and user has access"""
        service_package = ServicePackage.objects.filter(
            id=value
        ).first()
        
        if not service_package:
            raise serializers.ValidationError("Service package not found or access denied.")
        
        if not service_package.file:
            raise serializers.ValidationError("Service package does not have a file attached.")
            
        return value

    def _prepare_didox_payload(self, org, service_package):
        """Prepare payload for DIDOX API with mock data"""

        current_date = timezone.now().strftime('%Y-%m-%d')
        document_no = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        contract_no = f"CONTRACT-{uuid.uuid4().hex[:8].upper()}"

        return {
            "Document": {
                "DocumentNo": document_no,
                "DocumentDate": current_date,
                "DocumentName": f"Service Contract - {service_package.name if hasattr(service_package, 'name') else 'Package'}"
            },
            "ContractDoc": {
                "ContractNo": contract_no,
                "ContractDate": current_date
            },
            "SellerTin": org.branch.inn,
            "Seller": {
                "Name": org.branch.name,
                "BranchCode": "",
                "BranchName": "",
                "Address": org.branch.address
            },
            "BuyerTin": org.tin,
            "Buyer": {
                "Name": org.name,
                "Address": org.address,
                "BranchCode": "",
                "BranchName": ""
            }
        }

    def _prepare_didox_007_payload(self, org, service_package, contract_number, price, parts_content):
        """Prepare payload for DIDOX 007 API (free-form document)"""

        current_date = timezone.now().strftime('%Y-%m-%d')
        expire_date = (timezone.now() + timezone.timedelta(days=365)).strftime('%Y-%m-%d')
        user = self.context['request'].user

        # Owner - sotuvchi (filial)
        owner_data = {
            "Tin": org.branch.inn if org.branch else "",
            "Name": org.branch.name if org.branch else "",
            "BranchCode": "",
            "BranchName": "",
            "FizTin": user.pin if hasattr(user, 'pin') else "",
            "Fio": user.full_name if hasattr(user, 'full_name') else "",
            "Address": org.branch.address if org.branch else "",
            "WorkPhone": org.branch.phone if org.branch and hasattr(org.branch, 'phone') else "",
            "Mobile": "",
            "Oked": org.branch.oked if org.branch and hasattr(org.branch, 'oked') else "",
            "Account": org.branch.bank_account if org.branch and hasattr(org.branch, 'bank_account') else "",
            "BankId": org.branch.mfo if org.branch and hasattr(org.branch, 'mfo') else ""
        }

        # Client - xaridor (tashkilot)
        client_data = {
            "BranchCode": "",
            "BranchName": "",
            "Tin": org.tin if org else "",
            "Name": org.name if org else "",
            "FizTin": org.director_pin if org and hasattr(org, 'director_pin') else org.tin,
            "Fio": org.director_name if org and hasattr(org, 'director_name') else "",
            "Address": org.address if org else "",
            "WorkPhone": org.phone if org and hasattr(org, 'phone') else "",
            "Mobile": "",
            "Oked": org.oked if org and hasattr(org, 'oked') else "",
            "Account": org.bank_account if org and hasattr(org, 'bank_account') else "",
            "BankId": org.mfo if org and hasattr(org, 'mfo') else ""
        }

        # Parts - hujjat bo'limlari (sarlavha va matn)
        parts = []
        if isinstance(parts_content, list):
            for idx, part in enumerate(parts_content, 1):
                parts.append({
                    "ordno": idx,
                    "title": part.get("title", ""),
                    "body": part.get("body", "")
                })
        elif isinstance(parts_content, str):
            parts.append({
                "ordno": 1,
                "title": service_package.name if service_package else "Shartnoma",
                "body": parts_content
            })

        # Products - xizmatlar ro'yxati
        vat_rate = 12
        vat_sum = float(price) * vat_rate / 100
        total_with_vat = float(price) + vat_sum

        products = [{
            "OrdNo": 1,
            "Name": service_package.name if service_package else "Konsalting xizmati",
            "CatalogCode": "10602001001000000",  # Konsalting xizmatlari kodi
            "CatalogName": "Boshqaruv masalalari bo'yicha maslahat xizmatlari",
            "Barcode": "",
            "MeasureId": "35",  # Xizmat
            "PackageCode": "1544407",
            "PackageName": "xizmat",
            "Count": "1",
            "Summa": f"{float(price):.2f}",
            "DeliverySum": f"{float(price):.2f}",
            "VatRate": str(vat_rate),
            "VatSum": f"{vat_sum:.2f}",
            "DeliverySumWithVat": f"{total_with_vat:.2f}",
            "WithoutVat": False
        }]

        return {
            "isValid": True,
            "fromweb": True,
            "reverse_calc": True,
            "didoxorderid": "",
            "ContractDoc": {
                "ContractName": f"Konsalting xizmatlari shartnomasi - {service_package.name if service_package else ''}",
                "ContractNo": contract_number,
                "ContractDate": current_date,
                "ContractExpireDate": expire_date,
                "ContractPlace": org.district.region.name if org and hasattr(org, 'district') and org.district and hasattr(org.district, 'region') else "Toshkent"
            },
            "Owner": owner_data,
            "Clients": [client_data],
            "Parts": parts,
            "Products": products,
            "HasVat": True
        }

    def _load_contract_template_parts(self):
        """Shartnoma bo'limlari: datas/contractContentTemplate.json, bo'lmasa contractTemplate.docx (OS-18)"""
        return load_template_parts()

    def _render_template_parts(self, parts, context):
        """Replace template variables in parts with actual values"""
        rendered_parts = []
        for part in parts:
            title = part.get('title', '')
            body = part.get('body', '')

            # Replace template variables
            for key, value in context.items():
                placeholder = '{{' + key + '}}'
                title = title.replace(placeholder, str(value) if value else '')
                body = body.replace(placeholder, str(value) if value else '')

            rendered_parts.append({
                'title': title,
                'body': body
            })
        return rendered_parts

    def create(self, validated_data):
        """Create contract first, then send to DIDOX and update status"""
        service_package_id = validated_data.get('service_package_id')
        document_type = validated_data.get('document_type', '007')
        parts_data = validated_data.get('parts', [])

        user = self.context['request'].user
        org = user.organization

        service_package = ServicePackage.objects.get(id=service_package_id)
        price = package_price(service_package, org.sector)["price"]

        contract_number = f"CONTRACT-{uuid.uuid4().hex[:8].upper()}"

        with transaction.atomic():
            if document_type == '007':
                # 007 document type - free-form with Parts
                # If no parts provided, load from JSON template
                if not parts_data:
                    template_parts = self._load_contract_template_parts()
                    if template_parts:
                        # Prepare context for template rendering
                        template_context = build_template_context(user, org, service_package, contract_number, price)
                        parts_data = self._render_template_parts(template_parts, template_context)

                didox_payload = self._prepare_didox_007_payload(
                    org, service_package, contract_number, price, parts_data
                )

                contract = Contract.objects.create(
                    contract_number=contract_number,
                    user=user,
                    package=service_package,
                    total_amount=price,
                    status='created',
                    notes=f"007 Contract created - {service_package.name}",
                    created_by=user,
                    branch=org.branch
                )

                logger.info(f"007 Contract created with 'created' status: {contract.contract_number}")

                client = create_didox_client(timeout=60)
                didox_response = client.create_document_007_full_process(
                    document_payload=didox_payload
                )

            else:
                # 000 document type - standard with file attachment
                didox_payload = self._prepare_didox_payload(org, service_package)

                contract = Contract.objects.create(
                    contract_number=didox_payload['ContractDoc']['ContractNo'],
                    user=user,
                    package=service_package,
                    total_amount=price,
                    status='created',
                    notes=f"Contract created - Document: {didox_payload['Document']['DocumentName']}",
                    created_by=user,
                    branch=org.branch,
                    file=self.create_file({
                        'user': user,
                        'service_package': service_package,
                        'contract_number': didox_payload['ContractDoc']['ContractNo'],
                        "price": price
                    })
                )

                logger.info(f"Contract created with 'created' status: {contract.contract_number}")

                client = create_didox_client(timeout=60)
                didox_response = client.create_document_full_process_with_payload(
                    buyer_tin=org.tin,
                    file_path=contract.file.path,
                    document_payload=didox_payload
                )

            logger.info(f"DIDOX document creation response: {didox_response}")

            if not didox_response.success:
                logger.error(f"DIDOX document creation failed: {didox_response.error}")
                raise serializers.ValidationError(f"DIDOX document creation failed: {didox_response.error}")

            contract.status = 'pending'
            contract.didox_contract_data = didox_response.data
            contract.notes = f"Contract sent to DIDOX successfully"
            contract.didx_contract_id = didox_response.data.get('_id')
            contract.save()

            logger.info(f"Contract status updated to 'pending': {contract.contract_number}")

            return contract


    def create_file(self, data):
            """Create a file object from the given file path using dynamic context"""
        # try:
            user = data.get('user')
            service_package = data.get('service_package')
            contract_number = data.get('contract_number')
            org = user.organization if user else None
            price = data.get('price', 0)


            context = {
                "contractNum": contract_number or 1,
                "day": timezone.now().day,
                "month": UZ_MONTHS[int(timezone.now().month)], 
                "city": org.city if org and hasattr(org, 'city') else "Toshkent",
                "region": org.district.region.name if org and hasattr(org, 'district') and hasattr(org.district, 'region') and hasattr(org.district.region, 'regionName') else "Toshkent",
                "shefName": user.full_name if user else "Unknown Shef",
                "orgName": org.name if org else "Unknown Organization",
                "directorName": user.full_name if user else "Unknown Director",
                "serviceName": "Konsulting xizmatlari",
                "serviceValue": f"1 ta {service_package.name_uz}",
                "servicePercent": 12,
                "serviceAmount": price*12/100,
                "serviceOverallScore": price*112/100,
                "amountNum": price,
                "amountChar": num_to_words_uz(str(int(price))),
                "ijrochi":  "Omadbek"
            }
            
            
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            # try:
            pdf_path = loop.run_until_complete(
                generate_financial_report(
                    context=context, 
                    lang="uz",
                    media_root=settings.MEDIA_ROOT,
                    BASE_DIR=settings.BASE_DIR

                )
                )
            # finally:
            #     loop.close()
            
            relative_path = os.path.relpath(pdf_path, settings.MEDIA_ROOT)
            return relative_path
            
        # except Exception as e:
        #     logger.error(f"Failed to generate contract file: {str(e)}")
        #     return os.path.join(settings.MEDIA_ROOT, "contracts/", "sample_contract.pdf")
    

class ContractDetailSerializer(serializers.ModelSerializer):
    contract_url = serializers.SerializerMethodField(read_only=True)

    def get_contract_url(self, obj):
        settings_obj = SiteSettings.load()
        return f"{settings_obj.didox_client_url}/documents/{obj.didox_contract_data.get('_id')}/"

    class Meta:
        model = Contract
        fields = '__all__'
