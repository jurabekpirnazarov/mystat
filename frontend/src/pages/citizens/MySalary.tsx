import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Lock } from "lucide-react";
import { fetchSalary } from "../../api/citizens";
import useApi from "../../hooks/useApi";
import { ErrorState, PageHeader, SampleBanner, Skeleton } from "../../components/ui";
import Term from "../../components/Term";
import FavoriteButton from "../../components/FavoriteButton";
import { salaryPercentile } from "../../utils/salary";

const nf = (v: number | null | undefined) => (v === null || v === undefined ? "—" : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(v));

/** FQ-05: maoshni hudud va tarmoq taqsimoti bilan taqqoslash. Kiritilgan maosh serverga yuborilmaydi. */
export default function MySalary() {
  const [params, setParams] = useSearchParams();
  const region = Number(params.get("region")) || undefined;
  const sector = Number(params.get("sector")) || undefined;
  const { data, loading, error, reload } = useApi(() => fetchSalary({ region, sector }), [region, sector]);
  // Maosh faqat komponent holatida — URL'ga ham, so'rovga ham qo'shilmaydi
  const [salary, setSalary] = useState<number | "">("");

  const d = data?.distribution;
  const dist = d && d.p25 !== null && d.median !== null && d.p75 !== null && d.p90 !== null
    ? { p25: d.p25, median: d.median, p75: d.p75, p90: d.p90 } : null;
  const mine = typeof salary === "number" && salary > 0 ? salary / 1000 : null; // so'm -> ming so'm
  const pct = dist && mine ? salaryPercentile(mine, dist) : null;
  const bars = dist ? [
    { name: "p25", value: dist.p25 }, { name: "Median", value: dist.median }, { name: "O'rtacha", value: d?.mean ?? 0 },
    { name: "p75", value: dist.p75 }, { name: "p90", value: dist.p90 },
  ] : [];
  const select = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800";
  const update = (k: string, v: string) => {
    const next = new URLSearchParams(params);
    if (v) next.set(k, v);
    else next.delete(k);
    setParams(next, { replace: true });
  };

  return (
    <div className="py-2">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title="Mening maoshim" description="Maoshingiz hududingiz va tarmog'ingizdagi xodimlar orasida qayerda turadi?"
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Mening maoshim" }]}
          actions={<FavoriteButton kind="salary" title="Mening maoshim" params={{ ...(region ? { region } : {}), ...(sector ? { sector } : {}) }} />} />
        <SampleBanner show={data?.data_source !== "real"} text="Ish haqi taqsimoti hozircha namuna ma'lumot (real manba ulanmagan). Hisob usulini sinab ko'rish uchun." />
        {loading && !data ? <Skeleton variant="chart" /> : error || !data ? <ErrorState onRetry={reload} /> : (
          <div className="space-y-6">
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 grid grid-cols-1 sm:grid-cols-3 gap-4">
              <label className="text-sm">Hudud
                <select className={`${select} mt-1`} value={region ?? ""} onChange={(e) => update("region", e.target.value)}>
                  <option value="">Respublika</option>
                  {data.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
              <label className="text-sm">Tarmoq
                <select className={`${select} mt-1`} value={sector ?? ""} onChange={(e) => update("sector", e.target.value)}>
                  <option value="">Barcha tarmoqlar</option>
                  {data.sectors.map((s) => <option key={s.id} value={s.id}>{s.code} · {s.name}</option>)}
                </select>
              </label>
              <label className="text-sm">Oylik maoshingiz (so'm, qo'lga)
                <input type="number" min={0} inputMode="numeric" value={salary} onChange={(e) => setSalary(e.target.value === "" ? "" : Number(e.target.value))}
                  className={`${select} mt-1`} placeholder="masalan 5000000" />
                <span className="mt-1 flex items-center gap-1 text-xs text-gray-500"><Lock className="w-3 h-3" /> Saytga yuborilmaydi — hisob brauzeringizda.</span>
              </label>
            </section>

            {pct !== null && (
              <section className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5 text-lg" aria-live="polite">
                Sizning maoshingiz tanlangan guruhdagi xodimlarning taxminan <b>{pct}%</b> idan yuqori.
                <span className="block text-sm text-gray-600 dark:text-gray-300 mt-1">
                  <Term id="median">Median</Term>: {nf(dist?.median)} ming so'm · <Term id="percentile">persentil</Term> chegaralari p25–p90 bo'yicha bo'lakli baho.
                </span>
              </section>
            )}

            {dist && (
              <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <h2 className="font-semibold mb-2">Taqsimot, {data.year}-yil ({data.unit})</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={bars}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="name" fontSize={12} />
                      <YAxis fontSize={12} width={60} />
                      <Tooltip formatter={(v) => `${nf(Number(v))} ming so'm`} />
                      <Bar dataKey="value">{bars.map((b) => <Cell key={b.name} fill={b.name === "Median" ? "#2563eb" : "#93c5fd"} />)}</Bar>
                      {mine && <ReferenceLine y={mine} stroke="#f97316" strokeWidth={2} label={{ value: "Siz", fill: "#f97316", position: "right" }} />}
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <h2 className="font-semibold mb-2">Hududlar bo'yicha median</h2>
                <ol className="space-y-1 text-sm max-h-80 overflow-y-auto">
                  {data.by_region.map((r, i) => (
                    <li key={r.region_id} className="flex items-center gap-2">
                      <span className="w-5 text-xs text-gray-400">{i + 1}</span>
                      <span className="flex-1">{r.region}</span>
                      <span className="w-28 h-2 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden"><span className="block h-full bg-blue-500" style={{ width: `${(r.median / (data.by_region[0]?.median || 1)) * 100}%` }} /></span>
                      <span className="w-16 text-right tabular-nums">{nf(r.median)}</span>
                    </li>
                  ))}
                </ol>
              </section>
              <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <h2 className="font-semibold mb-2">Yillar bo'yicha o'sish (median)</h2>
                <ul className="space-y-1 text-sm">
                  {data.trend.map((t, i) => (
                    <li key={t.year} className="flex justify-between"><span>{t.year}</span><span className="tabular-nums">{nf(t.median)} {i > 0 && <span className="text-xs text-emerald-700">+{(((t.median / data.trend[i - 1].median) - 1) * 100).toFixed(1)}%</span>}</span></li>
                  ))}
                </ul>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
