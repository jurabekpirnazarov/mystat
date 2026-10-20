import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  AlertTriangle, BarChart3, Building2, ChevronDown, ExternalLink, FileText, Grid3X3, HelpCircle, Info, LayoutGrid, LogIn,
  LogOut, Map as MapIcon, Menu, Phone, Search, User, Users, X,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import NotificationBell from "./notifications/NotificationBell";
import CreditBalanceChip from "./company-score/CreditBalanceChip";
import CommandPalette from "./search/CommandPalette";
import { getRequest } from "../api/request";
import { profile } from "../api/apiUrls";
import logo from "../img/stat.png";
import { unwrap, type MaybeWrapped, type UserProfile } from "../types/api";

/**
 * Sayt sarlavhasi: (1) ingichka rasmiy qator — qo'mita nomi, portal haqida, reglamentlar, rasmiy saytlar;
 * (2) asosiy menyu — statistikaga yo'naltirilgan bo'limlar; (3) test rejimi haqida sokin xabar.
 * Ilgari: 7 ta bo'lim bir qatorda (logo matni ba'zi kengliklarda yashirinardi), qizil yuguruvchi qator.
 */

const MAIN_NAV = [
  { path: "/dashboards", label: "Ko'rsatkichlar", icon: LayoutGrid, match: ["/dashboards", "/release-calendar"] },
  { path: "/regions", label: "Hududlar", icon: MapIcon, match: ["/regions"] },
  { path: "/check", label: "Korxonalar", icon: Building2, match: ["/check", "/company", "/partners", "/stat-codes"] },
  { path: "/citizens", label: "Fuqarolar uchun", icon: Users, match: ["/citizens", "/my-salary", "/prices", "/learn", "/names", "/surveys"] },
  { path: "/services", label: "Xizmatlar", icon: Grid3X3, match: ["/services", "/tariffs", "/tariff"] },
  { path: "/questions", label: "Savol-javob", icon: HelpCircle, match: ["/questions"] },
  { path: "/contact", label: "Aloqa", icon: Phone, match: ["/contact"] },
];

const UTILITY_NAV = [
  { path: "/about", label: "Portal haqida", icon: Info },
  { path: "/reglaments", label: "Reglamentlar", icon: FileText },
  { path: "/statistics", label: "Portal statistikasi", icon: BarChart3 },
];

const OFFICIAL_SITES = [
  { href: "https://stat.uz/uz/", label: "stat.uz" },
  { href: "https://siat.stat.uz/", label: "SIAT" },
];

function initials(name: string) {
  return name.split(/\s+/).filter(Boolean).slice(0, 2).map((w) => w[0]?.toUpperCase()).join("") || "?";
}

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const location = useLocation();
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  // Ctrl+K / Cmd+K — global qidiruv; sahifadagi qidiruv maydonlari (bosh sahifa banneri) `open-global-search` yuboradi
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

  useEffect(() => {
    if (!isAuthenticated) return;
    const token = localStorage.getItem("access_token");
    getRequest(profile, undefined, token ? { Authorization: `Bearer ${token}` } : undefined)
      .then((response) => setProfileData(unwrap(response as MaybeWrapped<UserProfile>)))
      .catch((error) => console.error("Profile yuklashda xatolik:", error));
  }, [isAuthenticated]);

  // Profil menyusi: tashqarini bosish yoki Escape bilan yopiladi
  useEffect(() => {
    if (!isProfileDropdownOpen) return;
    const onDown = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setIsProfileDropdownOpen(false);
    };
    const onEsc = (e: KeyboardEvent) => e.key === "Escape" && setIsProfileDropdownOpen(false);
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onEsc);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onEsc);
    };
  }, [isProfileDropdownOpen]);

  // Sahifa almashganda mobil menyu yopiladi
  useEffect(() => setIsOpen(false), [location.pathname]);

  const isActive = (item: (typeof MAIN_NAV)[number]) =>
    item.match.some((m) => location.pathname === m || location.pathname.startsWith(`${m}/`));
  const displayName = profileData
    ? `${profileData.first_name || ""} ${profileData.last_name || ""}`.trim() || profileData.username
    : user?.name || "Foydalanuvchi";

  const handleLogout = () => {
    setIsProfileDropdownOpen(false);
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <>
      {/* 1. Rasmiy qator */}
      <div className="hidden bg-[#0b2a5b] text-blue-100 md:block dark:bg-[#071a3a]">
        <div className="mx-auto flex h-9 max-w-[90rem] items-center justify-between px-4 text-xs sm:px-6 lg:px-8">
          <p className="truncate">O'zbekiston Respublikasi Milliy statistika qo'mitasi</p>
          <nav aria-label="Qo'shimcha" className="flex items-center gap-4">
            {UTILITY_NAV.map(({ path, label }) => (
              <Link key={path} to={path} className={`hover:text-white ${location.pathname === path ? "text-white" : ""}`}>{label}</Link>
            ))}
            <span className="h-3 w-px bg-white/20" aria-hidden="true" />
            {OFFICIAL_SITES.map(({ href, label }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-white">
                {label}<ExternalLink className="h-3 w-3" aria-hidden="true" />
              </a>
            ))}
          </nav>
        </div>
      </div>

      {/* 2. Asosiy menyu */}
      <nav aria-label="Asosiy" className="sticky top-0 z-30 border-b border-slate-200 bg-white/95 backdrop-blur transition-colors duration-300 dark:border-gray-700 dark:bg-gray-800/95">
        <div className="mx-auto max-w-[90rem] px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between gap-4">
            <Link to="/" className="flex shrink-0 items-center gap-2.5" aria-label="Milliy statistika qo'mitasi — interaktiv xizmatlar platformasi, bosh sahifa">
              <img src={logo} alt="" width={40} height={40} className="h-10 w-10 shrink-0 object-contain" />
              <span className="hidden whitespace-nowrap leading-tight sm:block">
                <span className="block text-[10px] font-medium uppercase tracking-[0.12em] text-slate-500 dark:text-gray-400">Milliy statistika qo'mitasi</span>
                <span className="block text-sm font-bold text-blue-950 dark:text-white">Interaktiv xizmatlar platformasi</span>
              </span>
            </Link>

            <div className="hidden h-full items-stretch lg:flex">
              {MAIN_NAV.map((item) => {
                const active = isActive(item);
                return (
                  <Link key={item.path} to={item.path} aria-current={active ? "page" : undefined}
                    className={`flex items-center whitespace-nowrap border-b-2 px-2.5 text-sm font-medium transition-colors xl:px-3.5 ${
                      active
                        ? "border-blue-900 text-blue-950 dark:border-blue-400 dark:text-white"
                        : "border-transparent text-slate-600 hover:border-slate-300 hover:text-blue-900 dark:text-gray-300 dark:hover:text-white"
                    }`}>
                    {item.label}
                  </Link>
                );
              })}
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <button type="button" onClick={() => setSearchOpen(true)} aria-label="Qidiruv (Ctrl+K)" title="Qidiruv (Ctrl+K)"
                className="flex items-center gap-2 rounded-lg border border-slate-200 px-2.5 py-2 text-sm text-slate-500 transition hover:border-slate-300 hover:text-slate-700 dark:border-gray-600 dark:text-gray-300">
                <Search className="h-4 w-4" aria-hidden="true" />
                <span className="hidden 2xl:inline">Qidirish</span>
                <kbd className="hidden rounded border border-slate-200 px-1 text-[10px] text-slate-400 2xl:inline dark:border-gray-600">Ctrl K</kbd>
              </button>
              <CommandPalette open={searchOpen} onClose={() => setSearchOpen(false)} />
              {isAuthenticated && <CreditBalanceChip />}
              {isAuthenticated && <NotificationBell />}

              {isAuthenticated ? (
                <div className="relative" ref={dropdownRef}>
                  <button type="button" onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)}
                    aria-haspopup="menu" aria-expanded={isProfileDropdownOpen}
                    className="flex items-center gap-2 rounded-lg py-1 pl-1 pr-2 transition hover:bg-slate-100 dark:hover:bg-gray-700">
                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-900 text-xs font-bold text-white">{initials(displayName)}</span>
                    <span className="hidden max-w-[10rem] truncate text-sm font-medium text-slate-800 xl:inline dark:text-gray-100">{displayName}</span>
                    <ChevronDown className="hidden h-4 w-4 text-slate-400 xl:inline" aria-hidden="true" />
                  </button>
                  {isProfileDropdownOpen && (
                    <div role="menu" className="absolute right-0 top-12 z-50 w-64 overflow-hidden rounded-xl border border-slate-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                      <div className="border-b border-slate-100 px-4 py-3 dark:border-gray-700">
                        <p className="truncate text-sm font-semibold text-slate-900 dark:text-white">{displayName}</p>
                        <p className="truncate text-xs text-slate-500 dark:text-gray-400">{profileData?.email || "Email ko'rsatilmagan"}</p>
                        {profileData?.phone && <p className="text-xs text-slate-500 dark:text-gray-400">{profileData.phone}</p>}
                      </div>
                      <Link to="/cabinet" role="menuitem" onClick={() => setIsProfileDropdownOpen(false)}
                        className="flex items-center gap-2 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 dark:text-gray-200 dark:hover:bg-gray-700">
                        <User className="h-4 w-4 text-slate-400" aria-hidden="true" />Shaxsiy kabinet
                      </Link>
                      <button type="button" role="menuitem" onClick={handleLogout}
                        className="flex w-full items-center gap-2 px-4 py-2.5 text-left text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-gray-700">
                        <LogOut className="h-4 w-4" aria-hidden="true" />Chiqish
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <Link to="/login" className="flex items-center gap-1.5 whitespace-nowrap rounded-lg bg-blue-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-800">
                  <LogIn className="h-4 w-4" aria-hidden="true" />Kirish
                </Link>
              )}

              <button type="button" onClick={() => setIsOpen(!isOpen)} aria-label={isOpen ? "Menyuni yopish" : "Menyuni ochish"} aria-expanded={isOpen}
                className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 lg:hidden dark:text-gray-300 dark:hover:bg-gray-700">
                {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobil menyu: asosiy va qo'shimcha bo'limlar */}
        {isOpen && (
          <div className="border-t border-slate-200 bg-white px-2 pb-3 pt-2 lg:hidden dark:border-gray-700 dark:bg-gray-800">
            {[...MAIN_NAV, ...UTILITY_NAV.map((u) => ({ ...u, match: [u.path] }))].map((item) => {
              const Icon = item.icon;
              const active = isActive(item);
              return (
                <Link key={item.path} to={item.path} aria-current={active ? "page" : undefined}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-base font-medium ${
                    active ? "bg-blue-50 text-blue-950 dark:bg-blue-900/20 dark:text-white" : "text-slate-700 hover:bg-slate-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  }`}>
                  <Icon className="h-5 w-5 text-slate-400" aria-hidden="true" />{item.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* 3. Test rejimi haqida xabar (ilgari qizil yuguruvchi qator) */}
      <div className="border-b border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
        <p className="mx-auto flex max-w-[90rem] items-center gap-2 px-4 py-1.5 text-xs font-medium sm:px-6 lg:px-8">
          <AlertTriangle className="h-4 w-4 shrink-0" aria-hidden="true" />
          Platforma test rejimida ishlamoqda: ayrim ma'lumotlar namunaviy bo'lishi mumkin.
        </p>
      </div>
    </>
  );
};

export default Navbar;
