import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, FileDown, X } from "lucide-react";
import { fetchMyReports, fetchReportGuide, setReportReminder, type MyReportItem } from "../../api/myReports";
import useApi from "../../hooks/useApi";
import { ApiErrorState, DemoBadge, SampleBanner, Skeleton } from "../../components/ui";
import { formatDateTime } from "../../utils/format";
import CompanyScoreBadge from "../../components/company-score/CompanyScoreBadge";
import { useCompanyScores } from "../../api/companyScores";

const TYPE_LABEL = { monthly: "Oylik", quarterly: "Choraklik", yearly: "Yillik" } as const;
const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];

function daysColor(days: number | null) {
  if (days === null) return "bg-gray-100 text-gray-600";
  if (days <= 3) return "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300";
  if (days <= 10) return "bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300";
  return "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300";
}

/** Yo'riqnoma, namuna va eslatma sozlamasi. */
function ReportCard({ item, onClose, onReminder }: { item: MyReportItem; onClose: () => void; onReminder: (days: number | null) => void }) {
  const { data, loading } = useApi(() => fetchReportGuide(item.report_id), [item.report_id]);
  const guide = data?.guide;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" role="dialog" aria-modal="true" aria-label={item.type_uz}>
      <div className="w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-xl bg-white dark:bg-gray-900 shadow-2xl">
        <div className="sticky top-0 flex items-start justify-between gap-3 p-5 border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              {item.type_uz} <DemoBadge show={!!guide?.is_synthetic} />
            </h3>
            <p className="text-sm text-gray-500">{item.formsname_uz}</p>
          </div>
          <button type="button" onClick={onClose} aria-label="Yopish" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-5 space-y-5 text-sm text-gray-700 dark:text-gray-200">
          <div className="grid grid-cols-2 gap-3">
            <div><span className="text-gray-500">Davriylik:</span> {item.report_type ? TYPE_LABEL[item.report_type] : "—"}</div>
            <div><span className="text-gray-500">Muddat:</span> {item.srok_uz}</div>
            <div><span className="text-gray-500">Keyingi muddat:</span> {formatDateTime(item.next_deadline, false)}</div>
            <div><span className="text-gray-500">Qolgan kun:</span> {item.days_left ?? "—"}</div>
          </div>
          {loading ? (
            <Skeleton rows={6} />
          ) : !guide ? (
            <p className="text-gray-500">Bu shakl uchun yo'riqnoma hali kiritilmagan.</p>
          ) : (
            <>
              <section>
                <h4 className="font-semibold mb-1">Kim topshiradi</h4>
                <p>{guide.summary}</p>
              </section>
              <section>
                <h4 className="font-semibold mb-1">To'ldirish qadamlari</h4>
                <ul className="space-y-1">{guide.steps.split("\n").map((l) => <li key={l}>{l}</li>)}</ul>
              </section>
              {guide.common_errors && (
                <section>
                  <h4 className="font-semibold mb-1">Keng tarqalgan xatolar</h4>
                  <ul className="space-y-1">{guide.common_errors.split("\n").map((l) => <li key={l}>{l.replace(/^- /, "• ")}</li>)}</ul>
                </section>
              )}
              {guide.legal_basis && <p className="text-xs text-gray-500">Huquqiy asos: {guide.legal_basis}</p>}
              {guide.sample_file && (
                <a href={guide.sample_file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800">
                  <FileDown className="w-4 h-4" /> Namunaviy to'ldirilgan shakl (PDF)
                </a>
              )}
            </>
          )}
          <section className="rounded-lg bg-gray-50 dark:bg-gray-800 p-4">
            <h4 className="font-semibold mb-2">Eslatma</h4>
            <label className="flex flex-wrap items-center gap-2">
              Muddatdan
              <select
                value={item.reminded ? String(item.days_before ?? 3) : ""}
                onChange={(e) => onReminder(e.target.value ? Number(e.target.value) : null)}
                className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
              >
                <option value="">eslatma yo'q</option>
                {[1, 3, 5, 7, 10, 14].map((d) => <option key={d} value={d}>{d} kun</option>)}
              </select>
              oldin kabinetga xabarnoma
            </label>
          </section>
        </div>
      </div>
    </div>
  );
}

/** K-05: kabinetdagi "Hisobotlarim" — korxona STIR'iga biriktirilgan hisobotlar va muddatlar. */
export default function MyReports() {
  const [tab, setTab] = useState<"upcoming" | "past" | "year">("upcoming");
  const { data, loading, error, reload } = useApi(() => fetchMyReports(), []);
  const scores = useCompanyScores(data?.organization?.tin ? [data.organization.tin] : []);
  const [open, setOpen] = useState<MyReportItem | null>(null);
  const [overrides, setOverrides] = useState<Record<string, number | null>>({});

  const items = (data?.items ?? []).map((i) =>
    i.report_id in overrides ? { ...i, reminded: overrides[i.report_id] !== null, days_before: overrides[i.report_id] } : i
  );
  const monthKey = data?.today.slice(0, 7);
  const thisMonth = items.filter((i) => i.next_deadline?.startsWith(monthKey ?? "-"));
  const changeReminder = async (item: MyReportItem, days: number | null) => {
    await setReportReminder(item.report_id, days);
    setOverrides((o) => ({ ...o, [item.report_id]: days }));
    setOpen((cur) => (cur ? { ...cur, reminded: days !== null, days_before: days } : cur));
  };
  const tabCls = (active: boolean) =>
    `px-3 py-1.5 rounded-lg text-sm ${active ? "bg-blue-600 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-200"}`;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
        <CalendarClock className="w-5 h-5 text-blue-600" /> Hisobotlarim
      </h2>
      {loading && !data ? (
        <Skeleton variant="table" rows={5} />
      ) : error ? (
        <ApiErrorState
          error={error}
          onRetry={reload}
          notFoundAction={<Link to="/report-calendar" className="text-blue-600 underline">Umumiy hisobot kalendariga o'tish</Link>}
        />
      ) : data ? (
        <>
          <SampleBanner show={data.is_synthetic} text="Bu demo korxona hisobot shakllariga namuna sifatida biriktirilgan. Muddatlar real hisobot ro'yxatidan." />
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-3">
            {data.organization.name} (STIR {data.organization.tin}) <CompanyScoreBadge score={scores[data.organization.tin]} /> — {items.length} ta hisobot shakli. Shu oy: {thisMonth.length} ta muddat.
          </p>
          <div className="flex gap-2 mb-4" role="tablist">
            <button type="button" role="tab" aria-selected={tab === "upcoming"} className={tabCls(tab === "upcoming")} onClick={() => setTab("upcoming")}>Yaqin muddatlar</button>
            <button type="button" role="tab" aria-selected={tab === "past"} className={tabCls(tab === "past")} onClick={() => setTab("past")}>O'tgan muddatlar</button>
            <button type="button" role="tab" aria-selected={tab === "year"} className={tabCls(tab === "year")} onClick={() => setTab("year")}>{data.year}-yil</button>
          </div>

          {tab === "year" ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-xs">
                <thead>
                  <tr><th className="text-left p-2">Shakl</th>{MONTHS.map((m) => <th key={m} className="p-2">{m}</th>)}</tr>
                </thead>
                <tbody>
                  {items.map((i) => (
                    <tr key={i.report_id} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="p-2 whitespace-nowrap">{i.type_uz}</td>
                      {MONTHS.map((_, m) => {
                        const d = i.year_deadlines.find((x) => Number(x.slice(5, 7)) === m + 1);
                        return <td key={m} className="p-2 text-center">{d ? <span className="inline-block px-1.5 rounded bg-blue-100 dark:bg-blue-900/40 text-blue-800 dark:text-blue-200">{Number(d.slice(8))}</span> : ""}</td>;
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <ul className="space-y-2">
              {(tab === "upcoming" ? items : [...items].sort((a, b) => (b.last_deadline ?? "").localeCompare(a.last_deadline ?? ""))).map((i) => (
                <li key={i.report_id}>
                  <button type="button" onClick={() => setOpen(i)} className="w-full text-left rounded-lg border border-gray-200 dark:border-gray-700 p-3 hover:border-blue-300 flex items-center gap-3">
                    <span className="min-w-0 flex-1">
                      <span className="block font-medium text-gray-900 dark:text-white">{i.type_uz}</span>
                      <span className="block text-xs text-gray-500 truncate">{i.formsname_uz}</span>
                    </span>
                    {tab === "upcoming" ? (
                      <>
                        <span className="text-xs text-gray-500 shrink-0">{formatDateTime(i.next_deadline, false)}</span>
                        <span className={`shrink-0 px-2 py-0.5 rounded-full text-xs font-semibold ${daysColor(i.days_left)}`}>{i.days_left} kun</span>
                      </>
                    ) : (
                      <span className="text-xs text-gray-500 shrink-0">{formatDateTime(i.last_deadline, false)}</span>
                    )}
                  </button>
                </li>
              ))}
            </ul>
          )}
          {tab === "past" && (
            <p className="mt-3 text-xs text-gray-500">Topshirilganlik holati hozircha mavjud emas — faqat o'tgan muddatlar ko'rsatilmoqda.</p>
          )}
        </>
      ) : null}
      {open && <ReportCard item={open} onClose={() => setOpen(null)} onReminder={(d) => changeReminder(open, d)} />}
    </div>
  );
}
