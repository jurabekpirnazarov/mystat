import axiosT from "./baseUrl";

export type FilterValue = (string | number)[] | { min?: number | string; max?: number | string };

export interface DemographicFilter {
  column: string;
  label: string;
  ui: "range_or_list" | "multi_select" | "multi_select_search" | "radio" | string;
  order?: number;
  options: (string | number)[];
}

export interface DemographicSection {
  slug: string;
  name: string;
  description: string;
  icon: string;
  row_count: number;
  value_column: { name?: string; label?: string };
  filters: DemographicFilter[];
}

export interface DemographicSchema {
  sections: DemographicSection[];
  data_available: boolean;
  is_synthetic: boolean;
}

export interface DemographicDataResponse {
  total: number;
  count: number;
  returned?: number;
  rows: Record<string, string | number | null>[];
  value_column?: string;
  data_available: boolean;
  is_synthetic: boolean;
}

export interface DemographicQuery {
  filters: Record<string, FilterValue>;
  group_by: string[];
  limit?: number;
}

const BASE = "/additional-services/demographics";

export const fetchDemographicSchema = async () => (await axiosT.get<DemographicSchema>(`${BASE}/schema/`)).data;

export const fetchDemographicData = async (slug: string, query: DemographicQuery) =>
  (await axiosT.post<DemographicDataResponse>(`${BASE}/${slug}/data/`, { limit: 5000, ...query })).data;

export const downloadDemographicExcel = async (slug: string, query: DemographicQuery) => {
  const response = await axiosT.post(`${BASE}/${slug}/export/`, query, { responseType: "blob" });
  const url = URL.createObjectURL(response.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `demografik_${slug}.xlsx`;
  a.click();
  URL.revokeObjectURL(url);
};
