import { useCallback, useEffect, useRef, useState } from "react";
import { Link, NavLink, useLocation } from "react-router-dom";
import { CalendarClock, ChevronDown, Facebook, Instagram, LogIn, Menu, Phone, Search, Send, UserRound, X, Youtube } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { CONTACT } from "../../config/serviceCatalog";
import { PUBLIC_MENU, SOCIALS, type MenuGroup } from "../../config/publicMenu";
import { LogoMark } from "../brand/Logo";
import CommandPalette from "../search/CommandPalette";
import LanguageSwitcher from "./LanguageSwitcher";
import ViewControls from "./ViewControls";
import { useDismiss } from "./useDismiss";

const SOCIAL_ICONS = { telegram: Send, facebook: Facebook, instagram: Instagram, youtube: Youtube } as const;

/** LX-01: yuqori qator (36 px, --ds-ink). Mobilda yashirin: A A A, til va ijtimoiy tarmoqlar MobileMenu ichida. */
export function TopBar() {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  return (
    <div className="hidden bg-[rgb(var(--ds-ink))] text-white lg:block">
      <div className="mx-auto flex h-9 max-w-[1200px] items-center justify-between gap-4 px-6 text-xs">
        <div className="flex items-center gap-4">
          <ul className="flex items-center gap-1">
            {SOCIALS.map((s) => {
              const Icon = SOCIAL_ICONS[s.key];
              return (
                <li key={s.key}>
                  <a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-7 w-7 items-center justify-center rounded hover:bg-white/15">
                    <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  </a>
                </li>
              );
            })}
          </ul>
          <Link to="/report-calendar" className="inline-flex items-center gap-1.5 hover:underline">
            <CalendarClock className="h-3.5 w-3.5" aria-hidden="true" />{t(UI.reportCalendar)}
          </Link>
          <a href={CONTACT.phoneHref} className="inline-flex items-center gap-1.5 hover:underline">
            <Phone className="h-3.5 w-3.5" aria-hidden="true" />{CONTACT.phone}
          </a>
        </div>
        <div className="flex items-center gap-4">
          <ViewControls />
          <LanguageSwitcher variant="inline" />
          <Link to={isAuthenticated ? "/cabinet" : "/login"} className="inline-flex items-center gap-1.5 font-semibold hover:underline">
            {isAuthenticated ? <UserRound className="h-3.5 w-3.5" aria-hidden="true" /> : <LogIn className="h-3.5 w-3.5" aria-hidden="true" />}
            {t(isAuthenticated ? UI.cabinet : UI.login)}
          </Link>
        </div>
      </div>
    </div>
  );
}

/** LX-02: logo + ikki qatorli rasmiy nom; o'ngda qidiruv va kabinet. Mobilda ☰ tugmasi. */
export function PublicHeader({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const [searchOpen, setSearchOpen] = useState(false);
  return (
    <div className="bg-[rgb(var(--ds-brand))] text-[rgb(var(--ds-on-brand))]">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-3 px-4 sm:px-6" style={{ height: "var(--ds-header-height)" }}>
        <Link to="/" className="flex min-w-0 items-center gap-3" aria-label={`${t(UI.portalFull)} — ${t(UI.home)}`}>
          <LogoMark size={40} tone="dark" />
          <span className="min-w-0 leading-tight">
            <span className="nav-case block truncate text-[13px] font-bold sm:text-sm lg:text-[15px]">{t(UI.portalLine1)}</span>
            <span className="hidden truncate text-xs text-[rgb(var(--ds-on-brand-muted))] sm:block">{t(UI.portalLine2)}</span>
          </span>
        </Link>
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => setSearchOpen(true)} aria-label={t(UI.searchPlaceholder)} title="Ctrl+K"
            className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15">
            <Search className="h-5 w-5" aria-hidden="true" />
          </button>
          <Link to={isAuthenticated ? "/cabinet" : "/login"}
            className="hidden h-10 items-center rounded-lg bg-[rgb(var(--ds-accent))] px-4 text-sm font-semibold text-[rgb(var(--ds-ink))] hover:opacity-90 lg:inline-flex">
            {t(isAuthenticated ? UI.cabinet : UI.login)}
          </Link>
          <button type="button" onClick={onOpenMenu} aria-label={t(UI.openMenu)} className="flex h-10 w-10 items-center justify-center rounded-full hover:bg-white/15 lg:hidden">
            <Menu className="h-6 w-6" aria-hidden="true" />
          </button>
        </div>
      </div>
      <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
    </div>
  );
}

function Dropdown({ group, open, onToggle, onClose }: { group: MenuGroup; open: boolean; onToggle: () => void; onClose: () => void }) {
  const { t } = useLang();
  const ref = useRef<HTMLLIElement>(null);
  useDismiss(ref, open, onClose);
  const btn = "nav-case flex h-full items-center gap-1 px-3 text-[13px] font-semibold hover:bg-white/10";
  if (!group.groups) {
    return <li><NavLink to={group.to!} className={({ isActive }) => `${btn} ${isActive ? "border-b-2 border-[rgb(var(--ds-accent))]" : ""}`}>{t(group.label)}</NavLink></li>;
  }
  const cols = group.groups.length > 1 ? "grid-cols-2" : "grid-cols-1";
  return (
    <li ref={ref} className="relative h-full">
      <button type="button" onClick={onToggle} aria-expanded={open} aria-haspopup="true" className={`${btn} ${open ? "bg-white/10" : ""}`}>
        {t(group.label)}<ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className={`absolute left-0 top-full z-40 grid ${cols} min-w-[260px] gap-x-8 border border-mg-border bg-mg-surface p-4 text-mg-text shadow-lg`} style={{ minWidth: group.groups.length > 1 ? 520 : 260 }}>
          {group.groups.map((g, i) => (
            <div key={i}>
              {g.title && <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-mg-muted">{t(g.title)}</p>}
              <ul>
                {g.links.map((l) => (
                  <li key={l.to + t(l.label)}>
                    <Link to={l.to} onClick={onClose} className="block py-1.5 text-[15px] text-mg-primary hover:underline">{t(l.label)}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </li>
  );
}

/** LX-03: 6 bandli menyu, katta harflar, 48 px, skrollda yopishib qoladi. Bosish bilan ochiladi. */
export function MainNav() {
  const { t } = useLang();
  const [openIdx, setOpenIdx] = useState<number | null>(null);
  const { pathname } = useLocation();
  useEffect(() => setOpenIdx(null), [pathname]);
  const close = useCallback(() => setOpenIdx(null), []);
  return (
    <nav aria-label={t(UI.home)} className="sticky top-0 z-40 hidden border-t border-white/10 bg-[rgb(var(--ds-brand))] text-[rgb(var(--ds-on-brand))] lg:block">
      <ul className="mx-auto flex max-w-[1200px] px-3" style={{ height: "var(--ds-nav-height)" }}>
        {PUBLIC_MENU.map((g, i) => (
          <Dropdown key={i} group={g} open={openIdx === i} onToggle={() => setOpenIdx(openIdx === i ? null : i)} onClose={close} />
        ))}
      </ul>
    </nav>
  );
}

/** < 1024 px: ☰ ichida accordion, A A A, tillar va ijtimoiy tarmoqlar (LX-01). Yopiq holatda DOM'da yo'q (X-7). */
export function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const [expanded, setExpanded] = useState<number | null>(null);
  useEffect(() => {
    if (!open) return;
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onEsc);
    return () => document.removeEventListener("keydown", onEsc);
  }, [open, onClose]);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label={t(UI.openMenu)}>
      <button type="button" className="absolute inset-0 bg-black/50" aria-label={t(UI.closeMenu)} onClick={onClose} />
      <div className="absolute right-0 top-0 flex h-full w-[min(360px,92vw)] flex-col overflow-y-auto bg-mg-surface text-mg-text shadow-xl">
        <div className="flex items-center justify-between bg-[rgb(var(--ds-brand))] px-4 py-3 text-white">
          <ViewControls />
          <button type="button" onClick={onClose} aria-label={t(UI.closeMenu)} className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-white/15">
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
        <div className="border-b border-mg-border px-4 py-3 text-mg-heading"><LanguageSwitcher variant="inline" /></div>
        <ul className="flex-1">
          {PUBLIC_MENU.map((g, i) => (
            <li key={i} className="border-b border-mg-border">
              {g.groups ? (
                <>
                  <button type="button" aria-expanded={expanded === i} onClick={() => setExpanded(expanded === i ? null : i)}
                    className="nav-case flex min-h-[48px] w-full items-center justify-between px-4 text-left text-[13px] font-semibold text-mg-heading">
                    {t(g.label)}<ChevronDown className={`h-4 w-4 transition-transform ${expanded === i ? "rotate-180" : ""}`} aria-hidden="true" />
                  </button>
                  {expanded === i && (
                    <ul className="pb-2 pl-4">
                      {g.groups.flatMap((x) => x.links).map((l) => (
                        <li key={l.to + t(l.label)}><Link to={l.to} onClick={onClose} className="block px-4 py-2 text-[15px] text-mg-primary">{t(l.label)}</Link></li>
                      ))}
                    </ul>
                  )}
                </>
              ) : (
                <Link to={g.to!} onClick={onClose} className="nav-case flex min-h-[48px] items-center px-4 text-[13px] font-semibold text-mg-heading">{t(g.label)}</Link>
              )}
            </li>
          ))}
        </ul>
        <div className="space-y-3 p-4">
          <Link to={isAuthenticated ? "/cabinet" : "/login"} onClick={onClose}
            className="flex min-h-[44px] items-center justify-center rounded-lg bg-mg-primary text-sm font-semibold text-white">{t(isAuthenticated ? UI.cabinet : UI.login)}</Link>
          <ul className="flex gap-2">
            {SOCIALS.map((s) => {
              const Icon = SOCIAL_ICONS[s.key];
              return <li key={s.key}><a href={s.href} target="_blank" rel="noopener noreferrer" aria-label={s.label} className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgb(var(--ds-panel))] text-mg-heading"><Icon className="h-4 w-4" aria-hidden="true" /></a></li>;
            })}
          </ul>
        </div>
      </div>
    </div>
  );
}
