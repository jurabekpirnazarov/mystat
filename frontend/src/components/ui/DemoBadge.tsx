import { useState } from "react";

export type DataSource = "real" | "synthetic" | "mixed" | null | undefined;

interface DemoBadgeProps {
  /** Faqat true bo'lsa ko'rinadi (backend `is_synthetic` maydoni) */
  show?: boolean;
  label?: string;
  className?: string;
}

const EXPLANATION =
  "Bu raqamlar namuna sifatida yaratilgan va haqiqiy statistika emas. Real ma'lumot ulanganda avtomatik almashtiriladi.";

/** "Namuna ma'lumot" yorlig'i; bosilganda qisqa tushuntirish chiqadi. ISH_REJASI.md S-09. */
export default function DemoBadge({ show = true, label = "Namuna", className = "" }: DemoBadgeProps) {
  const [open, setOpen] = useState(false);
  if (!show) return null;
  return (
    <span className={`relative inline-flex ${className}`}>
      {/* <button> emas: yorliq ko'pincha bosiladigan qator (<button>) ichida turadi — ichma-ich tugma yaroqsiz HTML */}
      <span
        role="button"
        tabIndex={0}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }
        }}
        onBlur={() => setOpen(false)}
        aria-expanded={open}
        title={EXPLANATION}
        className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase tracking-wide cursor-pointer bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300"
      >
        {label}
      </span>
      {open && (
        <span
          role="tooltip"
          className="absolute z-20 top-full left-0 mt-1 w-64 rounded-lg border border-amber-200 dark:border-amber-800 bg-white dark:bg-gray-800 p-3 text-xs font-normal normal-case tracking-normal text-gray-700 dark:text-gray-200 shadow-lg"
        >
          {EXPLANATION}
        </span>
      )}
    </span>
  );
}

/** Agregat javobdagi `data_source` bo'yicha yorliq: "synthetic"/"mixed" bo'lsa chiqadi. */
export function SourceBadge({ source, className = "" }: { source: DataSource; className?: string }) {
  if (source !== "synthetic" && source !== "mixed") return null;
  return <DemoBadge label={source === "mixed" ? "Qisman namuna" : "Namuna"} className={className} />;
}

/** Sahifa yoki asosiy blok to'liq namuna bo'lganda tepada chiqadigan banner. */
export function SampleBanner({ show = true, text }: { show?: boolean; text?: string }) {
  if (!show) return null;
  return (
    <div
      role="note"
      className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 px-4 py-3 text-sm text-amber-900 dark:text-amber-200"
    >
      <span className="mt-0.5 inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold uppercase bg-amber-200/70 dark:bg-amber-800/60">
        Namuna
      </span>
      <p>{text ?? "Bu bo'limdagi ma'lumotlar namuna sifatida ko'rsatilmoqda va haqiqiy statistika emas."}</p>
    </div>
  );
}
