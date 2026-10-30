import type { LucideIcon } from "lucide-react";

/** Harakat kartasi: ikonka + sarlavha + 1 jumla + bitta fe'lli tugma. */
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
      <a href={href} className="inline-flex min-h-[44px] items-center justify-center rounded-xl bg-mg-primary px-5 text-sm font-semibold text-[rgb(var(--ds-on-primary))] hover:bg-mg-primary-dark">
        {actionLabel}
      </a>
    </div>
  );
}
