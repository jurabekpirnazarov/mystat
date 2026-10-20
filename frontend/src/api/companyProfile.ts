import axiosT from "./baseUrl";
import type { Klass, UnlockOption } from "./companyScores";

/** KORXONA_SCORING.md KR-45: korxona profili. Ochilmagan bo'lim ma'lumoti backend'dan kelmaydi (`locked: true`). */

export interface LockedSection {
  locked: true;
  title: string;
  summary: string;
  unlock?: UnlockOption;
  insufficient?: boolean;
}

export interface ContributionRow {
  key: string;
  name: string;
  applicable: boolean;
  score: number | null;
  weight: number;
  share: number;
  contribution: number;
}

export interface Contribution {
  base: number;
  pillars: ContributionRow[];
  raw: number;
  cap: number | null;
  total: number;
  preset: string;
  tax_debt: boolean;
}

export interface ProfileIndicator {
  code: string;
  name: string;
  pillar: string;
  kind: "peer" | "absolute" | "trade";
  position: "above" | "below" | "none";
  direction?: "+" | "-";
  score?: number | null;
}

export interface BasisSection {
  locked: false;
  pillars: { key: string; name: string; score: number | null; applicable: boolean }[];
  contribution: Contribution | null;
  flags: { code: string; name: string; effect: string }[];
  peer_group: string;
  peer_size: number;
  peer_label: string;
  rank: number | null;
  ranked: number | null;
  indicators: ProfileIndicator[];
}

export interface Sensitivity {
  klass: Klass;
  pillars: { key: string; step: number; delta: number; new_total: number; new_klass: Klass; per_point: number; room: number }[];
  next: null | {
    klass: Klass;
    min: number;
    gap: number;
    blocked_by_tax: boolean;
    fastest: { key: string; points_needed: number | null; reachable: boolean }[];
  };
}

export interface SimilarCompany {
  stir: string;
  name: string | null;
  overall: number | null;
  klass: Klass;
  klass_name: string;
  is_synthetic: boolean;
}

export interface DeepSection {
  locked: false;
  indicators: ProfileIndicator[];
  strengths: ProfileIndicator[];
  weaknesses: ProfileIndicator[];
  dynamics: { year: number; overall: number | null; klass: Klass; pillars: Record<string, number | null> }[];
  sensitivity: Sensitivity | null;
  presets: { key: string; name: string; overall: number | null; klass: Klass }[];
  similar: SimilarCompany[];
  region_context: null | {
    region: string | null; soato: string; year: string; score: number | null; rank: number | null; of: number;
    sectors: { label: string; lq: number }[]; link: string;
  };
  distribution: {
    filters: Record<string, string>;
    classes: { key: Klass; name: string; count: number; share: number }[];
    mean: number | null;
    scored: number;
    enough: boolean;
    histogram: { from: number; to: number; count: number }[];
    is_synthetic: boolean;
  };
  pdf: boolean;
}

export interface CompanyProfile {
  stir: string;
  preset: string;
  year: number | null;
  model_version: string;
  presets: { key: string; name: string }[];
  general: {
    name: string | null;
    stir: string;
    okpo: string | null;
    legal_form: string | null;
    oked_section: string | null;
    oked_name: string | null;
    oked_division: string | null;
    region: string | null;
    district: string | null;
    ownership: string | null;
    founded_year: number | null;
    employees_range: string | null;
    products_count: number;
    score: null | {
      overall: number | null; klass: Klass; klass_name: string; meaning: string; coverage: number; partial: boolean;
      year: number; data_source: "real" | "synthetic" | "mixed"; is_synthetic: boolean;
    };
    real_fields: string[];
    requisites_synthetic: boolean;
    /** IH-01: hudud sanoat reyestridagi real manzildan */
    region_is_real?: boolean;
  };
  access: {
    authenticated: boolean; owner: boolean; privileged: boolean; plan: string; balance: number;
    unlocks: Partial<Record<"basis" | "deep", string>>; scored: boolean;
  };
  basis: BasisSection | LockedSection;
  deep: DeepSection | LockedSection;
  watch: LockedSection & { min_plan: string; available: boolean; note: string };
  is_synthetic: boolean;
  sample_note: string | null;
  disclaimer: string;
}

export const fetchCompanyProfile = async (stir: string, preset?: string) =>
  (await axiosT.get<CompanyProfile>(`/analytics/company-profile/${stir}/`, { params: preset ? { preset } : {} })).data;
