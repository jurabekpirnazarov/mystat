import axiosT from "./baseUrl";
import type { DataSource } from "../components/ui";

export interface LimitUsage {
  configured: boolean;
  limit: number | null;
  used: number;
  /** Xizmat StatCoin bilan to'lanadi: shu so'rovda yechilgan miqdor va qoldiq (yoki narx va balans). */
  statcoin?: { charged?: number; price?: number; balance: number };
}

export interface BenchmarkMetric {
  key: string;
  label: string;
  unit: string;
  count: number;
  p25: number | null;
  median: number | null;
  p75: number | null;
  own: number | null;
  percentile: number | null;
}

export interface Benchmark {
  year: number;
  years: number[];
  level: "region" | "country";
  group: { oked_section: string; oked_name: string; region: string; size: number };
  has_own: boolean;
  metrics: BenchmarkMetric[];
  dynamics: Record<string, number | null>[];
  summary: string[];
  data_source: DataSource;
  usage: LimitUsage;
}

export const fetchBenchmark = async (params: { year?: number; geo?: "region" | "country" }) =>
  (await axiosT.get<Benchmark>("/analytics/benchmark/", { params })).data;
