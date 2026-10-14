/** FQ-03: inflyatsiya hisoblari (sof funksiyalar, unit test bilan). Qator — zanjirli indeks: {month: "YYYY-MM", index}. */
export interface CpiPoint {
  month: string;
  mom: number;
  index: number;
}

export function indexAt(series: CpiPoint[], month: string): number | null {
  return series.find((p) => p.month === month)?.index ?? null;
}

/** `from` oyidagi narxlardan `to` oyidagi narxlarga o'tish koeffitsienti (I_to / I_from). */
export function priceFactor(series: CpiPoint[], from: string, to: string): number | null {
  const a = indexAt(series, from);
  const b = indexAt(series, to);
  return a && b ? b / a : null;
}

export function monthsBetween(from: string, to: string): number {
  const [fy, fm] = from.split("-").map(Number);
  const [ty, tm] = to.split("-").map(Number);
  return (ty - fy) * 12 + (tm - fm);
}

/** Davr inflyatsiyasini yillikka keltirish: factor^(12/oylar) − 1. */
export function annualize(factor: number, months: number): number {
  return months > 0 ? Math.pow(factor, 12 / months) - 1 : 0;
}

/** Real foiz stavkasi: (1 + nominal) / (1 + inflyatsiya) − 1 (ikkalasi ham ulushda, masalan 0.2). */
export function realRate(nominal: number, inflation: number): number {
  return (1 + nominal) / (1 + inflation) - 1;
}

/** 1-stsenariy: o'tgan summaning bugungi narxlardagi ekvivalenti. */
export function adjustAmount(series: CpiPoint[], amount: number, from: string, to: string) {
  const factor = priceFactor(series, from, to);
  if (factor === null) return null;
  return { value: amount * factor, inflationPct: (factor - 1) * 100, factor };
}

/** 2-stsenariy: ijara (yoki istalgan narx) inflyatsiyadan tez o'sdimi? */
export function compareGrowth(series: CpiPoint[], startValue: number, endValue: number, from: string, to: string) {
  const factor = priceFactor(series, from, to);
  if (factor === null || startValue <= 0) return null;
  const growth = endValue / startValue;
  return { growthPct: (growth - 1) * 100, inflationPct: (factor - 1) * 100, realChangePct: (growth / factor - 1) * 100 };
}

/** 3-stsenariy: kredit/omonat nominal yillik foizi davrdagi inflyatsiyani qoplaydimi? */
export function depositReal(series: CpiPoint[], nominalAnnualPct: number, from: string, to: string) {
  const factor = priceFactor(series, from, to);
  const months = monthsBetween(from, to);
  if (factor === null || months <= 0) return null;
  const inflationAnnual = annualize(factor, months);
  const real = realRate(nominalAnnualPct / 100, inflationAnnual);
  return { inflationAnnualPct: inflationAnnual * 100, realRatePct: real * 100 };
}

/** Grafik: summaning xarid qobiliyati oyma-oy (boshlang'ich oy narxlarida). */
export function purchasingPower(series: CpiPoint[], amount: number, from: string, to: string) {
  const start = indexAt(series, from);
  if (!start) return [];
  return series
    .filter((p) => p.month >= from && p.month <= to)
    .map((p) => ({ month: p.month, value: Math.round((amount * start) / p.index) }));
}
