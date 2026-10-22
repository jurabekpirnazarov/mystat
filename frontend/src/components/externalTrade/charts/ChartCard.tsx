import { useRef, type ReactNode } from "react";
import { BarChart3 } from "lucide-react";
import ShareBar from "../../share/ShareBar";
import EmptyState from "../../ui/EmptyState";

/**
 * TI-09: tashqi savdo grafiklari uchun yagona o'ram — sarlavha, bir xil balandlik, ostida manba va davr,
 * `ShareBar` (havola, iqtibos, PNG) va bo'sh holat. Sintetik namuna bo'lsa "Namuna" belgisi.
 */
export default function ChartCard({ title, source, empty, height = 288, fileName, year, children, className = "" }: {
  title: string;
  /** "Manba: ... · davr" qatori */
  source?: string;
  empty?: boolean;
  height?: number;
  fileName?: string;
  year?: string;
  children: ReactNode;
  className?: string;
}) {
  const ref = useRef<HTMLElement>(null);
  return (
    <section ref={ref} aria-label={title} className={`rounded-mg border border-mg-border bg-mg-surface p-4 sm:p-5 ${className}`}>
      <h3 className="mb-3 text-base font-semibold text-mg-heading">{title}</h3>
      {empty ? (
        <EmptyState icon={BarChart3} title="Ma'lumot yo'q" description="Tanlangan parametrlar bo'yicha grafik chizib bo'lmadi." />
      ) : (
        <div style={{ height }}>{children}</div>
      )}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        {source && <p className="text-xs text-mg-muted">{source}</p>}
        <ShareBar title={title} targetRef={ref} fileName={fileName ?? title} year={year} compact />
      </div>
    </section>
  );
}
