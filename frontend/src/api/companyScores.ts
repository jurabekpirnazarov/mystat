import { useEffect, useState } from "react";
import axiosT from "./baseUrl";

/** KORXONA_SCORING.md KR-33: korxona bali API'si. Begona korxona uchun xom qiymatlar kelmaydi. */

export type Klass = "A" | "B" | "C" | "D" | "E" | "";
export type ScoreLang = "uz" | "ru" | "cry";

export interface CompanyScoreShort {
  stir: string;
  year: number;
  preset: string;
  overall: number | null;
  klass: Klass;
  klass_name: string;
  coverage: number;
  partial: boolean;
  data_source: "real" | "synthetic" | "mixed";
  is_synthetic: boolean;
  pillars: Record<string, number | null>;
  flags: string[];
}

export interface CompanyScoreIndicator {
  code: string;
  name: string;
  pillar: string;
  kind: "peer" | "absolute" | "trade";
  score: number | null;
  applicable: boolean;
  /** Faqat o'z korxonasi (me/) */
  value?: number | null;
  median?: number | null;
  unit?: string;
  fmt?: string;
}

export interface CompanyScoreDetail extends CompanyScoreShort {
  klass_info: { key: Klass; name: string };
  pillars_detail: { key: string; name: string; score: number | null; applicable: boolean }[];
  peer_group: string;
  peer_size: number;
  peer_label: string;
  flags_detail: { code: string; name: string }[];
  indicators: CompanyScoreIndicator[];
  years: number[];
  dynamics: { year: number; overall: number | null; klass: Klass }[];
  real_fields: string[];
  presets: { key: string; name: string }[];
  model_version: string;
  disclaimer: string;
  sample_note: string | null;
  recommendations?: { code: string; text: string; link: string | null; score: number | null }[];
}

export interface CompanyScoreDistribution {
  year: number;
  preset: string;
  total: number;
  scored: number;
  enough: boolean;
  mean: number | null;
  classes: { key: Klass; name: string; count: number; share: number }[];
  ab_share: number | null;
  insufficient: number;
  pillars: { key: string; name: string; median: number | null; p25?: number | null; p75?: number | null }[];
  histogram?: { from: number; to: number; count: number }[];
  data_source: "real" | "synthetic" | "mixed";
  is_synthetic: boolean;
  disclaimer: string;
}

export interface CompanyScoreMethodology {
  version: string;
  params: Record<string, number>;
  pillars: { key: string; name: string; indicators: { code: string; name: string; kind: string; direction: string; applies: string | null; unit: string }[] }[];
  presets: { key: string; name: string; weights: Record<string, number> }[];
  default_preset: string;
  classes: { key: Klass; name: string; min: number }[];
  size_classes: { key: string; name: string; max: number | null }[];
  tradable: { sections: string[]; divisions: string[] };
  flags: { code: string; name: string }[];
  disclaimer: string;
}

const params = (o: Record<string, string | number | undefined | null>) =>
  Object.fromEntries(Object.entries(o).filter(([, v]) => v !== undefined && v !== null && v !== ""));

export const fetchCompanyScores = async (stirs: string[], preset?: string, lang?: ScoreLang) =>
  (await axiosT.get<{ items: Record<string, CompanyScoreShort>; year: number | null; preset: string }>(
    "/analytics/company-scores/", { params: params({ stir: stirs.join(","), preset, lang }) })).data;

export const fetchCompanyScore = async (stir: string, q: { preset?: string; year?: number; lang?: ScoreLang } = {}) =>
  (await axiosT.get<CompanyScoreDetail>(`/analytics/company-scores/${stir}/`, { params: params(q) })).data;

export const fetchMyCompanyScore = async (q: { preset?: string; year?: number; lang?: ScoreLang } = {}) =>
  (await axiosT.get<CompanyScoreDetail>("/analytics/company-scores/me/", { params: params(q) })).data;

export const fetchCompanyScoreDistribution = async (q: { oked?: string; region?: string; district?: string; preset?: string; lang?: ScoreLang; size?: string }) =>
  (await axiosT.get<CompanyScoreDistribution>("/analytics/company-scores/distribution/", { params: params(q) })).data;

export const fetchCompanyScoreMethodology = async (lang?: ScoreLang) =>
  (await axiosT.get<CompanyScoreMethodology>("/analytics/company-scores/methodology/", { params: params({ lang }) })).data;

// --- Batch hook: sahifadagi barcha STIR'lar uchun bitta so'rov -------------------------------------------------

const MAX_BATCH = 100;
const cache = new Map<string, CompanyScoreShort | null>();

/**
 * KR-34: `useCompanyScores(stirs)` — ro'yxatdagi barcha STIR'lar uchun bitta batch so'rov (100 tadan bo'lib),
 * natija sahifalar orasida keshlanadi. Ball yo'q (yoki OS-18 bo'yicha yopiq) STIR — `null`.
 */
export function useCompanyScores(stirs: string[], preset?: string) {
  const key = (s: string) => `${preset ?? ""}:${s}`;
  const unique = [...new Set(stirs.filter(Boolean))];
  const missingKey = unique.filter((s) => !cache.has(key(s))).sort().join(",");
  const [, setVersion] = useState(0);

  useEffect(() => {
    if (!missingKey) return;
    const missing = missingKey.split(",");
    let alive = true;
    const chunks: string[][] = [];
    for (let i = 0; i < missing.length; i += MAX_BATCH) chunks.push(missing.slice(i, i + MAX_BATCH));
    Promise.all(chunks.map((c) => fetchCompanyScores(c, preset).catch(() => ({ items: {} as Record<string, CompanyScoreShort> }))))
      .then((results) => {
        const got: Record<string, CompanyScoreShort> = Object.assign({}, ...results.map((r) => r.items));
        missing.forEach((s) => cache.set(key(s), got[s] ?? null));
        if (alive) setVersion((v) => v + 1);
      });
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [missingKey, preset]);

  const map: Record<string, CompanyScoreShort | null | undefined> = {};
  unique.forEach((s) => (map[s] = cache.has(key(s)) ? cache.get(key(s)) : undefined));
  return map;
}

export const PRESETS = [
  { key: "muvozanatli", name: "Muvozanatli" },
  { key: "hamkor", name: "Hamkor / investor" },
  { key: "bank", name: "Bank / kredit" },
  { key: "eksport", name: "Eksport" },
  { key: "ijtimoiy", name: "Ijtimoiy ta'sir" },
];

export const PILLAR_NAMES: Record<string, string> = {
  M: "Moliyaviy holat", O: "O'sish va investitsiya", T: "Tashqi savdo", X: "Mehnat resurslari", I: "Inklyuzivlik",
  S: "Intizom va ishonchlilik",
};
