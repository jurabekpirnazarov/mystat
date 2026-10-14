import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Share2 } from "lucide-react";
import { fetchCpiSeries } from "../api/citizens";
import useApi from "../hooks/useApi";
import { ErrorState, PageHeader, Skeleton } from "../components/ui";
import Term from "../components/Term";
import FavoriteButton from "../components/FavoriteButton";
import { adjustAmount, compareGrowth, depositReal, purchasingPower } from "../utils/inflation";

type Scenario = "salary" | "rent" | "deposit";
const TABS: { id: Scenario; label: string }[] = [
  { id: "salary", label: "Maoshim bugun qancha?" },
  { id: "rent", label: "Ijara inflyatsiyadan tez o'sdimi?" },
  { id: "deposit", label: "Omonat/kredit foizi" },
];
const nf = (v: number, d = 0) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: d }).format(v);
const pct = (v: number) => `${v >= 0 ? "+" : ""}${nf(v, 1)}%`;

/** FQ-03: inflyatsiya kalkulyatori — real CPI (oylik indekslar zanjiri), mehmonga ochiq. */
export default function CpiCalculator() {
  const [params, setParams] = useSearchParams();
  const { data, loading, error, reload } = useApi(fetchCpiSeries, []);
  const series = useMemo(() => data?.series ?? [], [data]);
  const months = series.map((s) => s.month);
  const last = months[months.length - 1] ?? "";
  const defaultFrom = months.includes(`${Number(last.slice(0, 4)) - 5}${last.slice(4)}`) ? `${Number(last.slice(0, 4)) - 5}${last.slice(4)}` : months[0] ?? "";

  const scenario = (params.get("s") as Scenario) || "salary";
  const from = params.get("from") && months.includes(params.get("from") as string) ? (params.get("from") as string) : defaultFrom;
  const to = params.get("to") && months.includes(params.get("to") as string) ? (params.get("to") as string) : last;
  const amount = Number(params.get("amount") ?? 3_000_000);
  const end = Number(params.get("end") ?? 4_500_000);
  const rate = Number(params.get("rate") ?? 20);
  const [copied, setCopied] = useState(false);

  const set = (patch: Record<string, string | number>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => next.set(k, String(v)));
    setParams(next, { replace: true });
  };

  const result = useMemo(() => {
    if (!series.length || !from || !to || from >= to) return null;
    if (scenario === "salary") return { kind: "salary" as const, r: adjustAmount(series, amount, from, to) };
    if (scenario === "rent") return { kind: "rent" as const, r: compareGrowth(series, amount, end, from, to) };
    return { kind: "deposit" as const, r: depositReal(series, rate, from, to) };
  }, [series, scenario, amount, end, rate, from, to]);
  const chart = useMemo(() => (series.length && from < to ? purchasingPower(series, amount, from, to) : []), [series, amount, from, to]);

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const field = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700";
  const monthSelect = (value: string, onChange: (v: string) => void, label: string) => (
    <label className="text-sm">
      {label}
      <select value={value} onChange={(e) => onChange(e.target.value)} className={`${field} mt-1`}>
        {[...months].reverse().map((m) => <option key={m} value={m}>{m}</option>)}
      </select>
    </label>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Inflyatsiya kalkulyatori"
          description="Iste'mol narxlari indeksi (rasmiy oylik ma'lumot) asosida: maosh, ijara va omonat foizini inflyatsiya bilan solishtiring."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Fuqarolar uchun", to: "/citizens" }, { label: "Inflyatsiya kalkulyatori" }]}
          actions={<FavoriteButton kind="cpi" title="Inflyatsiya kalkulyatori" />}
        />
        {loading && !data ? (
          <Skeleton variant="chart" />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="space-y-6">
            <div className="flex flex-wrap gap-2" role="tablist">
              {TABS.map((t) => (
                <button key={t.id} type="button" role="tab" aria-selected={scenario === t.id} onClick={() => set({ s: t.id })}
                  className={`px-4 py-2 rounded-lg text-sm font-medium ${scenario === t.id ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {monthSelect(from, (v) => set({ from: v }), "Boshlang'ich oy")}
              {monthSelect(to, (v) => set({ to: v }), "Oxirgi oy")}
              {scenario !== "deposit" && (
                <label className="text-sm">{scenario === "salary" ? "Maosh (boshlang'ich oyda), so'm" : "Boshidagi ijara haqi, so'm"}
                  <input type="number" min={0} value={amount} onChange={(e) => set({ amount: Math.max(0, Number(e.target.value)) })} className={`${field} mt-1`} />
                </label>
              )}
              {scenario === "rent" && (
                <label className="text-sm">Hozirgi ijara haqi, so'm
                  <input type="number" min={0} value={end} onChange={(e) => set({ end: Math.max(0, Number(e.target.value)) })} className={`${field} mt-1`} />
                </label>
              )}
              {scenario === "deposit" && (
                <label className="text-sm">Nominal yillik foiz stavkasi, %
                  <input type="number" step="0.1" value={rate} onChange={(e) => set({ rate: Number(e.target.value) })} className={`${field} mt-1`} />
                </label>
              )}
              {from >= to && <p className="sm:col-span-2 text-sm text-red-600">Oxirgi oy boshlang'ichdan keyin bo'lishi kerak.</p>}
            </section>

            {result?.r && (
              <section className="rounded-2xl border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-5" aria-live="polite">
                {result.kind === "salary" && (
                  <p className="text-lg">
                    {from} dagi <b>{nf(amount)} so'm</b> {to} narxlarida taxminan <b className="text-blue-700 dark:text-blue-300">{nf(result.r.value)} so'm</b> ga teng.
                    <span className="block text-sm mt-1 text-gray-600 dark:text-gray-300">Shu davrda narxlar {pct(result.r.inflationPct)} oshgan (<Term id="cpi">ISN</Term> bo'yicha). Maoshingiz shundan kam oshgan bo'lsa, <Term id="real-value">real</Term> daromadingiz kamaygan.</span>
                  </p>
                )}
                {result.kind === "rent" && (
                  <p className="text-lg">
                    Ijara {pct(result.r.growthPct)} o'sgan, <Term id="inflation">inflyatsiya</Term> esa {pct(result.r.inflationPct)}.{" "}
                    <b>{result.r.realChangePct >= 0 ? `Ijara inflyatsiyadan ${nf(result.r.realChangePct, 1)}% tez o'sgan.` : `Ijara real hisobda ${nf(-result.r.realChangePct, 1)}% arzonlashgan.`}</b>
                  </p>
                )}
                {result.kind === "deposit" && (
                  <p className="text-lg">
                    Davrdagi yillik inflyatsiya ≈ {nf(result.r.inflationAnnualPct, 1)}%. {rate}% nominal stavkaning <Term id="real-interest-rate">real stavkasi</Term>:{" "}
                    <b className={result.r.realRatePct >= 0 ? "text-emerald-700 dark:text-emerald-300" : "text-red-600"}>{pct(result.r.realRatePct)}</b>
                    <span className="block text-sm mt-1 text-gray-600 dark:text-gray-300">
                      {result.r.realRatePct >= 0 ? "Omonat inflyatsiyani qoplaydi." : "Omonat inflyatsiyani qoplamaydi — pul real qiymatini yo'qotadi. Kredit uchun esa bu qarz real hisobda arzonlashadi degani."}
                    </span>
                  </p>
                )}
                <div className="mt-3 flex flex-wrap gap-2">
                  <button type="button" onClick={share} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 text-sm">
                    <Share2 className="w-4 h-4" /> {copied ? "Havola nusxalandi" : "Natijani ulashish"}
                  </button>
                  <Link to="/learn/inflyatsiya-nima" className="px-3 py-1.5 text-sm text-blue-700 dark:text-blue-300 hover:underline">Inflyatsiya nima? →</Link>
                </div>
              </section>
            )}

            {chart.length > 1 && scenario !== "deposit" && (
              <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                <h2 className="font-semibold mb-2">{nf(amount)} so'mning xarid qobiliyati ({from} narxlarida)</h2>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="month" fontSize={11} minTickGap={30} />
                      <YAxis fontSize={11} tickFormatter={(v) => nf(v / 1000) + "k"} width={55} />
                      <Tooltip formatter={(v) => `${nf(Number(v))} so'm`} />
                      <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </section>
            )}
            <p className="text-xs text-gray-500">
              Manba: iste'mol narxlari indeksi, oylik (o'tgan oyga nisbatan). Davr inflyatsiyasi oylik indekslar ko'paytmasi sifatida hisoblanadi. Ma'lumot: {months[0]} — {last}.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
