import { useCallback, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import SubscribeButton from "../components/SubscribeButton";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Download, Globe2, Hash, Layers, TrendingUp, X } from "lucide-react";
import SavedQueries from "../components/SavedQueries";
import {
  downloadTradeExport,
  fetchTradeDynamics,
  fetchTradeFlows,
  TRADE_VALUE_UNIT,
  type TradeFlow,
} from "../api/tradeFlows";
import useApi from "../hooks/useApi";
import TradeFlowMap from "../components/externalTrade/TradeFlowMap";
import { EmptyState, ErrorState, PageHeader, Skeleton, StatCard } from "../components/ui";

const fmt = (n: number, digits = 1) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: digits }).format(n).replace(/,/g, " ");
const compact = (n: number) => (n >= 1e6 ? `${fmt(n / 1e6)} mlrd` : n >= 1e3 ? `${fmt(n / 1e3)} mln` : fmt(n));

/** Tashqi savdo oqimlari: xarita, top-20 hamkor, yillar dinamikasi. Filtrlar URL'da (havolani ulashish mumkin). U-09. */
export default function TradeFlows() {
  const [params, setParams] = useSearchParams();
  const flow: TradeFlow = params.get("flow") === "import" ? "import" : "export";
  const year = Number(params.get("year")) || undefined;
  const hs = (params.get("hs") ?? "").replace(/\D/g, "").slice(0, 6);
  const countryId = Number(params.get("country")) || null;
  // U-16: taqqoslash — ikkinchi davlat (compare) yoki ikkinchi yil (year2)
  const compareId = Number(params.get("compare")) || null;
  const year2 = Number(params.get("year2")) || null;
  const [exportMsg, setExportMsg] = useState<string | null>(null);
  const [hsInput, setHsInput] = useState(hs);

  const update = useCallback(
    (patch: Record<string, string | number | null | undefined>) => {
      const next = new URLSearchParams(params);
      for (const [k, v] of Object.entries(patch)) {
        if (v === null || v === undefined || v === "") next.delete(k);
        else next.set(k, String(v));
      }
      setParams(next, { replace: true });
    },
    [params, setParams]
  );

  const flows = useApi(() => fetchTradeFlows({ flow, year, hs: hs.length >= 2 ? hs : undefined }), [flow, year, hs]);
  const dynamics = useApi(() => fetchTradeDynamics(flow, countryId), [flow, countryId]);
  const dynamics2 = useApi(() => (compareId ? fetchTradeDynamics(flow, compareId) : Promise.resolve(null)), [flow, compareId]);
  const flows2 = useApi(() => (year2 ? fetchTradeFlows({ flow, year: year2, hs: hs.length >= 2 ? hs : undefined }) : Promise.resolve(null)), [flow, year2, hs]);
  const doExport = async (detail: "country" | "hs4", format: "csv" | "xlsx") => {
    setExportMsg("Tayyorlanmoqda…");
    try {
      const r = await downloadTradeExport({ flow, year, hs: hs.length >= 2 ? hs : undefined, detail, format });
      setExportMsg(r.truncated ? `Yuklandi: ${r.rows} qator (server chegarasi — 10 000 qator).` : `Yuklandi: ${r.rows} qator.`);
    } catch {
      setExportMsg("Eksport qilib bo'lmadi.");
    }
  };

  const data = flows.data;
  const top = useMemo(() => (data?.countries ?? []).slice(0, 20), [data]);
  const selected = data?.countries.find((c) => c.country_id === countryId) ?? null;
  const compared = data?.countries.find((c) => c.country_id === compareId) ?? null;
  const year2Values = useMemo(() => new Map((flows2.data?.countries ?? []).map((c) => [c.country_id, c.value])), [flows2.data]);
  const chartData = useMemo(() => {
    const second = new Map((dynamics2.data ?? []).map((p) => [p.year, p.value]));
    return (dynamics.data ?? []).map((p) => ({ ...p, value2: second.get(p.year) ?? null }));
  }, [dynamics.data, dynamics2.data]);
  const flowLabel = flow === "export" ? "Eksport" : "Import";
  const onSelect = useCallback((id: number | null) => update({ country: id }), [update]);

  const toggle = (active: boolean) =>
    `px-4 py-2 text-sm font-medium transition ${active ? "bg-blue-600 text-white" : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700"}`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Tashqi savdo oqimlari"
          description="Davlatlar kesimida eksport va import: hajm, ulush va o'tgan yilning shu davriga nisbatan o'zgarish."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Tashqi savdo", to: "/ex-trade" }, { label: "Savdo oqimlari" }]}
          actions={
            <>
            <SubscribeButton indicator="trade" title="Tashqi savdo" />
            <Link to={hs.length >= 2 ? `/market-report?hs=${hs}` : "/market-report"} className="inline-flex items-center px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-white dark:hover:bg-gray-800">
              Mahsulot bo'yicha bozor tahlili →
            </Link>
            </>
          }
        />

        {/* Filtrlar */}
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden bg-white dark:bg-gray-800" role="group" aria-label="Oqim">
            <button type="button" className={toggle(flow === "export")} aria-pressed={flow === "export"} onClick={() => update({ flow: "export" })}>Eksport</button>
            <button type="button" className={toggle(flow === "import")} aria-pressed={flow === "import"} onClick={() => update({ flow: "import" })}>Import</button>
          </div>
          <select
            aria-label="Yil"
            value={data?.year ?? year ?? ""}
            onChange={(e) => update({ year: e.target.value })}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-800 dark:text-gray-100"
          >
            {(data?.years ?? (year ? [year] : [])).slice().reverse().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              update({ hs: hsInput.replace(/\D/g, "").slice(0, 6) || null });
            }}
            className="flex items-center gap-2"
          >
            <label htmlFor="hs" className="sr-only">TN VED kodi</label>
            <div className="relative">
              <Hash className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
              <input
                id="hs"
                inputMode="numeric"
                placeholder="TN VED (2–6 raqam)"
                value={hsInput}
                onChange={(e) => setHsInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                className="w-44 pl-8 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-800 dark:text-gray-100"
              />
            </div>
            <button type="submit" className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">Qo'llash</button>
            {hs && (
              <button type="button" onClick={() => { setHsInput(""); update({ hs: null }); }} className="text-sm text-gray-500 hover:text-gray-700" aria-label="Kodni tozalash">
                <X className="w-4 h-4" />
              </button>
            )}
          </form>
          {data && (
            <span className="text-sm text-gray-500 dark:text-gray-400">
              Davr: {data.year}-yil {data.period_label}
            </span>
          )}
          <select
            aria-label="Taqqoslash yili"
            value={year2 ?? ""}
            onChange={(e) => update({ year2: e.target.value || null })}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2"
          >
            <option value="">Yil bilan taqqoslash…</option>
            {(data?.years ?? []).filter((y) => y !== data?.year).slice().reverse().map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
          <div className="flex items-center gap-1">
            <Download className="w-4 h-4 text-gray-500" aria-hidden="true" />
            <button type="button" onClick={() => doExport("country", "csv")} className="px-2 py-1 rounded border text-xs">CSV</button>
            <button type="button" onClick={() => doExport("country", "xlsx")} className="px-2 py-1 rounded border text-xs">XLSX</button>
            <button type="button" onClick={() => doExport("hs4", "xlsx")} className="px-2 py-1 rounded border text-xs" title="Davlat × HS4, ko'pi bilan 10 000 qator">Davlat×HS4</button>
          </div>
          {exportMsg && <span role="status" className="text-xs text-gray-500">{exportMsg}</span>}
        </div>
        <div className="mb-6 max-w-sm">
          <SavedQueries
            kind="trade"
            current={{ flow, year, hs: hs || undefined, country: countryId ?? undefined, compare: compareId ?? undefined, year2: year2 ?? undefined }}
            onApply={(p) => setParams(new URLSearchParams(Object.entries(p).map(([k, v]) => [k, String(v)])), { replace: true })}
          />
        </div>

        {flows.loading && !data ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">{[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}</div>
            <Skeleton variant="chart" />
          </div>
        ) : flows.error ? (
          <ErrorState onRetry={flows.reload} />
        ) : !data || data.countries.length === 0 ? (
          <EmptyState icon={Globe2} title="Ma'lumot topilmadi" description="Boshqa yil yoki TN VED kodini tanlab ko'ring." />
        ) : (
          <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard label={`${flowLabel}, jami`} value={compact(data.total_value)} icon={TrendingUp} hint={TRADE_VALUE_UNIT} />
              <StatCard label="Hamkor davlatlar" value={data.countries_count} icon={Globe2} hint={hs ? `TN VED ${hs}*` : "barcha tovarlar"} />
              <StatCard label="Eng yirik hamkor" value={top[0]?.country_name ?? "—"} icon={ArrowUpRight} hint={top[0] ? `${top[0].share.toFixed(1)}% ulush` : undefined} />
              <StatCard
                label="Davlati ko'rsatilmagan"
                value={`${data.total_value ? ((data.other_countries_value / data.total_value) * 100).toFixed(1) : 0}%`}
                icon={Layers}
                hint={"\"Boshqa davlatlar\" yozuvi"}
              />
            </div>

            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
              <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                <h2 className="font-semibold text-gray-900 dark:text-white">{flowLabel} xaritasi</h2>
                {selected && (
                  <button type="button" onClick={() => onSelect(null)} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
                    {selected.country_name} <X className="w-4 h-4" />
                  </button>
                )}
              </div>
              <TradeFlowMap countries={data.countries} selectedId={countryId} onSelect={onSelect} />
            </section>

            <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
              <section className="xl:col-span-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">Top-20 hamkor</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 pr-2 font-medium w-8">#</th>
                        <th className="py-2 pr-2 font-medium">Davlat</th>
                        <th className="py-2 pr-2 font-medium text-right">Qiymat</th>
                        <th className="py-2 pr-2 font-medium w-40">Ulush</th>
                        <th className="py-2 font-medium text-right">O'zgarish</th>
                        {year2 && <th className="py-2 pl-2 font-medium text-right">{year2}-yil</th>}
                      </tr>
                    </thead>
                    <tbody>
                      {top.map((c, i) => (
                        <tr
                          key={c.country_id}
                          onClick={() => onSelect(c.country_id === countryId ? null : c.country_id)}
                          className={`cursor-pointer border-b border-gray-100 dark:border-gray-700/60 hover:bg-gray-50 dark:hover:bg-gray-700/40 ${c.country_id === countryId ? "bg-amber-50 dark:bg-amber-900/20" : ""}`}
                        >
                          <td className="py-2 pr-2 text-gray-500 tabular-nums">{i + 1}</td>
                          <td className="py-2 pr-2 text-gray-900 dark:text-white">{c.country_name}</td>
                          <td className="py-2 pr-2 text-right tabular-nums text-gray-900 dark:text-white whitespace-nowrap">{fmt(c.value)}</td>
                          <td className="py-2 pr-2">
                            <div className="flex items-center gap-2">
                              <div className="flex-1 h-1.5 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden">
                                <div className="h-full bg-blue-600" style={{ width: `${Math.min(100, c.share)}%` }} />
                              </div>
                              <span className="w-12 text-right tabular-nums text-gray-600 dark:text-gray-300">{c.share.toFixed(1)}%</span>
                            </div>
                          </td>
                          <td className="py-2 text-right tabular-nums whitespace-nowrap">
                            {c.change_pct === null ? (
                              <span className="text-gray-400">—</span>
                            ) : (
                              <span className={`inline-flex items-center gap-0.5 ${c.change_pct >= 0 ? "text-emerald-700" : "text-red-600"}`}>
                                {c.change_pct >= 0 ? <ArrowUpRight className="w-3.5 h-3.5" /> : <ArrowDownRight className="w-3.5 h-3.5" />}
                                {fmt(Math.abs(c.change_pct))}%
                              </span>
                            )}
                          </td>
                          {year2 && (
                            <td className="py-2 pl-2 text-right tabular-nums text-gray-600 dark:text-gray-300 whitespace-nowrap">
                              {year2Values.has(c.country_id) ? fmt(year2Values.get(c.country_id) as number) : "—"}
                            </td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">Qiymatlar: {TRADE_VALUE_UNIT}. O'zgarish — o'tgan yilning xuddi shu davriga nisbatan.</p>
              </section>

              <section className="xl:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-3">
                  {selected ? `${selected.country_name}: ` : ""}{selected ? flowLabel.toLowerCase() : flowLabel} dinamikasi
                </h2>
                <select
                  aria-label="Taqqoslash uchun davlat"
                  value={compareId ?? ""}
                  onChange={(e) => update({ compare: e.target.value || null })}
                  className="mb-2 w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-2 py-1.5"
                >
                  <option value="">Boshqa davlat bilan taqqoslash…</option>
                  {top.filter((c) => c.country_id !== countryId).map((c) => <option key={c.country_id} value={c.country_id}>{c.country_name}</option>)}
                </select>
                {dynamics.loading && !dynamics.data ? (
                  <Skeleton variant="chart" />
                ) : dynamics.error ? (
                  <ErrorState onRetry={dynamics.reload} />
                ) : (
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                        <XAxis dataKey="year" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                        <YAxis tickFormatter={(v: number) => compact(v)} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={64} />
                        <Tooltip
                          formatter={(v: number, key) => [`${fmt(v)} ${TRADE_VALUE_UNIT}`, key === "value2" ? compared?.country_name ?? "Taqqoslash" : selected?.country_name ?? flowLabel]}
                          labelFormatter={(y, payload) => `${y}-yil ${payload?.[0]?.payload?.period_label ?? ""}`}
                        />
                        <Line type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} />
                        {compareId && <Line type="monotone" dataKey="value2" stroke="#f97316" strokeWidth={2.5} dot={{ r: 3 }} isAnimationActive={false} connectNulls />}
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}
                <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                  Har yil uchun mavjud oxirgi kumulyativ davr olinadi — to'liq bo'lmagan yillar pastroq ko'rinadi.
                </p>
              </section>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
