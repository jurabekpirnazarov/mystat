import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CalendarDays } from "lucide-react";
import { fetchDashboards, type Dashboards as Data } from "../../api/statPublic";
import { ApiErrorState, PageHeader, Skeleton } from "../../components/ui";
import IndicatorTile from "../../components/stat/IndicatorTile";
import PopulationClock from "../../components/stat/PopulationClock";
import ShareBar from "../../components/share/ShareBar";

/**
 * JAHON_TAJRIBASI JT-17: mavzuli panellar ("Iqtisodiyot bir qarashda", "Mehnat bozori", "Aholi").
 * Har panel — respublika darajasidagi 4–5 asosiy ko'rsatkich: oxirgi qiymat, o'zgarish, dinamika, manba.
 * Panel URL'da (`/dashboards/labour`), shuning uchun havolani ulashsa shu panel ochiladi.
 */
export default function Dashboards() {
  const { slug } = useParams();
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctrl = new AbortController();
    setError(null);
    fetchDashboards(ctrl.signal).then(setData).catch((e) => !ctrl.signal.aborted && setError(e));
    return () => ctrl.abort();
  }, [attempt]);

  const panels = data?.panels ?? [];
  const current = panels.find((p) => p.slug === slug) ?? panels[0];

  useEffect(() => {
    if (current) document.title = `${current.title} — my.stat.uz`;
  }, [current]);

  return (
    <div className="py-2">
      <div className="w-full">
        <PageHeader
          title="Mavzuli panellar"
          description="Asosiy ko'rsatkichlar bir sahifada: oxirgi qiymat, o'tgan yilga nisbatan o'zgarish va dinamika."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Statistika", to: "/statistics" }, { label: "Mavzuli panellar" }]}
          actions={
            <Link to="/release-calendar" className="inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm hover:border-blue-300">
              <CalendarDays className="w-4 h-4" aria-hidden="true" /> E'lonlar kalendari
            </Link>
          }
        />

        {error ? (
          <ApiErrorState error={error} onRetry={() => setAttempt((a) => a + 1)} />
        ) : !data ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }, (_, i) => <Skeleton key={i} variant="card" />)}
          </div>
        ) : (
          <>
            {data.population_clock && (
              <div className="mb-6"><PopulationClock clock={data.population_clock} /></div>
            )}

            <nav aria-label="Panellar" className="mb-4 flex flex-wrap gap-2">
              {panels.map((p) => (
                <Link key={p.slug} to={`/dashboards/${p.slug}`} aria-current={p.slug === current?.slug ? "page" : undefined}
                  className={`rounded-full px-4 py-1.5 text-sm font-medium border ${p.slug === current?.slug
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-300"}`}>
                  {p.title}
                </Link>
              ))}
            </nav>

            {current && (
              <section aria-labelledby="panel-title">
                <div className="mb-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                  <div>
                    <h2 id="panel-title" className="text-lg font-semibold text-gray-900 dark:text-white">{current.title}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{current.description}</p>
                  </div>
                  <ShareBar title={`${current.title} — asosiy ko'rsatkichlar`} targetRef={panelRef}
                    fileName={`mystat-${current.slug}.png`} year={current.items[0]?.period} compact />
                </div>
                <div ref={panelRef} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {current.items.map((item) => <IndicatorTile key={item.key} item={item} share />)}
                </div>
              </section>
            )}

            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Manba: <a href={data.source.url} target="_blank" rel="noopener noreferrer" className="underline">{data.source.name}</a>, {data.source.license}.
              Respublika bo'yicha qiymatlar. Har bir kartochkadan ko'rsatkichni hududlar kesimida ochish mumkin.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
