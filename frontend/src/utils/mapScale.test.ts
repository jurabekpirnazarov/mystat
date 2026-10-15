import { describe, expect, it } from "vitest";
import { BIVARIATE, bivariateColor, buildScale, classOf, colorFor, legendRows, SEQUENTIAL, tertiles } from "./mapScale";

const input = { min: 2, max: 12, quantiles: [4, 5, 6, 9], diverging_center: null };

describe("mapScale (KR-06)", () => {
  it("null — ma'lumot yo'q, hech qachon eng past rang emas (N2)", () => {
    const scale = buildScale(input, "quantile", null);
    expect(colorFor(null, scale)).toBeNull();
    expect(colorFor(undefined, scale)).toBeNull();
    expect(colorFor(0, scale)).toBe(SEQUENTIAL[0]);
  });

  it("kvantil chegaralari barcha davrlar bo'yicha (backenddan)", () => {
    const scale = buildScale(input, "quantile", null)!;
    expect(scale.breaks).toEqual([4, 5, 6, 9]);
    expect(colorFor(4.5, scale)).toBe(SEQUENTIAL[1]);
    expect(colorFor(12, scale)).toBe(SEQUENTIAL[4]);
  });

  it("chiziqli shkala teng oraliqlar", () => {
    const scale = buildScale(input, "linear", null)!;
    expect(scale.breaks).toEqual([4, 6, 8, 10]);
    expect(legendRows(scale)[0]).toEqual({ from: 2, to: 4, color: SEQUENTIAL[0] });
  });

  it("takroriy kvantillar birlashtiriladi", () => {
    const scale = buildScale({ ...input, quantiles: [5, 5, 5, 9] }, "quantile", null)!;
    expect(scale.breaks).toEqual([5, 9]);
    expect(scale.colors).toHaveLength(3);
  });

  it("o'sish sur'ati: 100 markazli ikki tomonlama shkala, past yaxshi bo'lsa teskari", () => {
    const scale = buildScale({ min: 90, max: 120, quantiles: [], diverging_center: 100 }, "quantile", true)!;
    expect(scale.diverging).toBe(true);
    expect(classOf(100, scale.breaks)).toBe(2);
    const reversed = buildScale({ min: 90, max: 120, quantiles: [], diverging_center: 100 }, "quantile", false)!;
    expect(reversed.colors[0]).toBe(scale.colors[4]);
  });

  it("markaz oraliqdan tashqarida bo'lsa oddiy shkala", () => {
    expect(buildScale({ min: 101, max: 120, quantiles: [105, 108, 110, 115], diverging_center: 100 }, "quantile", true)!.diverging).toBe(false);
  });

  it("bivariate 3×3", () => {
    const [a, b] = tertiles([1, 2, 3, 4, 5, 6, 7, 8, 9]);
    expect(a).toBeLessThan(b);
    expect(bivariateColor(1, 1, [a, b], [a, b])).toBe(BIVARIATE[0][0]);
    expect(bivariateColor(9, 1, [a, b], [a, b])).toBe(BIVARIATE[0][2]);
    expect(bivariateColor(null, 1, [a, b], [a, b])).toBeNull();
  });
});
