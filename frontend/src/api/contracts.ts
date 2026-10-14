import axiosT from "./baseUrl";

export interface TimelineStep {
  key: "created" | "sent" | "client_signed" | "admin_signed" | "paid" | "active";
  label: string;
  done: boolean;
  date: string | null;
  note: string | null;
}

export interface ContractTimeline {
  status: string;
  cancelled: boolean;
  current: TimelineStep["key"] | null;
  steps: TimelineStep[];
  history: { status: string; date: string }[];
}

export interface Pricing {
  bhm_value: string;
  base_bhm_count: number;
  multiplier: number;
  base: string;
  price: string;
  vat_percent: number;
  vat: string;
  total: string;
}

export interface ContractPreview {
  template_found: boolean;
  package: { id: number; name: string };
  pricing: Pricing;
  requisites: Record<"name" | "tin" | "address" | "district" | "sector" | "director" | "seller", string | null>;
  parts: { title: string; body: string }[];
}

export const fetchContractTimeline = async (id: number) =>
  (await axiosT.get<ContractTimeline>(`/contracts/${id}/timeline/`)).data;

export const fetchContractPreview = async (servicePackageId: number) =>
  (await axiosT.post<ContractPreview>("/contracts/preview/", { service_package_id: servicePackageId })).data;

export const createContract = async (servicePackageId: number) =>
  (await axiosT.post("/contracts/create/", { service_package_id: servicePackageId, requisites_confirmed: true })).data;
