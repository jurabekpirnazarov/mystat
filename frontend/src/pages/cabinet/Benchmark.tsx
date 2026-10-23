import { useRef, useState } from "react";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BarChart3, Download } from "lucide-react";
import { fetchBenchmark, type BenchmarkMetric } from "../../api/analytics";
import { formatCredits } from "../../api/credits";
import useApi from "../../hooks/useApi";
import { ApiErrorState, Skeleton, SourceBadge } from "../../components/ui";
import { exportElementToPdf } from "../../utils/exportPdf";
import { ScoreBenchmark } from "../../components/company-score/ScoreWidgets";

const fmt = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined ? "—" : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: digits }).format(v);

/** Quti grafik: p25–p75 oraliq, median chizig'i, korxona nuqtasi. */
function BoxRow({ m }: { m: BenchmarkMetric }) {
  if (m.median === null || m.p25 === null || m.p75 === null) {
    return (
      <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">{m.label}</p>
        <p className="text-xs text-gray-500">Guruhda bu ko'rsatkich bo'yicha ma'lumot yo'q</p>
      </div>
    );
  }
  const lo = Math.min(m.p25, m.own ?? m.p25) * 0.85;
  const hi = Math.max(m.p75, m.own ?? m.p75) * 1.1;
  const pos = (v: number) => `${((v - lo) / (hi - lo || 1)) * 100}%`;
  return (
    <div className="py-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-sm font-medium text-gray-800 dark:text-gray-100">
          {m.label} <span className="text-xs font-normal text-gray-500">({m.unit})</span>
        </p>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Median <b className="text-gray-800 dark:text-gray-100">{fmt(m.median)}</b>
          {m.own !== null && (
            <>
              {" · "}Siz <b className="text-blue-600 dark:text-blue-400">{fmt(m.own)}</b>
              {m.percentile !== null && ` · ${fmt(m.percentile, 0)}-persentil`}
            </>
          )}
        </p>
      </div>
      <div className="relative mt-3 h-6" aria-hidden="true">
        <div className="absolute top-1/2 -translate-y-1/2 left-0 right-0 h-0.5 bg-gray-200 dark:bg-gray-700" />
        <div
          className="absolute top-0 h-6 rounded bg-blue-100 dark:bg-blue-900/40 border border-blue-300 dark:border-blue-700"
          style={{ left: pos(m.p25), width: `calc(${pos(m.p75)} - ${pos(m.p25)})` }}
        />
        <div className="absolute top-0 h-6 w-0.5 bg-blue-700 dark:bg-blue-300" style={{ left: pos(m.median) }} />
        {m.own !== null && (
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3.5 h-3.5 rounded-full bg-orange-500 ring-2 ring-white dark:ring-gray-800"
            style={{ left: pos(m.own) }}
          />
        )}
      </div>
      <div className="mt-1 flex justify-between text-[11px] text-gray-400">
        <span>p25: {fmt(m.p25)}</span>
        <span>p75: {fmt(m.p75)}</span>
      </div>
    </div>
  );
}

/** K-02: korxona ko'rsatkichlarini shu OKED va hududdagi guruh bilan solishtirish. */
export default function Benchmark() {
  const [year, setYear] = useState<number | undefined>();
  const [geo, setGeo] = useState<"region" | "country">("region");
  const { data, loading, error, reload } = useApi(() => fetchBenchmark({ year, geo }), [year, geo]);
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const sample = data?.data_source === "synthetic" || data?.data_source === "mixed";
  const exportPdf = async () => {
    if (!ref.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(ref.current, `benchmark-${data?.year ?? ""}.pdf`, sample);
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-blue-600" /> Tarmoq benchmarki <SourceBadge source={data?.data_source} />
        </h2>
        {data && (
          <div className="flex flex-wrap items-center gap-2">
            <select
              aria-label="Yil"
              value={data.year}
              onChange={(e) => setYear(Number(e.target.value))}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            >
              {data.years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
            <select
              aria-label="Taqqoslash darajasi"
              value={geo}
              onChange={(e) => setGeo(e.target.value as "region" | "country")}
              className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
            >
              <option value="region">Viloyat bo'yicha</option>
              <option value="country">Respublika bo'yicha</option>
            </select>
            <button
              type="button"
              onClick={exportPdf}
              disabled={exporting}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <Download className="w-4 h-4" /> PDF
            </button>
          </div>
        )}
      </div>

      {loading && !data ? (
        <Skeleton variant="chart" />
      ) : error ? (
        <ApiErrorState error={error} onRetry={reload} />
      ) : data ? (
        <div ref={ref} className="space-y-6 bg-white dark:bg-gray-800">
          <div className="rounded-xl bg-gray-50 dark:bg-gray-900/40 p-4 text-sm text-gray-700 dark:text-gray-200">
            Guruh: <b>{data.group.oked_section} · {data.group.oked_name}</b>, {data.group.region} — {data.group.size} ta korxona,{" "}
            {data.year}-yil.
            {data.level === "country" && geo === "region" && (
              <span className="block mt-1 text-amber-700 dark:text-amber-300">
                Viloyatda korxonalar soni 10 tadan kam, shuning uchun taqqoslash respublika bo'yicha.
              </span>
            )}
            {!data.has_own && (
              <span className="block mt-1 text-gray-500">Korxonangiz ko'rsatkichlari hali kiritilmagan — faqat guruh ko'rsatkichlari.</span>
            )}
            <span className="block mt-1 text-xs text-gray-500">Begona korxonalarning alohida ko'rsatkichlari ko'rsatilmaydi, faqat guruh agregati.</span>
          </div>

          <ul className="space-y-1">
            {data.summary.map((s) => (
              <li key={s} className="text-sm text-gray-800 dark:text-gray-100">• {s}</li>
            ))}
          </ul>

          <div className="rounded-xl border border-gray-200 dark:border-gray-700 px-4">
            {data.metrics.map((m) => (
              <BoxRow key={m.key} m={m} />
            ))}
            <div className="py-2 flex flex-wrap gap-4 text-[11px] text-gray-500">
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded bg-blue-100 border border-blue-300" /> p25–p75</span>
              <span className="inline-flex items-center gap-1"><span className="w-0.5 h-3 bg-blue-700" /> median</span>
              <span className="inline-flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-orange-500" /> korxonangiz</span>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-gray-800 dark:text-gray-100 mb-2">Tushum dinamikasi: korxona va guruh medianasi (ming so'm)</h3>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.dynamics}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis dataKey="year" fontSize={12} />
                  <YAxis fontSize={12} tickFormatter={(v) => fmt(v / 1000) + "k"} width={60} />
                  <Tooltip formatter={(v) => fmt(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue_median" name="Guruh medianasi" stroke="#2563eb" strokeWidth={2} />
                  <Line type="monotone" dataKey="revenue_own" name="Korxonangiz" stroke="#f97316" strokeWidth={2} connectNulls />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* KORXONA_SCORING.md KR-36: guruhdagi ball taqsimoti va ustunlar p25–p75 */}
          <ScoreBenchmark />
          {data.usage.statcoin && (
            <p className="text-xs text-gray-500">
              {data.usage.statcoin.charged ? `${formatCredits(data.usage.statcoin.charged)} yechildi` : "Bugun bu hisobot uchun StatCoin yechilgan"}
              {" "}· hamyonda {formatCredits(data.usage.statcoin.balance)} (bir kunda bir xil hisobot qayta sanalmaydi)
            </p>
          )}
          {data.usage.configured && data.usage.limit !== null && (
            <p className="text-xs text-gray-500">Paket limiti: {data.usage.used} / {data.usage.limit} (bir kunda bir xil hisobot qayta sanalmaydi)</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
