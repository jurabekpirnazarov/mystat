import { describe, expect, it } from "vitest";
import { computePrefill, type PrefillField } from "./usePrefill";

const fields: PrefillField[] = [
  { field: "tin", value: "900000222", source: "organization", fetched_at: null },
  { field: "org_name", value: "K LLC", source: "organization", fetched_at: null },
  { field: "phone", value: "+998901112233", source: "profile", fetched_at: null },
];
const mapping = { stir: ["tin"], companyName: ["org_name"], phoneNumber: ["org_phone", "phone"], address: ["address"] };

describe("computePrefill (K-01)", () => {
  it("bo'sh maydonlarni manba bilan to'ldiradi", () => {
    const { updates, sources } = computePrefill(mapping, { stir: "", companyName: "", phoneNumber: "", address: "" }, new Set(), fields);
    expect(updates).toEqual({ stir: "900000222", companyName: "K LLC", phoneNumber: "+998901112233" });
    expect(sources.phoneNumber?.source).toBe("profile");
    expect(updates.address).toBeUndefined();
  });

  it("qo'lda o'zgartirilgan maydon qayta to'ldirishda saqlanib qoladi", () => {
    const edited = new Set<keyof typeof mapping>(["companyName"]);
    // foydalanuvchi nomni o'chirib tashlagan bo'lsa ham (bo'sh), tahrirlangani uchun qayta yozilmaydi
    const { updates } = computePrefill(mapping, { stir: "", companyName: "", phoneNumber: "", address: "" }, edited, fields);
    expect(updates.companyName).toBeUndefined();
    expect(updates.stir).toBe("900000222");
  });

  it("to'ldirilgan qiymatning ustidan yozmaydi", () => {
    const { updates } = computePrefill(mapping, { stir: "123", companyName: "Mening nomim", phoneNumber: "", address: "" }, new Set(), fields);
    expect(updates).toEqual({ phoneNumber: "+998901112233" });
  });
});
