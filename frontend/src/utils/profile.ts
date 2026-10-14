import type { PrefillField } from "../hooks/usePrefill";

export const PROFILE_FIELDS: { key: string; label: string; required: boolean }[] = [
  { key: "full_name", label: "F.I.Sh.", required: true },
  { key: "phone", label: "Telefon", required: true },
  { key: "email", label: "Email", required: false },
  { key: "org_name", label: "Korxona nomi", required: true },
  { key: "tin", label: "STIR", required: true },
  { key: "address", label: "Manzil", required: true },
  { key: "region", label: "Viloyat", required: true },
  { key: "district", label: "Tuman", required: true },
  { key: "sector", label: "Tarmoq (OKED)", required: true },
];

/** U-15: majburiy maydonlarning necha foizi to'ldirilgan va qaysilari yetishmaydi. */
export function profileCompleteness(fields: PrefillField[], individual = false) {
  const have = new Set(fields.filter((f) => String(f.value).trim() !== "").map((f) => f.field));
  const orgOnly = new Set(["org_name", "tin", "address", "district", "sector", "region"]);
  const required = PROFILE_FIELDS.filter((f) => f.required && !(individual && orgOnly.has(f.key)));
  const missing = required.filter((f) => !have.has(f.key));
  return { percent: Math.round(((required.length - missing.length) / required.length) * 100), missing };
}
