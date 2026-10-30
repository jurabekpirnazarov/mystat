import { useState } from "react";
import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import IconChip from "./IconChip";

export interface LinkGridItem {
  to: string;
  label: string;
  /** Havola yonidagi son (masalan, shu mavzudagi ko'rsatkichlar) */
  count?: number | null;
  icon?: LucideIcon;
}

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(n).replace(/,/g, " ");

/** LX-05: matnli havolalar to'ri (3/2/1 ustun), dastlab `initial` ta, "Hammasini ochish" (`aria-expanded`). Plitka va ikonka yo'q. */
export default function LinkGrid({ items, initial = 12, id, expandLabel = "Hammasini ochish", collapseLabel = "Yig'ish" }: {
  items: LinkGridItem[]; initial?: number; id: string; expandLabel?: string; collapseLabel?: string;
}) {
  const [open, setOpen] = useState(false);
  const shown = open ? items : items.slice(0, initial);
  return (
    <div>
      <ul id={id} className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3" data-density="list">
        {shown.map((i) => (
          <li key={i.to + i.label} className="border-b border-mg-border">
            <Link to={i.to} className="flex min-h-[44px] items-center justify-between gap-3 py-2 text-[15px] leading-snug text-mg-primary hover:underline">
              <span className="flex items-center gap-3">{i.icon && <IconChip icon={i.icon} size="sm" />}{i.label}</span>
              {typeof i.count === "number" && <span className="tnum shrink-0 text-sm text-mg-muted">{fmt(i.count)}</span>}
            </Link>
          </li>
        ))}
      </ul>
      {items.length > initial && (
        <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open} aria-controls={id}
          className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-mg-primary hover:underline">
          {open ? collapseLabel : `${expandLabel} (${items.length})`}
        </button>
      )}
    </div>
  );
}
