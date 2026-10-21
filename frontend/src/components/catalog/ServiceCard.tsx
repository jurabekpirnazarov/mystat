import { Link } from "react-router-dom";
import { CheckCircle2, Clock, Star } from "lucide-react";
import type { ServiceShortStats } from "../../api/portal";
import type { ServiceCatalogItem } from "../../config/serviceCatalog";
import { sphereById } from "../../config/spheres";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import FavoriteServiceButton from "./FavoriteServiceButton";
import { compactNumber } from "./useServiceStats";

/**
 * my.gov.uz xizmat kartochkasi (MG-00, soha va qidiruv sahifalari): o'ng yuqorida `#raqam`, chapda doira ichida ikonka,
 * nom, pastida reyting · foydalanish soni · bajarish vaqti, o'ng pastda yulduzcha.
 */
export default function ServiceCard({ s, stats }: { s: ServiceCatalogItem; stats?: ServiceShortStats }) {
  const { t } = useLang();
  const sphere = sphereById(s.sphere)!;
  const Icon = s.icon;
  const soon = s.status === "soon";
  const body = (
    <>
      <span className="absolute right-3 top-2 text-xs text-mg-muted">#{s.number}</span>
      <span className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-full border border-mg-border ${sphere.tint}`}>
        <Icon className="h-6 w-6" aria-hidden="true" />
      </span>
      <span className="min-w-0 flex-1 py-3 pr-6">
        {soon
          ? <span className="block text-[15px] font-semibold leading-snug text-black dark:text-white">{t(s.title)}</span>
          : (
            <Link to={`/service/${s.number}`}
              className="block text-[15px] font-semibold leading-snug text-black before:absolute before:inset-0 before:rounded-mg before:content-[''] group-hover:text-mg-primary dark:text-white">
              {t(s.title)}
            </Link>
          )}
        <span className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-mg-text">
          {soon && <span className="rounded bg-amber-50 px-1.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/30 dark:text-amber-200">{t(UI.soon)}</span>}
          {stats?.rating != null && (
            <span className="inline-flex items-center gap-1" title={t({ uz: "Reyting", ru: "Рейтинг" })}>
              <Star className="h-3.5 w-3.5 text-mg-muted" aria-hidden="true" />{stats.rating.toFixed(2).replace(/0$/, "")}
            </span>
          )}
          {!!stats?.usage && (
            <span className="inline-flex items-center gap-1" title={t({ uz: "Foydalanishlar soni", ru: "Количество использований" })}>
              <CheckCircle2 className="h-3.5 w-3.5 text-mg-muted" aria-hidden="true" />{compactNumber(stats.usage)}
            </span>
          )}
          <span className="inline-flex items-center gap-1" title={t({ uz: "Bajarish vaqti", ru: "Время выполнения" })}>
            <Clock className="h-3.5 w-3.5 text-mg-muted" aria-hidden="true" />{t(s.duration)}
          </span>
        </span>
      </span>
      <span className="absolute bottom-2 right-2 z-10">
        <FavoriteServiceButton number={s.number} title={t(s.title)} />
      </span>
    </>
  );
  return (
    <div className={`group relative flex min-h-[118px] items-center gap-4 rounded-mg border border-mg-border bg-mg-surface px-4 py-2 transition hover:border-mg-primary/40 hover:shadow-sm ${soon ? "opacity-80" : ""}`}>
      {body}
    </div>
  );
}
