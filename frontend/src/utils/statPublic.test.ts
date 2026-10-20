import { describe, expect, it } from "vitest";
import { citations, embedCode, estimatePopulation, formatValue, secondsPerPerson } from "./statPublic";

describe("formatValue", () => {
  it("katta sonni bo'shliq bilan, kichigini kasr bilan", () => {
    expect(formatValue(1849650)).toBe("1 849 650");
    expect(formatValue(107.7)).toBe("107,7");
    expect(formatValue(4.8)).toBe("4,8");
    expect(formatValue(null)).toBe("—");
  });
});

describe("aholi soati (JT-02)", () => {
  const clock = { base_at: "2026-01-01T00:00:00+05:00", base_population: 38_236_700, annual_growth_pct: 1.847 };

  it("bazaviy sanada bazaviy son", () => {
    const t0 = new Date("2026-01-01T00:00:00+05:00").getTime();
    expect(Math.round(estimatePopulation(clock, t0))).toBe(38_236_700);
  });

  it("bir yildan keyin o'sish sur'ati bo'yicha", () => {
    const t1 = new Date("2026-01-01T00:00:00+05:00").getTime() + 365.2425 * 86400 * 1000;
    expect(Math.round(estimatePopulation(clock, t1))).toBe(Math.round(38_236_700 * 1.01847));
  });

  it("rasmiy parametrlar bilan stat.uz hisoblagichi bilan bir xil (chiziqli)", () => {
    // stat.uz: 2026-10-01 00:00 da 39 535 225; tug'ilish 30 s, o'lim 220, kelish 85, ketish 84; sec=1 696 679 -> 39 583 830
    const net = 1 / 30 - 1 / 220 + 1 / 85 - 1 / 84;
    const official = { base_at: "2026-10-01T00:00:00+05:00", base_population: 39_535_225, annual_growth_pct: 2.287, net_per_second: net };
    const t = new Date("2026-10-01T00:00:00+05:00").getTime() + 1_696_679 * 1000;
    expect(Math.abs(estimatePopulation(official, t) - 39_583_830)).toBeLessThan(3);
    expect(secondsPerPerson(official)).toBeCloseTo(34.9, 1);
  });

  it("bir kishiga soniyalar; o'sish 0 bo'lsa null", () => {
    expect(secondsPerPerson(clock)).toBeCloseTo(44.7, 0);
    expect(secondsPerPerson({ ...clock, annual_growth_pct: 0 })).toBeNull();
  });
});

describe("iqtibos va embed (JT-15)", () => {
  it("APA va GOST manba, havola va sanani o'z ichiga oladi", () => {
    const c = citations("Ishsizlik darajasi", "https://my.stat.uz/dashboards/labour", "2025", new Date(2026, 9, 20));
    expect(c.apa).toContain("(2025). Ishsizlik darajasi");
    expect(c.apa).toContain("murojaat sanasi: 20.10.2026");
    expect(c.gost).toContain("[Elektron resurs]");
  });

  it("embed kodida sarlavha xavfsiz", () => {
    const code = embedCode("https://my.stat.uz", "1875", 'Ish "haqi" <b>');
    expect(code).toContain('src="https://my.stat.uz/embed/indicator/1875"');
    expect(code).not.toContain("<b>");
    expect(code).toContain("&quot;haqi&quot;");
  });
});
