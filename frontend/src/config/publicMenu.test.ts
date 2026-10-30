import { describe, expect, it } from "vitest";
import { FOOTER_LINKS, PUBLIC_MENU, SOCIALS } from "./publicMenu";
import { indicatorsUrl, searchUrl } from "./searchFilters";

const text = (v: string | { uz: string; ru?: string }) => (typeof v === "string" ? v : v.uz);
const links = PUBLIC_MENU.flatMap((g) => (g.to ? [{ to: g.to, label: g.label }] : (g.groups ?? []).flatMap((x) => x.links)));

describe("publicMenu (UI_QAYTA_TUZISH.md 4.3)", () => {
  it("6 ta band: 5 ochiluvchi + 1 havola", () => {
    expect(PUBLIC_MENU).toHaveLength(6);
    expect(PUBLIC_MENU.filter((g) => g.to)).toHaveLength(1);
  });
  it("har havola ichki yo'l va nomga ega", () => {
    for (const l of links) {
      expect(l.to.startsWith("/")).toBe(true);
      expect(text(l.label).length).toBeGreaterThan(0);
    }
  });
  it("footer havolalari ichki; ijtimoiy tarmoqlar https", () => {
    expect(FOOTER_LINKS.every((l) => l.to.startsWith("/"))).toBe(true);
    expect(SOCIALS.every((s) => s.href.startsWith("https://"))).toBe(true);
  });
  it("lotin nomlarda kirill harf yo'q (X-9)", () => {
    expect(links.map((l) => text(l.label)).filter((s) => /[А-Яа-я]/.test(s))).toEqual([]);
  });
});

describe("searchFilters", () => {
  it("bo'sh qiymatlar URL'ga yozilmaydi", () => {
    expect(searchUrl("")).toBe("/search");
    expect(searchUrl(" eksport ", "faq")).toBe("/search?q=eksport&type=faq");
    expect(indicatorsUrl("aholi", "population")).toBe("/indicators?q=aholi&topic=population");
  });
});
