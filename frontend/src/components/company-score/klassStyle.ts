import type { Klass } from "../../api/companyScores";

/** A yashil, B och yashil, C sariq, D to'q sariq, E qizil; "—" kulrang shtrix. Rangdan tashqari harf ham bor. */
export const KLASS_STYLE: Record<Exclude<Klass, ""> | "none", { bg: string; text: string; ring: string; hex: string }> = {
  A: { bg: "bg-emerald-600", text: "text-white", ring: "ring-emerald-700", hex: "#059669" },
  B: { bg: "bg-lime-400", text: "text-lime-950", ring: "ring-lime-600", hex: "#a3e635" },
  C: { bg: "bg-yellow-300", text: "text-yellow-950", ring: "ring-yellow-500", hex: "#fde047" },
  D: { bg: "bg-orange-500", text: "text-white", ring: "ring-orange-700", hex: "#f97316" },
  E: { bg: "bg-red-600", text: "text-white", ring: "ring-red-800", hex: "#dc2626" },
  none: { bg: "bg-gray-200 dark:bg-gray-600", text: "text-gray-600 dark:text-gray-200", ring: "ring-gray-400", hex: "#9ca3af" },
};
