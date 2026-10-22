import axiosT from "./baseUrl";

/** TRADEINT_DIZAYN TI-01 / TI-03: umumiy qidiruv va raqamlar qatori (backend `trade_hub.py`). */
export interface TradeSummary {
  records: number;
  products: number;
  countries: number;
  years: number[];
  years_count: number;
  year_from: number;
  year_to: number;
  latest: { year: number; period: string; period_label: string };
  /** {yil: ogohlantirish} — ma'lumoti to'liq bo'lmagan yillar */
  quality: Record<string, string>;
  source: string;
}

export interface TradeSearchResult {
  products: { code: string; name: string; level: number }[];
  countries: { id: number; name: string; iso: string | null }[];
}

let summaryPromise: Promise<TradeSummary> | null = null;
/** Sahifa davomida bir marta so'raladi. */
export const fetchTradeSummary = () => {
  summaryPromise ??= axiosT.get<TradeSummary>("/additional-services/external-trade/summary/").then((r) => r.data).catch((e) => {
    summaryPromise = null;
    throw e;
  });
  return summaryPromise;
};

export const searchTrade = async (q: string, signal?: AbortSignal) =>
  (await axiosT.get<TradeSearchResult>("/additional-services/external-trade/search/", { params: { q }, signal })).data;
