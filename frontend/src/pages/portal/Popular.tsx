import { useEffect } from "react";
import { POPULAR } from "../../config/serviceCatalog";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import ServiceCard from "../../components/catalog/ServiceCard";
import { useServiceStats } from "../../components/catalog/useServiceStats";
import DemoBadge from "../../components/ui/DemoBadge";

/** `/popular` — "Ommabop xizmatlar" (sidebar'dagi birinchi band, my.gov.uz `/uz/popular` ga mos). */
export default function Popular() {
  const { t } = useLang();
  const { items: stats, isSample } = useServiceStats();
  useEffect(() => {
    document.title = `${t(UI.popular)} — my.stat.uz`;
  }, [t]);
  return (
    <div>
      <h1 className="flex items-center gap-3 text-[28px] font-semibold text-mg-primary">{t(UI.popular)} <DemoBadge show={isSample} /></h1>
      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {POPULAR.map((s) => <ServiceCard key={s.number} s={s} stats={stats[s.number]} />)}
      </div>
    </div>
  );
}
