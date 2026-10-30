/**
 * LX-04: qidiruv filtrlari uchun yagona manba (`SearchPanel`, `/search`, `/indicators`).
 * Faqat backend haqiqatan qo'llab-quvvatlaydigan turlar: xizmatlar, korxonalar, savollar, maqolalar, lug'at.
 */
export interface SearchType { key: string; label: string }

export const SEARCH_TYPES: SearchType[] = [
  { key: "", label: "Hammasi" },
  { key: "services", label: "Xizmatlar" },
  { key: "companies", label: "Korxonalar" },
  { key: "faq", label: "Savollar" },
  { key: "articles", label: "Maqolalar" },
  { key: "glossary", label: "Lug'at" },
];

export const POPULAR_QUERIES = ["Eksport", "Inflyatsiya", "STIR", "Hisobot", "Aholi", "Maosh"];

/** `/search?q=…&type=…` — bo'sh qiymatlar URL'ga yozilmaydi */
export function searchUrl(q: string, type = "") {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (type) p.set("type", type);
  const s = p.toString();
  return `/search${s ? `?${s}` : ""}`;
}

/** `/indicators?q=…&topic=…` */
export function indicatorsUrl(q: string, topic = "") {
  const p = new URLSearchParams();
  if (q.trim()) p.set("q", q.trim());
  if (topic) p.set("topic", topic);
  const s = p.toString();
  return `/indicators${s ? `?${s}` : ""}`;
}
