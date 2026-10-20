import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Check, Copy, FileDown, LogIn, Search, ShieldCheck } from "lucide-react";
import { fetchCertificate, type Certificate } from "../../api/statPublic";
import { ApiErrorState, PageHeader, Skeleton } from "../../components/ui";
import { useAuth } from "../../contexts/AuthContext";
import { exportElementToPdf } from "../../utils/exportPdf";
import { formatDateTime } from "../../utils/format";
import { loginUrl } from "../../utils/loginRedirect";

/**
 * JAHON_TAJRIBASI JT-04: statistik kodlar va topshiriladigan hisobotlar haqida ma'lumotnoma.
 * STIR URL'da (`?stir=`), ma'lumotnoma PDF qilib saqlanadi; tekshiruv kodi bilan istalgan tashkilot
 * `/stat-codes/verify` sahifasida haqiqiyligini tekshiradi.
 */
function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="py-2 grid grid-cols-3 gap-3 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <dt className="text-sm text-gray-500 dark:text-gray-400">{label}</dt>
      <dd className={`col-span-2 text-sm ${value ? "text-gray-900 dark:text-white font-medium" : "text-gray-400 italic"}`}>
        {value || "KTUT ma'lumotida mavjud emas"}
      </dd>
    </div>
  );
}

export default function StatCodes() {
  const { isAuthenticated } = useAuth();
  const [params, setParams] = useSearchParams();
  const stir = params.get("stir") ?? "";
  const [input, setInput] = useState(stir);
  const [data, setData] = useState<Certificate | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);
  const docRef = useRef<HTMLDivElement>(null);

  useEffect(() => { document.title = "Statistik kodlar ma'lumotnomasi — my.stat.uz"; }, []);

  useEffect(() => {
    if (stir.length !== 9 || !isAuthenticated) { setData(null); return; }
    const ctrl = new AbortController();
    setLoading(true);
    setError(null);
    fetchCertificate(stir, ctrl.signal)
      .then(setData)
      .catch((e) => { if (!ctrl.signal.aborted) { setError(e); setData(null); } })
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [stir, isAuthenticated]);

  const verifyUrl = data ? `${window.location.origin}${data.verify_path}` : "";
  const copyVerify = async () => {
    try { await navigator.clipboard.writeText(verifyUrl); setCopied(true); window.setTimeout(() => setCopied(false), 2000); } catch { /* ruxsat yo'q */ }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Statistik kodlar ma'lumotnomasi"
          description="STIR bo'yicha korxonaning statistik kodlari va qaysi statistik hisobotlarni topshirishi kerakligi. Bank, tender va davlat organlari uchun."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Xizmatlar", to: "/services" }, { label: "Statistik kodlar" }]}
          actions={<Link to="/stat-codes/verify" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm hover:border-blue-300"><ShieldCheck className="w-4 h-4" aria-hidden="true" />Ma'lumotnomani tekshirish</Link>}
        />

        <form className="mb-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (input.length === 9) setParams({ stir: input }); }}>
          <label htmlFor="stir" className="sr-only">STIR</label>
          <input id="stir" inputMode="numeric" autoComplete="off" placeholder="STIR (9 ta raqam)" value={input}
            onChange={(e) => setInput(e.target.value.replace(/\D/g, "").slice(0, 9))}
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 text-gray-900 dark:text-white tracking-widest" />
          <button type="submit" disabled={input.length !== 9}
            className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700 disabled:opacity-50">
            <Search className="w-4 h-4" aria-hidden="true" />Olish
          </button>
        </form>

        {!isAuthenticated ? (
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
            <p className="text-gray-700 dark:text-gray-200">Ma'lumotnoma bepul, lekin uni olish uchun tizimga kiring.</p>
            <Link to={loginUrl(`/stat-codes${stir ? `?stir=${stir}` : ""}`)} className="mt-3 inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-white text-sm hover:bg-blue-700">
              <LogIn className="w-4 h-4" aria-hidden="true" />Kirish
            </Link>
          </div>
        ) : loading ? (
          <Skeleton variant="table" rows={6} />
        ) : error ? (
          <ApiErrorState error={error} />
        ) : data ? (
          <>
            <div className="mb-3 flex flex-wrap justify-end gap-2 print:hidden">
              <button type="button" onClick={copyVerify} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm hover:border-blue-300">
                {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <Copy className="w-4 h-4" aria-hidden="true" />}
                {copied ? "Nusxalandi" : "Tekshiruv havolasi"}
              </button>
              <button type="button" onClick={() => docRef.current && exportElementToPdf(docRef.current, `malumotnoma-${data.stir}.pdf`)}
                className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700">
                <FileDown className="w-4 h-4" aria-hidden="true" />PDF
              </button>
            </div>

            <div ref={docRef} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 sm:p-8">
              <div className="text-center border-b border-gray-200 dark:border-gray-700 pb-4 mb-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">O'zbekiston Respublikasi Milliy statistika qo'mitasi · my.stat.uz</p>
                <h2 className="mt-1 text-xl font-bold text-gray-900 dark:text-white">Statistik kodlar va hisobotlar ro'yxati haqida ma'lumotnoma</h2>
                <p className="mt-1 text-xs text-gray-500">Berilgan sana: {formatDateTime(data.issued_at)}</p>
              </div>

              <dl>
                <Field label="Korxona nomi" value={data.name} />
                <Field label="STIR" value={data.stir} />
                <Field label="OKPO (KTUT kodi)" value={data.okpo} />
                <Field label="SOATO (hudud)" value={data.codes.soato ? `${data.codes.soato} · ${[data.codes.region, data.codes.district].filter(Boolean).join(", ")}` : null} />
                <Field label="Tarmoq" value={data.codes.sector} />
                <Field label="Tashkiliy-huquqiy shakl" value={data.codes.legal_form} />
              </dl>

              <h3 className="mt-6 mb-2 font-semibold text-gray-900 dark:text-white">Topshiriladigan statistik hisobotlar ({data.reports.length})</h3>
              {data.reports.length === 0 ? (
                <p className="text-sm text-gray-500">KTUT bo'yicha korxonaga majburiy statistik hisobot biriktirilmagan.</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="text-left text-gray-500 border-b border-gray-200 dark:border-gray-700">
                        <th className="py-2 pr-3 font-medium">Shakl</th>
                        <th className="py-2 pr-3 font-medium">Davriyligi</th>
                        <th className="py-2 font-medium">Topshirish muddati</th>
                      </tr>
                    </thead>
                    <tbody>
                      {data.reports.map((r) => (
                        <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700 align-top">
                          <td className="py-2 pr-3">
                            <span className="font-medium text-gray-900 dark:text-white">{r.form}</span>
                            <span className="block text-xs text-gray-500">{r.title}</span>
                          </td>
                          <td className="py-2 pr-3 whitespace-nowrap text-gray-700 dark:text-gray-200">{r.periodicity_label || "—"}</td>
                          <td className="py-2 text-gray-700 dark:text-gray-200">
                            {r.deadline_rule}
                            {r.next_deadline && <span className="block text-xs text-gray-500">Navbatdagi: {formatDateTime(r.next_deadline, false)}</span>}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 rounded-lg bg-gray-50 dark:bg-gray-900 p-4 text-xs text-gray-600 dark:text-gray-300">
                <p><b>Haqiqiyligini tekshirish:</b> {window.location.origin}/stat-codes/verify sahifasida quyidagi kodni kiriting yoki havolani oching.</p>
                <p className="mt-1 break-all font-mono text-[11px] text-gray-800 dark:text-gray-100">{data.verify_code}</p>
                <p className="mt-2">Manba: {data.source}. Hisobotlar ro'yxati KTUT ma'lumoti bo'yicha; o'zgarishlarni hisobot kalendarida kuzating.</p>
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-gray-500">STIR kiriting: korxonaning OKPO kodi va majburiy statistik hisobotlari chiqadi.</p>
        )}
      </div>
    </div>
  );
}
