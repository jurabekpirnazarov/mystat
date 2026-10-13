import requests

from apps.common.utils import get_district_by_soato, get_sector_first_parent_by_code
from apps.organizations.models import Organization
from apps.services.api.services import RegisterService, ServiceError, ServiceNotFound




def create_organization(user, legal_info):
    """
    Create or update an organization associated with the user based on legal_info.
    """
    if not legal_info:
        return

    org = getattr(user, 'organization', None)
    if not org:
        org = Organization.objects.create(
            user=user,
            name=legal_info.get("le_name").strip(),
            tin=legal_info.get("tin", ""),
        )

        service = RegisterService()
        registr_org_data = service.get_organization_detail(stir_number=int(legal_info.get("tin", "")))
        print("registr_org_data:", registr_org_data)
        district_soato = registr_org_data.get("soato", "")[:7] if registr_org_data else None
        ifut_code = registr_org_data.get("okeds", [])[0].get("oked") if registr_org_data else None
        address = registr_org_data.get("address").get("address", None) if registr_org_data else ""
        phone = registr_org_data.get("org_phone", None) if registr_org_data else ""
        
        org.district = get_district_by_soato(district_soato) if district_soato else None
        org.sector = get_sector_first_parent_by_code(ifut_code) if ifut_code else None
        org.address = address
        org.phone = phone

        org.save()
