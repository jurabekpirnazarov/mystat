import type { ReactNode } from "react";
import { ArrowRight } from "lucide-react";

/** Bo'lim sarlavhasi: H2 + ixtiyoriy izoh + o'ngda manzilini aytadigan "Barcha ..." havolasi. */
export default function SectionHeader({ id, title, description, moreHref, moreLabel, badge }: {
  id?: string; title: string; description?: string; moreHref?: string; moreLabel?: string; badge?: ReactNode;
}) {
  return (
    <div className="mb-5 flex items-end justify-between gap-4">
      <div className="min-w-0">
        <h2 id={id} className="flex items-center gap-3 text-[24.5px] font-semibold leading-9 text-mg-heading">{title}{badge}</h2>
        {description && <p className="mt-1 text-sm text-mg-muted">{description}</p>}
      </div>
      {moreHref && moreLabel && (
        <a href={moreHref} className="inline-flex shrink-0 items-center gap-2 text-sm font-medium text-mg-heading hover:text-mg-primary">
          {moreLabel} <ArrowRight className="h-5 w-5" aria-hidden="true" />
        </a>
      )}
    </div>
  );
}
