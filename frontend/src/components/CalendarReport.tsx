import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { getRequest } from "../api/request";
import { calendar } from "../api/apiUrls";

/**
 * Bosh sahifa: statistik hisobotlarni topshirish muddatlari (respondentlar uchun). To'liq ko'rinish — /report-calendar.
 * - Hafta dushanbadan boshlanadi (O'zbekistonda shunday; ilgari yakshanbadan edi).
 * - O'tgan muddatlar xira, kelayotganlari to'q — bugungi kundan oldingi va keyingi kunlar adashtirilmaydi.
 * - "Yaqin muddatlar" sana bo'yicha guruhlangan (ilgari tartib buzilgan: 25, keyin 5).
 * API: `reportlist/?year&month` — oy hisobotlari va `meta.has_reports_days` (muddat kunlari). Oylik hisobotlar har oy
 * shu kunga takrorlanadi, shuning uchun hisobot kuni `deadline` sanasining kunidan olinadi.
 */

interface ApiReport {
  id: string;
  type_uz: string;
  formsname_uz: string;
  srok_uz: string;
  deadline: string;
  report_type: string;
}

interface CalendarApiResponse {
  data: ApiReport[];
  meta: { month_count: number; has_reports_days: number[] };
}

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const WEEK = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const TYPE: Record<string, string> = { monthly: "Oylik", quarterly: "Choraklik", yearly: "Yillik", annual: "Yillik", weekly: "Haftalik" };

/** Bazadagi ba'zi nomlarda kodlash xatosi ("Рѕylik" = "oylik") va Excel qoldiqlari */
const clean = (t: string) => (t || "").replace(/Рѕ/g, "o").replace(/_x000D_/g, " ").replace(/\s+/g, " ").trim();

export default function CalendarReport() {
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1); });
  const [data, setData] = useState<CalendarApiResponse | null>(null);
  const [failed, setFailed] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    let alive = true;
    setData(null);
    setFailed(false);
    setSelected(null);
    getRequest(`${calendar}?year=${month.getFullYear()}&month=${month.getMonth() + 1}`)
      .then((r) => alive && setData(r as CalendarApiResponse))
      .catch(() => alive && setFailed(true));
    return () => { alive = false; };
  }, [month]);

  const today = new Date();
  const isCurrent = month.getFullYear() === today.getFullYear() && month.getMonth() === today.getMonth();
  const isPast = month < new Date(today.getFullYear(), today.getMonth(), 1);
  const dueDays = useMemo(() => new Set(data?.meta.has_reports_days ?? []), [data]);
  const byDay = useMemo(() => {
    const m = new Map<number, ApiReport[]>();
    for (const r of data?.data ?? []) {
      const d = new Date(r.deadline).getDate();
      if (!dueDays.has(d)) continue;
      m.set(d, [...(m.get(d) ?? []), r]);
    }
    return m;
  }, [data, dueDays]);

  const passed = (day: number) => isPast || (isCurrent && day < today.getDate());
  const daysInMonth = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const offset = (new Date(month.getFullYear(), month.getMonth(), 1).getDay() + 6) % 7; // dushanba = 0

  const listDays = selected !== null
    ? [selected]
    : [...byDay.keys()].sort((a, b) => a - b).filter((d) => !passed(d) || isPast);
  const shift = (n: number) => setMonth(new Date(month.getFullYear(), month.getMonth() + n, 1));

  return (
    <section aria-labelledby="report-cal-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="border-l-4 border-blue-900 pl-4 dark:border-blue-400">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-900 dark:text-blue-300">Respondentlar uchun</p>
          <h2 id="report-cal-title" className="mt-1 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">Hisobotlar taqvimi</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">Statistik hisobotlarni topshirish muddatlari. Kunni tanlang — shu kungi shakllar chiqadi.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link to="/stat-codes" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:border-blue-800 hover:text-blue-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            <ShieldCheck className="h-4 w-4" aria-hidden="true" />Mening hisobotlarim (STIR)
          </Link>
          <Link to="/report-calendar" className="inline-flex items-center gap-1.5 rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white hover:bg-blue-800">
            To'liq taqvim <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-5">
        {/* Oy to'ri */}
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-3">
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3 dark:border-gray-700">
            <button type="button" onClick={() => shift(-1)} aria-label="Oldingi oy" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700">
              <ChevronLeft className="h-5 w-5" />
            </button>
            <p className="font-semibold text-slate-900 dark:text-white">{MONTHS[month.getMonth()]} {month.getFullYear()}</p>
            <button type="button" onClick={() => shift(1)} aria-label="Keyingi oy" className="rounded-lg p-2 text-slate-600 hover:bg-slate-100 dark:text-gray-300 dark:hover:bg-gray-700">
              <ChevronRight className="h-5 w-5" />
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 p-3 text-center">
            {WEEK.map((w, i) => <div key={w} className={`py-1 text-xs font-medium ${i >= 5 ? "text-red-500" : "text-slate-500"}`}>{w}</div>)}
            {Array.from({ length: offset }).map((_, i) => <div key={`e${i}`} />)}
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
              const count = byDay.get(day)?.length ?? 0;
              const due = count > 0;
              const todayCell = isCurrent && day === today.getDate();
              const sel = selected === day;
              const tone = !due
                ? "text-slate-700 dark:text-gray-300"
                : passed(day)
                  ? "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-gray-700 dark:text-gray-400"
                  : "bg-blue-900 text-white hover:bg-blue-800 dark:bg-blue-700";
              return (
                <button key={day} type="button" disabled={!due} onClick={() => setSelected(sel ? null : day)}
                  aria-pressed={sel} aria-label={due ? `${day}-${MONTHS[month.getMonth()].toLowerCase()}: ${count} ta hisobot` : undefined}
                  className={`relative flex h-11 flex-col items-center justify-center rounded-lg text-sm font-medium transition sm:h-12 ${tone} ${todayCell ? "ring-2 ring-amber-400" : ""} ${sel ? "ring-2 ring-offset-1 ring-blue-500" : ""} ${due ? "cursor-pointer" : "cursor-default"}`}>
                  {day}
                  {due && <span className="text-[10px] leading-none opacity-80">{count} ta</span>}
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-4 border-t border-slate-100 px-4 py-2 text-[11px] text-slate-500 dark:border-gray-700">
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-blue-900" />Muddat</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded bg-slate-200" />O'tgan muddat</span>
            <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded ring-2 ring-amber-400" />Bugun</span>
          </div>
        </div>

        {/* Yaqin muddatlar / tanlangan kun */}
        <div className="flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 lg:col-span-2">
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-3 dark:border-gray-700">
            <p className="font-semibold text-slate-900 dark:text-white">
              {selected !== null ? `${selected}-${MONTHS[month.getMonth()].toLowerCase()}` : isPast ? "Oy muddatlari" : "Yaqin muddatlar"}
            </p>
            {selected !== null && <button type="button" onClick={() => setSelected(null)} className="text-xs text-blue-800 hover:underline dark:text-blue-300">Hammasi</button>}
          </div>
          <div className="max-h-[380px] flex-1 space-y-4 overflow-y-auto px-5 py-4">
            {failed ? (
              <p className="text-sm text-slate-500">Taqvimni yuklab bo'lmadi.</p>
            ) : !data ? (
              <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="h-14 animate-pulse rounded-lg bg-slate-100 dark:bg-gray-700" />)}</div>
            ) : listDays.length === 0 ? (
              <p className="text-sm text-slate-500">Bu oyda qolgan muddat yo'q. Keyingi oyni ko'ring.</p>
            ) : listDays.map((day) => (
              <div key={day}>
                <p className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
                  <span className={`flex h-7 w-7 items-center justify-center rounded-md text-sm ${passed(day) ? "bg-slate-100 text-slate-500 dark:bg-gray-700" : "bg-blue-900 text-white"}`}>{day}</span>
                  {MONTHS[month.getMonth()]} · {byDay.get(day)?.length ?? 0} ta shakl
                </p>
                <ul className="space-y-2">
                  {(byDay.get(day) ?? []).map((r) => (
                    <li key={r.id} className="rounded-lg border border-slate-100 px-3 py-2 dark:border-gray-700">
                      <p className="flex items-start justify-between gap-2 text-sm font-medium text-slate-900 dark:text-white">
                        <span>{clean(r.type_uz)}</span>
                        <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-gray-700 dark:text-gray-300">{TYPE[r.report_type] ?? "Boshqa"}</span>
                      </p>
                      <p className="mt-0.5 line-clamp-2 text-xs text-slate-500">{clean(r.formsname_uz)}</p>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
