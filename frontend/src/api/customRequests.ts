import axiosT from "./baseUrl";

export interface CustomRequestOptions {
  data_types: { code: string; name: string; indicators: string[]; available: boolean }[];
  regions: { id: number; name: string }[];
  max_years: number;
  is_staff: boolean;
}

export interface CustomRequestSpec {
  data_type: string;
  indicators: string[];
  year_from: number;
  year_to: number;
  regions: number[];
  output_format: "xlsx" | "pdf";
  urgent: boolean;
  comment?: string;
}

export interface CustomRequest extends CustomRequestSpec {
  id: number;
  data_type_label: string;
  region_names: string[];
  price_bhm: string;
  price_sum: string;
  approved_price_sum: string | null;
  status: "created" | "priced" | "in_progress" | "completed" | "cancelled";
  status_label: string;
  staff_comment: string;
  result_file: string | null;
  user_name: string;
  assigned_to_name: string | null;
  created_at: string;
  is_synthetic: boolean;
}

const base = "/services/custom-requests/";

export const fetchCustomOptions = async () => (await axiosT.get<CustomRequestOptions>(`${base}options/`)).data;
export const quoteCustomRequest = async (spec: CustomRequestSpec) =>
  (await axiosT.post<{ price_bhm: string; bhm_value: string; price_sum: string }>(`${base}quote/`, spec)).data;
export const createCustomRequest = async (spec: CustomRequestSpec) => (await axiosT.post<CustomRequest>(base, spec)).data;
export const listCustomRequests = async (staff = false) =>
  (await axiosT.get<CustomRequest[]>(base, { params: staff ? { scope: "staff" } : {} })).data;
export const cancelCustomRequest = async (id: number) => (await axiosT.delete<CustomRequest>(`${base}${id}/`)).data;
export const staffUpdateCustomRequest = async (id: number, data: FormData | Record<string, unknown>) =>
  (await axiosT.patch<CustomRequest>(`${base}${id}/`, data)).data;
