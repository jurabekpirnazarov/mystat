import axiosT from "./baseUrl";

/** KORXONA_SCORING.md KR-40: hamyon (kodda `credits`; barcha summalar so'mda). */

export interface CreditLedgerRow {
  id: number;
  kind: "grant" | "spend" | "expire" | "refund" | "adjust";
  kind_name: string;
  amount: number;
  action_code: string;
  object_ref: string;
  object_name: string | null;
  reason: string;
  expires_at: string | null;
  created_at: string;
  by: string | null;
}

export interface CreditUnlockRow {
  stir: string;
  name: string | null;
  level: "basis" | "deep";
  level_name: string;
  expires_at: string;
  days_left: number;
}

export interface CreditsMe {
  wallet: number | null;
  balance: number;
  plan: string;
  plan_name: string;
  expiring: { id: number; left: number; expires_at: string; kind: string; reason: string }[];
  ledger: { count: number; page: number; page_size: number; results: CreditLedgerRow[] };
  unlocks: CreditUnlockRow[];
  prices: Record<string, number>;
}

export interface UnlockResult {
  stir: string;
  level: "basis" | "deep";
  unlocked: boolean;
  charged: number;
  balance: number;
  free?: "owner" | "active";
  expires_at?: string;
}

export const fetchCredits = async (page = 1) => (await axiosT.get<CreditsMe>("/credits/me/", { params: { page } })).data;

export const unlockSection = async (stir: string, level: "basis" | "deep") =>
  (await axiosT.post<UnlockResult>("/credits/unlock/", { stir, level })).data;

/** Balans o'zgarganda sarlavhadagi chip yangilansin (sahifa yangilanmasdan). */
export const CREDITS_CHANGED = "credits:changed";
export const notifyCreditsChanged = (balance?: number) =>
  window.dispatchEvent(new CustomEvent(CREDITS_CHANGED, { detail: { balance } }));

export const PLAN_NAMES: Record<string, string> = {
  "": "Tarifsiz", s50: "Scoring 50", s60: "Scoring 60", s90: "Scoring 90", corp: "Korporativ",
};

/** Summa so'mda: "1 648 000 so'm". */
export const formatSom = (n: number) => `${String(Math.round(n)).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;
export const formatCredits = formatSom;
