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

// ColorBrewer YlGnBu va RdBu (5 sinf)
export const SEQUENTIAL = ["#ffffcc", "#a1dab4", "#41b6c4", "#2c7fb8", "#253494"];
const DIVERGING = ["#ca0020", "#f4a582", "#f7f7f7", "#92c5de", "#0571b0"];
export const MISSING_COLOR = "#d1d5db";

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

// KR-11: bivariate rejim — har ko'rsatkich uchun 3 sinf (tertil), 3×3 matritsa (Stevens palitrasi)
export const BIVARIATE = [
  ["#e8e8e8", "#e4acac", "#c85a5a"],
  ["#b0d5df", "#ad9ea5", "#985356"],
  ["#64acbe", "#627f8c", "#574249"],
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
