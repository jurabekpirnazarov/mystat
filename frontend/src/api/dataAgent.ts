import axiosT from "./baseUrl";

/** AI agent bilan ma'lumot savdosi: topish, narxlash, qabul/rad, tarix va yuklash. Narxni server hisoblaydi. */
export interface AgentSample {
  columns: string[];
  rows: (string | number)[][];
  coverage: string;
}

export interface AgentPreview {
  id: number;
  title: string;
  columns: string[];
  rows: (string | number | null)[][];
  total: number;
  offset: number;
  chart: { year: number; Eksport?: number; Import?: number }[];
  unit: string;
}

export interface AgentItem {
  id: string;
  kind: string;
  title: string;
  description: string;
  rows: number;
  /** so'm, chegirmadan oldin */
  price: number;
  owned: boolean;
  purchase_id: number | null;
  /** Sotib olishdan oldin: ustunlar, qamrov va yashirilgan qatorlar (haqiqiy qiymat yo'q). Sotib olingan bo'lsa null */
  sample: AgentSample | null;
}

export interface AgentQuestionOption {
  value: string;
  label: string;
  suggested?: boolean;
}

export interface AgentQuote {
  query: string;
  found: boolean;
  message?: string;
  login_required: boolean;
  questions: { id: string; text: string; options: AgentQuestionOption[] }[];
  product?: { code: string; name: string };
  flows: number[];
  items: AgentItem[];
  subtotal?: number;
  discount_pct?: number;
  discount?: number;
  total?: number;
  balance?: number;
  enough?: boolean;
  /** Chegirma %: nechta to'plam tanlansa (server siyosati) */
  bundle?: Record<string, number>;
  round_to?: number;
  /** Ma'lumot sifati ogohlantirishlari (to'liq bo'lmagan yillar) */
  warnings?: string[];
  offer_id: number | null;
  expires_at: string | null;
}

export interface AgentPurchase {
  id: number;
  kind: string;
  title: string;
  query: string;
  rows: number;
  price: number;
  created_at: string;
  hs: string;
  flows: string[];
  periods: Record<string, string>;
}

export const agentQuote = async (params: { query: string; hs?: string; flows?: number[] }, signal?: AbortSignal) =>
  (await axiosT.post<AgentQuote>("/credits/agent/quote/", params, { signal })).data;

export const agentAccept = async (offerId: number, items: string[]) =>
  (await axiosT.post<{ purchases: AgentPurchase[]; charged: number; balance: number }>("/credits/agent/accept/", { offer_id: offerId, items })).data;

export const agentDecline = async (offerId: number) => (await axiosT.post("/credits/agent/decline/", { offer_id: offerId })).data;

export const agentHistory = async () => (await axiosT.get<{ results: AgentPurchase[] }>("/credits/agent/history/")).data.results;

export const agentPreview = async (id: number, offset = 0, limit = 25) =>
  (await axiosT.get<AgentPreview>(`/credits/agent/purchases/${id}/preview/`, { params: { offset, limit } })).data;

/** Sotib olingan to'plamni yuklab oladi (qayta to'lovsiz). */
export const agentDownload = async (purchase: Pick<AgentPurchase, "id" | "kind" | "hs">, file: "xlsx" | "csv") => {
  const res = await axiosT.get(`/credits/agent/purchases/${purchase.id}/download/`, { params: { file }, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `savdo-${purchase.kind}-hs${purchase.hs}.${file}`;
  a.click();
  URL.revokeObjectURL(url);
};
