import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Building2, Download } from "lucide-react";
import axiosT from "../api/baseUrl";
import useApi from "../hooks/useApi";
import { ApiErrorState, PageHeader, Skeleton, SourceBadge, type DataSource } from "../components/ui";
import { exportElementToPdf } from "../utils/exportPdf";
import { formatDateTime, formatMoney } from "../utils/format";
import CompanyScoreCard from "../components/company-score/CompanyScoreCard";

interface Passport {
  basic: Record<"name" | "tin" | "address" | "phone" | "email" | "organization_type" | "region" | "district" | "sector" | "ktut_name", string | null>;
  products: { code: string; name: string; category: string }[] | null;
  reports: { report_id: string; type_uz: string; next_deadline: string | null }[] | null;
  indicators: { year: number; revenue: number; employees: number; output_value: number; export_value: number | null }[] | null;
  indicators_source: DataSource;
  contracts: { id: number; contract_number: string; status: string; total_amount: string; start_date: string }[] | null;
  package: { name: string; expires_at: string | null } | null;
}

const BASIC_LABELS: [keyof Passport["basic"], string][] = [
  ["tin", "STIR"], ["ktut_name", "KTUT'dagi nomi"], ["organization_type", "Shakl"], ["sector", "Tarmoq (OKED)"],
  ["region", "Viloyat"], ["district", "Tuman"], ["address", "Manzil"], ["phone", "Telefon"], ["email", "Email"],
];
const nf = (v: number) => new Intl.NumberFormat("ru-RU").format(Math.round(v));

function Block({ title, children, badge }: { title: string; children: React.ReactNode; badge?: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 break-inside-avoid">
      <h2 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">{title} {badge}</h2>
      {children}
    </section>
  );
}

/** K-07: korxona pasporti — faqat o'z korxonasi; ma'lumoti yo'q blok ko'rsatilmaydi. */
export default function OrganizationPassport() {
  const { data, loading, error, reload } = useApi(async () => (await axiosT.get<Passport>("/organizations/me/passport/")).data, []);
  const ref = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);

  const pdf = async () => {
    if (!ref.current) return;
    setExporting(true);
    try {
      await exportElementToPdf(ref.current, `korxona-pasporti-${data?.basic.tin ?? ""}.pdf`, data?.indicators_source === "synthetic");
    } finally {
      setExporting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Korxona pasporti"
          breadcrumbs={[{ label: "Kabinet", to: "/cabinet" }, { label: "Korxona pasporti" }]}
          actions={data && (
            <button type="button" onClick={pdf} disabled={exporting} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">
              <Download className="w-4 h-4" /> PDF
            </button>
          )}
        />
        {loading && !data ? (
          <Skeleton variant="chart" />
        ) : error ? (
          <ApiErrorState error={error} onRetry={reload} notFoundAction={<Link to="/cabinet" className="text-blue-600 underline">Kabinetga qaytish</Link>} />
        ) : data ? (
          <div ref={ref} className="space-y-4 bg-gray-50 dark:bg-gray-900">
            <Block title={data.basic.name ?? "Korxona"}>
              <div className="flex items-start gap-4">
                <Building2 className="w-10 h-10 text-blue-600 shrink-0" aria-hidden="true" />
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-2 text-sm flex-1">
                  {BASIC_LABELS.filter(([k]) => data.basic[k]).map(([k, label]) => (
                    <div key={k}><dt className="text-gray-500">{label}</dt><dd className="text-gray-900 dark:text-white">{data.basic[k]}</dd></div>
                  ))}
                </dl>
              </div>
            </Block>

            {/* KORXONA_SCORING.md KR-36: o'z korxonasi bali — tavsiyalar, o'z qiymatlari, yillar dinamikasi */}
            <CompanyScoreCard mode="own" className="break-inside-avoid" />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {data.indicators && (
                <Block title="Asosiy ko'rsatkichlar" badge={<SourceBadge source={data.indicators_source} />}>
                  <div className="h-48">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={data.indicators}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" fontSize={11} />
                        <YAxis fontSize={11} tickFormatter={(v) => `${nf(v / 1000)}k`} width={50} />
                        <Tooltip formatter={(v) => nf(Number(v))} />
                        <Bar dataKey="revenue" name="Tushum, ming so'm" fill="#2563eb" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                  {(() => {
                    const last = data.indicators[data.indicators.length - 1];
                    return (
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                        {last.year}: xodimlar {last.employees}, mahsulot {nf(last.output_value)} ming so'm
                        {last.export_value ? `, eksport ${nf(last.export_value)} ming $` : ""}.{" "}
                        <Link to="/cabinet" state={{ name: "benchmark" }} className="text-blue-600 hover:underline">Tarmoq bilan solishtirish →</Link>
                      </p>
                    );
                  })()}
                </Block>
              )}

              {data.reports && (
                <Block title="Hisobotlar">
                  <ul className="space-y-1.5 text-sm">
                    {data.reports.slice(0, 6).map((r) => (
                      <li key={r.report_id} className="flex justify-between gap-2">
                        <span className="truncate">{r.type_uz}</span>
                        <span className="text-gray-500 shrink-0">{formatDateTime(r.next_deadline, false)}</span>
                      </li>
                    ))}
                  </ul>
                  <Link to="/cabinet" state={{ name: "reports" }} className="mt-2 inline-block text-sm text-blue-600 hover:underline">Hisobotlarim →</Link>
                </Block>
              )}

              {data.products && (
                <Block title={`Ishlab chiqaradigan mahsulotlari (${data.products.length})`}>
                  <ul className="space-y-1 text-sm max-h-56 overflow-y-auto">
                    {data.products.map((p, i) => <li key={i}><b className="tabular-nums">{p.code}</b> {p.name} <span className="text-xs text-gray-500">· {p.category}</span></li>)}
                  </ul>
                </Block>
              )}

              {(data.contracts || data.package) && (
                <Block title="Shartnomalar va paket">
                  {data.package && <p className="text-sm mb-2">Faol paket: <b>{data.package.name}</b>{data.package.expires_at ? `, ${formatDateTime(data.package.expires_at, false)} gacha` : ""}</p>}
                  <ul className="space-y-1 text-sm">
                    {data.contracts?.map((c) => (
                      <li key={c.id} className="flex justify-between gap-2"><span>{c.contract_number}</span><span className="text-gray-500">{c.status} · {formatMoney(c.total_amount)}</span></li>
                    ))}
                  </ul>
                </Block>
              )}
            </div>
            <p className="text-xs text-gray-500">Tashqi savdo ma'lumotlarida korxona kesimi yo'q, shuning uchun bu blok ko'rsatilmaydi.</p>
          </div>
        ) : null}
      </div>
    </div>
  );
}
