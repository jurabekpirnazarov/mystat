import { useEffect, useState, type ReactNode } from "react";
import { Link, useLocation } from "react-router-dom";
import { AlertTriangle, ChevronLeft, ChevronRight, LogIn, Menu, Search, User } from "lucide-react";
import { LogoMark } from "../brand/Logo";
import CommandPalette from "../search/CommandPalette";
import FloatingSupport from "../FloatingSupport";
import NotificationBell from "../notifications/NotificationBell";
import CreditBalanceChip from "../company-score/CreditBalanceChip";
import Breadcrumbs from "../layout/Breadcrumbs";
import LanguageSwitcher from "../layout/LanguageSwitcher";
import AccessibilityMenu from "../layout/AccessibilityMenu";
import PageFeedback from "../layout/PageFeedback";
import PublicFooter from "../layout/PublicFooter";
import { MobileSidebar } from "../layout/Sidebar";
import TypoReporter from "../layout/TypoReporter";
import { NAV_GROUPS, isNavActive } from "../../config/navigation";
import { useAuth } from "../../contexts/AuthContext";
import { useLang, type I18nText } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

const TOP_NAV: { to: string; label: I18nText; match: string[] }[] = [
  { to: "/spheres", label: { uz: "Xizmatlar", ru: "Услуги" }, match: ["/spheres", "/service/", "/popular"] },
  { to: "/indicators", label: { uz: "Ko'rsatkichlar", ru: "Показатели" }, match: ["/indicators", "/topics", "/dashboards"] },
  { to: "/regions", label: { uz: "Hududlar", ru: "Регионы" }, match: ["/regions"] },
  { to: "/reporting", label: { uz: "Hisobotlar", ru: "Отчёты" }, match: ["/reporting", "/report-calendar", "/reports"] },
  { to: "/books", label: { uz: "Nashrlar", ru: "Издания" }, match: ["/books", "/book-order"] },
  { to: "/developers", label: { uz: "Ochiq API", ru: "Открытый API" }, match: ["/developers"] },
];

const STORE_KEY = "pp-sidebar-open";
const readOpen = () => {
  try {
    return window.localStorage.getItem(STORE_KEY) === "1";
  } catch {
    return false;
  }
};

/** Toshkent vaqti (UTC+5), soniyada bir yangilanadi. */
function useClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const tz = new Date(now.getTime() + now.getTimezoneOffset() * 60000 + 5 * 3600000);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${p(tz.getHours())}:${p(tz.getMinutes())}:${p(tz.getSeconds())}`;
}

function Sidebar({ open, onToggle }: { open: boolean; onToggle: () => void }) {
  const { pathname } = useLocation();
  const { t } = useLang();
  const { isAuthenticated, user } = useAuth();
  return (
    <aside aria-label={t({ uz: "Bo'limlar", ru: "Разделы" })}
      style={{ width: open ? 252 : 80, flexBasis: open ? 252 : 80 }}
      className="sticky top-4 hidden shrink-0 flex-col gap-3 self-start rounded-3xl border border-[var(--pp-line)] bg-[var(--pp-card)] p-3 transition-[width,flex-basis] duration-200 ease-out lg:flex">
      <div className={`flex items-center gap-2 pb-1 ${open ? "justify-between" : "justify-center"}`}>
        {open && <span className="pp-fade pl-1.5 text-xs font-semibold tracking-[0.06em] text-[var(--pp-muted)]">{t({ uz: "MENYU", ru: "МЕНЮ" })}</span>}
        <button type="button" onClick={onToggle} aria-expanded={open} aria-label={open ? t({ uz: "Menyuni yig'ish", ru: "Свернуть меню" }) : t({ uz: "Menyuni ochish", ru: "Развернуть меню" })}
          className="pp-focus flex h-10 w-10 items-center justify-center rounded-[14px] border border-[var(--pp-line)] bg-[var(--pp-card)] hover:bg-[var(--pp-soft)]">
          {open ? <ChevronLeft className="h-[18px] w-[18px]" aria-hidden="true" /> : <ChevronRight className="h-[18px] w-[18px]" aria-hidden="true" />}
        </button>
      </div>
      {NAV_GROUPS.map((g) => (
        <div key={g.id} className="flex flex-col gap-1">
          {open
            ? <span className="pp-fade whitespace-nowrap px-2 pb-0.5 pt-2 text-[11px] font-semibold tracking-[0.06em] text-[var(--pp-muted)]">{t(g.label).toUpperCase()}</span>
            : <span aria-hidden="true" className="mx-3.5 my-2 block h-px bg-[var(--pp-line)]" />}
          {g.items.map((it) => {
            const cur = isNavActive(it, pathname);
            const Icon = it.icon;
            const label = t(it.label);
            return (
              <Link key={it.to} to={it.to} aria-current={cur ? "page" : undefined} aria-label={label}
                className={`pp-sbi relative flex w-full items-center gap-3 rounded-2xl p-1 text-[15px] hover:no-underline ${cur && open ? "bg-[var(--p50)]" : "hover:bg-[var(--pp-soft)]"} ${cur ? "font-bold text-[var(--p800)]" : "font-medium text-[var(--pp-text)]"}`}>
                <span className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] ${cur ? "bg-[var(--btn)] text-white" : "bg-[var(--pp-soft)] text-[var(--pp-muted)]"}`}>
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </span>
                {open ? <span className="pp-fade min-w-0 flex-1 truncate text-left">{label}</span> : <span className="tip" aria-hidden="true">{label}</span>}
              </Link>
            );
          })}
        </div>
      ))}
      <div className={`mt-3 flex items-center gap-2.5 border-t border-[var(--pp-line)] pt-3.5 ${open ? "pl-1" : "justify-center"}`}>
        <span aria-hidden="true" className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[14px] bg-[var(--p100)] text-[15px] font-bold text-[var(--p800)]">
          {isAuthenticated ? (user?.name?.[0] ?? "U").toUpperCase() : "M"}
        </span>
        {open && (
          <span className="pp-fade flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{isAuthenticated ? user?.name : t({ uz: "Mehmon", ru: "Гость" })}</span>
            {isAuthenticated
              ? <Link to="/cabinet" className="text-[13px] font-medium text-[var(--btn)]">{t(UI.cabinet)}</Link>
              : <Link to="/login" className="text-[13px] font-medium text-[var(--btn)]">{t({ uz: "OneID orqali kirish", ru: "Войти через OneID" })}</Link>}
          </span>
        )}
      </div>
    </aside>
  );
}

function Header({ onOpenMenu, onSearch }: { onOpenMenu: () => void; onSearch: () => void }) {
  const { pathname } = useLocation();
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const clock = useClock();
  return (
    <header className="border-b border-[var(--pp-line)] bg-[var(--pp-card)]">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-3 px-4 py-3 sm:px-6">
        <button type="button" onClick={onOpenMenu} aria-label={t(UI.openMenu)} className="pp-focus rounded-lg p-1.5 lg:hidden">
          <Menu className="h-6 w-6" aria-hidden="true" />
        </button>
        <Link to="/" aria-label={`${t(UI.portalFull)} — ${t(UI.home)}`} className="mr-2 flex items-center gap-3 text-[var(--pp-text)] hover:no-underline">
          <LogoMark size={40} />
          <span className="flex flex-col leading-[1.15]">
            <span className="text-[19px] font-extrabold tracking-[-0.03em]">my.stat.uz</span>
            <span className="text-[11px] text-[var(--pp-muted)]">{t({ uz: "Rasmiy statistika portali", ru: "Официальный портал статистики" })}</span>
          </span>
        </Link>
        <nav aria-label={t({ uz: "Asosiy menyu", ru: "Главное меню" })} className="mr-auto hidden flex-wrap gap-0.5 text-sm font-semibold md:flex">
          {TOP_NAV.map((n) => {
            const cur = n.match.some((m) => pathname === m || pathname.startsWith(m.endsWith("/") ? m : `${m}/`));
            return (
              <Link key={n.to} to={n.to} aria-current={cur ? "page" : undefined}
                className={`pp-nav-link rounded-full px-3 py-2 ${cur ? "bg-[var(--p50)] text-[var(--p800)]" : "text-[var(--pp-text)]"}`}>{t(n.label)}</Link>
            );
          })}
        </nav>
        <div className="ml-auto flex flex-wrap items-center gap-2 md:ml-0">
          <span className="hidden h-[38px] items-center gap-2 rounded-full bg-[var(--pp-soft)] px-3.5 text-[13px] xl:flex">
            <span aria-hidden="true" className="h-2 w-2 rounded-full bg-[#1eb53a]" />
            <span className="mono font-semibold" aria-label={t({ uz: "Toshkent vaqti", ru: "Ташкентское время" })}>{clock}</span>
          </span>
          <button type="button" onClick={onSearch} aria-label={`${t(UI.search)} (Ctrl+K)`} title={`${t(UI.search)} (Ctrl+K)`}
            className="pp-focus flex h-[38px] w-[38px] items-center justify-center rounded-full border border-[var(--pp-line)] bg-[var(--pp-card)] hover:bg-[var(--pp-soft)]">
            <Search className="h-[18px] w-[18px]" aria-hidden="true" />
          </button>
          <LanguageSwitcher />
          <AccessibilityMenu />
          {isAuthenticated ? (
            <>
              <CreditBalanceChip />
              <NotificationBell />
              <Link to="/cabinet" className="flex h-[38px] items-center gap-2 rounded-full bg-[var(--btn)] px-4 text-sm font-bold text-white hover:no-underline hover:brightness-110">
                <User className="h-4 w-4" aria-hidden="true" />{t(UI.cabinet)}
              </Link>
            </>
          ) : (
            <Link to="/login" className="flex h-[38px] items-center gap-2 rounded-full bg-[var(--btn)] px-4 text-sm font-bold text-white hover:no-underline hover:brightness-110">
              <LogIn className="h-4 w-4" aria-hidden="true" />{t({ uz: "OneID orqali kirish", ru: "Войти через OneID" })}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

/**
 * "Shaffof xizmat pasporti" qobig'i: bayroq chizig'i → chap yig'iladigan sidebar → header → kontent → footer.
 * Bosh sahifa (`/`) o'z kengligida (hero), ichki sahifalar 1600 px konteynerda va breadcrumb bilan.
 * Kabinet (`/cabinet`) o'z qobig'ida qoladi (MainLayout hal qiladi).
 */
export default function PassportShell({ children }: { children: ReactNode }) {
  const { t } = useLang();
  const { pathname } = useLocation();
  const [open, setOpen] = useState(readOpen);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const home = pathname === "/";

  const toggle = () => {
    setOpen((v) => {
      try {
        window.localStorage.setItem(STORE_KEY, v ? "0" : "1");
      } catch { /* saqlanmasa ham ishlaydi */ }
      return !v;
    });
  };

  // Bosh sahifada "Eng ko'p foydalaniladigan xizmatlar" ko'ringanda menyu to'liq ochiladi (tanlov saqlanmaydi);
  // tepaga qaytilsa foydalanuvchi tanlagan holatga qaytadi.
  useEffect(() => {
    if (!home) return;
    let raf = 0;
    let target: HTMLElement | null = null;
    const check = () => {
      raf = 0;
      target ??= document.getElementById("pp-top");
      if (!target) return;
      const reached = target.getBoundingClientRect().top < window.innerHeight * 0.65;
      setOpen(reached ? true : readOpen());
    };
    const onScroll = () => {
      if (!raf) raf = window.requestAnimationFrame(check);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    onScroll();
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) window.cancelAnimationFrame(raf);
    };
  }, [home]);

  // Ctrl+K / Cmd+K va sahifadagi qidiruv maydonlari yuboradigan `open-global-search`
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setSearchOpen((v) => !v);
      }
    };
    const onOpen = () => setSearchOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("open-global-search", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("open-global-search", onOpen);
    };
  }, []);

  return (
    <div className="pp min-h-screen overflow-x-clip text-base leading-normal">
      <a href="#main-content" className="skip-link">{t(UI.skip)}</a>
      <div aria-hidden="true" className="pp-flag">
        <div style={{ flex: 40, background: "#0099B5" }} /><div style={{ flex: 2, background: "#CE1126" }} />
        <div style={{ flex: 16, background: "#FFFFFF" }} /><div style={{ flex: 2, background: "#CE1126" }} />
        <div style={{ flex: 40, background: "#1EB53A" }} />
      </div>
      <p className="flex items-center justify-center gap-2 bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />{t(UI.testMode)}
      </p>
      <div className="flex items-start gap-4 lg:p-4 lg:pr-0">
        <Sidebar open={open} onToggle={toggle} />
        <MobileSidebar open={menuOpen} onClose={() => setMenuOpen(false)} />
        <div className="min-w-0 flex-1">
          <Header onOpenMenu={() => setMenuOpen(true)} onSearch={() => setSearchOpen(true)} />
          <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
          <div className={home ? "" : "mx-auto w-full max-w-[1600px] px-4 pt-4 sm:px-6"}>
            {!home && <Breadcrumbs />}
            <main id="main-content" tabIndex={-1} className="min-h-[70vh] focus:outline-none">{children}</main>
            {!home && <PageFeedback />}
          </div>
          <PublicFooter />
        </div>
      </div>
      <TypoReporter />
      <FloatingSupport />
    </div>
  );
}
