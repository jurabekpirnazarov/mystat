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
    id: 1, slug: "companies", icon: Building2, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Korxonalar va tashkilotlar", ru: "Предприятия и организации" },
    subcategories: [
      { id: "reference", title: { uz: "Ma'lumotnomalar", ru: "Справки" } },
      { id: "score", title: { uz: "Reyting va ball", ru: "Рейтинг и балл" } },
    ],
  },
  {
    id: 2, slug: "reporting", icon: ClipboardList, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Hisobot topshirish", ru: "Сдача отчётности" },
    subcategories: [
      { id: "calendar", title: { uz: "Kalendar", ru: "Календарь" } },
      { id: "forms", title: { uz: "Shakllar", ru: "Формы" } },
    ],
  },
  {
    id: 3, slug: "trade", icon: Globe2, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Tashqi savdo", ru: "Внешняя торговля" },
    subcategories: [
      { id: "stats", title: { uz: "Statistika", ru: "Статистика" } },
      { id: "analysis", title: { uz: "Tahlil", ru: "Анализ" } },
    ],
  },
  {
    id: 4, slug: "business", icon: Briefcase, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Biznes tahlili", ru: "Бизнес-аналитика" },
    subcategories: [
      { id: "competition", title: { uz: "Raqobat", ru: "Конкуренция" } },
      { id: "benchmark", title: { uz: "Benchmark", ru: "Бенчмарк" } },
      { id: "order", title: { uz: "Buyurtma", ru: "Заказ" } },
    ],
  },
  {
    id: 5, slug: "prices", icon: Percent, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Narxlar va inflyatsiya", ru: "Цены и инфляция" },
    subcategories: [
      { id: "calc", title: { uz: "Kalkulyatorlar", ru: "Калькуляторы" } },
      { id: "monitoring", title: { uz: "Monitoring", ru: "Мониторинг" } },
    ],
  },
  {
    id: 6, slug: "population", icon: Users, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Aholi va demografiya", ru: "Население и демография" },
    subcategories: [],
  },
  {
    id: 7, slug: "labour", icon: Wallet, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Mehnat va ish haqi", ru: "Труд и заработная плата" },
    subcategories: [],
  },
  {
    id: 8, slug: "regions", icon: MapPinned, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Hududlar", ru: "Регионы" },
    subcategories: [
      { id: "map", title: { uz: "Xarita", ru: "Карта" } },
      { id: "forecast", title: { uz: "Prognoz", ru: "Прогноз" } },
    ],
  },
  {
    id: 9, slug: "industry", icon: Factory, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Sanoat", ru: "Промышленность" },
    subcategories: [],
  },
  {
    id: 10, slug: "publications", icon: Library, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Nashrlar", ru: "Публикации" },
    subcategories: [
      { id: "bulletins", title: { uz: "Byulletenlar va to'plamlar", ru: "Бюллетени и сборники" } },
      { id: "books", title: { uz: "Kitoblar", ru: "Книги" } },
    ],
  },
  {
    id: 11, slug: "classifiers", icon: BookOpen, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Tasniflagichlar va metodologiya", ru: "Классификаторы и методология" },
    subcategories: [],
  },
  {
    id: 12, slug: "open-data", icon: Database, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Ochiq ma'lumotlar", ru: "Открытые данные" },
    subcategories: [
      { id: "api", title: { uz: "API", ru: "API" } },
      { id: "download", title: { uz: "Ko'rish va yuklab olish", ru: "Просмотр и загрузка" } },
    ],
  },
  {
    id: 13, slug: "citizens", icon: UserRound, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Fuqarolar uchun", ru: "Для граждан" },
    subcategories: [],
  },
  {
    id: 14, slug: "tariffs", icon: FileSignature, tint: "text-[rgb(var(--ds-on-panel-muted))] bg-[rgb(var(--ds-panel))]",
    title: { uz: "Tariflar va shartnomalar", ru: "Тарифы и договоры" },
    subcategories: [
      { id: "packages", title: { uz: "Paketlar", ru: "Пакеты" } },
      { id: "consultation", title: { uz: "Konsultatsiya", ru: "Консультация" } },
    ],
  },
];

export const sphereById = (id: number) => SPHERES.find((s) => s.id === id);
