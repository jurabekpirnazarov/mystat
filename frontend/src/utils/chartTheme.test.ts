import { describe, expect, it } from "vitest";
import { formatAxis, niceAxis } from "./chartTheme";

describe("niceAxis", () => {
  it("o'q 0 dan emas, ma'lumot atrofida boshlanadi", () => {
    const { domain, ticks } = niceAxis([3119, 3500, 4379.8]);
    expect(domain[0]).toBeGreaterThan(2500);
    expect(domain[0]).toBeLessThanOrEqual(3119);
    expect(domain[1]).toBeGreaterThanOrEqual(4379.8);
    expect(ticks?.[0]).toBe(domain[0]);
    expect(ticks?.[ticks.length - 1]).toBe(domain[1]);
  });

  it("bo'linmalar teng qadamli", () => {
    const { ticks } = niceAxis([1233.4, 4226.5]);
    const steps = ticks!.slice(1).map((t, i) => Number((t - ticks![i]).toFixed(6)));
    expect(new Set(steps).size).toBe(1);
    expect(ticks!.length).toBeGreaterThanOrEqual(4);
  });

  it("musbat qiymatlarda 0 dan pastga tushmaydi, manfiylarni qamraydi", () => {
    expect(niceAxis([0.5, 30]).domain[0]).toBe(0);
    const { domain } = niceAxis([-12, 8]);
    expect(domain[0]).toBeLessThanOrEqual(-12);
    expect(domain[1]).toBeGreaterThanOrEqual(8);
  });

  it("null, bir xil qiymat va bo'sh ro'yxat", () => {
    expect(niceAxis([null, undefined]).domain).toEqual(["auto", "auto"]);
    const { domain } = niceAxis([5, 5, null]);
    expect(domain[0]).toBeLessThan(5);
    expect(domain[1]).toBeGreaterThan(5);
  });
});

describe("formatAxis", () => {
  it("katta sonlar ixcham, kichiklari odatdagidek", () => {
    expect(formatAxis(3_800_000)).toBe("3,8 mln");
    expect(formatAxis(12_500_000_000)).toBe("12,5 mlrd");
    expect(formatAxis(4.5)).toBe("4,5");
  });
});
