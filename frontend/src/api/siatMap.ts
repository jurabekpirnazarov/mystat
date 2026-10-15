import axiosT from "./baseUrl";

/** SIAT_KARTA_TAHLIL KR-05: karta API'si (ma'lumot backend bazasidan, SIAT'ga brauzerdan murojaat yo'q). */

export type GeoLevel = "region" | "district";

export interface SiatSource {
  name: string;
  license: string;
  url: string;
}

export interface MapIndicator {
  key: string;
  siat_id: number | null;
  kind: "source" | "group" | "derived";
  code: string;
  name: string;
  unit: string;
  theme: string;
  geo_level: GeoLevel;
  periodicity: "Y" | "Q" | "M" | "other";
  periods: string[];
  last_period: string;
  preliminary_years: number[];
  higher_is_better: boolean | null;
  diverging_center: number | null;
  source_updated_at: string | null;
  last_synced_at: string | null;
  siat_url: string;
  derived_from: string;
  notes: string;
  methodology: string;
  breakdowns: { code: string; name: string }[];
}

export interface MapCatalog {
  themes: { key: string; label: string }[];
  indicators: MapIndicator[];
  source: SiatSource;
}

export interface MapItem {
  code: string;
  name: string;
  kind: string;
  value: number | null;
  missing: boolean;
  preliminary: boolean;
}

export interface MapValues {
  indicator: string;
  name: string;
  unit: string;
  level: GeoLevel;
  parent: { code: string; name: string; value: number | null } | null;
  breakdown: { code: string; name: string } | null;
  period: string;
  periods: string[];
  preliminary: boolean;
  republic: number | null;
  items: MapItem[];
  scale: { min: number | null; max: number | null; quantiles: number[]; current_quantiles: number[]; diverging_center: number | null };
  higher_is_better: boolean | null;
  siat_url: string;
  source: SiatSource;
}

export interface TerritoryIndicator {
  key: string;
  name: string;
  theme: string;
  unit: string;
  period: string;
  value: number;
  preliminary: boolean;
  rank: number | null;
  of: number;
  higher_is_better: boolean | null;
  average: number | null;
  vs_average_pct: number | null;
  republic: number | null;
  siat_url: string;
  derived_from: string;
  series: { period: string; value: number | null }[];
}

export interface TerritoryCard {
  soato: string;
  name: string;
  level: GeoLevel;
  kind: string;
  parent: { soato: string; name: string } | null;
  area_km2: number | null;
  profile: string | null;
  children: number;
  indicators: TerritoryIndicator[];
  source: SiatSource;
}

export interface TerritoryName {
  code: string;
  level: GeoLevel;
  kind: string;
  parent: string | null;
  names: Record<"uz" | "ru" | "en" | "uzc", string>;
}

export interface ValuesParams {
  indicator: string;
  period?: string;
  level: GeoLevel;
  parent?: string;
  breakdown?: string;
}

const clean = (p: ValuesParams) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== ""));

export const fetchMapCatalog = async (signal?: AbortSignal) =>
  (await axiosT.get<MapCatalog>("/common/map/indicators/", { signal })).data;

export const fetchMapValues = async (params: ValuesParams, signal?: AbortSignal) =>
  (await axiosT.get<MapValues>("/common/map/values/", { params: clean(params), signal })).data;

export const fetchTerritory = async (soato: string, signal?: AbortSignal) =>
  (await axiosT.get<TerritoryCard>(`/common/map/territory/${soato}/`, { signal })).data;

export const fetchTerritories = async () =>
  (await axiosT.get<{ items: TerritoryName[] }>("/common/map/territories/")).data.items;

/** KR-12: joriy ko'rinish jadvali (backend tayyorlaydi: CSV — UTF-8 BOM, XLSX). */
export async function downloadMapTable(params: ValuesParams, kind: "csv" | "xlsx") {
  const res = await axiosT.get("/common/map/values/", { params: { ...clean(params), export: kind }, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `siat-${params.indicator}-${params.period ?? "oxirgi"}.${kind}`;
  a.click();
  URL.revokeObjectURL(url);
}
