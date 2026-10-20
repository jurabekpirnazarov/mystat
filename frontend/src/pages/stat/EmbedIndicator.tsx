import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { fetchIndicatorCard, type DashboardItem } from "../../api/statPublic";
import IndicatorTile from "../../components/stat/IndicatorTile";

/**
 * JAHON_TAJRIBASI JT-15: boshqa saytlarga `<iframe>` bilan qo'yiladigan ko'rsatkich kartochkasi.
 * Navbar va footer'siz (App.tsx `/embed/` yo'llari uchun), har doim oxirgi ma'lumot va manba havolasi bilan.
 */
export default function EmbedIndicator() {
  const { key = "" } = useParams();
  const [item, setItem] = useState<(DashboardItem & { source: { name: string; url: string } }) | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const ctrl = new AbortController();
    fetchIndicatorCard(key, ctrl.signal).then((d) => { setItem(d); document.title = `${d.name} — my.stat.uz`; })
      .catch(() => !ctrl.signal.aborted && setFailed(true));
    return () => ctrl.abort();
  }, [key]);

  const home = `${window.location.origin}/dashboards`;
  return (
    <div className="p-2 bg-white dark:bg-gray-900 min-h-screen">
      {failed ? (
        <p className="p-4 text-sm text-gray-600">Ko'rsatkich topilmadi. <a href={home} target="_blank" rel="noopener" className="underline">my.stat.uz</a></p>
      ) : !item ? (
        <div className="h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-800" aria-busy="true" />
      ) : (
        <>
          <IndicatorTile item={item} external tall />
          <p className="mt-1 px-1 text-[11px] text-gray-500">
            Manba: <a href={home} target="_blank" rel="noopener" className="underline font-medium">my.stat.uz</a> · {item.source.name}
          </p>
        </>
      )}
    </div>
  );
}
