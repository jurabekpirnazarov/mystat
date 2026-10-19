import { describe, expect, it } from "vitest";
import { loginUrl, safeReturnPath } from "./loginRedirect";

describe("safeReturnPath", () => {
  it("sayt ichidagi yo'lni qabul qiladi", () => {
    expect(safeReturnPath("/partners?q=olma")).toBe("/partners?q=olma");
  });

  it("tashqi va xavfli manzillarni rad etadi", () => {
    expect(safeReturnPath("https://evil.uz")).toBeNull();
    expect(safeReturnPath("//evil.uz")).toBeNull();
    expect(safeReturnPath("/\\evil.uz")).toBeNull();
    expect(safeReturnPath("")).toBeNull();
    expect(safeReturnPath(null)).toBeNull();
  });

  it("login va OneID sahifalariga qaytarmaydi", () => {
    expect(safeReturnPath("/login")).toBeNull();
    expect(safeReturnPath("/login?next=/x")).toBeNull();
    expect(safeReturnPath("/auth/oneid/callback?code=1")).toBeNull();
  });
});

describe("loginUrl", () => {
  it("next parametrini kodlaydi", () => {
    expect(loginUrl("/market-report?hs=0901")).toBe("/login?next=%2Fmarket-report%3Fhs%3D0901");
  });

  it("noto'g'ri manzilda oddiy /login", () => {
    expect(loginUrl("//evil.uz")).toBe("/login");
  });
});
