import { describe, expect, it } from "vitest";
import { DEFAULT_LAYOUT, MIN_CARDS, normalizeLayout } from "./homeWidgets";

const on = (l: ReturnType<typeof normalizeLayout>) => l.cards.filter((c) => c.enabled).length;

describe("normalizeLayout", () => {
  it("buzilgan yoki eski versiya — standart", () => {
    expect(normalizeLayout(null)).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout({ version: 0 })).toEqual(DEFAULT_LAYOUT);
    expect(normalizeLayout("x")).toEqual(DEFAULT_LAYOUT);
  });
  it("3 ta yoqilgan — 4 ga to'ldiriladi", () => {
    const l = normalizeLayout({ ...DEFAULT_LAYOUT, cards: DEFAULT_LAYOUT.cards.map((c, i) => ({ ...c, enabled: i < 3 })) });
    expect(on(l)).toBe(MIN_CARDS);
  });
  it("noma'lum kalit tashlanadi, yetishmagani to'ldiriladi", () => {
    const l = normalizeLayout({ ...DEFAULT_LAYOUT, cards: [{ key: "yo'q", enabled: true }, { key: "wage", enabled: true }], region: "9999" });
    expect(l.cards.some((c) => (c.key as string) === "yo'q")).toBe(false);
    expect(l.cards.length).toBe(DEFAULT_LAYOUT.cards.length);
    expect(l.region).toBe(DEFAULT_LAYOUT.region);
    expect(on(l)).toBeGreaterThanOrEqual(MIN_CARDS);
  });
  it("karta ko'rsatkichi hudud kesimi bo'lmasa — standart", () => {
    expect(normalizeLayout({ ...DEFAULT_LAYOUT, map: { indicator: "pop_growth" } }).map.indicator).toBe("population");
  });
});
