import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { ChevronDown, X } from "lucide-react";
import logo from "../../img/stat.png";
import { NAV_GROUPS, isNavActive } from "../../config/navigation";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

/**
 * MG-03 (MG-00 natijasi bo'yicha): chap tomondagi ko'k sidebar — my.gov.uz dagi kabi.
 * Desktop: 85px ikonkalar ustuni, sichqoncha yoki klaviatura fokusi kelganda yozuvlar bilan 268px gacha ochiladi
 * (kontent ustida, sahifani surmaydi). Mobil: burger orqali chiqadigan panel (`MobileSidebar`).
 */
function NavList({ expanded, onNavigate }: { expanded: boolean; onNavigate?: () => void }) {
  const { pathname } = useLocation();
  const { t } = useLang();
  const [closed, setClosed] = useState<Record<string, boolean>>({});

  return (
    <nav aria-label={t(UI.groupServices)} className="flex flex-1 flex-col gap-1 overflow-y-auto overflow-x-hidden px-3 pb-4 [scrollbar-width:thin]">
      {NAV_GROUPS.map((g) => {
        const open = !closed[g.id];
        return (
          <div key={g.id} className="mt-2">
            <button type="button" onClick={() => setClosed((c) => ({ ...c, [g.id]: open }))} aria-expanded={open}
              className={`flex w-full items-center rounded-lg py-2 text-white/90 hover:text-white ${expanded ? "justify-between px-3" : "justify-center"}`}>
              <span className={expanded ? "text-[17px] font-bold leading-tight" : "sr-only"}>{t(g.label)}</span>
              <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${open ? "" : "-rotate-90"}`} aria-hidden="true" />
            </button>
            {open && (
              <ul>
                {g.items.map((item) => {
                  const active = isNavActive(item, pathname);
                  const Icon = item.icon;
                  return (
                    <li key={item.to} className="border-b border-white/15 last:border-b-0">
                      <Link to={item.to} onClick={onNavigate} aria-current={active ? "page" : undefined}
                        title={expanded ? undefined : t(item.label)}
                        className={`flex items-center gap-3 rounded-lg py-3 text-[14px] font-semibold text-white transition-colors ${
                          expanded ? "px-3" : "justify-center"
                        } ${active ? "bg-white/15" : "hover:bg-white/10"}`}>
                        <Icon className="h-[22px] w-[22px] shrink-0 text-emerald-300" aria-hidden="true" />
                        <span className={expanded ? "leading-tight" : "sr-only"}>{t(item.label)}</span>
                      </Link>
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

function Brand({ expanded }: { expanded: boolean }) {
  const { t } = useLang();
  return (
    <Link to="/" aria-label={`${t(UI.portalFull)} — ${t(UI.home)}`}
      className={`flex shrink-0 items-center gap-2.5 py-5 ${expanded ? "px-6" : "justify-center"}`}>
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-white">
        <img src={logo} alt="" width={36} height={36} className="h-9 w-9 object-contain" />
      </span>
      {expanded && <span className="whitespace-nowrap font-serif text-xl font-bold text-white">my.stat.uz</span>}
    </Link>
  );
}

export function DesktopSidebar() {
  const [hover, setHover] = useState(false);
  return (
    <aside aria-label="Bo'limlar" className="fixed bottom-3 left-[22px] top-3 z-40 hidden lg:block"
      onMouseEnter={() => setHover(true)} onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)} onBlur={(e) => !e.currentTarget.contains(e.relatedTarget) && setHover(false)}>
      <div className={`flex h-full flex-col rounded-mg-side bg-mg-primary shadow-lg transition-[width] duration-200 dark:bg-blue-900 ${hover ? "w-[268px]" : "w-[85px]"}`}>
        <Brand expanded={hover} />
        <NavList expanded={hover} />
      </div>
    </aside>
  );
}

export function MobileSidebar({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t(UI.groupServices)}
      onKeyDown={(e) => e.key === "Escape" && onClose()}>
      <button type="button" aria-label={t(UI.closeMenu)} onClick={onClose} className="absolute inset-0 bg-slate-900/40" />
      <div className="absolute bottom-0 left-0 top-0 flex w-[290px] max-w-[85vw] flex-col bg-mg-primary dark:bg-blue-900">
        <div className="flex items-center justify-between pr-3">
          <Brand expanded />
          <button type="button" onClick={onClose} aria-label={t(UI.closeMenu)} autoFocus
            className="rounded-lg p-2 text-white hover:bg-white/10">
            <X className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
        <NavList expanded onNavigate={onClose} />
      </div>
    </div>
  );
}
