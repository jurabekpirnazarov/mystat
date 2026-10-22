import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { SPHERES } from "../../config/spheres";
import { featuredOfSphere } from "../../config/serviceCatalog";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

/**
 * MG-05: "Sohalar" to'ri — har kartochkada soha nomi, 2 ta xizmat (nuqtali ro'yxat), "› Barchasi" va o'ng pastda
 * och doira ichidagi soha ikonkasi (MG-00 dagi my.gov.uz kartochkasi).
 */
export default function SpheresGrid() {
  const { t } = useLang();
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
      {SPHERES.map((sp) => {
        const Icon = sp.icon;
        return (
          <article key={sp.id} className="relative flex min-h-[260px] flex-col rounded-mg bg-mg-surface p-5">
            <h3 className="mb-4 text-[22px] font-bold leading-[30px] text-black dark:text-white">
              <Link to={`/spheres/${sp.id}`} className="hover:text-mg-primary">{t(sp.title)}</Link>
            </h3>
            <ul className="flex-1 space-y-3.5 pr-16">
              {featuredOfSphere(sp.id).map((s) => (
                <li key={s.number} className="flex gap-2 text-[17px] font-medium leading-snug">
                  <span className="text-black dark:text-white" aria-hidden="true">•</span>
                  <Link to={`/service/${s.number}`} className="text-mg-primary-dark hover:underline">{t(s.title)}</Link>
                </li>
              ))}
            </ul>
            <Link to={`/spheres/${sp.id}`} className="mt-4 inline-flex items-center gap-1 pl-1 text-base font-semibold text-mg-primary-dark hover:underline">
              <ChevronRight className="h-5 w-5" aria-hidden="true" />{t(UI.all)}
            </Link>
            <span className={`absolute bottom-5 right-4 flex h-20 w-20 items-center justify-center rounded-full border border-mg-border opacity-70 ${sp.tint}`} aria-hidden="true">
              <Icon className="h-9 w-9" strokeWidth={1.5} />
            </span>
          </article>
        );
      })}
    </div>
  );
}
