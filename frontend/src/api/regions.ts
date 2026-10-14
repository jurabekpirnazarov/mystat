import axiosT from "./baseUrl";
import type { DataSource } from "../components/ui";

export interface RegionCard {
  key: string;
  label: string;
  unit: string;
  value: number;
  change_pct: number | null;
  republic: number | null;
  vs_average_pct: number | null;
  assessment: "good" | "bad" | null;
  source: "real" | "synthetic";
}

export interface RegionProfile {
  region: { id: number; code: string; name: string; name_uz: string };
  year: number | null;
  cards: RegionCard[];
  dynamics: Record<string, { year: number; value: number }[]>;
  districts: ({ id: number; name: string } & Record<string, number | string>)[];
  districts_count: number;
  industry: { companies: number; top_categories: { name: string; companies: number }[] } | null;
  trade: { year: number; period: string; export: number; import: number; unit: string } | null;
  data_source: DataSource;
}

export interface RegionMap {
  indicator: string;
  label: string;
  unit: string;
  year: number | null;
  items: { region_id: number; code: string; name: string; value: number | null }[];
  data_source: DataSource;
  indicators?: { key: string; label: string }[];
}

export const fetchRegionProfile = async (id: number) => (await axiosT.get<RegionProfile>(`/common/regions/${id}/profile/`)).data;
export const fetchRegionMap = async (indicator: string) => (await axiosT.get<RegionMap>("/common/regions/map/", { params: { indicator } })).data;
