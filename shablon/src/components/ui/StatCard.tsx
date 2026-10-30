import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";

/** Ko'rsatkich kartochkasi: nom, katta raqam, o'zgarish foizi va manba izohi. */
export default function StatCard({ label, value, icon: Icon, change, hint }: {
  label: string; value: ReactNode; icon?: LucideIcon; change?: number; hint?: string;
}) {
  const tone = change === undefined ? "" : change >= 0 ? "text-[rgb(var(--ds-success))]" : "text-[rgb(var(--ds-danger))]";
  return (
    <div className="rounded-mg border border-mg-border bg-mg-surface p-5">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm text-mg-muted">{label}</p>
          <p className="mt-1 whitespace-nowrap text-[28px] font-bold leading-8 tabular-nums text-mg-heading">{value}</p>
        </div>
        {Icon && (
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-mg-info text-mg-primary">
            <Icon className="h-5 w-5" aria-hidden="true" />
          </span>
        )}
      </div>
      <p className="mt-2 min-h-[20px] text-xs text-mg-muted">
        {change !== undefined && <span className={`mr-1 font-semibold ${tone}`}>{change >= 0 ? "+" : ""}{change.toFixed(1)}%</span>}
        {hint}
      </p>
    </div>
  );
}
