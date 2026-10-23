import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";
import { SPHERES } from "../../config/spheres";
import { featuredOfSphere } from "../../config/serviceCatalog";
import { useLang } from "../../i18n/LangContext";

/**
 * Ixcham "Sohalar" to'ri: kartochka tepasida ikonka-belgi va soha nomi (butun sarlavha havola, strelka bilan),
 * ostida 2 ta xizmat nozik chiziqlar bilan ajratilgan qatorlarda. Hover'da kartochka chegarasi va ikonka brend rangiga o'tadi.
 */
export default function SpheresGrid() {
  const { t } = useLang();
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
      {SPHERES.map((sp) => {
        const Icon = sp.icon;
        return (
          <article key={sp.id}
            className="group flex flex-col rounded-[12px] border border-[rgb(var(--ds-panel-line))] bg-mg-surface p-4 transition hover:border-[rgb(var(--ds-brand))] hover:shadow-mg-card">
            <Link to={`/spheres/${sp.id}`} className="flex items-center gap-3 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[rgb(var(--ds-brand))]">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] bg-[rgb(var(--ds-panel))] text-[rgb(var(--ds-on-panel))] transition group-hover:bg-[rgb(var(--ds-brand))] group-hover:text-white" aria-hidden="true">
                <Icon className="h-5 w-5" strokeWidth={1.7} />
              </span>
              <h3 className="flex-1 text-[15px] font-semibold leading-tight text-mg-heading">{t(sp.title)}</h3>
              <ArrowUpRight className="h-4 w-4 shrink-0 text-mg-muted opacity-0 transition group-hover:opacity-100" aria-hidden="true" />
            </Link>
            <ul className="mt-3 divide-y divide-[rgb(var(--ds-panel-line))]/60 border-t border-[rgb(var(--ds-panel-line))]/60">
              {featuredOfSphere(sp.id).map((s) => (
                <li key={s.number}>
                  <Link to={`/service/${s.number}`} className="block py-2 text-[14px] leading-snug text-mg-text hover:text-mg-primary hover:underline">{t(s.title)}</Link>
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
