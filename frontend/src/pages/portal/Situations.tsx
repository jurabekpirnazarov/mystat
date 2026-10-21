import { useEffect } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { SITUATIONS } from "../../config/situations";
import { serviceByNumber } from "../../config/serviceCatalog";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import ServiceCard from "../../components/catalog/ServiceCard";
import SituationCard from "../../components/catalog/SituationCard";
import { useServiceStats } from "../../components/catalog/useServiceStats";

/** `/situations` va `/situations/:slug` — vaziyatlar ro'yxati va vaziyatdagi xizmatlar ketma-ketligi. */
export default function Situations() {
  const { slug } = useParams();
  const { t } = useLang();
  const { items: stats } = useServiceStats();
  const situation = slug ? SITUATIONS.find((s) => s.slug === slug) : undefined;

  useEffect(() => {
    document.title = `${situation ? t(situation.title) : t(UI.situations)} — my.stat.uz`;
  }, [situation, t]);

  if (slug && !situation) return <Navigate to="/situations" replace />;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-6">
        <ol className="flex flex-wrap items-center gap-2 text-sm">
          <li><Link to="/" className="text-mg-primary hover:underline">{t(UI.home)}</Link></li>
          <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" aria-hidden="true" />
            {situation ? <Link to="/situations" className="text-mg-primary hover:underline">{t(UI.situations)}</Link> : <span aria-current="page">{t(UI.situations)}</span>}
          </li>
          {situation && <li className="flex items-center gap-2"><ChevronRight className="h-4 w-4" aria-hidden="true" /><span aria-current="page">{t(situation.title)}</span></li>}
        </ol>
      </nav>
      {situation ? (
        <>
          <h1 className="text-[28px] font-semibold text-mg-primary">{t(situation.title)}</h1>
          <p className="mt-2 max-w-3xl text-mg-text">{t(situation.description)}</p>
          <ol className="mt-6 grid gap-4 md:grid-cols-2">
            {situation.services.map((n, i) => {
              const s = serviceByNumber(n);
              return s ? (
                <li key={n} className="relative">
                  <span className="absolute -left-2 -top-2 z-10 flex h-7 w-7 items-center justify-center rounded-full bg-mg-primary text-xs font-bold text-white">{i + 1}</span>
                  <ServiceCard s={s} stats={stats[n]} />
                </li>
              ) : null;
            })}
          </ol>
        </>
      ) : (
        <>
          <h1 className="text-[28px] font-semibold text-mg-primary">{t(UI.situations)}</h1>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {SITUATIONS.map((s) => <SituationCard key={s.slug} slug={s.slug} />)}
          </div>
        </>
      )}
    </div>
  );
}
