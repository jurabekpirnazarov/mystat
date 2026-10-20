import { useState } from "react";
import { Link } from "react-router-dom";
import type { CompanyScoreShort } from "../../api/companyScores";
import { KLASS_STYLE } from "./klassStyle";

const HATCH = "repeating-linear-gradient(45deg, transparent 0 3px, rgba(107,114,128,.35) 3px 4px)";

interface Props {
  score: CompanyScoreShort | null | undefined;
  /** "sm" — jadval ichida, "md" — sarlavhada */
  size?: "sm" | "md";
  className?: string;
  /** false — tugma yoki havola ichida: fokus va tooltip yo'q (ichma-ich interaktiv element bo'lmasin) */
  interactive?: boolean;
  /** KR-46: badge korxona profiliga havola (`/company/:stir`) */
  to?: string;
  /** Ball yo'q (`null`) bo'lsa ham "—" chiqsin: tooltip'dagi sabab ("Hali hisoblanmagan") */
  emptyReason?: string;
}

/**
 * KORXONA_SCORING.md 6-bo'lim, 13.1: sinf harfi rangli doirachada + ball ("B · 63") — bepul umumiy ball. Ustiga olib
 * borilganda (yoki fokusda) sinf nomi, "Ball nimaga asoslangan: profilda, 1 StatCoin" va "Namuna" izohi. Ustunlar
 * ro'yxatlarga kelmaydi (KR-39). To'liqlik < 0.6 — kulrang "—" va "Ma'lumot yetarli emas".
 * `undefined` — yuklanmoqda, `null` — ball yo'q (`emptyReason` berilmasa badge chiqmaydi).
 */
export default function CompanyScoreBadge({ score, size = "sm", className = "", interactive = true, to, emptyReason }: Props) {
  const [open, setOpen] = useState(false);
  if (score === undefined) return <span className={`inline-block h-5 w-12 animate-pulse rounded-full bg-gray-200 dark:bg-gray-700 ${className}`} aria-hidden="true" />;
  if (score === null && !emptyReason) return null;
  const klass = score?.klass || "none";
  const st = KLASS_STYLE[klass];
  const none = klass === "none";
  const label = !score ? emptyReason! : none ? "Ma'lumot yetarli emas" : `${score.klass} · ${score.klass_name}, ball ${Math.round(score.overall ?? 0)} / 100`;
  const tip = interactive || !!to;

  const chip = (
    <span className={`inline-flex items-center gap-1 rounded-full border border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800 pr-2 ${size === "md" ? "text-sm" : "text-xs"} tabular-nums whitespace-nowrap`}>
      <span className={`inline-flex items-center justify-center rounded-full font-bold ${st.bg} ${st.text} ${size === "md" ? "h-6 w-6" : "h-5 w-5"}`}
        style={none ? { backgroundImage: HATCH } : undefined}>
        {none ? "—" : score!.klass}
      </span>
      <span className="font-medium text-gray-800 dark:text-gray-100">{none ? "—" : Math.round(score!.overall ?? 0)}</span>
      {score?.partial && <span className="text-amber-600" title="Qisman ma'lumot">*</span>}
      {score?.is_synthetic && <span className="rounded px-1 text-[10px] font-semibold uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">N</span>}
    </span>
  );
  const aria = `Korxona bali: ${label}${score?.is_synthetic ? " (namuna)" : ""}`;
  const handlers = { onFocus: () => setOpen(true), onBlur: () => setOpen(false) };

  return (
    <span className={`relative inline-flex ${className}`} onMouseEnter={() => tip && setOpen(true)} onMouseLeave={() => setOpen(false)}>
      {to ? (
        <Link to={to} aria-label={`${aria}. Profilni ochish`} className="rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500" {...handlers}>{chip}</Link>
      ) : (
        <span tabIndex={interactive ? 0 : undefined} role="img" aria-label={aria} {...(interactive ? handlers : {})}>{chip}</span>
      )}
      {open && tip && (
        <span role="tooltip" className="absolute z-30 top-full left-0 mt-1 w-60 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 text-xs text-gray-700 dark:text-gray-200 shadow-lg">
          <span className="block font-semibold">{label}</span>
          {score && !none && <span className="mt-1 block text-gray-600 dark:text-gray-300">Ball nimaga asoslangan: profilda, 1 StatCoin.</span>}
          {score?.is_synthetic && <span className="mt-2 block text-amber-700 dark:text-amber-300">Namuna: ball sintetik ko'rsatkichlardan, haqiqiy statistika emas.</span>}
          {score && <span className="mt-1 block text-gray-400">Taxminiy baho, rasmiy baho emas.</span>}
        </span>
      )}
    </span>
  );
}
