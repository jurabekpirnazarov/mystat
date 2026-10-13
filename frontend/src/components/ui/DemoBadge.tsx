interface DemoBadgeProps {
  /** Faqat true bo'lsa ko'rinadi (backend `is_synthetic` maydoni) */
  show?: boolean;
  label?: string;
  className?: string;
}

/** Sintetik (demo) ma'lumot belgisi. ISH_REJASI.md S-09. */
export default function DemoBadge({ show = true, label = "Demo", className = "" }: DemoBadgeProps) {
  if (!show) return null;
  return (
    <span
      title="Sintetik ma'lumot — faqat lokal/dev muhitida"
      className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300 ${className}`}
    >
      {label}
    </span>
  );
}
