import type { LucideIcon } from "lucide-react";
import {
  BookOpen, Building2, Briefcase, ClipboardList, Database, Factory, FileSignature, Globe2, Library, MapPinned,
  Percent, Users, UserRound, Wallet,
} from "lucide-react";
import type { I18nText } from "../i18n/LangContext";

/**
 * MG-04: my.stat.uz sohalari (MYGOV_DIZAYN.md 3-bo'lim). Tartib = bosh sahifa = sidebar = shu ro'yxat.
 * `id` URL'da ishlatiladi (`/spheres/:id`) va o'zgarmaydi; xizmat raqami = id × 100 + tartib.
 */
export interface Sphere {
  id: number;
  slug: string;
  title: I18nText;
  icon: LucideIcon;
  /** Kartochkadagi och doira ichidagi ikonka rangi (Tailwind sinfi) */
  tint: string;
  subcategories: { id: string; title: I18nText }[];
}

export const SPHERES: Sphere[] = [
  {
    id: 1, slug: "companies", icon: Building2, tint: "text-sky-500 bg-sky-50 dark:bg-sky-900/30",
    title: { uz: "Korxonalar va tashkilotlar", ru: "Предприятия и организации" },
    subcategories: [
      { id: "reference", title: { uz: "Ma'lumotnomalar", ru: "Справки" } },
      { id: "score", title: { uz: "Reyting va ball", ru: "Рейтинг и балл" } },
    ],
  },
  {
    id: 2, slug: "reporting", icon: ClipboardList, tint: "text-violet-500 bg-violet-50 dark:bg-violet-900/30",
    title: { uz: "Hisobot topshirish", ru: "Сдача отчётности" },
    subcategories: [
      { id: "calendar", title: { uz: "Kalendar", ru: "Календарь" } },
      { id: "forms", title: { uz: "Shakllar", ru: "Формы" } },
    ],
  },
  {
    id: 3, slug: "trade", icon: Globe2, tint: "text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30",
    title: { uz: "Tashqi savdo", ru: "Внешняя торговля" },
    subcategories: [
      { id: "stats", title: { uz: "Statistika", ru: "Статистика" } },
      { id: "analysis", title: { uz: "Tahlil", ru: "Анализ" } },
    ],
  },
  {
    id: 4, slug: "business", icon: Briefcase, tint: "text-amber-500 bg-amber-50 dark:bg-amber-900/30",
    title: { uz: "Biznes tahlili", ru: "Бизнес-аналитика" },
    subcategories: [
      { id: "competition", title: { uz: "Raqobat", ru: "Конкуренция" } },
      { id: "benchmark", title: { uz: "Benchmark", ru: "Бенчмарк" } },
      { id: "order", title: { uz: "Buyurtma", ru: "Заказ" } },
    ],
  },
  {
    id: 5, slug: "prices", icon: Percent, tint: "text-rose-500 bg-rose-50 dark:bg-rose-900/30",
    title: { uz: "Narxlar va inflyatsiya", ru: "Цены и инфляция" },
    subcategories: [
      { id: "calc", title: { uz: "Kalkulyatorlar", ru: "Калькуляторы" } },
      { id: "monitoring", title: { uz: "Monitoring", ru: "Мониторинг" } },
    ],
  },
  {
    id: 6, slug: "population", icon: Users, tint: "text-pink-500 bg-pink-50 dark:bg-pink-900/30",
    title: { uz: "Aholi va demografiya", ru: "Население и демография" },
    subcategories: [],
  },
  {
    id: 7, slug: "labour", icon: Wallet, tint: "text-teal-500 bg-teal-50 dark:bg-teal-900/30",
    title: { uz: "Mehnat va ish haqi", ru: "Труд и заработная плата" },
    subcategories: [],
  },
  {
    id: 8, slug: "regions", icon: MapPinned, tint: "text-blue-500 bg-blue-50 dark:bg-blue-900/30",
    title: { uz: "Hududlar", ru: "Регионы" },
    subcategories: [
      { id: "map", title: { uz: "Xarita", ru: "Карта" } },
      { id: "forecast", title: { uz: "Prognoz", ru: "Прогноз" } },
    ],
  },
  {
    id: 9, slug: "industry", icon: Factory, tint: "text-orange-500 bg-orange-50 dark:bg-orange-900/30",
    title: { uz: "Sanoat", ru: "Промышленность" },
    subcategories: [],
  },
  {
    id: 10, slug: "publications", icon: Library, tint: "text-indigo-500 bg-indigo-50 dark:bg-indigo-900/30",
    title: { uz: "Nashrlar", ru: "Публикации" },
    subcategories: [
      { id: "bulletins", title: { uz: "Byulletenlar va to'plamlar", ru: "Бюллетени и сборники" } },
      { id: "books", title: { uz: "Kitoblar", ru: "Книги" } },
    ],
  },
  {
    id: 11, slug: "classifiers", icon: BookOpen, tint: "text-cyan-600 bg-cyan-50 dark:bg-cyan-900/30",
    title: { uz: "Tasniflagichlar va metodologiya", ru: "Классификаторы и методология" },
    subcategories: [],
  },
  {
    id: 12, slug: "open-data", icon: Database, tint: "text-green-600 bg-green-50 dark:bg-green-900/30",
    title: { uz: "Ochiq ma'lumotlar", ru: "Открытые данные" },
    subcategories: [
      { id: "api", title: { uz: "API", ru: "API" } },
      { id: "download", title: { uz: "Ko'rish va yuklab olish", ru: "Просмотр и загрузка" } },
    ],
  },
  {
    id: 13, slug: "citizens", icon: UserRound, tint: "text-fuchsia-500 bg-fuchsia-50 dark:bg-fuchsia-900/30",
    title: { uz: "Fuqarolar uchun", ru: "Для граждан" },
    subcategories: [],
  },
  {
    id: 14, slug: "tariffs", icon: FileSignature, tint: "text-slate-500 bg-slate-100 dark:bg-slate-800",
    title: { uz: "Tariflar va shartnomalar", ru: "Тарифы и договоры" },
    subcategories: [
      { id: "packages", title: { uz: "Paketlar", ru: "Пакеты" } },
      { id: "consultation", title: { uz: "Konsultatsiya", ru: "Консультация" } },
    ],
  },
];

export const sphereById = (id: number) => SPHERES.find((s) => s.id === id);
