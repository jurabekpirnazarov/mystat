import axiosT from "./baseUrl";
import type { Pricing } from "./contracts";

/** KR-41: paket beradigan StatCoin. `monthly` — har oy, `topup` — bir marta (paket muddati). */
export interface PackageStatCoin {
  kind: "monthly" | "topup";
  amount: number;
  plan: string;
  months: number | null;
  /** Paket bilan ochiladigan: tarif darajasiga ko'ra profil bo'limlari va StatCoin xizmatlari (narxi bilan). */
  opens: {
    profile: { level: string; name: string; credits: number }[];
    services: { slug: string; name: string; credits: number }[];
    needs_plan_for_profile: boolean;
  };
}

export interface TariffCompare {
  sector: { id: number; code: string; name: string } | null;
  user_sector_id: number | null;
  sectors: { id: number; code: string; name: string }[];
  packages: { id: number; name: string; pricing: Pricing; statcoin: PackageStatCoin | null }[];
  /** Paket limiti o'rniga StatCoin bilan to'lanadigan xizmatlar (faol narxli). */
  statcoin_services: { slug: string; name: string; credits: number }[];
  rows: { id: number; slug: string | null; name: string; cells: Record<string, { name: string; limit: number; unlimited: boolean }[]> }[];
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
