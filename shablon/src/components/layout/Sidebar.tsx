import { useState } from "react";
import { ChevronDown, X } from "lucide-react";
import { Logo } from "../Logo";
import { NAV_GROUPS } from "./nav";

/** Chap panel: desktopda doim ochiq (268px), mobilda burger orqali chiqadigan panel. */
function NavList({ activeHref, onNavigate }: { activeHref: string; onNavigate?: () => void }) {
  const [closed, setClosed] = useState<Record<string, boolean>>({});
  return (
    <nav aria-label="Asosiy menyu" className="flex flex-1 flex-col gap-1 overflow-y-auto px-3 pb-4 [scrollbar-width:thin]">
      {NAV_GROUPS.map((g) => {
        const open = !closed[g.id];
        return (
          <div key={g.id} className="mt-2">
            <button type="button" onClick={() => setClosed((c) => ({ ...c, [g.id]: open }))} aria-expanded={open}
              className="flex w-full items-center justify-between rounded-lg px-3 py-2 text-[rgb(var(--ds-on-panel-muted))] hover:text-[rgb(var(--ds-on-panel))]">
              <span className="text-xs font-semibold uppercase leading-tight tracking-[0.08em]">{g.label}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true" />
            </button>
            {open && (
              <ul>
                {g.items.map((item) => {
                  const active = item.href === activeHref;
                  const Icon = item.icon;
                  return (
                    <li key={item.label} className="border-b border-[rgb(var(--ds-panel-line))] last:border-b-0">
                      <a href={item.href} onClick={onNavigate} aria-current={active ? "page" : undefined}
                        className={`flex items-center gap-3 rounded-lg px-3 py-3 text-[14px] font-medium text-[rgb(var(--ds-on-panel))] transition-colors ${active ? "bg-mg-surface shadow-mg-card ring-1 ring-[rgb(var(--ds-panel-line))]" : "hover:bg-mg-surface/70"}`}>
                        <Icon className={`h-5 w-5 shrink-0 ${active ? "text-mg-primary" : "text-[rgb(var(--ds-on-panel-muted))]"}`} aria-hidden="true" />
                        <span className="leading-tight">{item.label}</span>
                      </a>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
        );
      })}
    </nav>
  );
}

export function DesktopSidebar({ activeHref = "" }: { activeHref?: string }) {
  return (
    <aside aria-label="Bo'limlar" className="fixed bottom-3 left-[22px] top-3 z-40 hidden lg:block">
      <div className="flex h-full w-[268px] flex-col rounded-mg-side bg-[rgb(var(--ds-panel))] shadow-mg-card">
        <a href="#" aria-label="Bosh sahifa" className="shrink-0 px-5 py-5"><Logo /></a>
        <NavList activeHref={activeHref} />
      </div>
    </aside>
  );
}

export function MobileSidebar({ open, onClose, activeHref = "" }: { open: boolean; onClose: () => void; activeHref?: string }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Menyu" onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <button type="button" aria-label="Menyuni yopish" onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
      <div className="absolute bottom-0 left-0 top-0 flex w-[290px] max-w-[85vw] flex-col bg-[rgb(var(--ds-panel))]">
        <div className="flex items-center justify-between pr-3">
          <a href="#" className="px-5 py-5"><Logo /></a>
          <button type="button" onClick={onClose} aria-label="Menyuni yopish" autoFocus className="rounded-lg p-2 text-[rgb(var(--ds-on-panel))] hover:bg-mg-surface/70">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <NavList activeHref={activeHref} onNavigate={onClose} />
      </div>
    </div>
  );
}
