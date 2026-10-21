import type { LucideIcon } from "lucide-react";
import { BadgeCheck, Briefcase, ClipboardList, GraduationCap, MapPinned, MessageCircleQuestion, Percent, Ship, Wallet } from "lucide-react";
import type { I18nText } from "../i18n/LangContext";

/**
 * MG-00: my.gov.uz bosh sahifasidagi "Hayotiy vaziyatlar" bloki — statistika portali uchun foydalanuvchi vaziyatlari.
 * Har vaziyat — katalogdagi xizmatlar ketma-ketligi (raqamlar `serviceCatalog.ts` dan).
 */
export interface Situation {
  slug: string;
  title: I18nText;
  description: I18nText;
  icon: LucideIcon;
  services: number[];
}

export const SITUATIONS: Situation[] = [
  {
    slug: "start-business", icon: Briefcase, services: [801, 401, 302, 1101, 1401],
    title: { uz: "Biznes boshlash", ru: "Открытие бизнеса" },
    description: { uz: "Hudud va tarmoqni o'rganing, raqobatchilarni toping, bozorni baholang.", ru: "Изучите регион и отрасль, найдите конкурентов, оцените рынок." },
  },
  {
    slug: "export", icon: Ship, services: [301, 302, 303, 401],
    title: { uz: "Eksport va import", ru: "Экспорт и импорт" },
    description: { uz: "Tovar bo'yicha savdo hajmi, narxlar va hamkor davlatlar.", ru: "Объём торговли по товару, цены и страны-партнёры." },
  },
  {
    slug: "reporting", icon: ClipboardList, services: [201, 202, 203, 103, 1402],
    title: { uz: "Hisobot topshirish", ru: "Сдача отчётности" },
    description: { uz: "Qaysi hisobotlar va qachongacha topshiriladi, savol bo'lsa — konsultatsiya.", ru: "Какие отчёты и в какие сроки сдавать, при вопросах — консультация." },
  },
  {
    slug: "check-partner", icon: BadgeCheck, services: [102, 107, 103, 104],
    title: { uz: "Hamkorni tekshirish", ru: "Проверка партнёра" },
    description: { uz: "Korxona kartasi, bali va statistik kodlari.", ru: "Карточка, балл и статистические коды предприятия." },
  },
  {
    slug: "my-region", icon: MapPinned, services: [801, 802, 603, 601],
    title: { uz: "Mening hududim", ru: "Мой регион" },
    description: { uz: "Viloyat va tumaningiz ko'rsatkichlari, aholi va iqtisodiyot.", ru: "Показатели вашей области и района, население и экономика." },
  },
  {
    slug: "salary", icon: Wallet, services: [701, 702, 501, 502],
    title: { uz: "Ish haqi va daromad", ru: "Зарплата и доходы" },
    description: { uz: "Maoshingizni solishtiring va narxlar o'zgarishini hisoblang.", ru: "Сравните зарплату и рассчитайте изменение цен." },
  },
  {
    slug: "prices", icon: Percent, services: [501, 502],
    title: { uz: "Narxlar o'zgarishi", ru: "Изменение цен" },
    description: { uz: "Inflyatsiya kalkulyatori va mahsulot narxlari monitoringi.", ru: "Калькулятор инфляции и мониторинг цен." },
  },
  {
    slug: "research", icon: GraduationCap, services: [1201, 1202, 1203, 1101, 1104, 1001],
    title: { uz: "Ilmiy ish va tadqiqot", ru: "Научная работа и исследования" },
    description: { uz: "Ochiq API, panellar, e'lonlar kalendari, tasniflagichlar va nashrlar.", ru: "Открытый API, панели, календарь публикаций, классификаторы и издания." },
  },
  {
    slug: "ask", icon: MessageCircleQuestion, services: [1301, 1402, 1303],
    title: { uz: "Savol berish", ru: "Задать вопрос" },
    description: { uz: "Mutaxassisga savol yuboring yoki konsultatsiya band qiling.", ru: "Задайте вопрос специалисту или запишитесь на консультацию." },
  },
];
