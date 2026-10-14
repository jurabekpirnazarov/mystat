import axiosT from "./baseUrl";
import type { Pricing } from "./contracts";

export interface TariffCompare {
  sector: { id: number; code: string; name: string } | null;
  user_sector_id: number | null;
  sectors: { id: number; code: string; name: string }[];
  packages: { id: number; name: string; pricing: Pricing }[];
  rows: { id: number; name: string; cells: Record<string, { name: string; limit: number; unlimited: boolean }[]> }[];
}

export interface TariffRecommendation {
  package: { id: number; name: string } | null;
  pricing?: Pricing;
  reason?: string;
}

export const fetchTariffCompare = async (sector?: number) =>
  (await axiosT.get<TariffCompare>("/services/tariff-compare/", { params: sector ? { sector } : {} })).data;

export const fetchTariffRecommendation = async (params: { prints: number; bulletins: number; companies: number; sector?: number }) =>
  (await axiosT.get<TariffRecommendation>("/services/tariff-recommend/", { params })).data;
