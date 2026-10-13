import { useMemo, useState } from "react";
import { Receipt } from "lucide-react";
import { fetchMyPayments, type Payment } from "../../api/cabinet";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { formatDateTime, formatMoney } from "../../utils/format";

const STATUS: Record<Payment["status"], { label: string; cls: string }> = {
  paid: { label: "To'langan", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  waiting: { label: "Kutilmoqda", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  failed: { label: "Xatolik", cls: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300" },
  canceled: { label: "Bekor qilingan", cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
};
const PURPOSE: Record<Payment["purpose"], string> = { book: "Kitob", contract: "Shartnoma", service: "Xizmat" };
const PERIODS = [
  { id: "all", label: "Barcha davr", days: 0 },
  { id: "30", label: "30 kun", days: 30 },
  { id: "90", label: "90 kun", days: 90 },
  { id: "365", label: "1 yil", days: 365 },
];

/** To'lovlar tarixi — faqat mavjud tranzaksiyalarni o'qiydi (to'lov kodi o'zgarmaydi). U-04. */
export default function Payments() {
  const [status, setStatus] = useState("");
  const [period, setPeriod] = useState("all");
  const { data, loading, error, reload } = useApi(() => fetchMyPayments(status || undefined), [status]);

  const rows = useMemo(() => {
    const days = PERIODS.find((p) => p.id === period)?.days ?? 0;
    if (!days || !data) return data ?? [];
    const from = Date.now() - days * 86400_000;
    return data.filter((p) => new Date(p.date).getTime() >= from);
  }, [data, period]);

  const total = rows.filter((p) => p.status === "paid").reduce((sum, p) => sum + Number(p.amount), 0);
  const selectCls = "rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100 px-3 py-2";

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-end justify-between gap-3 mb-5">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">To'lovlar tarixi</h2>
          {rows.length > 0 && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Jami to'langan: {formatMoney(total)}</p>
          )}
        </div>
        <div className="flex gap-2">
          <select aria-label="Davr" className={selectCls} value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIODS.map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
          </select>
          <select aria-label="Holat" className={selectCls} value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="">Barcha holatlar</option>
            {(Object.keys(STATUS) as Payment["status"][]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
          </select>
        </div>
      </div>

      {loading && !data ? (
        <Skeleton variant="table" />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon={Receipt} title="Hozircha to'lovlar yo'q" description="Kitob yoki xizmat uchun to'lovlar shu yerda ko'rinadi." />
      ) : (
        <>
          {/* Mobil: kartochkalar */}
          <ul className="sm:hidden space-y-2">
            {rows.map((p) => (
              <li key={p.id} className="rounded-lg border border-gray-200 dark:border-gray-700 p-3">
                <div className="flex justify-between gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{p.title}</span>
                  <span className={`px-2 py-0.5 rounded-full text-xs ${STATUS[p.status]?.cls}`}>{STATUS[p.status]?.label ?? p.status}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">{formatMoney(p.amount)} · {p.provider.toUpperCase()}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(p.date)}</p>
              </li>
            ))}
          </ul>
          {/* Desktop: jadval */}
          <div className="hidden sm:block overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300">
                  <th className="py-2 pr-4 font-medium">Sana</th>
                  <th className="py-2 pr-4 font-medium">Maqsad</th>
                  <th className="py-2 pr-4 font-medium text-right">Summa</th>
                  <th className="py-2 pr-4 font-medium">Provayder</th>
                  <th className="py-2 font-medium">Holat</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((p) => (
                  <tr key={p.id} className="border-b border-gray-100 dark:border-gray-700/60">
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300 whitespace-nowrap">{formatDateTime(p.date)}</td>
                    <td className="py-3 pr-4 text-gray-900 dark:text-white">
                      <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">{PURPOSE[p.purpose]}</span>
                      {p.title}
                    </td>
                    <td className="py-3 pr-4 text-right tabular-nums text-gray-900 dark:text-white whitespace-nowrap">{formatMoney(p.amount)}</td>
                    <td className="py-3 pr-4 text-gray-600 dark:text-gray-300">{p.provider.toUpperCase()}</td>
                    <td className="py-3">
                      <span className={`px-2 py-1 rounded-full text-xs ${STATUS[p.status]?.cls}`}>{STATUS[p.status]?.label ?? p.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
