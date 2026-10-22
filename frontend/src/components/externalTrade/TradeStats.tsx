import { useEffect, useState } from "react";
import { CalendarRange, Database, Globe2, Package } from "lucide-react";
import { fetchTradeSummary, type TradeSummary } from "../../api/tradeHub";
import StatCard from "../ui/StatCard";
import DataQualityNote from "./DataQualityNote";

const nf = (n: number) => new Intl.NumberFormat("ru-RU").format(n);

/**
 * TI-03: raqamlar qatori. Hamma raqam API'dan (`/external-trade/summary/`), qattiq yozilgan raqam yo'q;
 * ostida manba va oxirgi yangilanish (ma'lumot davri).
 */
export default function TradeStats({ showQuality = false }: { showQuality?: boolean }) {
  const [data, setData] = useState<TradeSummary | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    fetchTradeSummary().then((d) => alive && setData(d)).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, []);
  if (failed) return null;

  return (
    <section aria-label="Ma'lumotlar bazasi">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Savdo yozuvlari" value={data ? nf(data.records) : "—"} icon={Database} hint="mahsulot × davlat × davr" />
        <StatCard label="HS kodlari" value={data ? nf(data.products) : "—"} icon={Package} hint="savdosi qayd etilgan" />
        <StatCard label="Davlatlar" value={data ? nf(data.countries) : "—"} icon={Globe2} hint="eksport yoki import bor" />
        <StatCard label="Davr" value={data ? `${data.year_from}–${data.year_to}` : "—"} icon={CalendarRange}
          hint={data ? `${data.years_count} yil ma'lumoti bor` : undefined} />
      </div>
      {data && (
        <p className="mt-2 text-xs text-mg-muted">
          Manba: {data.source}. Oxirgi yangilanish: {data.latest.year}-yil {data.latest.period_label} ma'lumoti.
        </p>
      )}
      {showQuality && data && <div className="mt-3"><DataQualityNote notes={Object.values(data.quality)} /></div>}
    </section>
  );
}
