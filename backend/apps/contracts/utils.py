from datetime import timedelta
import requests
import logging
from typing import Dict, Any, Optional, Union
import base64
from pathlib import Path
from contextlib import contextmanager
from dataclasses import dataclass
import os, uuid
from io import BytesIO

from django.utils import timezone
from django.conf import settings
from django.core.files.base import ContentFile

from apps.accounts.views import UZ_MONTHS
from apps.common.models import SiteSettings
from apps.services.models import ServicePackage

# PDF generation imports - optional
HAS_REPORTLAB = False

logger = logging.getLogger(__name__)



@dataclass
class DidoxResponse:
    """Standardized response wrapper"""
    success: bool
    data: Optional[Dict[str, Any]] = None
    error: Optional[str] = None
    status_code: Optional[int] = None

class DidoxAPIError(Exception):
    """Custom exception for DIDOX API errors"""
    def __init__(self, message: str, status_code: Optional[int] = None):
        self.message = message
        self.status_code = status_code
        super().__init__(self.message)

class DidoxClient:
    """Optimized DIDOX API Client with proper error handling and session management"""
    
    def __init__(self, timeout: int = 30):
        self.timeout = timeout
        self._settings = None
        self._session = None
    
    @property
    def settings(self) -> Dict[str, str]:
        """Lazy loading of settings with caching"""
        if self._settings is None:
            settings_obj = SiteSettings.load()
            self._settings = {
                "base_url": settings_obj.didox_url,
                "partner_token": settings_obj.didox_partner_token,
                "user_token": settings_obj.didox_user_token,
                "token_updated_at": settings_obj.didox_user_updated_at
            }
        return self._settings
    
    @contextmanager
    def get_session(self):
        """Context manager for session lifecycle"""
        session = requests.Session()
        try:
            yield session
        finally:
            session.close()
    
    def _make_request(
        self, 
        method: str, 
        endpoint: str, 
        session: requests.Session,
        headers: Optional[Dict] = None,
        json_data: Optional[Dict] = None,
        **kwargs
    ) -> DidoxResponse:
        """Centralized request handler with proper error handling"""
        settings_obj = SiteSettings.load()
        url = f"{settings_obj.didox_url}{endpoint}"
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        try:
            response = session.request(
                method=method,
                url=url,
                headers=default_headers,
                json=json_data,
                timeout=self.timeout,
                **kwargs
            )
            response.raise_for_status()
            
            return DidoxResponse(
                success=True,
                data=response.json(),
                status_code=response.status_code
            )
            
        except requests.exceptions.Timeout:
            error_msg = f"Request timeout after {self.timeout}s"
            logger.error(error_msg)
            return DidoxResponse(success=False, error=error_msg)
            
        except requests.exceptions.ConnectionError:
            error_msg = "Connection error to DIDOX API"
            logger.error(error_msg)
            return DidoxResponse(success=False, error=error_msg)
            
        except requests.exceptions.HTTPError as e:
            error_msg = f"HTTP error: {e.response.status_code} - {e.response.text}"
            logger.error(error_msg)
            return DidoxResponse(
                success=False, 
                error=error_msg,
                status_code=e.response.status_code
            )
            
        except requests.exceptions.RequestException as e:
            error_msg = f"Request failed: {str(e)}"
            logger.error(error_msg)
            return DidoxResponse(success=False, error=error_msg)
        
        except Exception as e:
            error_msg = f"Unexpected error: {str(e)}"
            logger.error(error_msg)
            return DidoxResponse(success=False, error=error_msg)
    
    def encode_file_to_base64(self, file_path: Union[str, Path]) -> Optional[str]:
        """Encode file to base64 with better error handling"""
        file_path = Path(file_path)
        
        if not file_path.exists():
            logger.error(f"File not found: {file_path}")
            return None
            
        if not file_path.is_file():
            logger.error(f"Path is not a file: {file_path}")
            return None
        
        try:
            with file_path.open("rb") as f:
                encoded = base64.b64encode(f.read()).decode("utf-8")
                logger.info(f"Successfully encoded file: {file_path}")
                return encoded
                
        except PermissionError:
            logger.error(f"Permission denied reading file: {file_path}")
            return None
        except MemoryError:
            logger.error(f"File too large to encode: {file_path}")
            return None
        except Exception as e:
            logger.error(f"Failed to encode file {file_path}: {str(e)}")
            return None
    
    def login_via_stir_pass(
        self, 
        username: str, 
        password: str, 
        session: requests.Session
    ) -> DidoxResponse:
        """Login via STIR pass with improved error handling"""
        if not username or not password:
            return DidoxResponse(success=False, error="Username and password are required")
        
        headers = {
            "Partner-Authorization": self.settings["partner_token"]
        }
        payload = {
            "username": username.strip(),
            "password": password.strip()
        }
        response = self._make_request(
            method="POST",
            endpoint=f"/v1/auth/{username.strip()}/password/ru",
            session=session,
            headers=headers,
            json_data=payload
        )
        settings = SiteSettings.load()
        if response.success:
            settings.didox_user_token = response.data.get("token")
            settings.didox_user_updated_at = timezone.now()
            settings.save(update_fields=['didox_user_token', 'didox_user_updated_at'])
            self._settings["user_token"] = settings.didox_user_token
            self._settings["token_updated_at"] = settings.didox_user_updated_at
            logger.info(f"Successfully logged in user: {username}")
        else:
            logger.error(f"Login failed for user: {username}")
            
        return response
    
    def login_via_company(self, session:requests.Session, token:str) -> DidoxResponse:
        """Login via company with improved error handling"""
        if not token:
            return DidoxResponse(success=False, error="Token is required")

        headers = {
            "Partner-Authorization": self.settings["partner_token"],
            "user-key": token
        }

        response = self._make_request(
            method="POST",
            endpoint="/v1/auth/company/200523356/login/ru",
            session=session,
            headers=headers
        )

        if response.success:
            logger.info(f"Successfully logged in company with token: {token}")
        else:
            logger.error(f"Login failed for company with token: {token}")

        return response

    def get_buyer_data(self, tin: str, session: requests.Session) -> DidoxResponse:
        """Get buyer data by TIN with validation"""
        if not tin or not tin.strip():
            return DidoxResponse(success=False, error="TIN is required")
        
        tin = tin.strip()
        
        response = self._make_request(
            method="GET",
            endpoint=f"/v1/utils/info/{tin}",
            session=session
        )
        
        if response.success:
            logger.info(f"Successfully retrieved buyer data for TIN: {tin}")
        else:
            logger.error(f"Failed to get buyer data for TIN: {tin}")
            
        return response
    
    def create_document(
        self,
        user_key: str,
        document_data: Dict,
        file_base64: str,
        session: requests.Session
    ) -> DidoxResponse:
        """Create document with improved payload structure"""
        if not user_key:
            return DidoxResponse(success=False, error="User key is required")

        if not file_base64:
            return DidoxResponse(success=False, error="File content is required")

        headers = {
            "Partner-Authorization": self.settings["partner_token"],
            "user-key": user_key
        }

        payload = {
            "data": document_data,
            "document": file_base64
        }

        response = self._make_request(
            method="POST",
            endpoint="/v1/documents/000/create",
            session=session,
            headers=headers,
            json_data=payload
        )

        if response.success:
            logger.info("Document created successfully")
        else:
            logger.error("Failed to create document")

        return response

    def create_document_007(
        self,
        user_key: str,
        document_data: Dict,
        session: requests.Session
    ) -> DidoxResponse:
        """Create 007 type document (free-form document with Parts)"""
        if not user_key:
            return DidoxResponse(success=False, error="User key is required")

        headers = {
            "Partner-Authorization": self.settings["partner_token"],
            "user-key": user_key
        }

        response = self._make_request(
            method="POST",
            endpoint="/v1/documents/007/create/uz",
            session=session,
            headers=headers,
            json_data=document_data
        )

        if response.success:
            logger.info("007 Document created successfully")
        else:
            logger.error(f"Failed to create 007 document: {response.error}")

        return response
    
    
    def create_document_full_process_with_payload(
        self, 
        buyer_tin: str, 
        file_path: Union[str, Path],
        document_payload: Dict[str, Any]
    ) -> DidoxResponse:
        """Complete document creation process with custom payload"""
        user_key = self.settings.get("user_token")
        if not buyer_tin or not buyer_tin.strip():
            return DidoxResponse(success=False, error="Buyer TIN is required")
        
        if not file_path:
            return DidoxResponse(success=False, error="File path is required")
        
        if not document_payload:
            return DidoxResponse(success=False, error="Document payload is required")
        print(file_path, "file_path")
        file_base64 = self.encode_file_to_base64(file_path)
        if not file_base64:
            return DidoxResponse(success=False, error="Failed to encode file")
        
        with self.get_session() as session:
            didox_user_token_updated_at = self.settings.get("token_updated_at")
            if (not didox_user_token_updated_at) or (timezone.now() - didox_user_token_updated_at > timedelta(minutes=360)):
                login_response = self.login_via_stir_pass(
                    "50708045210022",
                    "QoOm07082004..",
                    session
            )
                if not login_response.success:
                    return login_response
                
                user_key = login_response.data.get("token") if login_response.data else None
                if not user_key:
                    return DidoxResponse(success=False, error="User key not found in login response")

                login_response = self.login_via_company(
                    session,
                    user_key
                )
                if not login_response.success:
                    return login_response
            print(document_payload, "document_payload")
            document_response = self.create_document(
                user_key, 
                document_payload, 
                file_base64, 
                session
            )
            
            return document_response

    def create_document_007_full_process(
        self,
        document_payload: Dict[str, Any]
    ) -> DidoxResponse:
        """Complete 007 document creation process (free-form document with Parts)"""
        user_key = self.settings.get("user_token")

        if not document_payload:
            return DidoxResponse(success=False, error="Document payload is required")

        with self.get_session() as session:
            didox_user_token_updated_at = self.settings.get("token_updated_at")
            if (not didox_user_token_updated_at) or (timezone.now() - didox_user_token_updated_at > timedelta(minutes=360)):
                login_response = self.login_via_stir_pass(
                    "50708045210022",
                    "QoOm07082004..",
                    session
                )
                if not login_response.success:
                    return login_response

                user_key = login_response.data.get("token") if login_response.data else None
                if not user_key:
                    return DidoxResponse(success=False, error="User key not found in login response")

                login_response = self.login_via_company(
                    session,
                    user_key
                )
                if not login_response.success:
                    return login_response

            logger.info(f"Creating 007 document with payload: {document_payload}")
            document_response = self.create_document_007(
                user_key,
                document_payload,
                session
            )

            return document_response

    def get_signed_self_documents(
        self,
        user_key: str,
        session: requests.Session,
        last_updated_at: Optional[str] = None
    ) -> DidoxResponse:
        """Get documents sent by you that are waiting for user signature"""
        if not user_key:
            return DidoxResponse(success=False, error="User key is required")
        
        headers = {
            "Partner-Authorization": self.settings["partner_token"],
            "user-key": user_key
        }

        # Parameters for filtering documents
        params = {
            "owner": 1,  # Outgoing documents (sent by you)
            "status": "1",  # STATUS_SIGNED_SELF (1) - waiting for signature
            "limit": 100  # Maximum allowed limit
        }
        
        # Add date filter if last_updated_at is provided
        if last_updated_at:
            params["dateFromUpdated"] = last_updated_at
        
        response = self._make_request(
            method="GET",
            endpoint="/v2/documents",
            session=session,
            headers=headers,
            params=params
        )
        
        if response.success:
            logger.info(f"Successfully retrieved documents waiting for signature. Total: {response.data.get('total', 0)}")
        else:
            logger.error("Failed to retrieve documents waiting for signature")
            
        return response

    def get_all_pending_documents(
        self,
        user_key: str,
        session: requests.Session,
        last_updated_at: Optional[str] = None,
        page: int = 1,
        limit: int = 100
    ) -> DidoxResponse:
        """Get all documents waiting for signature with pagination support"""
        if not user_key:
            return DidoxResponse(success=False, error="User key is required")
        
        headers = {
            "Partner-Authorization": self.settings["partner_token"],
            "user-key": user_key
        }

        # Parameters for filtering documents
        params = {
            "owner": 1,  # Outgoing documents (sent by you)
            "status": "1,2",  # STATUS_SIGNAED_SELF (1) and STATUS_SIGNED_PARTY (2) - waiting for signature
            "page": page,
            "limit": min(limit, 100)  # Max 100 per API docs
        }
        
        # Add date filter if last_updated_at is provided
        if last_updated_at:
            params["dateFromUpdated"] = last_updated_at
        
        response = self._make_request(
            method="GET",
            endpoint="/v2/documents",
            session=session,
            headers=headers,
            params=params
        )
        
        if response.success:
            total_docs = response.data.get('total', 0)
            current_page_count = len(response.data.get('data', []))
            logger.info(f"Retrieved {current_page_count} documents from page {page}. Total available: {total_docs}")
        else:
            logger.error(f"Failed to retrieve documents for page {page}")
            
        return response

    def get_all_documents_full_process(
        self,
        last_updated_at: Optional[str] = None
    ) -> DidoxResponse:
        """Complete process to get all pending documents with automatic login"""
        user_key = self.settings.get("user_token")
        
        with self.get_session() as session:
            # Check if login is needed
            didox_user_token_updated_at = self.settings.get("token_updated_at")
            if (not didox_user_token_updated_at) or (timezone.now() - didox_user_token_updated_at > timedelta(minutes=360)):
                login_response = self.login_via_stir_pass(
                    "50708045210022",
                    "QoOm07082004..",
                    session
                )
                if not login_response.success:
                    return login_response
                
                user_key = login_response.data.get("token") if login_response.data else None
                if not user_key:
                    return DidoxResponse(success=False, error="User key not found in login response")

                login_response = self.login_via_company(session, user_key)
                if not login_response.success:
                    return login_response

            # Get all pending documents with pagination
            all_documents = []
            page = 1
            
            while True:
                response = self.get_all_pending_documents(
                    user_key=user_key,
                    session=session,
                    last_updated_at=last_updated_at,
                    page=page,
                    limit=100
                )
                
                if not response.success:
                    return response
                
                documents = response.data.get('data', [])
                all_documents.extend(documents)
                
                # Check if there are more pages
                next_page_url = response.data.get('next_page_url')
                if not next_page_url or not documents:
                    break
                    
                page += 1
            
            return DidoxResponse(
                success=True,
                data={
                    'data': all_documents,
                    'total': len(all_documents),
                    'pages_processed': page
                }
            )

def create_didox_client(timeout: int = 30) -> DidoxClient:
    """Factory function to create DIDOX client"""
    return DidoxClient(timeout=timeout)


def search_organization_by_inn(inn: str):
    """Search organization by INN"""
    from apps.organizations.models import Organization
    
    try:
        organization = Organization.objects.get(tin=inn)
        return organization
    except Organization.DoesNotExist:
        return None
    except Exception as e:
        logger.error(f"Error searching organization by INN {inn}: {str(e)}")
        return None


def get_user_from_organization(organization):
    """Get user from organization"""
    if organization and hasattr(organization, 'user'):
        return organization.user
    return None


def create_contract_number():
    """Generate unique contract number"""
    import uuid
    from django.utils import timezone
    
    timestamp = timezone.now().strftime('%Y%m%d%H%M%S')
    short_uuid = str(uuid.uuid4())[:8]
    return f"CONTRACT-{timestamp}-{short_uuid}"


def prepare_consulting_document_payload(contract, buyer_organization):
        """Prepare document payload for DIDOX - for consulting services"""
        current_date = timezone.now().strftime('%Y-%m-%d')
        document_no = f"DOC-{uuid.uuid4().hex[:8].upper()}"
        contract_no = f"CONTRACT-{uuid.uuid4().hex[:8].upper()}"
        
        return {
            "Document": {
                "DocumentNo": document_no,
                "DocumentDate": current_date,
                "DocumentName": f"Service Contract - Consulting Services"
            },
            "ContractDoc": {
                "ContractNo": contract_no,
                "ContractDate": current_date
            },
            "SellerTin": buyer_organization.branch.inn,
            "Seller": {
                "Name": buyer_organization.branch.name,
                "BranchCode": "",
                "BranchName": "",
                "Address": buyer_organization.branch.address
            },
            "BuyerTin": buyer_organization.tin,
            "Buyer": {
                "Name": buyer_organization.name,
                "Address": buyer_organization.address,
                "BranchCode": "",
                "BranchName": ""
            }
        }


def generate_contract_document(contract, organization):
    """Generate contract document using existing template system"""
    try:
        from apps.contracts.api.utils import generate_financial_report
        from django.conf import settings
        
        # Prepare context for contract template
        context = {
            "contractNum": contract.contract_number or 1,
            "day": timezone.now().day,
            "month": UZ_MONTHS[int(timezone.now().month)],
            "city": organization.city if organization and hasattr(organization, "city") else "Toshkent",
            "region": organization.district.region.regionName if organization and hasattr(organization, "district") and hasattr(organization.district, "region") and hasattr(organization.district.region, "regionName") else "Toshkent",
            "shefName": (getattr(contract, "user", None).full_name if getattr(contract, "user", None) and hasattr(contract.user, "full_name") else (getattr(contract, "created_by", None).full_name if getattr(contract, "created_by", None) and hasattr(contract.created_by, "full_name") else "Unknown Shef")),
            "orgName": organization.name if organization and hasattr(organization, "name") else "Unknown Organization",
            "directorName": (getattr(contract, "user", None).full_name if getattr(contract, "user", None) and hasattr(contract.user, "full_name") else (getattr(contract, "created_by", None).full_name if getattr(contract, "created_by", None) and hasattr(contract.created_by, "full_name") else "Unknown Director")),
            "serviceName": "Konsulting xizmatlari",
            "serviceValue": f"1 ta {getattr(getattr(contract, 'package', None), 'name_uz', getattr(getattr(contract, 'package', None), 'name', ''))}",
            "servicePercent": 12,
            "serviceAmount": float(getattr(contract, "total_amount", 0)) * 12 / 100,
            "serviceOverallScore": float(getattr(contract, "total_amount", 0)) * 112 / 100,
            "amountNum": float(getattr(contract, "total_amount", 0)),
            "amountChar": num_to_words_uz(int(getattr(contract, "total_amount", 0))),
            "ijrochi": contract.created_by.full_name if contract.created_by else '',
        }
        
        import asyncio
        pdf_path = asyncio.run(generate_financial_report(
            context=context,
            lang="uz",
            media_root=settings.MEDIA_ROOT,
            BASE_DIR=settings.BASE_DIR
        ))
        
        # Save PDF to contract file field
        if pdf_path and os.path.exists(pdf_path):
            with open(pdf_path, 'rb') as f:
                contract.file.save(
                    f"contract_{contract.contract_number}.pdf",
                    ContentFile(f.read()),
                    save=True
                )
            
            try:
                os.remove(pdf_path)
            except:
                pass
                
            logger.info(f"Contract document generated for {contract.contract_number}")
            return True
        
        return False
        
    except Exception as e:
        logger.error(f"Error generating contract document: {str(e)}")
        return False


def num_to_words_uz(num):
    """Convert number to words in Uzbek - simple implementation"""
    try:
        # Try using existing num2word_uz if available
        from apps.contracts.api.utils import num_to_words_uz as existing_converter
        return existing_converter(num)
    except:
        # Fallback simple implementation
        ones = ['', 'bir', 'ikki', 'uch', 'tort', 'besh', 'olti', 'yetti', 'sakkiz', 'toqqiz']
        teens = ['on', 'on bir', 'on ikki', 'on uch', 'on tort', 'on besh', 
                'on olti', 'on yetti', 'on sakkiz', 'on toqqiz']
        tens = ['', '', 'yigirma', 'ottiz', 'qirq', 'ellik', 'oltmish', 'yetmish', 'sakson', 'toqson']
        
        if num == 0:
            return 'nol'
        
        if num < 10:
            return ones[num]
        elif num < 20:
            return teens[num - 10]
        elif num < 100:
            return tens[num // 10] + (' ' + ones[num % 10] if num % 10 != 0 else '')
        elif num < 1000:
            return ones[num // 100] + ' yuz' + (' ' + num_to_words_uz(num % 100) if num % 100 != 0 else '')
        elif num < 1000000:
            return num_to_words_uz(num // 1000) + ' ming' + (' ' + num_to_words_uz(num % 1000) if num % 1000 != 0 else '')
        else:
            return str(num)  # Fallback for large numbers


def create_consulting_contract(user, organization, total_amount, service_description, notes=None, created_by=None):
        from apps.contracts.models import Contract
        from decimal import Decimal
        
        # Create contract instance
        contract = Contract.objects.create(
            contract_number=create_contract_number(),
            user=user,
            package=ServicePackage.objects.first(),
            total_amount=Decimal(str(total_amount)),
            notes=notes or service_description,
            created_by=created_by,
            status='created'
        )
        
        # Generate contract document
        if generate_contract_document(contract, organization):
            logger.info(f"Consulting contract {contract.contract_number} created and document generated")
        else:
            logger.warning(f"Contract {contract.contract_number} created but document generation failed")
        
        return contract
        


def send_contract_to_didox(contract, buyer_inn):
    """Send contract to DIDOX"""
    try:
        # Search organization
        organization = search_organization_by_inn(buyer_inn)
        if not organization:
            return DidoxResponse(success=False, error=f"Organization with INN {buyer_inn} not found")
        
        # Prepare document payload for consulting services
        document_payload = prepare_consulting_document_payload(contract, organization)
        print(document_payload, "document_payload")
        # Create DIDOX client
        client = create_didox_client()
        
        # Send to DIDOX
        if contract.file and contract.file.path:
            response = client.create_document_full_process_with_payload(
                buyer_tin=buyer_inn,
                file_path=contract.file.path,
                document_payload=document_payload
            )
            
            if response.success:
                # Save DIDOX response data
                contract.didox_contract_data = response.data
                if response.data and 'id' in response.data:
                    contract.didx_contract_id = response.data['id']
                contract.save(update_fields=['didox_contract_data', 'didx_contract_id'])
                logger.info(f"Contract {contract.contract_number} sent to DIDOX successfully")
            
            return response
        else:
            return DidoxResponse(success=False, error="Contract file not found")
            
    except Exception as e:
        error_msg = f"Error sending contract to DIDOX: {str(e)}"
        logger.error(error_msg)
        return DidoxResponse(success=False, error=error_msg)

