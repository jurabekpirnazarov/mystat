import { getRequest } from './request';
import { orginfo_api, classificator_item_api } from './apiUrls';

export interface Address {
  id: number;
  address: string;
  street: string;
  soato: string;
  region_id: number | null;
  sub_region_id: number | null;
  mahalla_id: number | null;
}

export interface Founder {
  name: string;
  share_amount_percent: string;
  share_amount: string;
}

export interface Oked {
  oked: string;
}

export interface OrganizationData {
  id: number;
  okpo: string;
  tin: string;
  reg_o: number;
  reg_date: string;
  reg_nom: string;
  name: string;
  opf: number;
  soogu: string;
  ptp: number;
  priz: number;
  csdp: number;
  total_share_amount: string;
  org_elpochta: string;
  org_phone: string;
  soato: string;
  address: Address;
  status: boolean;
  legal_status: string;
  director_name: string;
  founders: Founder[];
  okeds: Oked[];
}

export interface OrganizationInfoResponse {
  detail: string;
  use_id: number;
  psi_id: number;
  limit: number;
  used_count_after: number;
  service_response: OrganizationData;
}

export interface ClassificatorItem {
  id: number;
  stat_classifier: number;
  parent: number | null;
  name: string;
  name_uz: string;
  name_uz_k: string;
  name_en: string;
  name_ru: string;
  name_qr: string | null;
  code: string;
  code2: string;
  code3: string;
  code4: string;
  order: number;
  status: boolean;
  updated_at: string;
  created_at: string;
}

export interface ClassificatorResponse {
  data: {
    count: number;
    next: string | null;
    previous: string | null;
    page_count: number;
    results: ClassificatorItem[];
  };
}

export const getOrganizationInfo = async (stir: string): Promise<OrganizationInfoResponse> => {
  const response = await getRequest(orginfo_api(stir));
  return response as OrganizationInfoResponse;
};

export const getClassificatorItem = async (stat_classifier_type: string, code: string): Promise<ClassificatorResponse> => {
  const response = await getRequest(classificator_item_api(stat_classifier_type, code));
  return response as ClassificatorResponse;
};