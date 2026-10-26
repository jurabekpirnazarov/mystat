import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck, BookOpen, CalendarDays, Database, FileSignature, HelpCircle, Info, LayoutGrid, Library, Map as MapIcon,
  Phone, Sparkles, UserRound, Waypoints,
} from "lucide-react";
import { UI } from "../i18n/ui";
import type { I18nText } from "../i18n/LangContext";

/** Sidebar guruhlari (MG-00: my.gov.uz chap menyusi — "Xizmatlar" va "Yordam va qo'llab-quvvatlash"). */
export interface NavItem {
  to: string;
  label: I18nText;
  icon: LucideIcon;
  /** Faol deb hisoblanadigan yo'l boshlari */
  match?: string[];
}

export const NAV_GROUPS: { id: string; label: I18nText; items: NavItem[] }[] = [
  {
    id: "services",
    label: UI.groupServices,
    items: [
      { to: "/popular", label: UI.popular, icon: Sparkles },
      { to: "/spheres", label: UI.spheres, icon: LayoutGrid, match: ["/spheres", "/service/"] },
      { to: "/reporting", label: UI.reportCalendar, icon: CalendarDays, match: ["/reporting", "/report-calendar", "/reglaments", "/stat-codes"] },
      { to: "/check", label: UI.checkCompany, icon: BadgeCheck, match: ["/check", "/company/"] },
      { to: "/regions", label: UI.regionsMap, icon: MapIcon },
      { to: "/dashboards", label: UI.openData, icon: Database, match: ["/dashboards", "/release-calendar", "/developers"] },
      { to: "/tariffs", label: UI.tariffs, icon: FileSignature, match: ["/tariffs", "/tariff/"] },
      { to: "/books", label: UI.publications, icon: Library, match: ["/books", "/book-order"] },
    ],
  },
  {
    id: "help",
    label: UI.groupHelp,
    items: [
      { to: "/situations", label: UI.situations, icon: Waypoints },
      { to: "/questions", label: UI.faq, icon: HelpCircle },
      { to: "/citizens", label: UI.forCitizens, icon: UserRound },
      { to: "/learn", label: UI.learn, icon: BookOpen },
      { to: "/about", label: UI.about, icon: Info },
      { to: "/contact", label: UI.contact, icon: Phone },
    ],
  },
];

export function isNavActive(item: NavItem, pathname: string) {
  return (item.match ?? [item.to]).some((m) => pathname === m || pathname.startsWith(m.endsWith("/") ? m : `${m}/`));
}
