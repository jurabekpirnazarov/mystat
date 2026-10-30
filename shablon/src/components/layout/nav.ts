import type { LucideIcon } from "lucide-react";
import { BadgeCheck, BookOpen, CalendarDays, Database, HelpCircle, Info, LayoutGrid, Map as MapIcon, Phone, Sparkles, UserRound } from "lucide-react";

/** Yon menyu va footer shu bitta ro'yxatdan quriladi. O'z bo'limlaringizga almashtiring. */
export interface NavItem { href: string; label: string; icon: LucideIcon }
export const NAV_GROUPS: { id: string; label: string; items: NavItem[] }[] = [
  {
    id: "services",
    label: "Xizmatlar",
    items: [
      { href: "#", label: "Ommabop xizmatlar", icon: Sparkles },
      { href: "#", label: "Sohalar", icon: LayoutGrid },
      { href: "#", label: "Kalendar", icon: CalendarDays },
      { href: "#", label: "Tekshirish", icon: BadgeCheck },
      { href: "#", label: "Xarita", icon: MapIcon },
      { href: "#", label: "Ochiq ma'lumotlar", icon: Database },
    ],
  },
  {
    id: "help",
    label: "Yordam va qo'llab-quvvatlash",
    items: [
      { href: "#", label: "Savol-javob", icon: HelpCircle },
      { href: "#", label: "Fuqarolar uchun", icon: UserRound },
      { href: "#", label: "O'quv materiallari", icon: BookOpen },
      { href: "#", label: "Portal haqida", icon: Info },
      { href: "#", label: "Bog'lanish", icon: Phone },
    ],
  },
];
