import { describe, expect, it } from "vitest";
import { salaryPercentile } from "./salary";

const d = { p25: 2000, median: 3000, p75: 4500, p90: 6000 };

describe("salaryPercentile (FQ-05)", () => {
  it("taqsimot nuqtalarida aniq qiymat", () => {
    expect(salaryPercentile(2000, d)).toBe(25);
    expect(salaryPercentile(3000, d)).toBe(50);
    expect(salaryPercentile(4500, d)).toBe(75);
    expect(salaryPercentile(6000, d)).toBe(90);
  });

  it("oraliqda chiziqli: 3750 — median va p75 o'rtasi", () => {
    expect(salaryPercentile(3750, d)).toBe(63);
    expect(salaryPercentile(1000, d)).toBe(13);
  });

  it("chegaralar", () => {
    expect(salaryPercentile(0, d)).toBe(0);
    expect(salaryPercentile(-5, d)).toBe(0);
    expect(salaryPercentile(100000, d)).toBe(99);
  });
});
