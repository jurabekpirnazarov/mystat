import axiosT from "./baseUrl";

export type TradeFlow = "export" | "import";

/** Bazadagi TradeData.value birligi. Statistika qo'mitasi tashqi savdoni odatda ming AQSh dollarida beradi —
 *  egasi tomonidan tasdiqlanishi kerak (ISH_REJASI.md, OS-10). */
export const TRADE_VALUE_UNIT = "ming AQSh $";

export interface TradeFlowCountry {
  country_id: number;
  country_name: string;
  country_name_en: string;
  iso_numeric: string | null;
  value: number;
  quantity: number;
  share: number;
  prev_value: number | null;
  change_pct: number | null;
}

export interface TradeFlowsResponse {
  year: number;
  flow: TradeFlow;
  hs: string | null;
  period: string;
  period_label: string;
  total_value: number;
  other_countries_value: number;
  countries_count: number;
  years: number[];
  countries: TradeFlowCountry[];
}

export interface TradeDynamicsPoint {
  year: number;
  period: string;
  period_label: string;
  value: number;
}

const BASE = "/additional-services/external-trade/trade-flows/";

export const fetchTradeFlows = async (params: { flow: TradeFlow; year?: number; hs?: string; limit?: number }) => {
  const query: Record<string, string> = { flow: params.flow, limit: String(params.limit ?? 300) };
  if (params.year) query.year = String(params.year);
  if (params.hs) query.hs = params.hs;
  return (await axiosT.get<TradeFlowsResponse>(BASE, { params: query })).data;
};

export const fetchTradeDynamics = async (flow: TradeFlow, country?: number | null) => {
  const query: Record<string, string> = { flow };
  if (country) query.country = String(country);
  return (await axiosT.get<TradeDynamicsPoint[]>(`${BASE}dynamics/`, { params: query })).data;
};
