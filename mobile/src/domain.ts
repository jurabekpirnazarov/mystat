export type Tone = 'neutral' | 'warning' | 'danger' | 'info' | 'success';
export type ReportStatus = 'submitted' | 'due_soon' | 'overdue' | 'unknown';

const DAY = 86400000;
const toDay = (s: string) => Date.parse(s.slice(0, 10) + 'T00:00:00Z');
export const todayStr = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

/** Muddatgacha qolgan kun (manfiy = o'tgan) */
export const daysLeft = (deadline: string, today: string) => Math.round((toDay(deadline) - toDay(today)) / DAY);

/** HT-03: saqlanmaydi, hisoblanadi. `unknown` hech qachon "Topshirilmagan" deb yozilmaydi. */
export function computeStatus(row: { status: string; deadline: string }, today: string): ReportStatus {
  if (row.status === 'submitted') return 'submitted';
  const d = daysLeft(row.deadline, today);
  if (d < 0) return 'overdue';
  if (d <= 5) return 'due_soon';
  return 'unknown';
}
export const STATUS_LABEL: Record<ReportStatus, { label: string; tone: Tone; icon: string }> = {
  submitted: { label: 'Topshirilgan', tone: 'info', icon: '✓' },
  due_soon: { label: 'Muddati yaqin', tone: 'warning', icon: '!' },
  overdue: { label: "Muddati o'tgan", tone: 'danger', icon: '×' },
  unknown: { label: "Ma'lumot yo'q", tone: 'neutral', icon: '–' },
};
