import axiosT from "./baseUrl";
import type { DataSource } from "../components/ui";
import type { CpiPoint } from "../utils/inflation";

export interface SalaryResponse {
  year: number;
  years: number[];
  unit: string;
  distribution: Record<"median" | "mean" | "p25" | "p75" | "p90", number | null>;
  by_region: { region_id: number; region: string; code: string; median: number }[];
  trend: { year: number; median: number; p25: number; p75: number }[];
  regions: { id: number; name: string }[];
  sectors: { id: number; code: string; name: string }[];
  data_source: DataSource;
}

export interface PriceProduct {
  product: string;
  name: string;
  unit: string;
  price: number | null;
  change_month_pct: number | null;
  change_year_pct: number | null;
  series: (number | null)[];
}

export interface ArticleSummary {
  slug: string;
  topic: string;
  title: string;
  summary: string;
  reading_minutes: number;
  published_at: string;
  cover: string | null;
}

export interface ArticleDetail extends ArticleSummary {
  body: string;
  body_lang: string;
  related: { label: string; to: string }[];
  terms: { slug: string; term: string }[];
}

export interface GlossaryItem {
  slug: string;
  term: string;
  definition: string;
  example: string;
  article: string | null;
}

export interface SurveySummary {
  slug: string;
  title: string;
  description: string;
  is_open: boolean;
  closes_at: string | null;
  responses: number;
  answered: boolean;
}

export interface SurveyDetail {
  slug: string;
  title: string;
  description: string;
  is_open: boolean;
  answered: boolean;
  age_groups: string[];
  regions: { id: number; name: string }[];
  questions: { id: number; text: string; kind: "single" | "multi" | "scale"; scale_max: number; options: { id: string; text: string }[] }[];
}

export interface SurveyResults {
  slug: string;
  title: string;
  sample_responses: number;
  real_responses: number;
  questions: { id: number; text: string; kind: string; options: { id: string; text: string; count: number; share: number }[] }[];
}

export interface NameStats {
  name: string | null;
  name_cyr?: string;
  by_year?: { year: number; count: number }[];
  by_region?: { region_id: number; region: string; code: string; count: number }[];
  gender?: Partial<Record<"M" | "F", number>>;
  rank?: number | null;
  year?: number;
  suggestions?: string[];
  data_source: DataSource;
}

export interface CitizenQuestion {
  id: number;
  category: string;
  category_label: string;
  region: number | null;
  region_name: string | null;
  question: string;
  allow_publish: boolean;
  answer: string;
  status: "new" | "answered" | "rejected";
  status_label: string;
  created_at: string;
  answered_at: string | null;
}

export interface Favorite {
  id: number;
  kind: string;
  title: string;
  params: Record<string, string | number>;
  created_at: string;
}

const get = async <T,>(url: string, params?: Record<string, unknown>) => (await axiosT.get<T>(url, { params })).data;

export const fetchSalary = (params: { region?: number; sector?: number; year?: number }) => get<SalaryResponse>("/citizens/salary/", params);
export const fetchPrices = (region?: number) =>
  get<{ months: string[]; products: PriceProduct[]; data_source: DataSource }>("/citizens/prices/", region ? { region } : undefined);
export const fetchPriceRegions = (product: string) =>
  get<{ product: string; month: string; regions: { region_id: number; region: string; code: string; price: number | null }[] }>("/citizens/prices/regions/", { product });
export const fetchBasket = async (items: { product: string; qty: number }[], region?: number) =>
  (await axiosT.post<{ series: { month: string; total: number; complete: boolean }[]; missing_products: string[] }>("/citizens/prices/basket/", { items, region })).data;
export const fetchArticles = (topic?: string) =>
  get<{ topics: { code: string; name: string }[]; results: ArticleSummary[] }>("/citizens/articles/", topic ? { topic } : undefined);
export const fetchArticle = (slug: string, lang = "uz") => get<ArticleDetail>(`/citizens/articles/${slug}/`, { lang });
export const fetchGlossary = (q?: string, lang = "uz") => get<GlossaryItem[]>("/citizens/glossary/", { ...(q ? { q } : {}), lang });
export const fetchSurveys = () => get<SurveySummary[]>("/citizens/surveys/");
export const fetchSurvey = (slug: string) => get<SurveyDetail>(`/citizens/surveys/${slug}/`);
export const fetchSurveyResults = (slug: string, params: { region?: number; age_group?: string }) =>
  get<SurveyResults>(`/citizens/surveys/${slug}/results/`, params);
export const answerSurvey = async (slug: string, body: { region?: number; age_group?: string; answers: Record<number, string[] | number> }) =>
  (await axiosT.post(`/citizens/surveys/${slug}/answer/`, body)).data;
export const fetchNameStats = (q: string) => get<NameStats>("/citizens/names/", { q });
export const fetchTopNames = (params: { year?: number; gender?: "M" | "F" }) =>
  get<{ year: number; years: number[]; gender: string; results: { name: string; count: number }[]; data_source: DataSource }>("/citizens/names/top/", params);
export const fetchMyQuestions = (staff = false) => get<CitizenQuestion[]>("/citizens/questions/", staff ? { scope: "staff" } : undefined);
export const askQuestion = async (body: { category: string; region?: number | null; question: string; allow_publish: boolean }) =>
  (await axiosT.post<CitizenQuestion>("/citizens/questions/", body)).data;
export const answerQuestion = async (id: number, body: { answer: string; status?: string }) =>
  (await axiosT.patch<CitizenQuestion>(`/citizens/questions/${id}/`, body)).data;
export const fetchPublicAnswers = (q?: string) =>
  get<{ id: number; category: string; region: string | null; question: string; answer: string; answered_at: string }[]>("/citizens/answers/", q ? { q } : undefined);
export const fetchFavorites = () => get<Favorite[]>("/citizens/favorites/");
export const addFavorite = async (body: { kind: string; title: string; params: Record<string, unknown> }) =>
  (await axiosT.post<Favorite>("/citizens/favorites/", body)).data;
export const removeFavorite = async (id: number) => axiosT.delete(`/citizens/favorites/${id}/`);
export const fetchCitizenSummary = () =>
  get<{
    user: { name: string; type: string };
    region: { id: number; name: string } | null;
    favorites: Favorite[];
    questions: CitizenQuestion[];
    surveys_answered: number;
    open_surveys: number;
    book_orders: { id: number; status: string; total_amount: string; created_at: string }[];
  }>("/citizens/me/summary/");
export const fetchCpiSeries = () => get<{ base: string; source: string; series: CpiPoint[] }>("/additional-services/cpi/series/");
