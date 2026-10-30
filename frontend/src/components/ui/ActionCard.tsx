import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";

/** GV-02: ikonka + sarlavha (1–3 so'z) + 1 jumla + bitta fe'lli tugma. Bosiladigan joy — tugma. */
export default function ActionCard({ icon: Icon, title, text, actionLabel, href }: {
  icon: LucideIcon; title: string; text: string; actionLabel: string; href: string;
}) {
  return (
    <div className="flex h-full flex-col gap-3 rounded-mg border border-mg-border bg-mg-surface p-5">
      <span className="flex h-12 w-12 items-center justify-center rounded-[10px] bg-[rgb(var(--ds-panel))] text-[rgb(var(--ds-on-panel-muted))]">
        <Icon className="h-6 w-6" strokeWidth={1.6} aria-hidden="true" />
      </span>
      <h3 className="text-lg font-semibold text-mg-heading">{title}</h3>
      <p className="flex-1 text-sm leading-relaxed text-mg-muted">{text}</p>
      <Link to={href} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-mg-primary px-5 text-sm font-semibold text-white hover:opacity-90">
        {actionLabel}
      </Link>
    </div>
  );
}
