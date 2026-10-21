import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Lock, Search, TrendingDown, TrendingUp } from "lucide-react";
import { fetchMarketReport, searchHs, type HsOption, type MarketCountry, type MarketReport as Report } from "../api/marketReport";
import { useAuth } from "../contexts/AuthContext";
import { ApiErrorState, EmptyState, PageHeader, Skeleton, StatCard } from "../components/ui";
import { exportElementToPdf } from "../utils/exportPdf";
import { loginUrl } from "../utils/loginRedirect";

const nf = (v: number | null | undefined, d = 0) =>
  v === null || v === undefined ? "—" : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: d }).format(v);
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "" : `${v >= 0 ? "+" : ""}${nf(v, 1)}%`);

function CountryTable({ title, rows, unit }: { title: string; rows: MarketCountry[]; unit: string }) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-gray-500">Ma'lumot yo'q</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-gray-500"><th className="py-1">Davlat</th><th className="text-right">{unit}</th><th className="text-right">Ulush</th><th className="text-right">O'zgarish</th></tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.country_id} className="border-t border-gray-100 dark:border-gray-700">
                <td className="py-1.5">{r.country}</td>
                <td className="text-right tabular-nums">{nf(r.value, 1)}</td>
                <td className="text-right tabular-nums">{nf(r.share, 1)}%</td>
                <td className={`text-right tabular-nums ${r.change_pct !== null && r.change_pct < 0 ? "text-red-600" : "text-emerald-700"}`}>{pct(r.change_pct)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}

/** K-03: HS kodi bo'yicha bozor tahlili. Qisqa versiya ochiq, to'liq (PDF) — login va paket limiti bilan. */
export default function MarketReport() {
  const [params, setParams] = useSearchParams();
  const hs = params.get("hs") ?? "";
  const { isAuthenticated } = useAuth();
  const [query, setQuery] = useState(hs);
  const [options, setOptions] = useState<HsOption[]>([]);
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2 || query === hs) {
      setOptions([]);
      return;
    }
    const t = setTimeout(() => searchHs(query.trim()).then(setOptions).catch(() => setOptions([])), 250);
    return () => clearTimeout(t);
  }, [query, hs]);

  const load = async (code: string, full = false) => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchMarketReport(code, full));
    } catch (e) {
      setError(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (hs) void load(hs);
  }, [hs]);

  const choose = (code: string) => {
    setOptions([]);
    setQuery(code);
    setParams({ hs: code });
  };

  const fullPdf = async () => {
    setExporting(true);
    try {
      const full = report?.full ? report : await fetchMarketReport(hs, true);
      setReport(full);
      await new Promise((r) => setTimeout(r, 300)); // grafiklar chizilishi uchun
      if (ref.current) await exportElementToPdf(ref.current, `bozor-tahlili-${hs}.pdf`);
    } catch (e) {
      setError(e);
    } finally {
      setExporting(false);
    }
  };

  const chart = report?.dynamics.map((y) => ({ ...y, label: y.partial ? `${y.year}*` : String(y.year) })) ?? [];

  return (
    <div className="py-2">
      <div className="w-full">
        <PageHeader
          title="Bozor tahlili"
          description="Mahsulot (HS kodi) bo'yicha eksport va import, asosiy hamkorlar, narx dinamikasi va bozor konsentratsiyasi."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Tashqi savdo", to: "/trade-flows" }, { label: "Bozor tahlili" }]}
        />

        <div className="relative max-w-xl mb-6">
          <label htmlFor="hs" className="sr-only">HS kodi yoki mahsulot nomi</label>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            id="hs"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && /^\d{2,6}$/.test(query.trim())) choose(query.trim()); }}
            placeholder="HS kodi (masalan 5201) yoki mahsulot nomi (paxta, хлопок)"
            autoComplete="off"
            className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"
          />
          {options.length > 0 && (
            <ul role="listbox" className="absolute z-20 mt-1 w-full max-h-72 overflow-y-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
              {options.map((o) => (
                <li key={o.code}>
                  <button type="button" role="option" aria-selected={false} onClick={() => choose(o.code)} className="w-full text-left px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                    <b className="tabular-nums">{o.code}</b> <span className="text-gray-600 dark:text-gray-300 line-clamp-1">{o.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {!hs ? (
          <EmptyState icon={Search} title="Mahsulotni tanlang" description="HS kodi yoki nomini yozing — masalan 5201 (paxta tolasi), 0806 (uzum), 7108 (oltin)." />
        ) : loading && !report ? (
          <Skeleton variant="chart" />
        ) : error ? (
          <ApiErrorState error={error} onRetry={() => load(hs)} />
        ) : report ? (
          <>
            <div className="flex flex-wrap justify-end gap-2 mb-3">
              {isAuthenticated ? (
                <button type="button" onClick={fullPdf} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50">
                  <Download className="w-4 h-4" /> {report.full ? "PDF yuklab olish" : "To'liq hisobot (PDF)"}
                </button>
              ) : (
                <Link to={loginUrl()} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
                  <Lock className="w-4 h-4" /> To'liq hisobot uchun kiring
                </Link>
              )}
            </div>
            <div ref={ref} className="space-y-6 bg-gray-50 dark:bg-gray-900 p-1">
              <div>
                <h2 className="text-xl font-semibold text-gray-900 dark:text-white">{report.product.code} · {report.product.name_uz ?? report.product.name_ru}</h2>
                <p className="text-sm text-gray-500">{report.latest.year}-yil, {report.latest.period_label}. Qiymatlar {report.value_unit}.</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <StatCard label="Eksport" value={nf(report.latest.export_value, 1)} change={report.latest.export_change_pct ?? undefined} hint={report.latest.compared_with ? `${report.latest.compared_with}-yilning shu davriga` : undefined} />
                <StatCard label="Import" value={nf(report.latest.import_value, 1)} change={report.latest.import_change_pct ?? undefined} />
                <StatCard label="Savdo saldosi" value={nf(report.latest.balance, 1)} />
                <StatCard label="Eksport hamkorlari" value={report.latest.export_partners} hint="davlat" />
              </div>

              <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">Yillar bo'yicha ({report.value_unit})</h3>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => nf(v)} width={70} />
                      <Tooltip formatter={(v) => nf(Number(v), 1)} labelFormatter={(l, p) => `${l} ${p?.[0]?.payload?.period_label ?? ""}`} />
                      <Legend />
                      <Bar dataKey="export_value" name="Eksport" fill="#2563eb" />
                      <Bar dataKey="import_value" name="Import" fill="#f97316" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <p className="text-xs text-gray-500">* — yil to'liq emas (qisman davr).</p>
              </section>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                <CountryTable title="Asosiy eksport bozorlari" rows={report.top_export} unit={report.value_unit} />
                <CountryTable title="Asosiy import manbalari" rows={report.top_import} unit={report.value_unit} />
              </div>

              <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 className="font-semibold mb-2 text-gray-900 dark:text-white">O'rtacha narx, AQSh $ / tonna</h3>
                <div className="h-56">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={chart}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="label" fontSize={12} />
                      <YAxis fontSize={12} tickFormatter={(v) => nf(v)} width={70} />
                      <Tooltip formatter={(v) => nf(Number(v), 1)} />
                      <Legend />
                      <Line type="monotone" dataKey="export_price" name="Eksport narxi" stroke="#2563eb" strokeWidth={2} connectNulls />
                      <Line type="monotone" dataKey="import_price" name="Import narxi" stroke="#f97316" strokeWidth={2} connectNulls />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {report.latest.export_price_coverage !== null && (
                  <p className="text-xs text-gray-500">Narx eksport qiymatining {nf(report.latest.export_price_coverage, 1)}% i (tonnada o'lchangan qismi) bo'yicha.</p>
                )}
              </section>

              {report.full ? (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                  <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <h3 className="font-semibold mb-1">Bozor konsentratsiyasi</h3>
                    <p className="text-3xl font-bold">{nf(report.concentration?.hhi)}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{report.concentration?.label}</p>
                    <p className="mt-2 text-xs text-gray-500">Herfindahl indeksi: hamkorlar ulushlari kvadratlari yig'indisi (0–10 000). 1500 dan past — eksport ko'p davlatga taqsimlangan, 2500 dan yuqori — bir-ikki davlatga bog'liq.</p>
                  </section>
                  <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-1"><TrendingUp className="w-4 h-4 text-emerald-700" /> O'sayotgan bozorlar</h3>
                    {(report.growing_markets ?? []).filter((g) => g.change_pct > 0).map((g) => <p key={g.country} className="text-sm flex justify-between"><span>{g.country}</span><span className="text-emerald-700">{pct(g.change_pct)}</span></p>)}
                  </section>
                  <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                    <h3 className="font-semibold mb-2 flex items-center gap-1"><TrendingDown className="w-4 h-4 text-red-600" /> Qisqarayotgan bozorlar</h3>
                    {(report.shrinking_markets ?? []).map((g) => <p key={g.country} className="text-sm flex justify-between"><span>{g.country}</span><span className="text-red-600">{pct(g.change_pct)}</span></p>)}
                  </section>
                </div>
              ) : (
                <p className="text-sm text-gray-500">Qisqa versiya: top-5 hamkor. To'liq hisobotda top-10, bozor konsentratsiyasi va o'sayotgan/qisqarayotgan bozorlar.</p>
              )}
              <ul className="text-xs text-gray-500 space-y-0.5">{report.notes.map((n) => <li key={n}>• {n}</li>)}</ul>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
