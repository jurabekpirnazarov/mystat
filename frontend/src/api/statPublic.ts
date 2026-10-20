import axiosT from "./baseUrl";
import type { SiatSource } from "./siatMap";

/** JAHON_TAJRIBASI JT-10, JT-17, JT-02: e'lonlar kalendari, mavzuli panellar, aholi soati (SIAT bazasidan). */

export interface ReleaseItem {
  key: string;
  title: string;
  theme: string;
  theme_label: string;
  periodicity: string;
  siat_url: string;
  map_url: string;
  /** YYYY-MM-DD */
  date: string;
  time: string | null;
  /** Kutilayotgan davr, masalan "2026" */
  period: string;
  /** official — qo'mita sanasi; estimated — SIAT yangilanishidan taxminiy; siat — SIAT'da yangilangan */
  kind: "official" | "estimated" | "siat";
  status: "planned" | "published" | "postponed" | "overdue";
  url: string;
  note: string;
}

export interface ReleaseCalendar {
  today: string;
  upcoming: ReleaseItem[];
  recent: ReleaseItem[];
  themes: { key: string; label: string }[];
  source: SiatSource;
}

export interface DashboardItem {
  key: string;
  name: string;
  unit: string;
  period: string;
  value: number;
  preliminary: boolean;
  /** pct — o'tgan davrga nisbatan %; pp — foiz punkti (ko'rsatkichning o'zi foizda) */
  change: number | null;
  change_kind: "pct" | "pp";
  higher_is_better: boolean | null;
  diverging_center: number | null;
  series: { period: string; value: number }[];
  map_url: string;
  siat_url: string;
  derived_from: string;
  source_updated_at: string | null;
}

export interface DashboardPanel {
  slug: string;
  title: string;
  description: string;
  items: DashboardItem[];
}

export interface PopulationClock {
  /** Boshlang'ich nuqta vaqti (ISO, vaqt zonasi bilan) */
  base_at: string;
  base_population: number;
  annual_growth_pct: number;
  /** official — qo'mita hisoblagichi (admin kiritadi); siat — SIAT 1-yanvar bahosi */
  kind: "official" | "siat";
  /** stat.uz hisoblagichi: sof o'sish, kishi/soniya */
  net_per_second: number | null;
  /** stat.uz: har necha soniyada bitta tug'ilish / o'lim / kelish / ketish */
  rates: { birth_seconds: number; death_seconds: number; arrive_seconds: number; depart_seconds: number } | null;
  source: string;
  source_url: string;
}

export interface Dashboards {
  panels: DashboardPanel[];
  population_clock: PopulationClock | null;
  source: SiatSource;
}

export const fetchReleaseCalendar = async (signal?: AbortSignal) =>
  (await axiosT.get<ReleaseCalendar>("/common/map/releases/", { signal })).data;

// Bosh sahifada banner va "O'zbekiston raqamlarda" bir xil javobni ishlatadi — bitta so'rov, 5 daqiqa
let dashboardsCache: { at: number; promise: Promise<Dashboards> } | null = null;

export const fetchDashboards = async (signal?: AbortSignal) => {
  if (signal) return (await axiosT.get<Dashboards>("/common/map/dashboards/", { signal })).data;
  if (!dashboardsCache || Date.now() - dashboardsCache.at > 5 * 60 * 1000) {
    const promise = axiosT.get<Dashboards>("/common/map/dashboards/").then((r) => r.data);
    promise.catch(() => { dashboardsCache = null; });
    dashboardsCache = { at: Date.now(), promise };
  }
  return dashboardsCache.promise;
};

/** iCal obunasi uchun to'liq manzil (kalendar ilovasi brauzer sessiyasisiz o'zi yuklaydi). */
export function releasesIcsUrl(): string {
  const base = (axiosT.defaults.baseURL ?? "/api/").replace(/\/?$/, "/");
  const absolute = base.startsWith("http") ? base : `${window.location.origin}${base.startsWith("/") ? "" : "/"}${base}`;
  return `${absolute}common/map/releases.ics`;
}

export const fetchIndicatorCard = async (key: string, signal?: AbortSignal) =>
  (await axiosT.get<DashboardItem & { source: SiatSource }>(`/common/map/card/${encodeURIComponent(key)}/`, { signal })).data;

// --- JT-04: statistik kodlar ma'lumotnomasi ---------------------------------------------------------------------

export interface CertificateReport {
  id: string;
  form: string;
  title: string;
  periodicity: "monthly" | "quarterly" | "yearly" | null;
  periodicity_label: string;
  deadline_rule: string;
  next_deadline: string | null;
}

export interface Certificate {
  stir: string;
  okpo: string;
  name: string;
  /** Faqat portalda ro'yxatdan o'tgan korxona uchun; KTUT'da bu kodlar yo'q */
  codes: Partial<Record<"soato" | "region" | "district" | "sector" | "legal_form" | "ktyadr" | "address", string | null>>;
  reports: CertificateReport[];
  issued_at: string;
  verify_code: string;
  verify_path: string;
  source: string;
}

export interface CertificateCheck {
  valid: boolean;
  detail?: string;
  stir?: string;
  okpo?: string;
  name?: string;
  issued_at?: string;
  reports_count?: number;
  /** Ma'lumotnoma berilgandan keyin hisobotlar ro'yxati o'zgarganmi */
  changed?: boolean;
}

export const fetchCertificate = async (stir: string, signal?: AbortSignal) =>
  (await axiosT.get<Certificate>(`/additional-services/ktut/${stir}/certificate/`, { signal })).data;

export const verifyCertificate = async (code: string, signal?: AbortSignal) =>
  (await axiosT.get<CertificateCheck>("/additional-services/certificate/verify/", { params: { code }, signal })).data;
