import axiosT from "./baseUrl";
import type { LimitUsage } from "./analytics";

export interface MarketYear {
  year: number;
  period: string;
  period_label: string;
  partial: boolean;
  export_value: number;
  import_value: number;
  export_tonnes: number;
  import_tonnes: number;
  export_price: number | null;
  import_price: number | null;
  export_price_coverage: number | null;
  import_price_coverage: number | null;
  balance: number;
}

export interface MarketCountry {
  country_id: number;
  country: string;
  value: number;
  share: number;
  change_pct: number | null;
}

export interface MarketReport {
  hs: string;
  product: { code: string; name_uz: string | null; name_ru: string | null };
  value_unit: string;
  latest: MarketYear & {
    export_change_pct: number | null;
    import_change_pct: number | null;
    compared_with: number | null;
    export_partners: number;
  };
  dynamics: MarketYear[];
  top_export: MarketCountry[];
  top_import: MarketCountry[];
  concentration: { hhi: number | null; label: string | null } | null;
  growing_markets?: { country: string; value: number; prev_value: number; change_pct: number }[];
  shrinking_markets?: { country: string; value: number; prev_value: number; change_pct: number }[];
  notes: string[];
  full: boolean;
  usage: LimitUsage | null;
}

export interface HsOption {
  code: string;
  name: string;
  level: number;
}

export const fetchMarketReport = async (hs: string, full = false) =>
  (await axiosT.get<MarketReport>("/additional-services/market-report/", { params: { hs, ...(full ? { full: 1 } : {}) } })).data;

export const searchHs = async (q: string) =>
  (await axiosT.get<HsOption[]>("/additional-services/hs-search/", { params: { q } })).data;
