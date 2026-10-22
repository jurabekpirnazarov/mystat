const MONTHS_UZ = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

/** "13 okt 2026, 14:05" */
export function formatDateTime(value: string | null | undefined, withTime = true): string {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return value;
  const date = `${d.getDate()} ${MONTHS_UZ[d.getMonth()]} ${d.getFullYear()}`;
  if (!withTime) return date;
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${date}, ${hh}:${mm}`;
}

/** "3 daqiqa oldin", "2 kun oldin"; bir haftadan eski bo'lsa — sana */
export function timeAgo(value: string | null | undefined): string {
  if (!value) return "";
  const diff = (Date.now() - new Date(value).getTime()) / 1000;
  if (diff < 60) return "hozirgina";
  if (diff < 3600) return `${Math.floor(diff / 60)} daqiqa oldin`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} soat oldin`;
  if (diff < 7 * 86400) return `${Math.floor(diff / 86400)} kun oldin`;
  return formatDateTime(value, false);
}

/** "2026-03" -> "mar" */
export function monthLabel(yyyyMm: string): string {
  const month = Number(yyyyMm.split("-")[1]);
  return MONTHS_UZ[month - 1] ?? yyyyMm;
}

export function formatMoney(value: string | number | null | undefined): string {
  const n = Number(value ?? 0);
  return `${new Intl.NumberFormat("uz-UZ").format(Math.round(n)).replace(/,/g, " ")} so'm`;
}

/** RichText maydonlardan teglarni olib tashlash */
export function stripHtml(html: string | null | undefined): string {
  if (!html) return "";
  const div = document.createElement("div");
  div.innerHTML = html;
  return (div.textContent || "").trim();
}

export const nowTime = () => new Date().toLocaleTimeString("uz-UZ", { hour: "2-digit", minute: "2-digit" });

/** Xizmat bajarish muddati kodi (backend `Service.DURATION_CHOICES`) -> o'qiladigan matn. */
const DURATION_LABELS: Record<string, string> = {
  now: "Darhol",
  to_1_day: "1 kun",
  to_1_2_day: "1–2 kun",
  to_week: "1 hafta",
};
export const durationLabel = (code?: string | null): string => (code ? DURATION_LABELS[code] ?? code : "—");
