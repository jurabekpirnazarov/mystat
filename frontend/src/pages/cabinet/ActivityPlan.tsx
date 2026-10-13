import { useMemo, useState } from "react";
import { CalendarRange } from "lucide-react";
import { fetchActivityPlans, type ActivityPlan as Plan } from "../../api/cabinet";
import useApi from "../../hooks/useApi";
import { DemoBadge, EmptyState, ErrorState, Skeleton } from "../../components/ui";

const MONTHS = ["Yan", "Fev", "Mar", "Apr", "May", "Iyn", "Iyl", "Avg", "Sen", "Okt", "Noy", "Dek"];
const QUARTERS = [[1, 2, 3], [4, 5, 6], [7, 8, 9], [10, 11, 12]];

/** Faoliyat rejasi: xizmat × oy jadvali (issiqlik xaritasi), chorak bo'yicha jami. U-06. */
export default function ActivityPlan() {
  const thisYear = new Date().getFullYear();
  const [year, setYear] = useState(thisYear);
  const { data, loading, error, reload } = useApi(() => fetchActivityPlans(year), [year]);

  const { rows, max, synthetic } = useMemo(() => {
    const byService = new Map<string, number[]>();
    let maxValue = 0;
    for (const p of data ?? []) {
      const key = `${p.service_name} — ${p.district_name}`;
      const months = byService.get(key) ?? Array(12).fill(0);
      months[p.month - 1] += p.plan_count;
      maxValue = Math.max(maxValue, months[p.month - 1]);
      byService.set(key, months);
    }
    return {
      rows: [...byService.entries()].sort(([a], [b]) => a.localeCompare(b)),
      max: maxValue,
      synthetic: (data ?? []).some((p: Plan) => p.is_synthetic),
    };
  }, [data]);

  const cell = (v: number) => {
    if (!v) return "bg-gray-50 dark:bg-gray-800 text-gray-300 dark:text-gray-600";
    const level = Math.ceil((v / (max || 1)) * 4);
    return ["", "bg-blue-100 text-blue-900", "bg-blue-200 text-blue-900", "bg-blue-400 text-white", "bg-blue-600 text-white"][level];
  };

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
          Faoliyat rejasi <DemoBadge show={synthetic} />
        </h2>
        <select
          aria-label="Yil"
          value={year}
          onChange={(e) => setYear(Number(e.target.value))}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-800 dark:text-gray-100"
        >
          {[thisYear - 1, thisYear, thisYear + 1].map((y) => <option key={y} value={y}>{y}</option>)}
        </select>
      </div>

      {loading && !data ? (
        <Skeleton variant="table" />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon={CalendarRange} title={`${year}-yil uchun reja yo'q`} description="Rejalar sizga yoki tumaningizga biriktirilganda shu yerda ko'rinadi." />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-separate border-spacing-1">
            <thead>
              <tr className="text-gray-500 dark:text-gray-400">
                <th className="text-left font-medium pr-2 min-w-[12rem]">Xizmat — tuman</th>
                {MONTHS.map((m) => <th key={m} className="font-medium w-10">{m}</th>)}
                {QUARTERS.map((_, i) => <th key={i} className="font-medium w-12">{i + 1}-ch</th>)}
                <th className="font-medium w-12">Jami</th>
              </tr>
            </thead>
            <tbody>
              {rows.map(([name, months]) => (
                <tr key={name}>
                  <td className="pr-2 text-gray-800 dark:text-gray-100">{name}</td>
                  {months.map((v, i) => (
                    <td key={i} className={`text-center rounded tabular-nums py-1.5 ${cell(v)}`} title={`${MONTHS[i]}: ${v}`}>{v || "·"}</td>
                  ))}
                  {QUARTERS.map((q, i) => (
                    <td key={i} className="text-center tabular-nums font-medium text-gray-700 dark:text-gray-200">
                      {q.reduce((s, m) => s + months[m - 1], 0)}
                    </td>
                  ))}
                  <td className="text-center tabular-nums font-semibold text-gray-900 dark:text-white">{months.reduce((a, b) => a + b, 0)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
