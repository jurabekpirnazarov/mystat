import { useTheme } from "../contexts/ThemeContext";

/** Recharts grafiklari uchun yorug'/qorong'i mavzuga mos ranglar (o'qlar, to'r, tooltip). */
export function useChartTheme() {
  const dark = useTheme().theme === "dark";
  return {
    grid: dark ? "#374151" : "#e5e7eb",
    axis: dark ? "#9ca3af" : "#6b7280",
    tooltip: {
      contentStyle: {
        background: dark ? "#1f2937" : "#ffffff",
        border: `1px solid ${dark ? "#374151" : "#e5e7eb"}`,
        borderRadius: 8,
        fontSize: 12,
        color: dark ? "#f3f4f6" : "#111827",
      },
      labelStyle: { fontWeight: 600, color: dark ? "#f3f4f6" : "#111827" },
    },
    dotFill: dark ? "#1f2937" : "#ffffff",
  };
}

/**
 * O'q chegaralari va bo'linmalari: 0 dan emas, ma'lumot atrofida (8% zaxira bilan), teng "chiroyli" qadam bilan
 * (1, 2, 2.5, 5 × 10ⁿ). Qiymatlar musbat bo'lsa 0 dan pastga tushmaydi. YAxis/XAxis'ga `{...niceAxis(...)}` qilib beriladi.
 */
export function niceAxis(values: (number | null | undefined)[], count = 5): { domain: [number, number] | ["auto", "auto"]; ticks?: number[] } {
  const xs = values.filter((v): v is number => typeof v === "number" && Number.isFinite(v));
  if (!xs.length) return { domain: ["auto", "auto"] };
  let min = Math.min(...xs);
  let max = Math.max(...xs);
  if (min === max) {
    const d = Math.abs(min) * 0.1 || 1;
    min -= d;
    max += d;
  }
  const pad = (max - min) * 0.08;
  const step = niceStep((max - min + 2 * pad) / (count - 1));
  let lo = Math.floor((min - pad) / step) * step;
  if (min >= 0 && lo < 0) lo = 0;
  const hi = Math.ceil((max + pad) / step) * step;
  const ticks: number[] = [];
  for (let v = lo; v <= hi + step / 2; v += step) ticks.push(round(v));
  return { domain: [round(lo), round(hi)], ticks };
}

function niceStep(raw: number) {
  const p = 10 ** Math.floor(Math.log10(raw));
  const f = raw / p;
  return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
}

const round = (v: number) => Number(v.toPrecision(12));

const compact1 = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

/** O'q yorliqlari uchun ixcham son: 3 800 000 → "3,8 mln", 12 500 000 000 → "12,5 mlrd". Kichik sonlar o'zgarmaydi. */
export function formatAxis(value: number) {
  const a = Math.abs(value);
  if (a >= 1e9) return `${compact1.format(value / 1e9)} mlrd`;
  if (a >= 1e6) return `${compact1.format(value / 1e6)} mln`;
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: a >= 1000 ? 0 : 1 }).format(value);
}
