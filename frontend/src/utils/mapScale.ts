/**
 * KR-06: kartaning rang shkalasi. Sof funksiyalar — testlanadi (mapScale.test.ts).
 *
 * - kvantil (5 sinf) standart, chiziqli ixtiyoriy; chegaralar barcha davrlar bo'yicha bir xil (KR-08);
 * - o'sish sur'ati kabi ko'rsatkichlarda markazli (100) ikki tomonlama shkala;
 * - `null` — alohida "ma'lumot yo'q" (shtrixli), hech qachon eng past rang emas (N2);
 * - respublika qiymati shkalaga kirmaydi (N5) — backend uni items'ga qo'shmaydi.
 */

export type ScaleMode = "quantile" | "linear";

export interface ScaleInput {
  min: number | null;
  max: number | null;
  quantiles: number[];
  diverging_center: number | null;
}

export interface Scale {
  breaks: number[]; // ichki chegaralar, o'sish tartibida (sinflar soni = breaks.length + 1)
  colors: string[];
  diverging: boolean;
  min: number;
  max: number;
}

// Portal tizimi: bitta ko'k gamma (och → to'q), markazli shkala uchun amber–ko'k (rang ko'rmaslikda ham ajraladi)
export const SEQUENTIAL = ["#E8EFFD", "#B9CFF8", "#7DA6F1", "#3E79E8", "#1745B5"];
const DIVERGING = ["#B45309", "#F0BC7E", "#F1F3F6", "#8DB3F2", "#155EEF"];
export const MISSING_COLOR = "#D0D5DD";

/** Rang ustidagi matn: och fonda to'q, to'q fonda oq (WCAG nisbiy yorqinlik). */
export function readableOn(hex: string) {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2] > 0.35 ? "#172B4D" : "#FFFFFF";
}

export function buildScale(input: ScaleInput, mode: ScaleMode, higherIsBetter: boolean | null): Scale | null {
  const { min, max } = input;
  if (min === null || max === null) return null;
  const center = input.diverging_center;
  if (center !== null && min < center && max > center) {
    const d = Math.max(center - min, max - center);
    const colors = higherIsBetter === false ? [...DIVERGING].reverse() : DIVERGING;
    return { breaks: [center - 0.6 * d, center - 0.2 * d, center + 0.2 * d, center + 0.6 * d], colors, diverging: true, min, max };
  }
  let breaks: number[];
  if (mode === "linear" || input.quantiles.length !== 4) {
    const step = (max - min) / 5;
    breaks = [1, 2, 3, 4].map((i) => min + step * i);
  } else {
    breaks = dedupe(input.quantiles);
  }
  const colors = breaks.length + 1 === 5 ? SEQUENTIAL : pick(SEQUENTIAL, breaks.length + 1);
  return { breaks, colors, diverging: false, min, max };
}

function dedupe(values: number[]) {
  return values.filter((v, i) => i === 0 || v > values[i - 1]);
}

function pick(palette: string[], n: number) {
  if (n <= 1) return [palette[2]];
  return Array.from({ length: n }, (_, i) => palette[Math.round((i * (palette.length - 1)) / (n - 1))]);
}

export function classOf(value: number, breaks: number[]) {
  let i = 0;
  while (i < breaks.length && value > breaks[i]) i += 1;
  return i;
}

export function colorFor(value: number | null | undefined, scale: Scale | null) {
  if (value === null || value === undefined || !scale) return null;
  return scale.colors[classOf(value, scale.breaks)];
}

/** Legenda qatorlari: [dan, gacha, rang]. */
export function legendRows(scale: Scale) {
  const edges = [scale.min, ...scale.breaks, scale.max];
  return scale.colors.map((color, i) => ({ from: edges[i], to: edges[i + 1], color }));
}

// KR-11: bivariate rejim — har ko'rsatkich uchun 3 sinf (tertil), 3×3 matritsa (ko'k × amber, portal palitrasi)
export const BIVARIATE = [
  ["#EEF1F6", "#BFD3F7", "#6C9CF0"],
  ["#F6DDB8", "#C7BFC4", "#6F88B8"],
  ["#EBAF55", "#B48A68", "#4A5A78"],
];

export function tertiles(values: number[]) {
  const s = [...values].sort((a, b) => a - b);
  if (!s.length) return [0, 0];
  const at = (q: number) => s[Math.min(s.length - 1, Math.floor(q * s.length))];
  return [at(1 / 3), at(2 / 3)];
}

/** x — birinchi ko'rsatkich (ustun), y — ikkinchi (qator). */
export function bivariateColor(x: number | null, y: number | null, tx: number[], ty: number[]) {
  if (x === null || y === null) return null;
  return BIVARIATE[classOf(y, ty)][classOf(x, tx)];
}

const nf1 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const nf0 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 });

export function formatValue(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return Math.abs(value) >= 1000 ? nf0.format(value) : nf1.format(value);
}
