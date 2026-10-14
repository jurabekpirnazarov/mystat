import { Link, useSearchParams } from "react-router-dom";
import { BookOpen, Clock } from "lucide-react";
import { fetchArticles } from "../../api/citizens";
import useApi from "../../hooks/useApi";
import { ErrorState, PageHeader, Skeleton } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

/** FQ-07: "Statistika oddiy tilda" — maqolalar ro'yxati, mavzu bo'yicha filtr. */
export default function Learn() {
  const [params, setParams] = useSearchParams();
  const topic = params.get("topic") ?? "";
  const { data, loading, error, reload } = useApi(() => fetchArticles(topic || undefined), [topic]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Statistika oddiy tilda"
          description="Asosiy statistik tushunchalar — qisqa va tushunarli. Murakkab atamalar uchun lug'atga qarang."
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Maqolalar" }]}
          actions={<Link to="/glossary" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Lug'at →</Link>}
        />
        <div className="flex flex-wrap gap-2 mb-6">
          <button type="button" onClick={() => setParams({})} className={`px-3 py-1.5 rounded-full text-sm ${!topic ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>Barchasi</button>
          {data?.topics.map((t) => (
            <button key={t.code} type="button" onClick={() => setParams({ topic: t.code })}
              className={`px-3 py-1.5 rounded-full text-sm ${topic === t.code ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700"}`}>{t.name}</button>
          ))}
        </div>
        {loading && !data ? (
          <Skeleton variant="card" />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.results.map((a) => (
              <Link key={a.slug} to={`/learn/${a.slug}`} className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 hover:border-blue-300 flex flex-col">
                <BookOpen className="w-6 h-6 text-blue-600 mb-3" aria-hidden="true" />
                <h2 className="font-semibold text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">{a.title}</h2>
                <p className="mt-2 text-sm text-gray-600 dark:text-gray-300 flex-1">{a.summary}</p>
                <p className="mt-3 text-xs text-gray-500 flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {a.reading_minutes} daqiqa · {formatDateTime(a.published_at, false)}</p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
