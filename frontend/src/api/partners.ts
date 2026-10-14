import axiosT from "./baseUrl";

export interface PartnerFilters {
  q?: string;
  region?: number;
  district?: string;
  category?: number;
  legal_form?: string;
  page?: number;
}

export interface PartnerRow {
  stir: string;
  name: string;
  legal_form: { code: string; name: string };
  region: string | null;
  region_code: string | null;
  district: string | null;
  products: number;
  categories: number;
}

export interface PartnerFilterOptions {
  regions: { id: number; code: string; name: string }[];
  districts: string[];
  categories: { id: number; name: string; parent: number | null }[];
  legal_forms: { code: string; name: string }[];
}

export interface SavedQuery {
  id: number;
  kind: "trade" | "partners";
  name: string;
  params: Record<string, string | number>;
  created_at: string;
}

const clean = (f: PartnerFilters) => Object.fromEntries(Object.entries(f).filter(([, v]) => v !== undefined && v !== ""));

export const searchPartners = async (f: PartnerFilters) =>
  (await axiosT.get<{ count: number; page: number; page_size: number; results: PartnerRow[] }>("/additional-services/partners/search/", { params: clean(f) })).data;

export const partnersMap = async (f: PartnerFilters) =>
  (await axiosT.get<{ region_code: string; region_id: number; region: string; count: number }[]>("/additional-services/partners/map/", { params: clean({ ...f, page: undefined }) })).data;

export const partnerFilterOptions = async (region?: number) =>
  (await axiosT.get<PartnerFilterOptions>("/additional-services/partners/filters/", { params: region ? { region } : {} })).data;

export const exportPartners = async (f: PartnerFilters) => {
  const res = await axiosT.get("/additional-services/partners/export/", { params: clean({ ...f, page: undefined }), responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "korxonalar.xlsx";
  a.click();
  URL.revokeObjectURL(url);
};

export const listSavedQueries = async (kind: SavedQuery["kind"]) =>
  (await axiosT.get<SavedQuery[]>("/additional-services/saved-queries/", { params: { kind } })).data;

export const saveQuery = async (kind: SavedQuery["kind"], name: string, params: Record<string, unknown>) =>
  (await axiosT.post<SavedQuery>("/additional-services/saved-queries/", { kind, name, params })).data;

export const deleteSavedQuery = async (id: number) => axiosT.delete(`/additional-services/saved-queries/${id}/`);
