import { describe, expect, it } from "vitest";
import { toCyrillic } from "./translit";

describe("toCyrillic", () => {
  it("o', g', sh, ch harflari", () => {
    expect(toCyrillic("O'zbekiston")).toBe("Ўзбекистон");
    expect(toCyrillic("Sog'liqni saqlash")).toBe("Соғлиқни сақлаш");
    expect(toCyrillic("Ishonch")).toBe("Ишонч");
  });
  it("so'z boshidagi e — э", () => {
    expect(toCyrillic("eksport va import")).toBe("экспорт ва импорт");
  });
  it("ya, yo, yu", () => {
    expect(toCyrillic("Yangi yo'l")).toBe("Янги йўл");
  });
});
