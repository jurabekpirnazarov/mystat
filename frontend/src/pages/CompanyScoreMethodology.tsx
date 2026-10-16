import { useSearchParams } from "react-router-dom";
import useApi from "../hooks/useApi";
import { fetchCompanyScoreMethodology, type ScoreLang } from "../api/companyScores";
import { ErrorState, PageHeader, Skeleton } from "../components/ui";
import { KLASS_STYLE } from "../components/company-score/klassStyle";

const KIND: Record<string, string> = {
  peer: "tengdoshlar ichida percentil",
  absolute: "o'z formulasi (normativga nisbatan)",
  trade: "eksportchilar ichida percentil",
};
const APPLIES: Record<string, string> = {
  has_history: "2 yildan ortiq faoliyat yuritganlarda",
  producing: "faqat A, B, C bo'limlarida",
  employees_6: "6 va undan ko'p xodimda",
  employees_20: "20 va undan ko'p xodimda",
  reports_due: "majburiy hisoboti borlarda",
};
const LANGS: [ScoreLang, string][] = [["uz", "O'zb"], ["cry", "Ўзб"], ["ru", "Рус"]];

/**
 * KORXONA_SCORING.md KR-38, 6-bo'lim 14-band: korxona bali metodologiyasi oddiy tilda. Ko'rsatkichlar, vaznlar va
 * chegaralar API orqali `company_scoring.yaml` dan — sahifada qo'lda yozilgan raqam yo'q.
 */
export default function CompanyScoreMethodology() {
  const [params, setParams] = useSearchParams();
  const lang = (params.get("lang") as ScoreLang) || "uz";
  const { data, loading, error, reload } = useApi(() => fetchCompanyScoreMethodology(lang), [lang]);
  const p = data?.params ?? {};

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <PageHeader title="Korxona bali: qanday hisoblanadi" description="Taxminiy baho, rasmiy baho emas. Ochiq va namuna ko'rsatkichlarga asoslangan." />
      <div className="mb-4 flex gap-1" role="group" aria-label="Til">
        {LANGS.map(([code, label]) => (
          <button key={code} type="button" onClick={() => setParams({ lang: code })} aria-pressed={lang === code}
            className={`px-2.5 py-1 rounded text-xs ${lang === code ? "bg-blue-600 text-white" : "border border-gray-300 dark:border-gray-600"}`}>{label}</button>
        ))}
      </div>
      {loading && <Skeleton className="h-64" />}
      {Boolean(error) && <ErrorState onRetry={reload} />}
      {data && (
        <article className="space-y-6 text-sm text-gray-700 dark:text-gray-200">
          <p className="rounded-lg bg-amber-50 dark:bg-amber-900/20 px-3 py-2 text-amber-900 dark:text-amber-200">{data.disclaimer} Model versiyasi {data.version}.</p>

          <section>
            <h2 className="text-lg font-semibold">1. Nimani o'lchaydi</h2>
            <p className="mt-1">Har korxonaga 0–100 ball va 6 ta ustun bo'yicha baho beriladi. Ball korxonani <b>o'z tengdoshlari</b> bilan solishtiradi: bir xil OKED bo'limi va o'lchamdagi korxonalar. Korxonaning kattaligi, hududi va mulkchilik shakli bahoga kirmaydi.</p>
            <p className="mt-1">Tengdoshlar guruhi: OKED bo'limi × o'lcham ({data.size_classes.map((c) => `${c.name}${c.max ? ` — ${c.max} gacha xodim` : ` — ${data.size_classes[data.size_classes.length - 2]?.max}+ xodim`}`).join("; ")}). Guruhda {p.min_peer} tadan kam korxona bo'lsa — faqat OKED bo'limi, u ham kam bo'lsa — butun respublika.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">2. Ustunlar va ko'rsatkichlar</h2>
            <div className="mt-2 overflow-x-auto">
              <table className="w-full text-xs">
                <thead><tr className="text-left text-gray-500"><th className="py-1 pr-2">Ustun</th><th className="pr-2">Ko'rsatkich</th><th className="pr-2">Qanday baholanadi</th><th>Qo'llanilishi</th></tr></thead>
                <tbody>
                  {data.pillars.flatMap((pl) => pl.indicators.map((ind, i) => (
                    <tr key={ind.code} className="border-t border-gray-100 dark:border-gray-700 align-top">
                      <td className="py-1 pr-2 font-medium">{i === 0 ? `${pl.key}. ${pl.name}` : ""}</td>
                      <td className="pr-2">{ind.name}{ind.direction === "-" && <span className="text-gray-400"> (past — yaxshi)</span>}</td>
                      <td className="pr-2">{KIND[ind.kind] ?? ind.kind}</td>
                      <td>{ind.applies ? APPLIES[ind.applies] ?? ind.applies : "hammada"}</td>
                    </tr>
                  )))}
                </tbody>
              </table>
            </div>
            <p className="mt-2">Tashqi savdo ustuni faqat {data.tradable.sections.join(", ")} bo'limlari va {data.tradable.divisions.join(", ")}-bo'linmada baholanadi; boshqa korxonalar eksport qilmagani uchun jazolanmaydi. Eksportchi: {p.exporter_base} + {p.exporter_span} × (eksport ko'rsatkichlari percentili); eksport qilmaydigan savdoga yaroqli korxona — {p.no_export_score}.</p>
            <p className="mt-1">Kichik korxonada ulushlar (ayollar, rahbariyatdagi ayollar) bo'lim o'rtachasiga tortiladi: (n·x + {p.shrink_k}·o'rtacha) / (n + {p.shrink_k}).</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold">3. Vaznlar</h2>
            <table className="mt-2 w-full text-xs">
              <thead><tr className="text-left text-gray-500"><th className="py-1">Preset</th>{data.pillars.map((pl) => <th key={pl.key} className="text-right" title={pl.name}>{pl.key}</th>)}</tr></thead>
              <tbody>
                {data.presets.map((pr) => (
                  <tr key={pr.key} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-1">{pr.name}{pr.key === data.default_preset && <span className="text-gray-400"> (standart)</span>}</td>
                    {data.pillars.map((pl) => <td key={pl.key} className="text-right tabular-nums">{pr.weights[pl.key] ?? 0}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <section>
            <h2 className="text-lg font-semibold">4. Sinflar, bayroqlar va to'liqlik</h2>
            <ul className="mt-2 flex flex-wrap gap-2">
              {data.classes.map((c) => (
                <li key={c.key} className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1">
                  <span className={`inline-flex h-6 w-6 items-center justify-center rounded-full font-bold ${KLASS_STYLE[c.key || "none"].bg} ${KLASS_STYLE[c.key || "none"].text}`}>{c.key}</span>
                  {c.name} · {c.min} dan
                </li>
              ))}
            </ul>
            <ul className="mt-2 list-disc pl-5 space-y-1">
              <li>Soliq qarzi bo'lsa umumiy ball {p.cap_tax_debt} dan oshmaydi (A va B mumkin emas).</li>
              <li>Bayroqlar: {data.flags.map((f) => f.name).join(", ")}.</li>
              <li>To'liqlik {Math.round((p.coverage_min ?? 0) * 100)}% dan kam bo'lsa ball yo'q ("Ma'lumot yetarli emas"), {Math.round((p.coverage_full ?? 0) * 100)}% dan kam bo'lsa — "qisman ma'lumot". Yetishmagan qiymat o'rtacha bilan to'ldirilmaydi.</li>
              <li>Tavsiyalar faqat korxonaning o'ziga (kabinetda): percentili {p.rec_peer_below} dan past yoki mutlaq bahosi {p.rec_abs_below} dan past ko'rsatkichlardan eng pasti {p.rec_max} tasi.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold">5. Ma'lumot va maxfiylik</h2>
            <ul className="mt-1 list-disc pl-5 space-y-1">
              <li>Begona korxonaning xom qiymatlari (tushum, foyda, ish haqi, soliq qarzi summasi) hech qayerda ko'rsatilmaydi — faqat ball, sinf, ustunlar va bayroq nomi.</li>
              <li>Hozir ko'rsatkichlarning ko'pchiligi <b>namuna</b> (sintetik): ular "Namuna" belgisi bilan chiqadi. Real manbali ko'rsatkichlar (hisobotlar soni, mahsulot turlari) kartochkada "Real" belgisi bilan.</li>
              <li>Real ma'lumot ulanganda vaznlar va chegaralar qayta kalibrlanadi.</li>
            </ul>
          </section>
        </article>
      )}
    </div>
  );
}
