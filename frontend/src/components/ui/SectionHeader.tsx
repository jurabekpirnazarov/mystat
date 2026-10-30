import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

/** GV-01: har blok bir xil sarlavha + o'ngda manzilini aytadigan "Barcha …" havolasi (umumiy "Batafsil" taqiqlanadi). */
export default function SectionHeader({ id, title, description, moreHref, moreLabel, badge, accent = false }: {
  id?: string; title: string; description?: string; moreHref?: string; moreLabel?: string; badge?: ReactNode;
  /** Sarlavha oldida aksent chiziq (ommaviy bosh sahifa) */
  accent?: boolean;
}) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-x-4 gap-y-1">
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-3 text-[20px] font-semibold leading-8 text-mg-heading sm:text-[24.5px] sm:leading-9">{accent && <span className="h-6 w-1 rounded-full bg-[rgb(var(--ds-accent))]" aria-hidden="true" />}{title}{badge}</h2>
        {description && <p className="mt-1 text-sm text-mg-muted">{description}</p>}
      </div>
      {moreHref && moreLabel && (
        <Link to={moreHref} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-mg-heading hover:text-mg-primary">
          {moreLabel} <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </Link>
      )}
    </div>
  );
}
