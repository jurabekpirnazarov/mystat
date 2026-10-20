/** JAHON_TAJRIBASI JT-02, JT-15, JT-17 uchun sof funksiyalar (vitest: statPublic.test.ts). */

const NBSP = new RegExp(`[${String.fromCharCode(0xa0, 0x202f)}]`, "g");

/** Katta son — bo'shliq bilan, kasr xonasi qiymat kattaligiga qarab: 1 849 650 · 107,7 · 4,8 */
export function formatValue(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return "—";
  const abs = Math.abs(value);
  const digits = abs >= 1000 ? 0 : abs >= 100 ? 1 : 2;
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits }).format(value).replace(NBSP, " ");
}

export function formatInt(value: number): string {
  return new Intl.NumberFormat("ru-RU").format(Math.floor(value)).replace(NBSP, " ");
}

// --- JT-02: aholi soati ---------------------------------------------------------------------------------------

export interface ClockBase {
  base_at: string;
  base_population: number;
  annual_growth_pct: number;
  /** stat.uz hisoblagichi parametrlaridan sof o'sish (kishi/soniya); bo'lsa soat chiziqli yuradi */
  net_per_second?: number | null;
}

const YEAR_MS = 365.2425 * 86400 * 1000;

/**
 * Rasmiy parametrlar bo'lsa stat.uz bilan bir xil: N(t) = N0 + (t − t0)·sof_o'sish (chiziqli).
 * Aks holda SIAT bahosi: N(t) = N0 · (1 + g)^(t − t0).
 */
export function estimatePopulation(clock: ClockBase, now: number): number {
  const t0 = new Date(clock.base_at).getTime();
  if (clock.net_per_second) return clock.base_population + ((now - t0) / 1000) * clock.net_per_second;
  return clock.base_population * Math.pow(1 + clock.annual_growth_pct / 100, (now - t0) / YEAR_MS);
}

/** Aholi bittaga ko'payishi uchun o'rtacha necha soniya (o'sish manfiy yoki 0 bo'lsa null). */
export function secondsPerPerson(clock: ClockBase): number | null {
  if (clock.net_per_second) return clock.net_per_second > 0 ? 1 / clock.net_per_second : null;
  const perYear = (clock.base_population * clock.annual_growth_pct) / 100;
  return perYear > 0 ? YEAR_MS / 1000 / perYear : null;
}

// --- JT-15: iqtibos va embed ----------------------------------------------------------------------------------

export const PUBLISHER = "O'zbekiston Respublikasi Milliy statistika qo'mitasi";

function ddmmyyyy(d: Date) {
  return `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
}

export function citations(title: string, url: string, year?: string, accessed: Date = new Date()) {
  const y = year || String(accessed.getFullYear());
  const date = ddmmyyyy(accessed);
  return {
    apa: `${PUBLISHER}. (${y}). ${title} [Ma'lumotlar to'plami]. my.stat.uz. ${url} (murojaat sanasi: ${date})`,
    gost: `${title} [Elektron resurs] // ${PUBLISHER}. — URL: ${url} (murojaat sanasi: ${date}).`,
  };
}

export function embedCode(origin: string, key: string, title: string) {
  const src = `${origin}/embed/indicator/${encodeURIComponent(key)}`;
  const safeTitle = title.replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
  return `<iframe src="${src}" title="${safeTitle}" width="100%" height="380" style="border:0" loading="lazy"></iframe>`;
}
