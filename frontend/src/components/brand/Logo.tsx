import { useId } from "react";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

/**
 * my.stat.uz portal belgisi (docs/LOGO.md). my.gov.uz oilasiga mos: ustma-ust kartochkalar ("xizmatlar portali"),
 * old kartochkada o'suvchi uchta ustun (statistika; qo'mitaning UZSTAT emblemidagi ustunlar bilan davomiylik).
 * Ranglar davlat bayrog'idan: ko'k (old kartochka), oq ajratuvchi chiziq, yashil (orqa kartochka).
 * `tone="light"` — och fonda (rangli), `tone="dark"` — ko'k fonda (oq; sidebar, PWA ikonka).
 */
export function LogoMark({ size = 40, tone = "light", className = "" }: { size?: number; tone?: "light" | "dark"; className?: string }) {
  const id = useId().replace(/:/g, "");
  const dark = tone === "dark";
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" className={className} role="img" aria-hidden="true">
      <defs>
        <linearGradient id={`f${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#1A7BF0" />
          <stop offset="1" stopColor="#0058C2" />
        </linearGradient>
        <linearGradient id={`b${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#2CC84D" />
          <stop offset="1" stopColor="#1A9E3F" />
        </linearGradient>
      </defs>
      <rect x="13" y="3" width="24" height="24" rx="6.5" fill={dark ? "#FFFFFF" : `url(#b${id})`} fillOpacity={dark ? 0.45 : 1} />
      <rect x="3" y="11" width="26" height="26" rx="7" fill={dark ? "#FFFFFF" : `url(#f${id})`} stroke={dark ? "#0068E0" : "#FFFFFF"} strokeWidth="2" />
      <g fill={dark ? "#0068E0" : "#FFFFFF"}>
        <rect x="8.5" y="25" width="4.4" height="7" rx="1.4" />
        <rect x="13.8" y="20.5" width="4.4" height="11.5" rx="1.4" />
        <rect x="19.1" y="16" width="4.4" height="16" rx="1.4" />
      </g>
    </svg>
  );
}

/** "my.stat.uz" yozuvi — Literata 700 (my.gov.uz yozuviga o'xshash qavsli serif, rasmiy ko'rinish). */
export function Wordmark({ size = 26, tone = "light", className = "" }: { size?: number; tone?: "light" | "dark"; className?: string }) {
  return (
    <span className={`whitespace-nowrap font-brand font-bold leading-none tracking-[-0.01em] ${tone === "dark" ? "text-white" : "text-mg-primary"} ${className}`}
      style={{ fontSize: size }}>
      my.stat.uz
    </span>
  );
}

/**
 * To'liq belgi: belgi + yozuv, `org` bo'lsa ostida tashkilot nomi ("MILLIY STATISTIKA QO'MITASI") — davlat
 * portallarining rasmiy lockup'i (footer, hujjatlar).
 */
export function Logo({ size = 40, tone = "light", org = false, className = "" }: {
  size?: number; tone?: "light" | "dark"; org?: boolean; className?: string;
}) {
  const { t } = useLang();
  return (
    <span className={`inline-flex items-center gap-3 ${className}`}>
      <LogoMark size={size} tone={tone} className="shrink-0" />
      <span className="flex flex-col">
        <Wordmark size={size * 0.64} tone={tone} />
        {org && (
          <span className={`mt-1 whitespace-nowrap font-semibold uppercase tracking-[0.08em] ${tone === "dark" ? "text-white/80" : "text-mg-muted"}`}
            style={{ fontSize: Math.max(9, Math.round(size * 0.21)) }}>
            {t(UI.portalLine1)}
          </span>
        )}
      </span>
    </span>
  );
}
