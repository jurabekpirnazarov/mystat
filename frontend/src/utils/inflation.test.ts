import { describe, expect, it } from "vitest";
import { adjustAmount, annualize, compareGrowth, depositReal, priceFactor, purchasingPower, realRate, type CpiPoint } from "./inflation";

// Har oy +1% (oylik indeks 101) — 12 oyda 1.01^12 ≈ 1.126825
const series: CpiPoint[] = [];
let level = 100;
for (let i = 0; i <= 24; i++) {
  const y = 2020 + Math.floor(i / 12);
  const m = (i % 12) + 1;
  if (i > 0) level *= 1.01;
  series.push({ month: `${y}-${String(m).padStart(2, "0")}`, mom: 101, index: level });
}

describe("inflyatsiya hisoblari (FQ-03)", () => {
  it("narx koeffitsienti oylik indekslar ko'paytmasi", () => {
    expect(priceFactor(series, "2020-01", "2021-01")).toBeCloseTo(Math.pow(1.01, 12), 10);
  });

  it("1-stsenariy: maosh bugungi narxlarda (qo'lda: 1 000 000 × 1.01^12 = 1 126 825)", () => {
    const r = adjustAmount(series, 1_000_000, "2020-01", "2021-01");
    expect(Math.round(r!.value)).toBe(1_126_825);
    expect(r!.inflationPct).toBeCloseTo(12.6825, 3);
  });

  it("2-stsenariy: ijara 20% oshdi, inflyatsiya 12.68% — real o'sish ≈ 6.49%", () => {
    const r = compareGrowth(series, 1_000_000, 1_200_000, "2020-01", "2021-01");
    expect(r!.growthPct).toBeCloseTo(20, 10);
    expect(r!.realChangePct).toBeCloseTo((1.2 / Math.pow(1.01, 12) - 1) * 100, 10);
  });

  it("3-stsenariy: 20% omonat, yillik inflyatsiya 12.68% — real stavka (1.2/1.126825−1)", () => {
    const r = depositReal(series, 20, "2020-01", "2021-01");
    expect(r!.inflationAnnualPct).toBeCloseTo(12.6825, 3);
    expect(r!.realRatePct).toBeCloseTo((1.2 / Math.pow(1.01, 12) - 1) * 100, 6);
    expect(realRate(0.1, 0.1)).toBe(0);
    expect(annualize(Math.pow(1.01, 24), 24)).toBeCloseTo(Math.pow(1.01, 12) - 1, 10);
  });

  it("xarid qobiliyati kamayib boradi va noma'lum oy uchun null", () => {
    const pp = purchasingPower(series, 1000, "2020-01", "2020-04");
    expect(pp.map((p) => p.value)).toEqual([1000, 990, 980, 971]);
    expect(adjustAmount(series, 1, "1999-01", "2020-01")).toBeNull();
  });
});
