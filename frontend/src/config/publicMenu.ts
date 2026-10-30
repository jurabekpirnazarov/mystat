import type { I18nText } from "../i18n/LangContext";

/**
 * UI_QAYTA_TUZISH.md 4.3: ommaviy menyu v2 (lex.uz "mazmun turi bo'yicha" tamoyili). MainNav, MobileMenu va `/sitemap`
 * shu bitta manbadan o'qiydi. URL'lar mavjud sahifalarga olib boradi (yo'q sahifa uchun havola qo'yilmaydi).
 */
export interface MenuLink { to: string; label: I18nText }
export interface MenuGroup { label: I18nText; to?: string; groups?: { title?: I18nText; links: MenuLink[] }[] }

export const PUBLIC_MENU: MenuGroup[] = [
  {
    label: { uz: "Statistik ma'lumotlar", ru: "Статистические данные" },
    groups: [
      {
        title: { uz: "Yangi e'lonlar", ru: "Новые публикации" },
        links: [
          { to: "/release-calendar", label: { uz: "E'lonlar kalendari", ru: "Календарь публикаций" } },
        ],
      },
      {
        title: { uz: "Bo'limlar", ru: "Разделы" },
        links: [
          { to: "/topics", label: { uz: "Mavzular", ru: "Темы" } },
          { to: "/indicators", label: { uz: "Barcha ko'rsatkichlar", ru: "Все показатели" } },
          { to: "/dashboards", label: { uz: "Panellar", ru: "Панели" } },
          { to: "/regions", label: { uz: "Hududlar", ru: "Регионы" } },
          { to: "/demographics", label: { uz: "Demografiya", ru: "Демография" } },
          { to: "/ex-trade", label: { uz: "Tashqi savdo", ru: "Внешняя торговля" } },
          { to: "/books", label: { uz: "Nashrlar", ru: "Издания" } },
        ],
      },
    ],
  },
  {
    label: { uz: "Xizmatlar", ru: "Услуги" },
    groups: [{
      links: [
        { to: "/spheres", label: { uz: "Sohalar", ru: "Сферы" } },
        { to: "/popular", label: { uz: "Ommabop xizmatlar", ru: "Популярные услуги" } },
        { to: "/tariffs", label: { uz: "Tariflar", ru: "Тарифы" } },
        { to: "/check", label: { uz: "Kontragent kartasi", ru: "Карточка контрагента" } },
        { to: "/consultation", label: { uz: "Konsultatsiya", ru: "Консультация" } },
        { to: "/spheres", label: { uz: "Barcha xizmatlar →", ru: "Все услуги →" } },
      ],
    }],
  },
  {
    label: { uz: "Hisobot topshiruvchilarga", ru: "Отчитывающимся" },
    groups: [{
      links: [
        { to: "/report-calendar", label: { uz: "Hisobot kalendari", ru: "Календарь отчётности" } },
        { to: "/reports", label: { uz: "Hisobot shakllari", ru: "Формы отчётов" } },
        { to: "/reglaments", label: { uz: "Reglamentlar", ru: "Регламенты" } },
        { to: "/stat-codes", label: { uz: "Statistik kodlar", ru: "Статистические коды" } },
        { to: "/cabinet", label: { uz: "Kabinetga kirish", ru: "Вход в кабинет" } },
      ],
    }],
  },
  {
    label: { uz: "Ma'lumotnomalar", ru: "Справочники" },
    groups: [{
      links: [
        { to: "/statistical-classifications", label: { uz: "Klassifikatorlar", ru: "Классификаторы" } },
        { to: "/methodology/company-score", label: { uz: "Metodologiya", ru: "Методология" } },
        { to: "/glossary", label: { uz: "Glossariy", ru: "Глоссарий" } },
        { to: "/cpi-calculator", label: { uz: "ISN kalkulyatori", ru: "Калькулятор ИПЦ" } },
        { to: "/my-salary", label: { uz: "Maosh kalkulyatori", ru: "Калькулятор зарплаты" } },
        { to: "/names", label: { uz: "Ism statistikasi", ru: "Статистика имён" } },
        { to: "/developers", label: { uz: "Ochiq API", ru: "Открытый API" } },
      ],
    }],
  },
  {
    label: { uz: "Portal haqida", ru: "О портале" },
    groups: [{
      links: [
        { to: "/about", label: { uz: "Portal haqida", ru: "О портале" } },
        { to: "/learn", label: { uz: "Foydalanuvchi qo'llanmasi", ru: "Руководство пользователя" } },
        { to: "/terms", label: { uz: "Foydalanish shartlari", ru: "Условия использования" } },
        { to: "/privacy", label: { uz: "Maxfiylik", ru: "Конфиденциальность" } },
        { to: "/surveys", label: { uz: "So'rovnomalar", ru: "Опросы" } },
        { to: "/statistics", label: { uz: "Portal statistikasi", ru: "Статистика портала" } },
        { to: "/contact", label: { uz: "Aloqa", ru: "Контакты" } },
      ],
    }],
  },
  { label: { uz: "Tushuntirishlar", ru: "Разъяснения" }, to: "/situations" },
];

/** LX-12: footer birinchi qatori */
export const FOOTER_LINKS: MenuLink[] = [
  { to: "/about", label: { uz: "Portal haqida", ru: "О портале" } },
  { to: "/terms", label: { uz: "Foydalanish shartlari", ru: "Условия использования" } },
  { to: "/privacy", label: { uz: "Maxfiylik siyosati", ru: "Политика конфиденциальности" } },
  { to: "/sitemap", label: { uz: "Portal xaritasi", ru: "Карта портала" } },
  { to: "/developers", label: { uz: "Ochiq API", ru: "Открытый API" } },
  { to: "/contact", label: { uz: "Aloqa", ru: "Контакты" } },
];

/** GV-09: foydali resurslar (matnli, logosiz) */
export const USEFUL_RESOURCES = [
  { href: "https://stat.uz", label: "stat.uz" },
  { href: "https://my.gov.uz", label: "my.gov.uz" },
  { href: "https://lex.uz", label: "lex.uz" },
  { href: "https://data.egov.uz", label: "data.egov.uz" },
  { href: "https://gov.uz", label: "gov.uz" },
];

/** Ijtimoiy tarmoqlar: faqat shu yerda (telefon va email `serviceCatalog.CONTACT` da). Footer'dagi mavjud rasmiy manzillar. */
export const SOCIALS = [
  { key: "telegram", label: "Telegram", href: "https://t.me/uzstataxborot" },
  { key: "facebook", label: "Facebook", href: "https://www.facebook.com/uzstataxborot" },
  { key: "instagram", label: "Instagram", href: "https://www.instagram.com/uzstataxborot" },
  { key: "youtube", label: "YouTube", href: "https://www.youtube.com/channel/UCiMwrLl7Cq_NrUv1L5ubNkw" },
] as const;
