/** Umumiy belgi: ustma-ust ikki kartochka va uchta o'suvchi ustun. O'z logotipingiz bilan almashtiring. */
export function LogoMark({ size = 40 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" aria-hidden="true">
      <rect x="13" y="3" width="24" height="24" rx="6.5" fill="rgb(var(--ds-on-panel-muted))" fillOpacity={0.55} />
      <rect x="3" y="11" width="26" height="26" rx="7" fill="rgb(var(--ds-on-panel))" stroke="rgb(var(--ds-panel))" strokeWidth="2" />
      <g fill="rgb(var(--ds-panel))">
        <rect x="8.5" y="25" width="4.4" height="7" rx="1.4" />
        <rect x="13.8" y="20.5" width="4.4" height="11.5" rx="1.4" />
        <rect x="19.1" y="16" width="4.4" height="16" rx="1.4" />
      </g>
    </svg>
  );
}

export function Logo({ name = "Loyiha nomi", tagline = "Qisqa tavsif" }: { name?: string; tagline?: string }) {
  return (
    <span className="flex items-center gap-3">
      <LogoMark size={44} />
      <span className="leading-tight">
        <span className="block text-xl font-bold text-[rgb(var(--ds-on-panel))]">{name}</span>
        <span className="block text-[10px] font-semibold uppercase tracking-[0.12em] text-[rgb(var(--ds-on-panel-muted))]">{tagline}</span>
      </span>
    </span>
  );
}
