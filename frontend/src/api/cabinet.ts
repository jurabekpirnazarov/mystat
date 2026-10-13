import axiosT from "./baseUrl";

export interface CabinetSummary {
  package: {
    id: number;
    name_uz: string;
    name_ru: string;
    started_at: string | null;
    duration_days: number;
    expires_at: string | null;
  } | null;
  limits: { id: number; name_uz: string; package_service_id: number; limit: number; used: number }[];
  contracts: { total: number; by_status: Record<string, number> };
  open_requests: number;
  unread_notifications: number;
  usage_by_month: { month: string; count: number }[];
  recent_activity: { type: "usage" | "book_order" | "request" | "contract"; title: string; status?: string; date: string }[];
}

export interface Payment {
  id: number;
  date: string;
  amount: string;
  status: "waiting" | "paid" | "failed" | "canceled";
  purpose: "book" | "contract" | "service";
  title: string;
  provider: string;
}

export interface ServiceRequest {
  id: number;
  status: "created" | "pending" | "completed" | "cancelled";
  contract: number;
  contract_number: string;
  package_item: number;
  package_item_name: string;
  client_input_text: string | null;
  client_file: string | null;
  admin_input_text: string | null;
  admin_file: string | null;
  created_at: string;
  updated_at: string;
  is_synthetic: boolean;
}

export interface ActivityPlan {
  id: number;
  year: number;
  month: number;
  plan_count: number;
  service: number;
  service_name: string;
  district: number;
  district_name: string;
  region_name: string | null;
  is_synthetic: boolean;
}

export interface ContractShort {
  id: number;
  contract_number: string;
  status: string;
  package: number;
}

export interface PackageServiceGroup {
  package_service: { id: number; name_uz: string; slug: string | null };
  items: { id: number; name_uz: string; limit: number }[];
}

export const fetchCabinetSummary = async () => (await axiosT.get<CabinetSummary>("/accounts/me/summary/")).data;

export const fetchMyPayments = async (status?: string) =>
  (await axiosT.get<Payment[]>("/accounts/me/payments/", { params: status ? { status } : {} })).data;

export const fetchServiceRequests = async () => (await axiosT.get<ServiceRequest[]>("/services/service-request/")).data;

export const createServiceRequest = async (payload: { contract: number; package_item: number; client_input_text: string; client_file?: File | null }) => {
  const form = new FormData();
  form.append("contract", String(payload.contract));
  form.append("package_item", String(payload.package_item));
  form.append("client_input_text", payload.client_input_text);
  if (payload.client_file) form.append("client_file", payload.client_file);
  return (await axiosT.post<ServiceRequest>("/services/service-request/", form)).data;
};

export const fetchActivityPlans = async (year: number) =>
  (await axiosT.get<ActivityPlan[]>("/services/activity-plans/", { params: { year } })).data;

export const fetchMyContracts = async () =>
  (await axiosT.get<{ results: ContractShort[] }>("/contracts/")).data.results;

/** me/package-items: guruhlar + oxirgi elementda faol shartnoma ({contract_id, contract_number}) */
export const fetchPackageServiceGroups = async (): Promise<{ groups: PackageServiceGroup[]; contractId: number | null }> => {
  try {
    const data = (await axiosT.get<Array<PackageServiceGroup | { contract_id: number }>>("/accounts/me/package-items/")).data;
    const groups = data.filter((row): row is PackageServiceGroup => "package_service" in row);
    const contractRow = data.find((row): row is { contract_id: number } => "contract_id" in row);
    return { groups, contractId: contractRow?.contract_id ?? null };
  } catch {
    return { groups: [], contractId: null }; // faol shartnoma bo'lmasa backend 404 qaytaradi
  }
};

export const fetchMyRole = async (): Promise<string | null> => {
  const data = (await axiosT.get("/accounts/profile/")).data;
  return (data?.data ?? data)?.role ?? null;
};

export const respondToServiceRequest = async (id: number, payload: { status: ServiceRequest["status"]; admin_input_text: string; admin_file?: File | null }) => {
  const form = new FormData();
  form.append("status", payload.status);
  form.append("admin_input_text", payload.admin_input_text);
  if (payload.admin_file) form.append("admin_file", payload.admin_file);
  return (await axiosT.patch<ServiceRequest>(`/services/service-response/${id}/`, form)).data;
};
