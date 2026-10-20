import axiosT from "./baseUrl";
import type { CompanyScoreShort } from "./companyScores";

/** IHAMKOR_MUQOBIL.md IH-08: kontragent kartasi — bepul, faqat real manbalar (KTUT, hisobotlar, sanoat reyestri). */

export interface CardBadge {
  code: string;
  text: string;
  tone: "good" | "info" | "warn";
  source: string;
  hint?: string;
}

export interface CardPassport {
  name: string | null;
  stir: string;
  okpo: string | null;
  legal_form: string | null;
  region: string | null;
  district: string | null;
  address: string | null;
  in_ktut: boolean;
  sources: { requisites: string; address: string | null };
  as_of: string | null;
  /** Manbada yo'q maydonlar (o'ylab topilmaydi) */
  missing: string[];
}

export interface CardDiscipline {
  available: boolean;
  reports_count: number;
  by_periodicity: Record<string, number>;
  forms: { id: string; form: string; title: string; periodicity: string; deadline_rule: string }[];
  timely_share: number | null;
  timely_note?: string;
  note?: string;
  source: string;
}

export interface CardProduction {
  available: boolean;
  products_count: number;
  products: { code: string; name: string }[];
  categories: { name: string; count: number }[];
  source: string;
  as_of?: string | null;
}

export interface CompanyCard {
  stir: string;
  passport: CardPassport;
  badges: CardBadge[];
  discipline: CardDiscipline;
  production: CardProduction;
  score: CompanyScoreShort | null;
  links: { profile: string; certificate: string };
  note: string;
}

export interface CardSearchRow {
  stir: string;
  name: string;
  district: string | null;
  products: number;
  in_ktut: boolean;
}

export const fetchCompanyCard = async (stir: string, signal?: AbortSignal) =>
  (await axiosT.get<CompanyCard>(`/analytics/company-card/${stir}/`, { signal })).data;

export const searchCompanies = async (q: string, signal?: AbortSignal) =>
  (await axiosT.get<{ results: CardSearchRow[] }>("/analytics/company-card/search/", { params: { q }, signal })).data.results;
