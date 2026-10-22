import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, FileText, Lock, Search, TrendingDown, TrendingUp } from "lucide-react";
import { fetchMarketReport, fetchSampleReport, type MarketCountry, type MarketReport as Report } from "../api/marketReport";
import { useAuth } from "../contexts/AuthContext";
import { ApiErrorState, EmptyState, PageHeader, Skeleton, StatCard } from "../components/ui";
import ResultCard from "../components/common/ResultCard";
import FlowToggle from "../components/externalTrade/FlowToggle";
import TradeSearch from "../components/externalTrade/TradeSearch";
import DataQualityNote from "../components/externalTrade/DataQualityNote";
import { ServiceAbout, ServiceFaq } from "../components/catalog/ServiceAbout";
import { useFlow } from "../components/externalTrade/useFlow";
import { mg } from "../theme/tokens";
import { exportElementToPdf } from "../utils/exportPdf";
import { loginUrl } from "../utils/loginRedirect";

const nf = (v: number | null | undefined, d = 0) =>
  v === null || v === undefined ? "—" : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: d }).format(v);
const pct = (v: number | null | undefined) => (v === null || v === undefined ? "" : `${v >= 0 ? "+" : ""}${nf(v, 1)}%`);

type Tab = "overview" | "countries" | "price";
const TABS: { id: Tab; label: string }[] = [
  { id: "overview", label: "Umumiy" },
  { id: "countries", label: "Xaridor davlatlar" },
  { id: "price", label: "Narx" },
];

/** TI-07: davlat kartalari (yagona ResultCard) — o'rin, qiymat, ulush, o'zgarish, o'rtacha narx. */
function CountryCards({ title, rows, unit, flowLabel, unreliable }: { title: string; rows: MarketCountry[]; unit: string; flowLabel: string; unreliable: boolean }) {
  return (
    <section aria-label={title}>
      <h3 className="mb-3 text-base font-semibold text-mg-heading">{title}</h3>
      {rows.length === 0 ? (
        <p className="text-sm text-mg-muted">Ma'lumot yo'q</p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2">
          {rows.map((r, i) => (
            <ResultCard key={r.country_id} variant="country" rank={i + 1} title={r.country} flowLabel={flowLabel} value={nf(r.value, 1)} unit={unit}
              share={r.share} changePct={r.change_pct} changeSince="o'tgan yilga nisbatan" unreliable={unreliable} price={r.price_kg ?? null}
              to={`/trade-flows?country=${r.country_id}`} />
          ))}
        </div>
      )}
    </section>
  );
}

/** K-03: HS kodi bo'yicha bozor tahlili. Qisqa versiya ochiq, to'liq (PDF) — login va paket limiti bilan. TI-06/TI-07. */
export default function MarketReport() {
  const [params, setParams] = useSearchParams();
  const hs = params.get("hs") ?? "";
  const [flow, setFlow] = useFlow();
  const { isAuthenticated } = useAuth();
  const [tab, setTab] = useState<Tab>("overview");
  const [report, setReport] = useState<Report | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<unknown>(null);
  const [exporting, setExporting] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const load = async (code: string) => {
    setLoading(true);
    setError(null);
    try {
      setReport(await fetchMarketReport(code));
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
    const next = new URLSearchParams(params);
    next.set("hs", code);
    setParams(next);
  };

  /** Barcha bo'limlarni bir vaqtda chizib, so'ng PDFga aylantiradi (yorliqlar yashirgan bo'limlar ham kiradi). */
  const toPdf = async (data: Report) => {
    setExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 400));
      if (ref.current) await exportElementToPdf(ref.current, `bozor-tahlili-${data.hs}${data.sample ? "-namuna" : ""}.pdf`);
    } catch (e) {
      setError(e);
    } finally {
      setExporting(false);
    }
  };

  const fullPdf = async () => {
    setExporting(true);
    try {
      const full = report?.full ? report : await fetchMarketReport(hs, true);
      setReport(full);
      await toPdf(full);
    } catch (e) {
      setError(e);
      setExporting(false);
    }
  };

  const samplePdf = async () => {
    setExporting(true);
    try {
      const sample = await fetchSampleReport();
      setReport(sample);
      const next = new URLSearchParams(params);
      next.set("hs", sample.hs);
      setParams(next, { replace: true });
      await toPdf(sample);
    } catch (e) {
      setError(e);
      setExporting(false);
    }
  };

  const chart = report?.dynamics.map((y) => ({ ...y, label: y.partial ? `${y.year}*` : String(y.year) })) ?? [];
  const unreliable = (report?.quality_notes?.length ?? 0) > 0;
  const show = (t: Tab) => exporting || tab === t;

  return (
    <div className="py-2">
      <div className="w-full">
        <PageHeader
          title="Bozor tahlili"
          description="Mahsulot (HS kodi) bo'yicha eksport va import, asosiy hamkorlar, narx dinamikasi va bozor konsentratsiyasi."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Tashqi savdo", to: "/ex-trade" }, { label: "Bozor tahlili" }]}
        />

        <div className="mb-6 flex flex-wrap items-center gap-3">
          <TradeSearch flow={flow} className="w-full max-w-xl" initial={hs} placeholder="HS kodi (masalan 5201) yoki mahsulot nomi (paxta, хлопок)" onPickProduct={choose} />
          <FlowToggle value={flow} onChange={setFlow} />
        </div>

        {!hs ? (
          <div className="space-y-6">
            <EmptyState icon={Search} title="Mahsulotni tanlang" description="HS kodi yoki nomini yozing — masalan 5201 (paxta tolasi), 0806 (uzum), 7108 (oltin)." />
            <div className="text-center">
              <button type="button" onClick={samplePdf} disabled={exporting} className="inline-flex items-center gap-2 rounded-mg border border-mg-primary px-4 py-2 text-sm font-semibold text-mg-primary hover:bg-mg-info disabled:opacity-50">
                <FileText className="h-4 w-4" aria-hidden="true" /> {exporting ? "Tayyorlanmoqda…" : "Namuna hisobot (PDF)"}
              </button>
              <p className="mt-1 text-xs text-mg-muted">Kirish shart emas — real ma'lumotlar asosidagi namuna.</p>
            </div>
            <ServiceAbout number={302} />
            <ServiceFaq number={302} />
          </div>
        ) : loading && !report ? (
          <Skeleton variant="chart" />
        ) : error ? (
          <ApiErrorState error={error} onRetry={() => load(hs)} />
        ) : report ? (
          <>
            <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
              <div role="tablist" aria-label="Bo'limlar" className="inline-flex rounded-mg border border-mg-border bg-mg-surface p-1">
                {TABS.map((t) => (
                  <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} onClick={() => setTab(t.id)}
                    className={`rounded-[10px] px-4 py-1.5 text-sm font-semibold ${tab === t.id ? "bg-mg-primary text-white" : "text-mg-text hover:bg-mg-info"}`}>{t.label}</button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                <button type="button" onClick={samplePdf} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-mg border border-mg-border px-3 py-2 text-sm disabled:opacity-50">
                  <FileText className="h-4 w-4" aria-hidden="true" /> Namuna hisobot (PDF)
                </button>
                {isAuthenticated ? (
                  <button type="button" onClick={fullPdf} disabled={exporting} className="inline-flex items-center gap-1.5 rounded-mg bg-mg-primary px-3 py-2 text-sm text-white disabled:opacity-50">
                    <Download className="h-4 w-4" aria-hidden="true" /> {report.full ? "PDF yuklab olish" : "To'liq hisobot (PDF)"}
                  </button>
                ) : (
                  <Link to={loginUrl()} className="inline-flex items-center gap-1.5 rounded-mg border border-mg-border px-3 py-2 text-sm">
                    <Lock className="h-4 w-4" aria-hidden="true" /> To'liq hisobot uchun kiring
                  </Link>
                )}
              </div>
            </div>
            <div ref={ref} className="space-y-6 bg-mg-bg p-1">
              <div>
                <h2 className="text-xl font-semibold text-mg-heading">
                  {report.product.code} · {report.product.name_uz ?? report.product.name_ru}
                  {report.sample && <span className="ml-2 rounded-full bg-mg-info px-2 py-0.5 text-xs font-medium text-mg-primary">Namuna</span>}
                </h2>
                <p className="text-sm text-mg-muted">{report.latest.year}-yil, {report.latest.period_label}. Qiymatlar {report.value_unit}.</p>
              </div>
              <DataQualityNote notes={report.quality_notes} />

              {show("overview") && (
                <>
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <StatCard label="Eksport" value={nf(report.latest.export_value, 1)} change={unreliable ? undefined : report.latest.export_change_pct ?? undefined} hint={report.latest.compared_with ? `${report.latest.compared_with}-yilning shu davriga` : undefined} />
                    <StatCard label="Import" value={nf(report.latest.import_value, 1)} change={unreliable ? undefined : report.latest.import_change_pct ?? undefined} />
                    <StatCard label="Savdo saldosi" value={nf(report.latest.balance, 1)} />
                    <StatCard label="Eksport hamkorlari" value={report.latest.export_partners} hint="davlat" />
                  </div>
                  <section className="rounded-mg border border-mg-border bg-mg-surface p-4">
                    <h3 className="mb-2 font-semibold text-mg-heading">Yillar bo'yicha ({report.value_unit})</h3>
                    <div className="h-64">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={chart}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                          <XAxis dataKey="label" fontSize={12} />
                          <YAxis fontSize={12} tickFormatter={(v) => nf(v)} width={70} />
                          <Tooltip formatter={(v) => nf(Number(v), 1)} labelFormatter={(l, p) => `${l} ${p?.[0]?.payload?.period_label ?? ""}`} />
                          <Legend />
                          <Bar dataKey="export_value" name="Eksport" fill={mg.flow.export} fillOpacity={flow === "import" ? 0.35 : 1} />
                          <Bar dataKey="import_value" name="Import" fill={mg.flow.import} fillOpacity={flow === "export" ? 0.35 : 1} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                    <p className="text-xs text-mg-muted">* — yil to'liq emas (qisman davr).</p>
                  </section>
                  {report.full && (
                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                      <section className="rounded-mg border border-mg-border bg-mg-surface p-4">
                        <h3 className="mb-1 font-semibold">Bozor konsentratsiyasi</h3>
                        <p className="text-3xl font-bold">{nf(report.concentration?.hhi)}</p>
                        <p className="text-sm text-mg-text">{report.concentration?.label}</p>
                        <p className="mt-2 text-xs text-mg-muted">Herfindahl indeksi: hamkorlar ulushlari kvadratlari yig'indisi (0–10 000). 1500 dan past — eksport ko'p davlatga taqsimlangan, 2500 dan yuqori — bir-ikki davlatga bog'liq.</p>
                      </section>
                      <section className="rounded-mg border border-mg-border bg-mg-surface p-4">
                        <h3 className="mb-2 flex items-center gap-1 font-semibold"><TrendingUp className="h-4 w-4 text-emerald-700" aria-hidden="true" /> O'sayotgan bozorlar</h3>
                        {(report.growing_markets ?? []).filter((g) => g.change_pct > 0).map((g) => <p key={g.country} className="flex justify-between text-sm"><span>{g.country}</span><span className="text-emerald-700">{pct(g.change_pct)}</span></p>)}
                      </section>
                      <section className="rounded-mg border border-mg-border bg-mg-surface p-4">
                        <h3 className="mb-2 flex items-center gap-1 font-semibold"><TrendingDown className="h-4 w-4 text-red-600" aria-hidden="true" /> Qisqarayotgan bozorlar</h3>
                        {(report.shrinking_markets ?? []).map((g) => <p key={g.country} className="flex justify-between text-sm"><span>{g.country}</span><span className="text-red-600">{pct(g.change_pct)}</span></p>)}
                      </section>
                    </div>
                  )}
                </>
              )}

              {show("countries") && (
                <div className="space-y-6">
                  {(flow === "export" || flow === "total") && <CountryCards title="Xaridor davlatlar (eksport bozorlari)" rows={report.top_export} unit={report.value_unit} flowLabel="Eksport" unreliable={unreliable} />}
                  {(flow === "import" || flow === "total") && <CountryCards title="Yetkazib beruvchi davlatlar (import manbalari)" rows={report.top_import} unit={report.value_unit} flowLabel="Import" unreliable={unreliable} />}
                  {!report.full && <p className="text-sm text-mg-muted">Qisqa versiya: top-5 hamkor. To'liq hisobotda top-10, bozor konsentratsiyasi va o'sayotgan/qisqarayotgan bozorlar.</p>}
                </div>
              )}

              {show("price") && (
                <section className="rounded-mg border border-mg-border bg-mg-surface p-4">
                  <h3 className="mb-2 font-semibold text-mg-heading">O'rtacha narx, AQSh $ / tonna</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chart}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="label" fontSize={12} />
                        <YAxis fontSize={12} tickFormatter={(v) => nf(v)} width={70} />
                        <Tooltip formatter={(v) => nf(Number(v), 1)} />
                        <Legend />
                        <Line type="monotone" dataKey="export_price" name="Eksport narxi" stroke={mg.flow.export} strokeWidth={2} connectNulls />
                        <Line type="monotone" dataKey="import_price" name="Import narxi" stroke={mg.flow.import} strokeWidth={2} connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  {report.latest.export_price_coverage !== null && (
                    <p className="text-xs text-mg-muted">Narx eksport qiymatining {nf(report.latest.export_price_coverage, 1)}% i (tonnada o'lchangan qismi) bo'yicha.</p>
                  )}
                </section>
              )}
              <ul className="space-y-0.5 text-xs text-mg-muted">{report.notes.map((n) => <li key={n}>• {n}</li>)}</ul>
            </div>
            <ServiceAbout number={302} />
            <ServiceFaq number={302} />
          </>
        ) : null}
      </div>
    </div>
  );
}
