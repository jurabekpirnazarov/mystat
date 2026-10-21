import { useEffect } from "react";
import { Link } from "react-router-dom";
import { POPULAR, SERVICES } from "../../config/serviceCatalog";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import Banner from "../../components/Banner";
import HomeHighlights from "../../components/home/HomeHighlights";
import { useServiceStats } from "../../components/catalog/useServiceStats";
import DemoBadge from "../../components/ui/DemoBadge";
import Statistics from "../Statistics";

/** Portal statistikasi: eng ko'p ishlatilgan 10 xizmat (MG-10 hisoblagichidan). */
function TopServices() {
  const { t } = useLang();
  const { items, isSample } = useServiceStats();
  const rows = SERVICES.filter((s) => s.status === "live" && items[s.number]?.usage)
    .sort((a, b) => items[b.number].usage - items[a.number].usage).slice(0, 10);
  const list = rows.length ? rows : POPULAR.slice(0, 10);
  const max = Math.max(1, ...list.map((s) => items[s.number]?.usage ?? 0));
  return (
    <section aria-labelledby="top-services" className="rounded-mg bg-mg-surface p-6">
      <h2 id="top-services" className="flex items-center gap-3 text-xl font-semibold text-mg-heading">
        {t({ uz: "Eng ko'p foydalanilgan xizmatlar", ru: "Самые используемые услуги" })} <DemoBadge show={isSample} />
      </h2>
      <ol className="mt-4 space-y-3">
        {list.map((s, i) => {
          const n = items[s.number]?.usage ?? 0;
          return (
            <li key={s.number} className="grid grid-cols-[1.5rem_1fr_auto] items-center gap-3 text-sm">
              <span className="text-mg-muted">{i + 1}</span>
              <span>
                <Link to={`/service/${s.number}`} className="font-medium text-mg-primary hover:underline">#{s.number} {t(s.title)}</Link>
                <span className="mt-1 block h-2 rounded-full bg-mg-info">
                  <span className="block h-full rounded-full bg-mg-primary" style={{ width: `${(100 * n) / max}%` }} />
                </span>
              </span>
              <span className="tabular-nums text-mg-text">{n.toLocaleString("ru-RU")}</span>
            </li>
          );
        })}
      </ol>
    </section>
  );
}

/**
 * MG-13: "Statistika" sahifasi. 1-etapda bosh sahifada bo'lgan bloklar shu yerga o'zgarishsiz ko'chdi: banner
 * (jonli aholi soni, portal faoliyati) va "O'zbekiston raqamlarda". Pastda — xizmatlar bo'yicha foydalanish va
 * mavjud portal statistikasi (foydalanuvchilar, oylik grafik).
 */
export default function StatisticsHub() {
  const { t } = useLang();
  useEffect(() => {
    document.title = `${t(UI.statistics)} — my.stat.uz`;
  }, [t]);
  return (
    <div className="space-y-10">
      <h1 className="text-[28px] font-semibold text-mg-primary">{t(UI.statistics)}</h1>
      <div className="overflow-hidden rounded-mg"><Banner /></div>
      <HomeHighlights />
      <TopServices />
      <div className="overflow-hidden rounded-mg"><Statistics /></div>
    </div>
  );
}
