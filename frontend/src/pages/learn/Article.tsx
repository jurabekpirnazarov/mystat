import { Link, useParams, useSearchParams } from "react-router-dom";
import { fetchArticle } from "../../api/citizens";
import useApi from "../../hooks/useApi";
import { ApiErrorState, PageHeader, Skeleton } from "../../components/ui";
import Markdown from "../../components/Markdown";

const LANGS = [{ code: "uz", label: "O'zbekcha" }, { code: "cry", label: "Ўзбекча" }, { code: "ru", label: "Русский" }];

/** FQ-07: maqola sahifasi (3 tilda; tarjimasi yo'q qism o'zbekchada). */
export default function Article() {
  const { slug = "" } = useParams();
  const [params, setParams] = useSearchParams();
  const lang = params.get("lang") ?? "uz";
  const { data, loading, error, reload } = useApi(() => fetchArticle(slug, lang), [slug, lang]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <article className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8" lang={lang === "ru" ? "ru" : "uz"}>
        {loading && !data ? (
          <Skeleton rows={10} />
        ) : error || !data ? (
          <ApiErrorState error={error} onRetry={reload} />
        ) : (
          <>
            <PageHeader title={data.title} description={data.summary}
              breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Maqolalar", to: "/learn" }, { label: data.title }]} />
            <div className="flex gap-2 mb-6" role="group" aria-label="Til">
              {LANGS.map((l) => (
                <button key={l.code} type="button" onClick={() => setParams({ lang: l.code })} aria-pressed={lang === l.code}
                  className={`px-2.5 py-1 rounded text-xs ${lang === l.code ? "bg-blue-600 text-white" : "border border-gray-300 dark:border-gray-600"}`}>{l.label}</button>
              ))}
            </div>
            {data.body_lang !== lang && <p className="mb-4 text-xs text-amber-700 dark:text-amber-300">Maqola matni hozircha faqat o'zbek tilida.</p>}
            <div className="rounded-2xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-6 sm:p-8">
              <Markdown text={data.body} />
            </div>
            {data.related.length > 0 && (
              <div className="mt-6">
                <h2 className="font-semibold mb-2">Bog'liq ko'rsatkichlar</h2>
                <div className="flex flex-wrap gap-2">
                  {data.related.map((r) => <Link key={r.to} to={r.to} className="px-3 py-1.5 rounded-lg bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 text-sm">{r.label} →</Link>)}
                </div>
              </div>
            )}
            {data.terms.length > 0 && (
              <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">Atamalar: {data.terms.map((t, i) => <span key={t.slug}>{i > 0 && ", "}<Link to={`/glossary#${t.slug}`} className="text-blue-600 hover:underline">{t.term}</Link></span>)}</p>
            )}
          </>
        )}
      </article>
    </div>
  );
}
