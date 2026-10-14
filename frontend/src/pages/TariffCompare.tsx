import { useState } from "react";
import { Link } from "react-router-dom";
import { Calculator, Check, Sparkles } from "lucide-react";
import { fetchTariffCompare, fetchTariffRecommendation, type TariffRecommendation } from "../api/tariffs";
import useApi from "../hooks/useApi";
import { ErrorState, PageHeader, Skeleton } from "../components/ui";
import { formatMoney } from "../utils/format";

const QUESTIONS = [
  { key: "prints", label: "Oyiga nechta statistik to'plam (e-kitob) kerak?" },
  { key: "bulletins", label: "Nechta statistik byulleten kerak?" },
  { key: "companies", label: "Nechta korxona haqida ma'lumot kerak?" },
] as const;

/** K-09: tariflarni yonma-yon taqqoslash, sektor bo'yicha narx kalkulyatori va "menga qaysi paket mos?". */
export default function TariffCompare() {
  const [sector, setSector] = useState<number | undefined>();
  const { data, loading, error, reload } = useApi(() => fetchTariffCompare(sector), [sector]);
  const [need, setNeed] = useState({ prints: 0, bulletins: 0, companies: 0 });
  const [advice, setAdvice] = useState<TariffRecommendation | null>(null);

  const recommend = async () => {
    setAdvice(await fetchTariffRecommendation({ ...need, sector: sector ?? data?.sector?.id }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Tariflarni taqqoslash"
          description="Paketlardagi xizmatlar va limitlar, tarmog'ingiz bo'yicha yakuniy narx."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Xizmatlar", to: "/services" }, { label: "Tariflar" }]}
        />
        {loading && !data ? (
          <Skeleton variant="table" rows={8} />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="space-y-8">
            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-3">
                <Calculator className="w-5 h-5 text-blue-600" /> Narx kalkulyatori
              </h2>
              <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1" htmlFor="sector">Faoliyat tarmog'i (OKED bo'limi)</label>
              <select
                id="sector"
                value={sector ?? data.sector?.id ?? ""}
                onChange={(e) => setSector(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full sm:w-auto px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm"
              >
                <option value="">Tarmoq tanlanmagan (asosiy narx)</option>
                {data.sectors.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.code} · {s.name}
                    {s.id === data.user_sector_id ? " (sizning korxonangiz)" : ""}
                  </option>
                ))}
              </select>
              <p className="mt-2 text-xs text-gray-500">
                Narx = paketdagi BHM soni × BHM qiymati ({formatMoney(data.packages[0]?.pricing.bhm_value)}) × tarmoq koeffitsienti. Hisob serverda bajariladi.
              </p>
            </section>

            <section className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700">
                    <th className="text-left p-4 w-1/3">Xizmat</th>
                    {data.packages.map((p) => (
                      <th key={p.id} className="p-4 text-center align-bottom">
                        <div className="font-semibold text-gray-900 dark:text-white">{p.name}</div>
                        <div className="text-blue-600 dark:text-blue-400 font-bold">{formatMoney(p.pricing.price)}</div>
                        <div className="text-[11px] text-gray-500">QQS bilan {formatMoney(p.pricing.total)}</div>
                        {p.pricing.multiplier !== 1 && <div className="text-[11px] text-gray-500">koeffitsient ×{p.pricing.multiplier}</div>}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {data.rows.map((row) => (
                    <tr key={row.id} className="border-b border-gray-100 dark:border-gray-700 align-top">
                      <td className="p-4 text-gray-700 dark:text-gray-200">{row.name}</td>
                      {data.packages.map((p) => {
                        const cells = row.cells[String(p.id)] ?? [];
                        return (
                          <td key={p.id} className="p-4 text-center text-xs text-gray-600 dark:text-gray-300">
                            {cells.length === 0 ? (
                              <span className="text-gray-300 dark:text-gray-600">—</span>
                            ) : (
                              cells.map((c, i) => (
                                <div key={i} className="mb-1">
                                  {c.limit > 0 ? <b className="text-gray-900 dark:text-white">{c.limit}</b> : <Check className="inline w-4 h-4 text-emerald-500" />}{" "}
                                  <span className="block">{c.name}</span>
                                </div>
                              ))
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  <tr>
                    <td className="p-4" />
                    {data.packages.map((p) => (
                      <td key={p.id} className="p-4 text-center">
                        <Link to={`/tariff/${p.id}`} className="inline-flex px-3 py-2 rounded-lg bg-blue-600 text-white text-xs font-medium hover:bg-blue-700">
                          Shartnoma tuzish
                        </Link>
                      </td>
                    ))}
                  </tr>
                </tbody>
              </table>
            </section>

            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
              <h2 className="font-semibold text-gray-900 dark:text-white flex items-center gap-2 mb-4">
                <Sparkles className="w-5 h-5 text-amber-500" /> Menga qaysi paket mos?
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {QUESTIONS.map((q) => (
                  <label key={q.key} className="text-sm text-gray-700 dark:text-gray-200">
                    {q.label}
                    <input
                      type="number"
                      min={0}
                      value={need[q.key]}
                      onChange={(e) => setNeed((n) => ({ ...n, [q.key]: Math.max(0, Number(e.target.value) || 0) }))}
                      className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700"
                    />
                  </label>
                ))}
              </div>
              <button type="button" onClick={recommend} className="mt-4 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
                Tavsiya olish
              </button>
              {advice && (
                <div role="status" className="mt-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 p-4 text-sm">
                  {advice.package ? (
                    <>
                      Sizga <b>{advice.package.name}</b> mos — {formatMoney(advice.pricing?.price)} (QQS bilan {formatMoney(advice.pricing?.total)}).{" "}
                      <Link to={`/tariff/${advice.package.id}`} className="text-blue-600 underline">Batafsil</Link>
                    </>
                  ) : (
                    advice.reason
                  )}
                </div>
              )}
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
