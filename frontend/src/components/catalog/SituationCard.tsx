import { Link } from "react-router-dom";
import { SITUATIONS } from "../../config/situations";
import { useLang } from "../../i18n/LangContext";

/** Vaziyat kartochkasi (bosh sahifa va `/situations`): ikonka och ko'k kvadratda + nom — my.gov.uz uslubida. */
export default function SituationCard({ slug }: { slug: string }) {
  const { t } = useLang();
  const s = SITUATIONS.find((x) => x.slug === slug)!;
  const Icon = s.icon;
  return (
    <Link to={`/situations/${s.slug}`}
      className="flex min-h-[95px] items-center gap-4 rounded-mg border border-mg-border bg-mg-surface px-5 py-4 transition hover:border-mg-primary/40 hover:shadow-sm">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-mg-info text-mg-primary">
        <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="text-[15px] font-semibold text-black dark:text-white">{t(s.title)}</span>
    </Link>
  );
}

