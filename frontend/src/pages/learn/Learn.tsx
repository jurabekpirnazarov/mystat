import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, BookOpen, Briefcase, Clock, Lightbulb, TrendingUp, Users, Wallet, type LucideIcon } from "lucide-react";
import { fetchArticles } from "../../api/citizens";
import useApi from "../../hooks/useApi";
import { ErrorState, PageHeader, Skeleton } from "../../components/ui";

/** Mavzu bo'yicha belgi va rang — kartochkalar bir qarashda ajralib tursin. */
const TOPIC_STYLE: Record<string, { icon: LucideIcon; tile: string; badge: string; bar: string }> = {
  prices: { icon: Wallet, tile: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300", badge: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200", bar: "bg-amber-400" },
  economy: { icon: TrendingUp, tile: "bg-blue-100 text-blue-700 dark:bg-blue-900/40 dark:text-blue-300", badge: "bg-blue-50 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200", bar: "bg-blue-500" },
  population: { icon: Users, tile: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300", badge: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200", bar: "bg-emerald-500" },
  labour: { icon: Briefcase, tile: "bg-violet-100 text-violet-700 dark:bg-violet-900/40 dark:text-violet-300", badge: "bg-violet-50 text-violet-800 dark:bg-violet-900/30 dark:text-violet-200", bar: "bg-violet-500" },
  methods: { icon: Lightbulb, tile: "bg-rose-100 text-rose-700 dark:bg-rose-900/40 dark:text-rose-300", badge: "bg-rose-50 text-rose-800 dark:bg-rose-900/30 dark:text-rose-200", bar: "bg-rose-400" },
};
const FALLBACK = { icon: BookOpen, tile: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200", badge: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-200", bar: "bg-gray-400" };

/** FQ-07: "Statistika oddiy tilda" — maqolalar ro'yxati, mavzu bo'yicha filtr. */
export default function Learn() {
  const [params, setParams] = useSearchParams();
  const topic = params.get("topic") ?? "";
  const { data, loading, error, reload } = useApi(() => fetchArticles(topic || undefined), [topic]);
  const topicName = (code: string) => data?.topics.find((t) => t.code === code)?.name ?? "";
  const chip = (active: boolean) =>
    `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm transition-colors ${active ? "bg-blue-600 text-white" : "bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:border-blue-300"}`;

  return (
    <div className="py-2">
      <div className="w-full">
        <PageHeader
          title="Statistika oddiy tilda"
          description="Narxlar, maosh, aholi haqida — oddiy so'zlar bilan, 2 daqiqada o'qiladi. Notanish so'z uchrasa, lug'atga qarang."
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Maqolalar" }]}
          actions={<Link to="/glossary" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Lug'at →</Link>}
        />
        <div className="flex flex-wrap gap-2 mb-6" role="group" aria-label="Mavzu bo'yicha saralash">
          <button type="button" onClick={() => setParams({})} aria-pressed={!topic} className={chip(!topic)}>Barchasi</button>
          {data?.topics.map((t) => {
            const Icon = (TOPIC_STYLE[t.code] ?? FALLBACK).icon;
            return (
              <button key={t.code} type="button" onClick={() => setParams({ topic: t.code })} aria-pressed={topic === t.code} className={chip(topic === t.code)}>
                <Icon className="w-4 h-4" aria-hidden="true" /> {t.name}
              </button>
            );
          })}
        </div>
        {loading && !data ? (
          <Skeleton variant="card" />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : data.results.length === 0 ? (
          <p className="text-gray-500">Bu mavzuda hozircha maqola yo'q.</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {data.results.map((a) => {
              const s = TOPIC_STYLE[a.topic] ?? FALLBACK;
              const Icon = s.icon;
              return (
                <Link key={a.slug} to={`/learn/${a.slug}`}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md hover:border-blue-300 focus-visible:outline focus-visible:outline-2 focus-visible:outline-blue-600">
                  <span className={`h-1.5 w-full ${s.bar}`} aria-hidden="true" />
                  {a.cover && <img src={a.cover} alt="" loading="lazy" className="h-36 w-full object-cover" />}
                  <div className="flex flex-1 flex-col p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <span className={`inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.tile}`}>
                        <Icon className="w-5 h-5" aria-hidden="true" />
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${s.badge}`}>{topicName(a.topic)}</span>
                    </div>
                    <h2 className="text-lg font-semibold leading-snug text-gray-900 dark:text-white group-hover:text-blue-700 dark:group-hover:text-blue-300">{a.title}</h2>
                    <p className="mt-2 flex-1 text-sm leading-relaxed text-gray-600 dark:text-gray-300">{a.summary}</p>
                    <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700 pt-3 text-sm">
                      <span className="inline-flex items-center gap-1 text-gray-500"><Clock className="w-4 h-4" aria-hidden="true" /> {a.reading_minutes} daqiqa</span>
                      <span className="inline-flex items-center gap-1 font-medium text-blue-700 dark:text-blue-300">
                        O'qish <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
