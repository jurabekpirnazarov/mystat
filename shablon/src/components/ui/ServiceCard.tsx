import { Star, type LucideIcon } from "lucide-react";

/** Xizmat kartochkasi (ro'yxat ko'rinishi): ikonka, nom, raqam va qisqa ko'rsatkichlar. */
export default function ServiceCard({ icon: Icon, title, number, meta, href = "#" }: {
  icon: LucideIcon; title: string; number: number; meta: string; href?: string;
}) {
  return (
    <a href={href} className="relative flex min-h-[95px] items-center gap-4 rounded-mg border border-mg-border bg-mg-surface px-5 py-4 transition hover:border-mg-primary/40 hover:shadow-sm">
      <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[10px] bg-[rgb(var(--ds-panel))] text-[rgb(var(--ds-on-panel-muted))]">
        <Icon className="h-7 w-7" strokeWidth={1.5} aria-hidden="true" />
      </span>
      <span className="min-w-0">
        <span className="block text-[15px] font-semibold text-mg-heading">{title}</span>
        <span className="mt-1 block text-xs text-mg-muted">{meta}</span>
      </span>
      <span className="absolute right-3 top-2 text-[11px] text-mg-muted">#{number}</span>
      <Star className="absolute bottom-3 right-3 h-4 w-4 text-mg-muted" aria-hidden="true" />
    </a>
  );
}
