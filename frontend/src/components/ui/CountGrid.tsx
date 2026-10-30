import { Link } from "react-router-dom";
import type { LucideIcon } from "lucide-react";
import IconChip from "./IconChip";

export interface CountItem {
  label: string;
  /** null — hali yuklanmoqda: "0" emas, yuklanish belgisi ko'rsatiladi (GV-03, X-1) */
  value: number | null;
  to: string;
  icon?: LucideIcon;
}

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(n).replace(/,/g, " ");

/** LX-07: hisoblagichlar to'ri, har biri filtrlangan sahifaga havola. Faqat API qaytargan haqiqiy son. */
export default function CountGrid({ items, narrow = false }: { items: CountItem[]; /** Yarim kenglikdagi ustun uchun: 4 emas, 2 ustun */ narrow?: boolean }) {
  return (
    <ul className={`grid gap-x-8 sm:grid-cols-2 ${narrow ? "" : "lg:grid-cols-4"}`}>
      {items.map((i) => (
        <li key={i.label} className="border-b border-mg-border">
          <Link to={i.to} className="flex min-h-[44px] items-center justify-between gap-3 py-2 text-[15px] text-mg-text hover:text-mg-primary">
            <span className="flex items-center gap-3">{i.icon && <IconChip icon={i.icon} size="sm" />}{i.label}</span>
            {i.value === null
              ? <span className="inline-block h-4 w-12 animate-pulse rounded bg-gray-200 dark:bg-gray-700" role="status" aria-label="Yuklanmoqda" />
              : <span className="tnum font-bold text-mg-heading">{fmt(i.value)}</span>}
          </Link>
        </li>
      ))}
    </ul>
  );
}
