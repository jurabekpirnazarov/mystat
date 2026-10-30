import { useEffect } from "react";
import { Link } from "react-router-dom";
import { SERVICES } from "../../config/serviceCatalog";
import { SPHERES } from "../../config/spheres";
import { NAV_GROUPS } from "../../config/navigation";
import { PUBLIC_MENU } from "../../config/publicMenu";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

const PUBLIC_V2 = import.meta.env.VITE_PUBLIC_V2 === "1";

/** MG-09: `/sitemap` — portal xaritasi, katalog va navigatsiyadan avtomatik. */
export default function Sitemap() {
  const { t } = useLang();
  useEffect(() => {
    document.title = `${t(UI.sitemap)} — my.stat.uz`;
  }, [t]);
  return (
    <div>
      <h1 className="text-[28px] font-semibold text-mg-primary">{t(UI.sitemap)}</h1>
      <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {/* LX-12: to'liq xarita `MainNav` bilan bir xil manbadan (config/publicMenu.ts) */}
        {PUBLIC_V2 && PUBLIC_MENU.map((g, i) => (
          <section key={`pm-${i}`} className="rounded-mg bg-mg-surface p-5">
            <h2 className="font-bold text-mg-heading">{g.to ? <Link to={g.to} className="hover:text-mg-primary">{t(g.label)}</Link> : t(g.label)}</h2>
            <ul className="mt-2 space-y-1">
              {(g.groups ?? []).flatMap((x) => x.links).map((l) => <li key={l.to + t(l.label)}><Link to={l.to} className="text-sm text-mg-primary hover:underline">{t(l.label)}</Link></li>)}
            </ul>
          </section>
        ))}
        {!PUBLIC_V2 && NAV_GROUPS.map((g) => (
          <section key={g.id} className="rounded-mg bg-mg-surface p-5">
            <h2 className="font-bold text-mg-heading">{t(g.label)}</h2>
            <ul className="mt-2 space-y-1">
              {g.items.map((i) => <li key={i.to}><Link to={i.to} className="text-sm text-mg-primary hover:underline">{t(i.label)}</Link></li>)}
            </ul>
          </section>
        ))}
        {SPHERES.map((sp) => (
          <section key={sp.id} className="rounded-mg bg-mg-surface p-5">
            <h2 className="font-bold text-mg-heading"><Link to={`/spheres/${sp.id}`} className="hover:text-mg-primary">{t(sp.title)}</Link></h2>
            <ul className="mt-2 space-y-1">
              {SERVICES.filter((s) => s.sphere === sp.id).map((s) => (
                <li key={s.number} className="text-sm">
                  <span className="text-mg-muted">#{s.number} </span>
                  {s.status === "live"
                    ? <Link to={`/service/${s.number}`} className="text-mg-primary hover:underline">{t(s.title)}</Link>
                    : <span className="text-mg-muted">{t(s.title)} ({t(UI.soon)})</span>}
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
