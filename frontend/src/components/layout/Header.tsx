import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { CalendarClock, ChevronDown, LogIn, LogOut, Menu, Phone, Search, User } from "lucide-react";
import axiosT from "../../api/baseUrl";
import { calendar, profile } from "../../api/apiUrls";
import { useAuth } from "../../contexts/AuthContext";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { CONTACT } from "../../config/serviceCatalog";
import { unwrap, type MaybeWrapped, type UserProfile } from "../../types/api";
import logo from "../../img/stat.png";
import NotificationBell from "../notifications/NotificationBell";
import CreditBalanceChip from "../company-score/CreditBalanceChip";
import CommandPalette from "../search/CommandPalette";
import LanguageSwitcher from "./LanguageSwitcher";
import AccessibilityMenu from "./AccessibilityMenu";
import { useDismiss } from "./useDismiss";

const MONTHS_UZ = ["yan", "fev", "mar", "apr", "may", "iyun", "iyul", "avg", "sen", "okt", "noy", "dek"];
const MONTHS_RU = ["янв", "фев", "мар", "апр", "мая", "июн", "июл", "авг", "сен", "окт", "ноя", "дек"];

/** Joriy oydagi eng yaqin hisobot muddati (kun) — my.gov.uz dagi "112 SOS" o'rnidagi tezkor havola uchun. */
function useNextDeadline() {
  const [day, setDay] = useState<Date | null>(null);
  useEffect(() => {
    const now = new Date();
    axiosT.get<{ meta?: { has_reports_days?: number[] } }>(calendar, { params: { year: now.getFullYear(), month: now.getMonth() + 1 } })
      .then((r) => {
        const next = (r.data.meta?.has_reports_days ?? []).filter((d) => d >= now.getDate()).sort((a, b) => a - b)[0];
        if (next) setDay(new Date(now.getFullYear(), now.getMonth(), next));
      })
      .catch(() => undefined);
  }, []);
  return day;
}

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

function UserMenu() {
  const { t } = useLang();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<UserProfile | null>(null);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => {
    axiosT.get(profile).then((r) => setData(unwrap(r.data as MaybeWrapped<UserProfile>))).catch(() => undefined);
  }, []);

  const name = data ? `${data.first_name || ""} ${data.last_name || ""}`.trim() || data.username : user?.name || "";
  const onLogout = () => {
    setOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="menu" aria-expanded={open}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-3 hover:bg-mg-primary/5">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-mg-btn text-sm font-bold text-white">{initials(name)}</span>
        <span className="hidden max-w-[10rem] text-left leading-tight xl:block">
          <span className="block text-xs text-mg-muted">{t(UI.welcome)}</span>
          <span className="block truncate text-sm font-semibold text-mg-heading">{name}</span>
        </span>
        <ChevronDown className="hidden h-4 w-4 text-mg-muted xl:block" aria-hidden="true" />
      </button>
      {open && (
        <div role="menu" className="absolute right-0 top-full z-50 mt-2 w-64 overflow-hidden rounded-mg border border-mg-border bg-mg-surface py-1 shadow-lg">
          <div className="border-b border-mg-border px-4 py-3">
            <p className="truncate text-sm font-semibold text-mg-heading">{name}</p>
            {data?.email && <p className="truncate text-xs text-mg-muted">{data.email}</p>}
          </div>
          <Link to="/cabinet" role="menuitem" onClick={close} className="flex items-center gap-2 px-4 py-2.5 text-sm text-mg-text hover:bg-mg-info">
            <User className="h-4 w-4 text-mg-muted" aria-hidden="true" />{t(UI.cabinet)}
          </Link>
          <button type="button" role="menuitem" onClick={onLogout}
            className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700">
            <LogOut className="h-4 w-4" aria-hidden="true" />{t(UI.logout)}
          </button>
        </div>
      )}
    </div>
  );
}

const Divider = () => <span className="hidden h-9 w-px bg-mg-primary/40 md:block" aria-hidden="true" />;

/**
 * MG-03: header — chapda portal nomi (2 qator, katta harflarda), o'ngda: qidiruv (bosh sahifadan tashqari),
 * hisobot muddati (my.gov.uz dagi "112 SOS" o'rnida), aloqa telefoni + "Qayta aloqa", til, maxsus imkoniyatlar, "Kirish".
 */
export default function Header({ onOpenMenu }: { onOpenMenu: () => void }) {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const { pathname } = useLocation();
  const [searchOpen, setSearchOpen] = useState(false);
  const deadline = useNextDeadline();
  const isHome = pathname === "/";

  // Ctrl+K / Cmd+K — global qidiruv; sahifadagi qidiruv maydonlari `open-global-search` yuboradi
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
    <header className="flex items-center justify-between gap-3 py-4 md:py-6">
      <div className="flex items-center gap-3">
        <button type="button" onClick={onOpenMenu} aria-label={t(UI.openMenu)} className="rounded-lg p-1.5 text-mg-primary hover:bg-mg-primary/5 lg:hidden">
          <Menu className="h-7 w-7" aria-hidden="true" />
        </button>
        <Link to="/" className="flex items-center gap-3" aria-label={`${t(UI.portalFull)} — ${t(UI.home)}`}>
          <img src={logo} alt="" width={44} height={44} className="h-11 w-11 object-contain lg:hidden" />
          <span className="hidden text-[13px] font-medium uppercase leading-[19px] text-mg-heading sm:block">
            <span className="block">{t(UI.portalLine1)}</span>
            <span className="block">{t(UI.portalLine2)}</span>
          </span>
        </Link>
      </div>

      <div className="flex items-center gap-1.5 sm:gap-3">
        {!isHome && (
          <button type="button" onClick={() => setSearchOpen(true)} aria-label={`${t(UI.search)} (Ctrl+K)`} title={`${t(UI.search)} (Ctrl+K)`}
            className="rounded-full p-2 text-mg-primary hover:bg-mg-primary/5">
            <Search className="h-7 w-7" aria-hidden="true" />
          </button>
        )}
        <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />

        <Link to="/report-calendar" className="hidden items-center gap-2 rounded-md p-1 hover:bg-mg-primary/5 md:flex" title={t(UI.reportCalendar)}>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-mg-sos text-white">
            <CalendarClock className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="leading-tight">
            <span className="block text-base font-bold text-mg-primary">
              {deadline
                ? t({ uz: `${deadline.getDate()}-${MONTHS_UZ[deadline.getMonth()]}`, ru: `${deadline.getDate()} ${MONTHS_RU[deadline.getMonth()]}` })
                : t(UI.reportCalendar).split(" ")[0]}
            </span>
            <span className="block text-sm text-mg-primary">{deadline ? t(UI.deadline) : t(UI.reportCalendar).split(" ").slice(1).join(" ")}</span>
          </span>
        </Link>
        <Divider />
        <div className="hidden items-center gap-2 md:flex">
          <a href={CONTACT.phoneHref} aria-label={CONTACT.phone} className="flex h-11 w-11 items-center justify-center rounded-full bg-mg-primary text-white">
            <Phone className="h-5 w-5" aria-hidden="true" />
          </a>
          <span className="leading-tight">
            <a href={CONTACT.phoneHref} className="block whitespace-nowrap text-base font-bold text-mg-primary">{CONTACT.phone.replace("+998 ", "")}</a>
            <Link to="/contact" className="block text-sm text-mg-primary hover:underline">{t(UI.feedbackLink)}</Link>
          </span>
        </div>
        <Divider />
        <LanguageSwitcher />
        <Divider />
        <AccessibilityMenu />
        {isAuthenticated ? (
          <>
            <CreditBalanceChip />
            <NotificationBell />
            <UserMenu />
          </>
        ) : (
          <Link to="/login" className="ml-1 flex h-12 items-center gap-3 rounded-full bg-mg-btn py-2 pl-2 pr-5 text-[15px] font-semibold text-white shadow-mg-btn transition hover:brightness-110">
            <span className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
              <LogIn className="h-4 w-4" aria-hidden="true" />
            </span>
            {t(UI.login)}
          </Link>
        )}
      </div>
    </header>
  );
}
