import { useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, Download, Share2 } from "lucide-react";
import { fetchRegionMap, fetchRegionProfile, type RegionCard, type RegionProfile as Profile } from "../api/regions";
import useApi from "../hooks/useApi";
import { DemoBadge, ErrorState, PageHeader, SampleBanner, Skeleton } from "../components/ui";
import Term from "../components/Term";
import FavoriteButton from "../components/FavoriteButton";
import SubscribeButton from "../components/SubscribeButton";
import { exportElementToPng } from "../utils/exportPdf";

const nf = (v: number | null | undefined, d = 1) => (v === null || v === undefined ? "—" : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: d }).format(v));
const TERM: Record<string, string> = { unemployment_rate: "unemployment-rate", grp_per_capita: "grp", avg_salary: "average-wage", births: "crude-birth-rate" };

function Card({ c }: { c: RegionCard }) {
  const term = TERM[c.key];
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <p className="text-xs text-gray-500 flex items-center gap-1">
        {term ? <Term id={term}>{c.label}</Term> : c.label}{c.year ? `, ${c.year}` : ""}{c.preliminary ? "*" : ""} <DemoBadge show={c.source === "synthetic"} />
        {c.source === "siat" && c.source_url && (
          <a href={c.source_url} target="_blank" rel="noopener noreferrer" title="Rasmiy statistika (SIAT)" className="ml-auto text-[10px] font-semibold text-blue-700 hover:underline">SIAT</a>
        )}
      </p>
      <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{nf(c.value)} <span className="text-xs font-normal text-gray-500">{c.unit}</span></p>
      <p className="mt-1 text-xs text-gray-500">
        {c.change_pct !== null && <span className="mr-2">{c.change_pct >= 0 ? "+" : ""}{nf(c.change_pct)}% yil davomida</span>}
        {c.vs_average_pct !== null && (
          <span className={`inline-flex items-center ${c.assessment === "good" ? "text-emerald-700" : c.assessment === "bad" ? "text-red-600" : ""}`}>
            {c.vs_average_pct >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            {nf(Math.abs(c.vs_average_pct))}% {c.vs_average_pct >= 0 ? "yuqori" : "past"} ({c.key === "population" && c.source === "siat" ? "viloyatlar o'rtachasidan" : "respublika o'rtachasidan"})
          </span>
        )}
      </p>
    </div>
  );
}

function Infographic({ p }: { p: Profile }) {
  return (
    <div className="w-[360px] rounded-2xl bg-gradient-to-b from-blue-700 to-blue-900 text-white p-6 space-y-4">
      <p className="text-xs uppercase tracking-wider opacity-80">my.stat.uz · {p.year}</p>
      <h3 className="text-2xl font-bold">{p.region.name_uz}</h3>
      {p.cards.slice(0, 6).map((c) => (
        <div key={c.key} className="flex items-baseline justify-between border-b border-white/20 pb-2">
          <span className="text-sm opacity-90">{c.label}</span>
          <span className="text-lg font-semibold">{nf(c.value)}</span>
        </div>
      ))}
      {p.industry && <p className="text-sm">Sanoat korxonalari: <b>{nf(p.industry.companies, 0)}</b></p>}
      {p.data_source !== "real" && <p className="text-[10px] opacity-80">Ko'rsatkichlarning bir qismi namuna (haqiqiy statistika emas).</p>}
    </div>
  );
}

/** FQ-02: viloyat profili, infografika (PNG), ikki hududni solishtirish (?compare=<id>). */
export default function RegionProfile() {
  const { id } = useParams();
  const [params, setParams] = useSearchParams();
  const compareId = Number(params.get("compare")) || null;
  const { data, loading, error, reload } = useApi(() => fetchRegionProfile(Number(id)), [id]);
  const other = useApi(() => (compareId ? fetchRegionProfile(compareId) : Promise.resolve(null)), [compareId]);
  const regions = useApi(() => fetchRegionMap("population"), []);
  const info = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = useState(false);

  const merged = (key: string) => {
    const a = data?.dynamics[key] ?? [];
    const b = other.data?.dynamics[key] ?? [];
    return a.map((p) => ({ year: p.year, a: p.value, b: b.find((x) => x.year === p.year)?.value }));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {loading && !data ? (
          <Skeleton variant="chart" />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <>
            <PageHeader
              title={data.region.name_uz}
              description={`${data.year ?? ""}-yil holati · ${data.districts_count} ta tuman/shahar`}
              breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Hududlar", to: `/regions?t=${data.region.code}` }, { label: data.region.name_uz }]}
              actions={
                <>
                  <SubscribeButton indicator={`region:${data.region.id}`} title={`Hudud: ${data.region.name_uz}`} />
                  <FavoriteButton kind="region" title={`Hudud: ${data.region.name_uz}`} params={{ region: data.region.id }} />
                  <button type="button" onClick={() => info.current && exportElementToPng(info.current, `hudud-${data.region.code}.png`, data.data_source === "synthetic")}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"><Download className="w-4 h-4" /> Infografika</button>
                  <button type="button" onClick={async () => { await navigator.clipboard?.writeText(window.location.href); setCopied(true); }}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"><Share2 className="w-4 h-4" /> {copied ? "Nusxalandi" : "Ulashish"}</button>
                </>
              }
            />
            <SampleBanner show={data.data_source !== "real"} text={data.cards.some((c) => c.source === "siat")
              ? "Aholi, ish haqi, ishsizlik va aholi jon boshiga YaHM — rasmiy statistika (SIAT). «Namuna» belgili ko'rsatkichlar hali namuna."
              : "Aholi, ish haqi, ishsizlik, YaHM va boshqa hududiy ko'rsatkichlar namuna. Sanoat korxonalari va tashqi savdo — real ma'lumot."} />

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              {data.cards.map((c) => <Card key={c.key} c={c} />)}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <section className="lg:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <h2 className="font-semibold">O'rtacha ish haqi dinamikasi</h2>
                  <select aria-label="Solishtirish uchun hudud" value={compareId ?? ""} onChange={(e) => setParams(e.target.value ? { compare: e.target.value } : {})}
                    className="px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm">
                    <option value="">Boshqa hudud bilan solishtirish…</option>
                    {regions.data?.items.filter((r) => r.region_id !== data.region.id).map((r) => <option key={r.region_id} value={r.region_id}>{r.name}</option>)}
                  </select>
                </div>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={merged("avg_salary")}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                      <XAxis dataKey="year" fontSize={12} />
                      <YAxis fontSize={12} width={60} />
                      <Tooltip formatter={(v) => nf(Number(v))} />
                      <Legend />
                      <Line type="monotone" dataKey="a" name={data.region.name_uz} stroke="#2563eb" strokeWidth={2} />
                      {other.data && <Line type="monotone" dataKey="b" name={other.data.region.name_uz} stroke="#f97316" strokeWidth={2} />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                {other.data && (
                  <table className="mt-4 w-full text-sm">
                    <thead><tr className="text-left text-xs text-gray-500"><th>Ko'rsatkich</th><th className="text-right">{data.region.name_uz}</th><th className="text-right">{other.data.region.name_uz}</th></tr></thead>
                    <tbody>
                      {data.cards.map((c) => (
                        <tr key={c.key} className="border-t border-gray-100 dark:border-gray-700">
                          <td className="py-1">{c.label}</td>
                          <td className="text-right tabular-nums">{nf(c.value)}</td>
                          <td className="text-right tabular-nums">{nf(other.data?.cards.find((x) => x.key === c.key)?.value)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                )}
              </section>
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
                {data.industry && (
                  <div>
                    <h2 className="font-semibold">Sanoat <span className="text-xs font-normal text-gray-500">(real)</span></h2>
                    <p className="text-sm">{nf(data.industry.companies, 0)} ta ishlab chiqaruvchi korxona</p>
                    <ul className="mt-1 text-xs text-gray-600 dark:text-gray-300 space-y-0.5">
                      {data.industry.top_categories.map((t) => <li key={t.name}>• {t.name} — {t.companies}</li>)}
                    </ul>
                    <Link to={`/partners?region=${data.region.id}`} className="text-xs text-blue-600 hover:underline">Korxonalar ro'yxati →</Link>
                  </div>
                )}
                {data.trade && (
                  <div>
                    <h2 className="font-semibold">Tashqi savdo <span className="text-xs font-normal text-gray-500">(real, {data.trade.year} {data.trade.period})</span></h2>
                    <p className="text-sm">Eksport: <b>{nf(data.trade.export, 0)}</b> {data.trade.unit}</p>
                    <p className="text-sm">Import: <b>{nf(data.trade.import, 0)}</b> {data.trade.unit}</p>
                  </div>
                )}
                <div ref={info} className="pt-2"><Infographic p={data} /></div>
              </section>
            </div>

            {data.districts.length > 0 && (
              <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
                <h2 className="font-semibold px-4 pt-4">Tumanlar reytingi <DemoBadge show={data.districts_source !== "siat" && data.data_source !== "real"} />{data.districts_source === "siat" && <span className="ml-2 text-xs font-normal text-gray-500">manba: SIAT</span>}</h2>
                <table className="min-w-full text-sm">
                  <thead><tr className="text-left text-xs text-gray-500"><th className="px-4 py-2">Tuman/shahar</th><th className="px-2 text-right">Aholi, ming</th><th className="px-2 text-right">O'rtacha ish haqi</th><th className="px-2 text-right">Ishsizlik, %</th>{data.districts_source !== "siat" && <th className="px-2 text-right">Tug'ilganlar</th>}</tr></thead>
                  <tbody>
                    {data.districts.map((d) => (
                      <tr key={d.id} className="border-t border-gray-100 dark:border-gray-700">
                        <td className="px-4 py-1.5">{d.name}</td>
                        <td className="px-2 text-right tabular-nums">{nf(d.population as number)}</td>
                        <td className="px-2 text-right tabular-nums">{nf(d.avg_salary as number, 0)}</td>
                        <td className="px-2 text-right tabular-nums">{nf(d.unemployment_rate as number)}</td>
                        {data.districts_source !== "siat" && <td className="px-2 text-right tabular-nums">{nf(d.births as number, 0)}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </section>
            )}
          </>
        )}
      </div>
    </div>
  );
}
