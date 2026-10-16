import axiosT from "./baseUrl";

/** SIAT_KARTA_TAHLIL KR-05: karta API'si (ma'lumot backend bazasidan, SIAT'ga brauzerdan murojaat yo'q). */

export type GeoLevel = "region" | "district";

export interface SiatSource {
  name: string;
  license: string;
  url: string;
}

export interface MapIndicator {
  key: string;
  siat_id: number | null;
  kind: "source" | "group" | "derived" | "score";
  code: string;
  name: string;
  unit: string;
  theme: string;
  geo_level: GeoLevel;
  periodicity: "Y" | "Q" | "M" | "other";
  periods: string[];
  last_period: string;
  preliminary_years: number[];
  higher_is_better: boolean | null;
  diverging_center: number | null;
  source_updated_at: string | null;
  last_synced_at: string | null;
  siat_url: string;
  derived_from: string;
  notes: string;
  methodology: string;
  breakdowns: { code: string; name: string }[];
  /** Prognoz yillari (SCORING_MODEL.md 10.8) — vaqt slayderida alohida belgilanadi */
  forecast_periods?: string[];
  /** Salohiyat ustuni (score-A..E) */
  pillar?: string | null;
}

export interface MapCatalog {
  themes: { key: string; label: string }[];
  indicators: MapIndicator[];
  source: SiatSource;
}

export interface MapItem {
  code: string;
  name: string;
  kind: string;
  value: number | null;
  missing: boolean;
  preliminary: boolean;
  forecast?: boolean;
  lo80?: number | null;
  hi80?: number | null;
  direction_uncertain?: boolean;
  /** Salohiyat: "Ma'lumot yetarli emas" / "Hali tuzilmagan" */
  note?: string | null;
  status?: string;
}

export interface MapValues {
  indicator: string;
  name: string;
  unit: string;
  level: GeoLevel;
  parent: { code: string; name: string; value: number | null } | null;
  breakdown: { code: string; name: string } | null;
  period: string;
  periods: string[];
  preliminary: boolean;
  republic: number | null;
  items: MapItem[];
  scale: { min: number | null; max: number | null; quantiles: number[]; current_quantiles: number[]; diverging_center: number | null };
  higher_is_better: boolean | null;
  siat_url: string;
  source: SiatSource;
  forecast?: boolean;
  forecast_periods?: string[];
  view?: "level" | "growth";
  scenario?: ForecastScenario;
  note?: string | null;
  disclaimer?: string;
}

/** 10.8.1: prognoz ssenariysi (URL `sc=base|opt|pes`) */
export type ForecastScenario = "base" | "optimistic" | "pessimistic";

export interface ForecastBlock {
  forecast: { period: string; value: number; lo80: number | null; hi80: number | null }[];
  scenarios: { optimistic: { period: string; value: number }[]; pessimistic: { period: string; value: number }[] };
  growth: { from: string; to: string; per_year: number | null; lo: number | null; hi: number | null; national: number | null; unit: string; direction_uncertain: boolean };
  drivers: { feature: string; name: string; effect: "up" | "down" }[];
  basis: "factors" | "trend";
  /** 10.8.3: usul (oddiy tilda) va o'tgan yillardagi o'rtacha xato */
  model?: { method: string; error_pct: number | null; error_pct_last: number | null; direction_pct: number | null; horizons: [number, number]; coverage_pct: number | null } | null;
}

export interface TerritoryIndicator {
  key: string;
  name: string;
  theme: string;
  unit: string;
  period: string;
  value: number;
  preliminary: boolean;
  rank: number | null;
  of: number;
  higher_is_better: boolean | null;
  average: number | null;
  vs_average_pct: number | null;
  republic: number | null;
  siat_url: string;
  derived_from: string;
  series: { period: string; value: number | null }[];
  forecast?: ForecastBlock | null;
}

export interface TerritoryCard {
  soato: string;
  name: string;
  level: GeoLevel;
  kind: string;
  parent: { soato: string; name: string } | null;
  area_km2: number | null;
  profile: string | null;
  children: number;
  indicators: TerritoryIndicator[];
  source: SiatSource;
}

export interface TerritoryName {
  code: string;
  level: GeoLevel;
  kind: string;
  parent: string | null;
  names: Record<"uz" | "ru" | "en" | "uzc", string>;
}

export interface ValuesParams {
  indicator: string;
  period?: string;
  level: GeoLevel;
  parent?: string;
  breakdown?: string;
  /** Salohiyat: preset yoki vaznlar ("25,25,15,25,10") */
  preset?: string;
  weights?: string;
  /** Prognoz yilida: kutilayotgan yillik o'sish */
  view?: "growth";
  /** Prognoz yilida: ssenariy (base bo'lsa yuborilmaydi) */
  scenario?: "opt" | "pes";
}

const clean = (p: ValuesParams) => Object.fromEntries(Object.entries(p).filter(([, v]) => v !== undefined && v !== ""));

export const fetchMapCatalog = async (signal?: AbortSignal) =>
  (await axiosT.get<MapCatalog>("/common/map/indicators/", { signal })).data;

export const fetchMapValues = async (params: ValuesParams, signal?: AbortSignal) =>
  (await axiosT.get<MapValues>("/common/map/values/", { params: clean(params), signal })).data;

export const fetchTerritory = async (soato: string, signal?: AbortSignal) =>
  (await axiosT.get<TerritoryCard>(`/common/map/territory/${soato}/`, { signal })).data;

export const fetchTerritories = async () =>
  (await axiosT.get<{ items: TerritoryName[] }>("/common/map/territories/")).data.items;

/** KR-12: joriy ko'rinish jadvali (backend tayyorlaydi: CSV — UTF-8 BOM, XLSX). */
export async function downloadMapTable(params: ValuesParams, kind: "csv" | "xlsx") {
  const res = await axiosT.get("/common/map/values/", { params: { ...clean(params), export: kind }, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `siat-${params.indicator}-${params.period ?? "oxirgi"}.${kind}`;
  a.click();
  URL.revokeObjectURL(url);
}

// --- Salohiyat indeksi (SCORING_MODEL.md KR-19) ---------------------------------------------------------------

export interface ScoreIndicatorRow {
  id: string;
  name: string;
  unit: string;
  value: number;
  year: number;
  lagged: boolean;
  preliminary: boolean;
  short: boolean;
  forecast: boolean;
  s: number | null;
  percentile: number | null;
  rank: number | null;
  of: number | null;
  national: number | null;
  vs_national_pct: number | null;
}

export interface ScoreSide { indicator: string; name: string; text: string; percentile: number | null }

export interface ScoreRecommendation {
  title: string;
  text: string;
  strength: number;
  tentative: boolean;
  fallback?: boolean;
  evidence: { indicator?: string; name: string; value: number; unit: string; percentile?: number | null; text: string; from_parent?: boolean }[];
}

export interface ScoreSector {
  code: string;
  source: "industry" | "investment";
  name: string;
  lq: number;
  share: number;
  growth: number | null;
  national_growth: number | null;
  year: number;
  label: "leading" | "slowing" | "growing" | "invest";
  label_name: string;
  text: string;
}

export interface ScoreDetail {
  soato: string;
  name: string;
  level: GeoLevel;
  kind: string;
  period: string;
  periods: string[];
  forecast_periods: string[];
  forecast: boolean;
  status: "ok" | "partial" | "insufficient" | "not_created";
  status_label: string;
  index_name: string;
  methodology_version: string;
  score: number | null;
  rank?: number | null;
  of?: number;
  rank_range?: [number, number] | null;
  rank_unstable?: boolean;
  rank_in_parent?: [number, number] | null;
  coverage?: number;
  partial?: boolean;
  missing: boolean;
  pillars?: { key: string; name: string; score: number | null; weight: number; indicators: ScoreIndicatorRow[] }[];
  context?: ScoreIndicatorRow[];
  strengths?: ScoreSide[];
  weaknesses?: ScoreSide[];
  sectors?: ScoreSector[];
  recommendations?: ScoreRecommendation[];
  peers?: { soato: string; name: string; distance: number; score: number | null; ahead_in: { indicator: string; name: string }[] }[];
  gaps?: { indicator: string; name: string; reason: string }[];
  parent_context?: { soato: string; name: string; score: number | null; rank: number | null; of: number; pillars: { key: string; name: string; score: number | null }[]; sectors: ScoreSector[] };
  future?: { period: string; score: number; rank: number | null; of: number; rank_range: [number, number] | null; from_period: string; from_rank: number | null; from_score: number | null; recommendations: ScoreRecommendation[]; note: string } | null;
  preset: string | null;
  disclaimer: string;
  forecast_note: string | null;
}

export interface ScoreConfig {
  version: string;
  pillars: { key: string; name: string; indicators: { id: string; name: string; unit: string; direction: "+" | "-"; transform: string; level: GeoLevel; source: string }[] }[];
  context: { id: string; name: string; source: string }[];
  presets: Record<string, { name: string; region: number[]; district: number[] }>;
  rules: { code: string; name: string; levels: GeoLevel[] }[];
  params: Record<string, number>;
  disclaimer: string;
  /** KR-22: metodologiya matni tanlangan tilda, raqamlar scoring.yaml dan qo'yilgan */
  methodology: { sections: { key: string; title: string; items: string[]; note: string | null }[]; labels: Record<string, string> };
}

export type MethodologyLang = "uz" | "uzc" | "ru" | "en";

export interface ScoreQuery {
  period?: string;
  preset?: string;
  weights?: string;
}

export const fetchScoreConfig = async (lang?: MethodologyLang) =>
  (await axiosT.get<ScoreConfig>("/common/map/score/config/", { params: lang && lang !== "uz" ? { lang } : {} })).data;

export const fetchScoreDetail = async (soato: string, q: ScoreQuery, signal?: AbortSignal) =>
  (await axiosT.get<ScoreDetail>(`/common/map/score/${soato}/`, { params: Object.fromEntries(Object.entries(q).filter(([, v]) => v)), signal })).data;

/** KR-21: reyting jadvali (indeks, ustunlar, o'rin oralig'i) — metodologiya versiyasi va manba bilan. */
export async function downloadScoreTable(params: { level: GeoLevel; parent?: string } & ScoreQuery, kind: "csv" | "xlsx") {
  const query = Object.fromEntries(Object.entries({ ...params, export: kind }).filter(([, v]) => v));
  const res = await axiosT.get("/common/map/score/", { params: query, responseType: "blob" });
  const url = URL.createObjectURL(res.data as Blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `salohiyat-${params.level}-${params.period ?? "oxirgi"}.${kind}`;
  a.click();
  URL.revokeObjectURL(url);
}

export const isScoreKey = (key: string | undefined) => !!key && (key === "score" || key.startsWith("score-"));

export interface ScoreListItem {
  soato: string;
  name: string;
  kind: string;
  score: number | null;
  rank: number | null;
  rank_range: [number, number] | null;
  rank_in_parent: [number, number] | null;
  pillars: Record<string, number | null>;
  coverage: number | null;
  partial: boolean;
  missing: boolean;
  status: string;
  /** 10.8.6: haqiqiy yil → prognoz yili (yoki aksincha) o'zgarishi; musbat rank_change — yuqoriga */
  outlook?: { score_change: number | null; rank_change: number | null; from_rank: number | null; to_rank: number | null; to_score: number | null };
}

export interface ScoreMover { soato: string; name: string; rank_change: number; score_change: number | null; from_rank: number | null; to_rank: number | null }

export interface ScoreList {
  level: GeoLevel;
  period: string;
  forecast: boolean;
  preset: string | null;
  weights: Record<string, number>;
  of: number;
  index_name: string;
  pillars: { key: string; name: string }[];
  items: ScoreListItem[];
  /** 10.6: eng ko'p ko'tarilishi/tushishi kutilgan hududlar */
  outlook: { from: string; to: string; up: ScoreMover[]; down: ScoreMover[] } | null;
  methodology_version: string;
  disclaimer: string;
}

export const fetchScoreList = async (params: { level: GeoLevel; parent?: string } & ScoreQuery, signal?: AbortSignal) =>
  (await axiosT.get<ScoreList>("/common/map/score/", { params: Object.fromEntries(Object.entries(params).filter(([, v]) => v)), signal })).data;

// --- Maqsadli ssenariy (SCORING_MODEL.md 10.5, P2) -------------------------------------------------------------

export interface WhatIf {
  soato: string;
  feature: string;
  feature_name: string;
  unit: string;
  delta: number;
  deltas: number[];
  indicators: { indicator: string; name: string; unit: string; rows: { period: string; base: number; value: number; change_pct: number | null }[] }[];
  note: string;
}

export const fetchWhatIf = async (soato: string, delta: number, signal?: AbortSignal) =>
  (await axiosT.get<WhatIf>(`/common/map/forecast/${soato}/what-if/`, { params: { feature: "unemployment", delta }, signal })).data;

// --- Prognoz aniqligi (SCORING_MODEL.md 10.4, KR-28) -----------------------------------------------------------

export interface ForecastQuality {
  version: string;
  trained_at: string;
  rows: { indicator: string; name: string; level: string; horizon: number; method: string; error_pct: number | null; direction_pct: number | null; coverage_pct: number | null; n: number | null; small_sample: boolean }[];
  monitoring: { indicator: string; name: string; error_pct: number | null; inside_pct: number | null; count: number; outside: number; previous_version: string }[];
  note: string;
}

export const fetchForecastQuality = async (lang?: MethodologyLang) =>
  (await axiosT.get<ForecastQuality>("/common/map/forecast/quality/", { params: lang && lang !== "uz" ? { lang } : {} })).data;
