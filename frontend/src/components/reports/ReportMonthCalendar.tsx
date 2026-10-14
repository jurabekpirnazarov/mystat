import { useMemo, useState } from "react";
import { Bell, BellOff, CalendarDays, ChevronLeft, ChevronRight, Download } from "lucide-react";
import axiosT from "../../api/baseUrl";
import useApi from "../../hooks/useApi";
import { useAuth } from "../../contexts/AuthContext";
import { EmptyState, ErrorState, Skeleton } from "../ui";

interface CalendarItem {
  report_id: string;
  date: string;
  type_uz: string;
  formsname_uz: string;
  srok_uz: string;
  report_type: "monthly" | "quarterly" | "yearly" | null;
  reminded: boolean;
}

const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentabr", "Oktabr", "Noyabr", "Dekabr"];
const WEEK = ["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"];
const TYPE_LABEL = { monthly: "Oylik", quarterly: "Choraklik", yearly: "Yillik" } as const;
const TYPE_DOT = { monthly: "bg-blue-500", quarterly: "bg-emerald-500", yearly: "bg-orange-500" } as const;

/** Tanlangan hisobotlar uchun .ics (iCalendar) — telefon/Outlook kalendariga import qilinadi. */
function downloadIcs(items: CalendarItem[]) {
  const stamp = new Date().toISOString().replace(/[-:]/g, "").split(".")[0] + "Z";
  const esc = (s: string) => s.replace(/[\\;,]/g, (m) => `\\${m}`).replace(/\n/g, "\\n");
  const events = items.map((i) => {
    const d = i.date.replace(/-/g, "");
    return [
      "BEGIN:VEVENT",
      `UID:${i.report_id}-${d}@my.stat.uz`,
      `DTSTAMP:${stamp}`,
      `DTSTART;VALUE=DATE:${d}`,
      `SUMMARY:${esc(`Hisobot: ${i.type_uz}`)}`,
      `DESCRIPTION:${esc(i.formsname_uz)}`,
      "BEGIN:VALARM", "TRIGGER:-P3D", "ACTION:DISPLAY", `DESCRIPTION:${esc(i.type_uz)}`, "END:VALARM",
      "END:VEVENT",
    ].join("\r\n");
  });
  const ics = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//my.stat.uz//Hisobot kalendari//UZ", ...events, "END:VCALENDAR"].join("\r\n");
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = "hisobot-muddatlari.ics";
  a.click();
  URL.revokeObjectURL(url);
}

/** Hisobot muddatlari — oy ko'rinishi, eslatma va .ics eksport. U-13. */
export default function ReportMonthCalendar() {
  const today = new Date();
  const [cursor, setCursor] = useState({ year: today.getFullYear(), month: today.getMonth() + 1 });
  const [selectedDay, setSelectedDay] = useState<string | null>(null);
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const { isAuthenticated } = useAuth();

  const { data, loading, error, reload } = useApi(
    async () => (await axiosT.get<{ items: CalendarItem[] }>("/additional-services/reportlist/calendar/", { params: cursor })).data.items,
    [cursor.year, cursor.month]
  );
  const items = useMemo(() => (data ?? []).map((i) => (i.report_id in overrides ? { ...i, reminded: overrides[i.report_id] } : i)), [data, overrides]);

  const byDay = useMemo(() => {
    const map = new Map<string, CalendarItem[]>();
    items.forEach((i) => map.set(i.date, [...(map.get(i.date) ?? []), i]));
    return map;
  }, [items]);

  const cells = useMemo(() => {
    const first = new Date(cursor.year, cursor.month - 1, 1);
    const offset = (first.getDay() + 6) % 7; // dushanbadan boshlanadi
    const days = new Date(cursor.year, cursor.month, 0).getDate();
    return [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];
  }, [cursor]);

  const shift = (delta: number) => {
    setSelectedDay(null);
    setCursor(({ year, month }) => {
      const m = month + delta;
      return m < 1 ? { year: year - 1, month: 12 } : m > 12 ? { year: year + 1, month: 1 } : { year, month: m };
    });
  };

  const toggleReminder = async (item: CalendarItem) => {
    const url = `/additional-services/reportlist/${encodeURIComponent(item.report_id)}/remind/`;
    if (item.reminded) await axiosT.delete(url);
    else await axiosT.post(url);
    setOverrides((o) => ({ ...o, [item.report_id]: !item.reminded }));
  };

  const iso = (day: number) => `${cursor.year}-${String(cursor.month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
  const todayIso = iso(today.getDate());
  const isCurrentMonth = cursor.year === today.getFullYear() && cursor.month === today.getMonth() + 1;
  const list = selectedDay ? byDay.get(selectedDay) ?? [] : items;

  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <CalendarDays className="w-5 h-5 text-blue-600" /> Hisobot muddatlari kalendari
        </h2>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => shift(-1)} aria-label="Oldingi oy" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronLeft className="w-5 h-5" /></button>
          <span className="w-36 text-center font-medium text-gray-900 dark:text-white">{MONTHS[cursor.month - 1]} {cursor.year}</span>
          <button type="button" onClick={() => shift(1)} aria-label="Keyingi oy" className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"><ChevronRight className="w-5 h-5" /></button>
          <button
            type="button"
            disabled={!items.length}
            onClick={() => downloadIcs(items)}
            className="ml-2 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <Download className="w-4 h-4" /> .ics
          </button>
        </div>
      </div>

      {loading && !data ? (
        <Skeleton variant="chart" />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_22rem] gap-6">
          <div>
            <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
              {WEEK.map((w) => <div key={w}>{w}</div>)}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {cells.map((day, i) => {
                if (day === null) return <div key={`e${i}`} />;
                const key = iso(day);
                const dayItems = byDay.get(key) ?? [];
                const selected = key === selectedDay;
                return (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setSelectedDay(selected ? null : key)}
                    aria-label={`${day}-${MONTHS[cursor.month - 1]}: ${dayItems.length} ta hisobot`}
                    className={`h-16 sm:h-20 rounded-lg border p-1.5 text-left flex flex-col transition ${
                      selected ? "border-blue-500 bg-blue-50 dark:bg-blue-900/30" : "border-gray-100 dark:border-gray-700 hover:border-blue-300"
                    } ${isCurrentMonth && key === todayIso ? "ring-2 ring-blue-400" : ""}`}
                  >
                    <span className="text-xs text-gray-600 dark:text-gray-300">{day}</span>
                    {dayItems.length > 0 && (
                      <span className="mt-auto flex items-center gap-1">
                        {dayItems.slice(0, 3).map((it, j) => (
                          <span key={j} className={`w-2 h-2 rounded-full ${it.report_type ? TYPE_DOT[it.report_type] : "bg-gray-400"}`} />
                        ))}
                        <span className="text-[11px] font-semibold text-gray-700 dark:text-gray-200">{dayItems.length}</span>
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
            <div className="mt-3 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              {(Object.keys(TYPE_LABEL) as (keyof typeof TYPE_LABEL)[]).map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5"><span className={`w-2 h-2 rounded-full ${TYPE_DOT[t]}`} />{TYPE_LABEL[t]}</span>
              ))}
            </div>
          </div>

          <div>
            <p className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
              {selectedDay ? `${Number(selectedDay.slice(8))}-${MONTHS[cursor.month - 1].toLowerCase()}` : "Shu oydagi barcha muddatlar"} · {list.length} ta
            </p>
            {list.length === 0 ? (
              <EmptyState title="Muddatlar yo'q" className="py-6" />
            ) : (
              <ul className="space-y-2 max-h-[26rem] overflow-y-auto pr-1">
                {list.map((it) => (
                  <li key={`${it.report_id}-${it.date}`} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white">{it.type_uz}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">{it.formsname_uz}</p>
                        <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">
                          {it.date.split("-").reverse().join(".")} · {it.report_type ? TYPE_LABEL[it.report_type] : ""}
                        </p>
                      </div>
                      {isAuthenticated && (
                        <button
                          type="button"
                          onClick={() => toggleReminder(it)}
                          aria-pressed={it.reminded}
                          title={it.reminded ? "Eslatmani o'chirish" : "Muddatdan 3 kun oldin eslatish"}
                          className={`shrink-0 p-2 rounded-full ${it.reminded ? "bg-blue-600 text-white" : "text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"}`}
                        >
                          {it.reminded ? <Bell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                        </button>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            )}
            {!isAuthenticated && <p className="mt-2 text-xs text-gray-500">Eslatma qo'yish uchun tizimga kiring.</p>}
          </div>
        </div>
      )}
    </section>
  );
}
