import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { AlertTriangle, ShieldCheck, ShieldX } from "lucide-react";
import { verifyCertificate, type CertificateCheck } from "../../api/statPublic";
import { PageHeader, Skeleton } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

/** JAHON_TAJRIBASI JT-04: ma'lumotnoma haqiqiyligini tekshirish — login kerak emas. */
export default function CertificateVerify() {
  const [params, setParams] = useSearchParams();
  const code = params.get("code") ?? "";
  const [input, setInput] = useState(code);
  const [result, setResult] = useState<CertificateCheck | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => { document.title = "Ma'lumotnomani tekshirish — my.stat.uz"; }, []);

  useEffect(() => {
    if (!code) { setResult(null); return; }
    const ctrl = new AbortController();
    setLoading(true);
    verifyCertificate(code, ctrl.signal)
      .then(setResult)
      .catch(() => !ctrl.signal.aborted && setResult({ valid: false, detail: "Tekshirib bo'lmadi. Keyinroq urinib ko'ring." }))
      .finally(() => !ctrl.signal.aborted && setLoading(false));
    return () => ctrl.abort();
  }, [code]);

  return (
    <div className="py-2">
      <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title="Ma'lumotnomani tekshirish"
          description="my.stat.uz bergan statistik kodlar ma'lumotnomasi haqiqiymi — kodni kiriting."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Statistik kodlar", to: "/stat-codes" }, { label: "Tekshirish" }]} />

        <form className="mb-6 flex gap-2" onSubmit={(e) => { e.preventDefault(); if (input.trim()) setParams({ code: input.trim() }); }}>
          <label htmlFor="code" className="sr-only">Tekshiruv kodi</label>
          <input id="code" value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ma'lumotnomadagi kod"
            className="flex-1 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-4 py-2.5 font-mono text-sm text-gray-900 dark:text-white" />
          <button type="submit" className="rounded-lg bg-blue-600 px-5 py-2.5 text-white font-medium hover:bg-blue-700">Tekshirish</button>
        </form>

        {loading ? <Skeleton variant="card" /> : result && (
          result.valid ? (
            <div className="rounded-xl border border-emerald-200 dark:border-emerald-800 bg-emerald-50 dark:bg-emerald-950/30 p-5">
              <p className="flex items-center gap-2 font-semibold text-emerald-800 dark:text-emerald-300">
                <ShieldCheck className="w-5 h-5" aria-hidden="true" />Ma'lumotnoma haqiqiy
              </p>
              <dl className="mt-3 grid grid-cols-3 gap-y-1 text-sm">
                <dt className="text-gray-500">Korxona</dt><dd className="col-span-2 font-medium text-gray-900 dark:text-white">{result.name}</dd>
                <dt className="text-gray-500">STIR</dt><dd className="col-span-2">{result.stir}</dd>
                <dt className="text-gray-500">OKPO</dt><dd className="col-span-2">{result.okpo}</dd>
                <dt className="text-gray-500">Berilgan</dt><dd className="col-span-2">{formatDateTime(result.issued_at)}</dd>
                <dt className="text-gray-500">Hisobotlar</dt><dd className="col-span-2">{result.reports_count} ta (hozirgi holat)</dd>
              </dl>
              {result.changed && (
                <p className="mt-3 flex gap-2 text-sm text-amber-800 dark:text-amber-300">
                  <AlertTriangle className="w-4 h-4 mt-0.5 shrink-0" aria-hidden="true" />
                  Ma'lumotnoma berilgandan keyin hisobotlar ro'yxati o'zgargan. Yangi ma'lumotnoma oling:{" "}
                  <Link to={`/stat-codes?stir=${result.stir}`} className="underline">bu yerda</Link>.
                </p>
              )}
            </div>
          ) : (
            <div className="rounded-xl border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-5">
              <p className="flex items-center gap-2 font-semibold text-red-800 dark:text-red-300">
                <ShieldX className="w-5 h-5" aria-hidden="true" />Tasdiqlanmadi
              </p>
              <p className="mt-1 text-sm text-red-800 dark:text-red-300">{result.detail}</p>
            </div>
          )
        )}
      </div>
    </div>
  );
}
