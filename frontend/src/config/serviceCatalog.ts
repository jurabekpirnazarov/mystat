import type { LucideIcon } from "lucide-react";
import {
  BadgeCheck, BarChart3, BookMarked, BookOpen, Building, Building2, Calculator, CalendarClock, CalendarDays,
  ClipboardCheck, ClipboardList, Coins, FileBarChart, FileSearch, FileSignature, FileText, Gauge, Globe2,
  HandCoins, Handshake, Landmark, LayoutDashboard, LineChart, Map as MapIcon, MessageCircleQuestion, Newspaper,
  PackageSearch, Percent, ScrollText, ShoppingBasket, Ship, SpellCheck, Tags, UserCheck, Users, Vote,
  Wallet, Webhook, BellRing, Factory,
} from "lucide-react";
import { translate, type I18nText } from "../i18n/LangContext";

/**
 * MG-04: xizmatlar katalogi — menyu, bosh sahifa, soha sahifalari, xizmat pasporti, qidiruv va sayt xaritasi
 * faqat shu ro'yxatdan o'qiydi (takroriy ro'yxat yo'q). Manba: docs/XIZMATLAR_TAHLILI.md (kirish sharti, narx, limit)
 * va docs/MYGOV_DIZAYN.md 3-bo'lim (sohalar). Raqam = soha id × 100 + tartib; raqam o'zgarmaydi.
 */
export type Audience = "all" | "legal" | "individual";
/** open — kirishsiz; login — ro'yxatdan o'tgach bepul; package — tarif paketi limitidan; priced — alohida narx; credits — hamyondan (so'm) */
export type Access = "open" | "login" | "package" | "priced" | "credits";

export interface ServiceCatalogItem {
  number: number;
  sphere: number;
  subcategory?: string;
  alsoIn?: number[];
  title: I18nText;
  description: I18nText;
  /** Ishchi sahifa. `/cabinet?tab=` — kabinet bo'limi */
  route: string;
  icon: LucideIcon;
  duration: I18nText;
  users: Audience;
  access: Access;
  price: I18nText;
  legalBasis: I18nText;
  requiredDocs: I18nText;
  unit: I18nText;
  howItWorks: I18nText[];
  actionType: "open" | "apply";
  status: "live" | "soon";
  /** Bosh sahifadagi "Ommabop xizmatlar" tartibi */
  popularOrder?: number;
  /** Soha kartochkasida ko'rinadigan 2 xizmatdan biri */
  featured?: boolean;
  /** Qidiruv uchun qo'shimcha so'zlar */
  keywords?: string[];
}

export const CONTACT = {
  phone: "+998 71 233-45-67",
  phoneHref: "tel:+998712334567",
  email: "info@stat.uz",
};

// Takrorlanadigan matnlar
const T = {
  free: { uz: "Bepul", ru: "Бесплатно" },
  freeLogin: { uz: "Bepul, ro'yxatdan o'tgan foydalanuvchilar uchun", ru: "Бесплатно для зарегистрированных пользователей" },
  instant: { uz: "Darhol", ru: "Сразу" },
  oneMin: { uz: "1 daqiqa", ru: "1 минута" },
  threeMin: { uz: "3 daqiqa", ru: "3 минуты" },
  days: { uz: "1–3 ish kuni", ru: "1–3 рабочих дня" },
  noDocs: { uz: "Talab etilmaydi", ru: "Не требуется" },
  stirOnly: { uz: "Korxonaning STIR raqami", ru: "ИНН предприятия" },
  law: { uz: "O'zbekiston Respublikasining \"Rasmiy statistika to'g'risida\"gi Qonuni", ru: "Закон Республики Узбекистан «Об официальной статистике»" },
  lawPortal: { uz: "\"Rasmiy statistika to'g'risida\"gi Qonun; portalning foydalanish shartlari", ru: "Закон «Об официальной статистике»; условия использования портала" },
  committee: { uz: "Milliy statistika qo'mitasi", ru: "Национальный комитет по статистике" },
};
const STEP = {
  open: { uz: "Xizmat sahifasini oching", ru: "Откройте страницу услуги" },
  login: { uz: "Tizimga kiring (login/parol, OneID yoki ERI)", ru: "Войдите в систему (логин/пароль, OneID или ЭЦП)" },
  filter: { uz: "Kerakli filtrlarni tanlang: davr, hudud, ko'rsatkich", ru: "Выберите фильтры: период, регион, показатель" },
  result: { uz: "Natijani ekranda ko'ring yoki yuklab oling", ru: "Посмотрите результат на экране или скачайте" },
  stir: { uz: "Korxonaning STIR raqamini yoki nomini kiriting", ru: "Введите ИНН или название предприятия" },
  limit: { uz: "Tarif paketingizda limit borligini tekshiring", ru: "Проверьте лимит в вашем тарифном пакете" },
  apply: { uz: "Arizani to'ldirib yuboring", ru: "Заполните и отправьте заявку" },
  wait: { uz: "Mutaxassis ko'rib chiqadi, natija kabinetga keladi", ru: "Специалист рассмотрит заявку, результат придёт в кабинет" },
  cabinet: { uz: "Shaxsiy kabinetda tegishli bo'limni oching", ru: "Откройте нужный раздел в личном кабинете" },
};
const pkg = (limits: string): I18nText => ({
  uz: `Tarif paketi limitidan: ${limits}`,
  ru: `Из лимита тарифного пакета: ${limits}`,
});

const base = {
  legalBasis: T.law, requiredDocs: T.noDocs, unit: T.committee, actionType: "open" as const, status: "live" as const,
};

export const SERVICES: ServiceCatalogItem[] = [
  // 1. Korxonalar va tashkilotlar
  {
    ...base, number: 101, sphere: 1, subcategory: "reference", featured: true, popularOrder: 1,
    title: { uz: "Korxona to'g'risida ma'lumot", ru: "Сведения о предприятии" },
    description: { uz: "STIR bo'yicha korxonaning rasmiy ma'lumotlari: nomi, ro'yxatdan o'tganligi va asosiy ko'rsatkichlari", ru: "Официальные сведения о предприятии по ИНН: название, регистрация и основные показатели" },
    route: "/orginfo", icon: FileSearch, duration: T.oneMin, users: "all", access: "package",
    price: pkg("1-tarif — 10, 2-tarif — 100, 3-tarif — 1 000, 4-tarif — 10 000 korxona"),
    requiredDocs: T.stirOnly, howItWorks: [STEP.login, STEP.stir, STEP.result], keywords: ["stir", "inn", "ktyadr", "orginfo"],
  },
  {
    ...base, number: 102, sphere: 1, subcategory: "reference", featured: true, popularOrder: 2,
    title: { uz: "Kontragentni tekshirish", ru: "Проверка контрагента" },
    description: { uz: "Korxona kartasi: OKPO, majburiy hisobotlar, hudud va mahsulotlar. Xulosani PDF qilib yuklash mumkin", ru: "Карточка предприятия: ОКПО, обязательная отчётность, регион и продукция. Заключение в PDF" },
    route: "/check", icon: BadgeCheck, duration: T.oneMin, users: "all", access: "open", price: T.free,
    requiredDocs: T.stirOnly, howItWorks: [STEP.stir, STEP.result], keywords: ["ihamkor", "kontragent", "karta", "okpo"],
  },
  {
    ...base, number: 103, sphere: 1, subcategory: "reference",
    title: { uz: "Statistik kodlar ma'lumotnomasi", ru: "Справка о статистических кодах" },
    description: { uz: "STIR bo'yicha OKPO va majburiy hisobotlar ro'yxati, tekshirish kodi bilan PDF", ru: "ОКПО и перечень обязательной отчётности по ИНН, PDF с кодом проверки" },
    route: "/stat-codes", icon: ScrollText, duration: T.oneMin, users: "all", access: "login", price: T.freeLogin,
    requiredDocs: T.stirOnly, howItWorks: [STEP.login, STEP.stir, { uz: "Ma'lumotnomani PDF qilib yuklab oling", ru: "Скачайте справку в PDF" }],
    actionType: "apply", keywords: ["okpo", "kod", "malumotnoma"],
  },
  {
    ...base, number: 104, sphere: 1, subcategory: "reference",
    title: { uz: "Ma'lumotnomani tekshirish", ru: "Проверка справки" },
    description: { uz: "Statistik kodlar ma'lumotnomasining haqiqiyligini kod bo'yicha tekshirish", ru: "Проверка подлинности справки о статистических кодах по коду" },
    route: "/stat-codes/verify", icon: ClipboardCheck, duration: T.instant, users: "all", access: "open", price: T.free,
    requiredDocs: { uz: "Ma'lumotnomadagi tekshirish kodi", ru: "Код проверки из справки" }, howItWorks: [STEP.open, { uz: "Tekshirish kodini kiriting", ru: "Введите код проверки" }, STEP.result],
  },
  {
    ...base, number: 105, sphere: 1, subcategory: "reference",
    title: { uz: "Korxona va tashkilotlar ro'yxati", ru: "Перечень предприятий и организаций" },
    description: { uz: "Ro'yxatga olingan korxona va tashkilotlarni nom yoki STIR bo'yicha qidirish", ru: "Поиск зарегистрированных предприятий и организаций по названию или ИНН" },
    route: "/organizations", icon: Building2, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.stir, STEP.result],
  },
  {
    ...base, number: 106, sphere: 1, subcategory: "reference",
    title: { uz: "KTUT bo'yicha korxona", ru: "Предприятие по КТУТ" },
    description: { uz: "Korxonalar reyestri (KTUT): STIR, OKPO va hisobot topshiruvchi sifatidagi ma'lumotlar", ru: "Реестр предприятий (КТУТ): ИНН, ОКПО и сведения как о респонденте" },
    route: "/organizations-ktut", icon: Landmark, duration: T.instant, users: "all", access: "login", price: T.freeLogin,
    requiredDocs: T.stirOnly, howItWorks: [STEP.login, STEP.stir, STEP.result], keywords: ["ktut", "reyestr"],
  },
  {
    ...base, number: 107, sphere: 1, subcategory: "score",
    title: { uz: "Korxona bali", ru: "Балл предприятия" },
    description: { uz: "Korxonaning umumiy bali va sinfi; batafsil tahlil hamyondan to'lanadi", ru: "Общий балл и класс предприятия; подробный анализ оплачивается из кошелька" },
    route: "/company-score/components", icon: Gauge, duration: T.instant, users: "all", access: "credits",
    price: { uz: "Umumiy ball — bepul; \"Ball nimaga asoslangan\" — 16 500 so'm; \"Chuqur tahlil\" — 49 500 so'm (30 kun ochiq)", ru: "Общий балл — бесплатно; «Из чего состоит балл» — 16 500 сум; «Глубокий анализ» — 49 500 сум (30 дней)" },
    requiredDocs: T.stirOnly, howItWorks: [STEP.stir, { uz: "Umumiy ballni ko'ring", ru: "Посмотрите общий балл" }, { uz: "Kerak bo'lsa batafsil bo'limlarni hamyon hisobidan oching", ru: "При необходимости откройте подробные разделы из кошелька" }],
    keywords: ["scoring", "reyting", "ball"],
  },
  {
    ...base, number: 108, sphere: 1, subcategory: "score",
    title: { uz: "Korxona pasporti", ru: "Паспорт предприятия" },
    description: { uz: "O'z korxonangiz bali, tavsiyalar va dinamika", ru: "Балл вашего предприятия, рекомендации и динамика" },
    route: "/cabinet/organization", icon: Building, duration: T.instant, users: "legal", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, STEP.result],
  },

  // 2. Hisobot topshirish
  {
    ...base, number: 201, sphere: 2, subcategory: "calendar", featured: true, popularOrder: 3,
    title: { uz: "Hisobot kalendari", ru: "Календарь отчётности" },
    description: { uz: "Statistik hisobotlarni topshirish muddatlari, eslatma va .ics eksport", ru: "Сроки сдачи статистической отчётности, напоминания и экспорт .ics" },
    route: "/report-calendar", icon: CalendarDays, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, { uz: "Oy yoki STIR bo'yicha muddatlarni ko'ring", ru: "Посмотрите сроки по месяцу или ИНН" }, { uz: "Eslatma qo'ying yoki kalendarga eksport qiling", ru: "Поставьте напоминание или экспортируйте в календарь" }],
    keywords: ["muddat", "deadline", "kalendar"],
  },
  {
    ...base, number: 202, sphere: 2, subcategory: "calendar", featured: true,
    title: { uz: "Hisobotlarim", ru: "Мои отчёты" },
    description: { uz: "Korxonangiz topshirishi kerak bo'lgan hisobotlar va ularning muddatlari", ru: "Отчёты, которые должно сдать ваше предприятие, и их сроки" },
    route: "/cabinet?tab=reports", icon: CalendarClock, duration: T.instant, users: "legal", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, STEP.cabinet, STEP.result],
  },
  {
    ...base, number: 203, sphere: 2, subcategory: "forms",
    title: { uz: "Taqdim etiladigan hisobotlar ro'yxati", ru: "Перечень представляемой отчётности" },
    description: { uz: "Tasdiqlangan statistik hisobot shakllari va STIR bo'yicha majburiy hisobotlar", ru: "Утверждённые формы статистической отчётности и обязательные отчёты по ИНН" },
    route: "/reports", icon: ClipboardList, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.stir, STEP.result], keywords: ["shakl", "forma"],
  },
  {
    ...base, number: 204, sphere: 2, subcategory: "forms",
    title: { uz: "Reglamentlar", ru: "Регламенты" },
    description: { uz: "Xizmat ko'rsatish reglamentlari va me'yoriy hujjatlar", ru: "Регламенты оказания услуг и нормативные документы" },
    route: "/reglaments", icon: FileText, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.result],
  },

  // 3. Tashqi savdo
  {
    ...base, number: 301, sphere: 3, subcategory: "stats", featured: true, popularOrder: 4,
    title: { uz: "Tashqi savdo statistikasi", ru: "Статистика внешней торговли" },
    description: { uz: "Eksport va import yillar, oylar, hududlar, davlatlar va tovarlar kesimida; yuklab olish", ru: "Экспорт и импорт по годам, месяцам, регионам, странам и товарам; выгрузка" },
    route: "/ex-trade", icon: Ship, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.filter, STEP.result], keywords: ["eksport", "import", "hs", "tnved"],
  },
  {
    ...base, number: 302, sphere: 3, subcategory: "analysis", featured: true, popularOrder: 5, alsoIn: [9],
    title: { uz: "Bozor tahlili", ru: "Анализ рынка" },
    description: { uz: "HS kodi bo'yicha eksport va import, narxlar va asosiy hamkor davlatlar", ru: "Экспорт и импорт по коду ТН ВЭД, цены и основные страны-партнёры" },
    route: "/market-report", icon: LineChart, duration: T.oneMin, users: "all", access: "package",
    price: pkg("qisqa versiya bepul; to'liq versiya 1/3/10/30 ta"),
    requiredDocs: { uz: "Mahsulotning HS kodi yoki nomi", ru: "Код ТН ВЭД или название товара" },
    howItWorks: [STEP.open, { uz: "Mahsulot HS kodini yoki nomini kiriting", ru: "Введите код ТН ВЭД или название товара" }, STEP.result],
  },
  {
    ...base, number: 303, sphere: 3, subcategory: "stats",
    title: { uz: "Savdo oqimlari", ru: "Торговые потоки" },
    description: { uz: "Eksport va import oqimlari xaritada, davlatlar bo'yicha taqqoslash", ru: "Потоки экспорта и импорта на карте, сравнение по странам" },
    route: "/trade-flows", icon: Globe2, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.filter, STEP.result],
  },

  // 4. Biznes tahlili
  {
    ...base, number: 401, sphere: 4, subcategory: "competition", featured: true, popularOrder: 6,
    title: { uz: "Hamkor va raqobatchilarni qidirish", ru: "Поиск партнёров и конкурентов" },
    description: { uz: "Hudud, tuman va faoliyat turi bo'yicha korxonalar, xarita va XLSX eksport", ru: "Предприятия по региону, району и виду деятельности, карта и выгрузка XLSX" },
    route: "/partners", icon: Handshake, duration: T.oneMin, users: "all", access: "package",
    price: pkg("qidiruv bepul; XLSX eksport 1/3/10/30 ta"),
    howItWorks: [STEP.open, STEP.filter, { uz: "Ro'yxatni ko'ring yoki XLSX qilib yuklab oling", ru: "Посмотрите список или скачайте XLSX" }],
  },
  {
    ...base, number: 402, sphere: 4, subcategory: "benchmark", featured: true,
    title: { uz: "Tarmoq benchmarki", ru: "Отраслевой бенчмарк" },
    description: { uz: "Korxonangiz ko'rsatkichlarini tarmoqdagi tengdoshlar bilan solishtirish", ru: "Сравнение показателей вашего предприятия с отраслевыми аналогами" },
    route: "/cabinet?tab=benchmark", icon: BarChart3, duration: T.oneMin, users: "legal", access: "package",
    price: pkg("1/3/10/30 ta"), howItWorks: [STEP.login, STEP.limit, STEP.cabinet, STEP.result],
  },
  {
    ...base, number: 403, sphere: 4, subcategory: "order",
    title: { uz: "Tahliliy ma'lumot tayyorlash", ru: "Подготовка аналитических данных" },
    description: { uz: "Paket doirasida tanlangan ko'rsatkichlar bo'yicha tahliliy ma'lumot", ru: "Аналитические данные по выбранным показателям в рамках пакета" },
    route: "/cabinet?tab=requests", icon: FileBarChart, duration: T.days, users: "legal", access: "package",
    price: pkg("2-tarif — 10 ko'rsatkich, 3-tarif — 30, 4-tarif — 50"),
    requiredDocs: { uz: "Ko'rsatkichlar, davr va hududlar ro'yxati", ru: "Перечень показателей, период и регионы" },
    howItWorks: [STEP.login, STEP.apply, STEP.wait], actionType: "apply",
  },
  {
    ...base, number: 404, sphere: 4, subcategory: "order",
    title: { uz: "Individual ma'lumot so'rovi", ru: "Индивидуальный запрос данных" },
    description: { uz: "Buyurtma asosida statistik ma'lumot; narx hajmga qarab BHMda hisoblanadi", ru: "Статистические данные по заказу; цена рассчитывается в БРВ по объёму" },
    route: "/cabinet?tab=custom", icon: PackageSearch, duration: T.days, users: "legal", access: "priced",
    price: { uz: "(asos + ko'rsatkichlar + yillar + hududlar) × shoshilinchlik, BHMda. Xodim tasdiqlaydi, keyin shartnoma", ru: "(база + показатели + годы + регионы) × срочность, в БРВ. Подтверждает сотрудник, затем договор" },
    requiredDocs: { uz: "Ko'rsatkichlar, davr va hududlar ro'yxati", ru: "Перечень показателей, период и регионы" },
    howItWorks: [STEP.login, STEP.apply, { uz: "Narxni tasdiqlang va shartnoma tuzing", ru: "Подтвердите цену и заключите договор" }, STEP.wait],
    actionType: "apply",
  },

  // 5. Narxlar va inflyatsiya
  {
    ...base, number: 501, sphere: 5, subcategory: "calc", featured: true, popularOrder: 7,
    title: { uz: "Inflyatsiya kalkulyatori", ru: "Калькулятор инфляции" },
    description: { uz: "Tanlangan davr uchun iste'mol narxlari indeksi (ISN) o'zgarishini zanjir usulida hisoblash", ru: "Расчёт изменения индекса потребительских цен за выбранный период цепным методом" },
    route: "/cpi-calculator", icon: Calculator, duration: T.instant, users: "all", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, { uz: "Boshlang'ich va oxirgi oyni tanlang", ru: "Выберите начальный и конечный месяц" }, STEP.result],
    keywords: ["isn", "cpi", "inflyatsiya", "indeks"],
  },
  {
    ...base, number: 502, sphere: 5, subcategory: "monitoring", featured: true,
    title: { uz: "Narxlar monitoringi", ru: "Мониторинг цен" },
    description: { uz: "Asosiy iste'mol mahsulotlari narxi hududlar bo'yicha va \"savat\" kalkulyatori", ru: "Цены на основные продукты по регионам и калькулятор «корзины»" },
    route: "/prices", icon: ShoppingBasket, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.filter, STEP.result],
  },
  {
    ...base, number: 503, sphere: 5, subcategory: "calc", status: "soon",
    title: { uz: "Shaxsiy inflyatsiya", ru: "Личная инфляция" },
    description: { uz: "Xarajatlaringiz tarkibiga qarab shaxsiy inflyatsiya darajasi", ru: "Личный уровень инфляции по структуре ваших расходов" },
    route: "/prices", icon: Percent, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.result],
  },

  // 6. Aholi va demografiya
  {
    ...base, number: 601, sphere: 6, featured: true, popularOrder: 8,
    title: { uz: "Demografik ma'lumotlar", ru: "Демографические данные" },
    description: { uz: "Aholi soni, tug'ilish, o'lim, nikoh, ajrim va migratsiya 1989-yildan, viloyat va tumanlar kesimida", ru: "Численность населения, рождаемость, смертность, браки, разводы и миграция с 1989 года по регионам и районам" },
    route: "/demographics", icon: Users, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.filter, STEP.result], keywords: ["aholi", "tug'ilish", "migratsiya"],
  },
  {
    ...base, number: 602, sphere: 6, featured: true,
    title: { uz: "Ismlar statistikasi", ru: "Статистика имён" },
    description: { uz: "Ism qancha uchrashi, yillar va hududlar bo'yicha", ru: "Насколько распространено имя, по годам и регионам" },
    route: "/names", icon: SpellCheck, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, { uz: "Ismni kiriting", ru: "Введите имя" }, STEP.result],
  },
  {
    ...base, number: 603, sphere: 6,
    title: { uz: "Aholi paneli", ru: "Панель «Население»" },
    description: { uz: "Aholi soni, o'sishi, qishloq aholisi va gender nisbati bir sahifada, jonli aholi soati bilan", ru: "Численность, прирост, сельское население и гендерное соотношение на одной странице с живым счётчиком" },
    route: "/dashboards/population", icon: LayoutDashboard, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.result],
  },

  // 7. Mehnat va ish haqi
  {
    ...base, number: 701, sphere: 7, featured: true, popularOrder: 9,
    title: { uz: "Mening maoshim", ru: "Моя зарплата" },
    description: { uz: "Ish haqingizni hudud va tarmoqdagi taqsimot bilan solishtirish", ru: "Сравнение вашей зарплаты с распределением по региону и отрасли" },
    route: "/my-salary", icon: Wallet, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, { uz: "Hudud, tarmoq va ish haqingizni kiriting", ru: "Укажите регион, отрасль и зарплату" }, STEP.result],
    keywords: ["maosh", "ish haqi", "zarplata"],
  },
  {
    ...base, number: 702, sphere: 7, featured: true,
    title: { uz: "Mehnat bozori paneli", ru: "Панель «Рынок труда»" },
    description: { uz: "O'rtacha ish haqi, uning real o'sishi va ishsizlik darajasi", ru: "Средняя зарплата, её реальный рост и уровень безработицы" },
    route: "/dashboards/labour", icon: HandCoins, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.result],
  },

  // 8. Hududlar
  {
    ...base, number: 801, sphere: 8, subcategory: "map", featured: true, popularOrder: 10,
    title: { uz: "Hududlar xaritasi", ru: "Карта регионов" },
    description: { uz: "Viloyat va tumanlar ko'rsatkichlari xaritada, mening hududim, salohiyat indeksi", ru: "Показатели областей и районов на карте, мой регион, индекс потенциала" },
    route: "/regions", icon: MapIcon, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, { uz: "Ko'rsatkich va hududni tanlang", ru: "Выберите показатель и регион" }, STEP.result],
    keywords: ["siat", "viloyat", "tuman", "xarita"],
  },
  {
    ...base, number: 802, sphere: 8, subcategory: "forecast", featured: true,
    title: { uz: "Iqtisodiyot paneli", ru: "Панель «Экономика»" },
    description: { uz: "YaIM, o'sish va asosiy iqtisodiy ko'rsatkichlar bir qarashda", ru: "ВВП, рост и основные экономические показатели" },
    route: "/dashboards/economy", icon: LayoutDashboard, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.result],
  },

  // 9. Sanoat
  {
    ...base, number: 901, sphere: 9, featured: true,
    title: { uz: "Sanoat mahsulotlari ishlab chiqaruvchilari", ru: "Производители промышленной продукции" },
    description: { uz: "Mahsulot turlari, ishlab chiqaruvchi korxonalar, manzil va mahsulot kodlari", ru: "Виды продукции, предприятия-производители, адреса и коды продукции" },
    route: "/industry", icon: Factory, duration: T.instant, users: "all", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, STEP.filter, STEP.result],
  },
  {
    ...base, number: 902, sphere: 9, status: "soon",
    title: { uz: "Tarmoq sahifasi", ru: "Страница отрасли" },
    description: { uz: "OKED bo'yicha tarmoq: korxonalar, mahsulotlar va savdo", ru: "Отрасль по ОКЭД: предприятия, продукция и торговля" },
    route: "/industry", icon: Tags, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.result],
  },

  // 10. Nashrlar
  {
    ...base, number: 1001, sphere: 10, subcategory: "books", featured: true, popularOrder: 11,
    title: { uz: "Nashrlarga elektron buyurtma", ru: "Электронный заказ изданий" },
    description: { uz: "Statistik to'plamlar va kitoblarni buyurtma qilish, pochta orqali yetkazish", ru: "Заказ статистических сборников и книг с доставкой почтой" },
    route: "/books", icon: BookMarked, duration: T.threeMin, users: "all", access: "priced",
    price: { uz: "Har nashrning narxi katalogda; Click orqali onlayn to'lanadi", ru: "Цена каждого издания в каталоге; оплата онлайн через Click" },
    requiredDocs: { uz: "Yetkazish uchun pochta bo'limi", ru: "Почтовое отделение для доставки" },
    howItWorks: [STEP.login, { uz: "Nashrni tanlab savatga qo'shing", ru: "Выберите издание и добавьте в корзину" }, { uz: "Pochta bo'limini tanlab Click orqali to'lang", ru: "Выберите почтовое отделение и оплатите через Click" }],
    actionType: "apply",
  },
  {
    ...base, number: 1002, sphere: 10, subcategory: "bulletins", featured: true,
    title: { uz: "Statistik byulletenlar", ru: "Статистические бюллетени" },
    description: { uz: "Byulletenlarni kabinetdan yuklab olish", ru: "Скачивание бюллетеней из кабинета" },
    route: "/cabinet?tab=services", icon: Newspaper, duration: T.instant, users: "legal", access: "package",
    price: pkg("1/3/5/7 ta"), howItWorks: [STEP.login, STEP.limit, STEP.cabinet],
  },
  {
    ...base, number: 1003, sphere: 10, subcategory: "bulletins",
    title: { uz: "Statistik to'plamlar", ru: "Статистические сборники" },
    description: { uz: "Yillik statistik to'plamlarning elektron nusxasi", ru: "Электронные копии ежегодных статистических сборников" },
    route: "/cabinet?tab=services", icon: BookOpen, duration: T.instant, users: "legal", access: "package",
    price: pkg("1/3/5 ta, 4-tarifda — barchasi"), howItWorks: [STEP.login, STEP.limit, STEP.cabinet],
  },

  // 11. Tasniflagichlar va metodologiya
  {
    ...base, number: 1101, sphere: 11, featured: true,
    title: { uz: "Statistik tasniflagichlar", ru: "Статистические классификаторы" },
    description: { uz: "Iqtisodiy faoliyat, mahsulot, hudud va boshqa tasniflagichlar, 3 tilda qidiruv", ru: "Классификаторы видов деятельности, продукции, территорий и др., поиск на 3 языках" },
    route: "/statistical-classifications", icon: Tags, duration: T.instant, users: "all", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, { uz: "Tasniflagich va kodni qidiring", ru: "Найдите классификатор и код" }, STEP.result],
    keywords: ["oked", "okpo", "soato", "klassifikator"],
  },
  {
    ...base, number: 1102, sphere: 11, featured: true,
    title: { uz: "Korxona bali metodologiyasi", ru: "Методология балла предприятия" },
    description: { uz: "Ball qanday hisoblanadi: ustunlar, og'irliklar va manbalar", ru: "Как рассчитывается балл: компоненты, веса и источники" },
    route: "/methodology/company-score", icon: Gauge, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open], legalBasis: T.lawPortal,
  },
  {
    ...base, number: 1103, sphere: 11,
    title: { uz: "Kontragent kartasi metodologiyasi", ru: "Методология карточки контрагента" },
    description: { uz: "Kartadagi ma'lumotlar qayerdan olinadi va qanday o'qiladi", ru: "Откуда берутся данные карточки и как их читать" },
    route: "/methodology/company-card", icon: FileText, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open], legalBasis: T.lawPortal,
  },
  {
    ...base, number: 1104, sphere: 11,
    title: { uz: "Statistik atamalar lug'ati", ru: "Словарь статистических терминов" },
    description: { uz: "Statistik atamalarning oddiy tildagi izohi", ru: "Объяснение статистических терминов простым языком" },
    route: "/glossary", icon: BookOpen, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open],
  },

  // 12. Ochiq ma'lumotlar
  {
    ...base, number: 1201, sphere: 12, subcategory: "api", featured: true, popularOrder: 12,
    title: { uz: "Ochiq API", ru: "Открытый API" },
    description: { uz: "ISN, tashqi savdo, hududlar, hisobot shakllari va demografiya bo'yicha ochiq API", ru: "Открытый API: ИПЦ, внешняя торговля, регионы, формы отчётности и демография" },
    route: "/developers", icon: Webhook, duration: T.oneMin, users: "all", access: "login",
    price: { uz: "Bepul; kunlik so'rov limiti bor. Kalit kabinetda olinadi", ru: "Бесплатно; есть дневной лимит запросов. Ключ — в кабинете" },
    howItWorks: [STEP.login, { uz: "Kabinetda API kalitini oling", ru: "Получите API-ключ в кабинете" }, { uz: "Hujjat bo'yicha so'rov yuboring", ru: "Отправляйте запросы по документации" }],
    keywords: ["api", "dasturchi", "json"],
  },
  {
    ...base, number: 1202, sphere: 12, subcategory: "download", featured: true,
    title: { uz: "Mavzuli panellar", ru: "Тематические панели" },
    description: { uz: "Iqtisodiyot, mehnat bozori va aholi bo'yicha asosiy ko'rsatkichlar, ulashish va embed", ru: "Ключевые показатели экономики, рынка труда и населения, публикация и встраивание" },
    route: "/dashboards", icon: LayoutDashboard, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.result],
  },
  {
    ...base, number: 1203, sphere: 12, subcategory: "download",
    title: { uz: "E'lonlar kalendari", ru: "Календарь публикаций" },
    description: { uz: "Qaysi ko'rsatkich qachon e'lon qilinadi; .ics eksport", ru: "Когда публикуется каждый показатель; экспорт .ics" },
    route: "/release-calendar", icon: CalendarDays, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open, STEP.result],
  },
  {
    ...base, number: 1204, sphere: 12, subcategory: "download",
    title: { uz: "Ko'rsatkichlarga obuna", ru: "Подписка на показатели" },
    description: { uz: "Ko'rsatkich yangilanganda xabarnoma olish", ru: "Уведомление при обновлении показателя" },
    route: "/cabinet?tab=subscriptions", icon: BellRing, duration: T.oneMin, users: "all", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, STEP.cabinet, { uz: "Ko'rsatkichni tanlab obuna bo'ling", ru: "Выберите показатель и подпишитесь" }],
  },

  // 13. Fuqarolar uchun
  {
    ...base, number: 1301, sphere: 13, featured: true,
    title: { uz: "Savol bering", ru: "Задать вопрос" },
    description: { uz: "Statistik ma'lumot bo'yicha savol yuboring; ochiq javoblar ro'yxati", ru: "Задайте вопрос о статистических данных; список открытых ответов" },
    route: "/answers", icon: MessageCircleQuestion, duration: T.days, users: "all", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, STEP.apply, STEP.wait], actionType: "apply",
  },
  {
    ...base, number: 1302, sphere: 13, featured: true,
    title: { uz: "So'rovnomalar", ru: "Опросы" },
    description: { uz: "Aholi so'rovnomalarida qatnashish va natijalarni ko'rish", ru: "Участие в опросах населения и просмотр результатов" },
    route: "/surveys", icon: Vote, duration: T.threeMin, users: "all", access: "login",
    price: { uz: "Bepul; natijalar ochiq, qatnashish — ro'yxatdan o'tgach", ru: "Бесплатно; результаты открыты, участие — после регистрации" },
    howItWorks: [STEP.open, { uz: "So'rovnomani tanlang va javob bering", ru: "Выберите опрос и ответьте" }, STEP.result],
  },
  {
    ...base, number: 1303, sphere: 13,
    title: { uz: "Statistika oddiy tilda", ru: "Статистика простым языком" },
    description: { uz: "Statistik tushunchalar haqida qisqa maqolalar", ru: "Короткие статьи о статистических понятиях" },
    route: "/learn", icon: BookOpen, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open],
  },
  {
    ...base, number: 1304, sphere: 13,
    title: { uz: "Fuqarolar markazi", ru: "Центр для граждан" },
    description: { uz: "Fuqarolar uchun barcha bepul xizmatlar bir sahifada", ru: "Все бесплатные услуги для граждан на одной странице" },
    route: "/citizens", icon: UserCheck, duration: T.instant, users: "all", access: "open", price: T.free,
    howItWorks: [STEP.open],
  },

  // 14. Tariflar va shartnomalar
  {
    ...base, number: 1401, sphere: 14, subcategory: "packages", featured: true,
    title: { uz: "Tarif paketlari va narx kalkulyatori", ru: "Тарифные пакеты и калькулятор цены" },
    description: { uz: "1–4-tariflarni taqqoslash, sektor bo'yicha narx va mos paketni tanlash", ru: "Сравнение тарифов 1–4, цена по сектору и подбор пакета" },
    route: "/tariffs", icon: Calculator, duration: T.threeMin, users: "legal", access: "priced",
    price: { uz: "BHM soni korxonaning sektori (OKED) bo'yicha; paket 365 kun amal qiladi", ru: "Количество БРВ по сектору предприятия (ОКЭД); пакет действует 365 дней" },
    requiredDocs: { uz: "Korxona STIR raqami (shartnoma uchun)", ru: "ИНН предприятия (для договора)" },
    howItWorks: [{ uz: "Tariflarni taqqoslang", ru: "Сравните тарифы" }, STEP.login, { uz: "Shartnoma tuzib DIDOX'da imzolang", ru: "Заключите договор и подпишите в DIDOX" }, { uz: "To'lovdan keyin paket faollashadi", ru: "После оплаты пакет активируется" }],
    actionType: "apply", keywords: ["tarif", "paket", "narx"],
  },
  {
    ...base, number: 1402, sphere: 14, subcategory: "consultation", featured: true,
    title: { uz: "Konsultatsiya", ru: "Консультация" },
    description: { uz: "Statistika mutaxassisi bilan onlayn uchrashuv band qilish", ru: "Запись на онлайн-встречу со специалистом по статистике" },
    route: "/consultation", icon: Users, duration: T.threeMin, users: "legal", access: "package",
    price: pkg("1/2/5/10 ta"), howItWorks: [STEP.open, { uz: "Mutaxassis va bo'sh vaqtni tanlang", ru: "Выберите специалиста и время" }, STEP.login, { uz: "Band qilishni tasdiqlang", ru: "Подтвердите запись" }],
    actionType: "apply",
  },
  {
    ...base, number: 1403, sphere: 14, subcategory: "packages",
    title: { uz: "Shartnomalar", ru: "Договоры" },
    description: { uz: "Shartnoma holati, oldindan ko'rish va DIDOX imzosi", ru: "Статус договора, предпросмотр и подпись в DIDOX" },
    route: "/cabinet?tab=contracts", icon: FileSignature, duration: T.instant, users: "legal", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, STEP.cabinet, STEP.result],
  },
  {
    ...base, number: 1404, sphere: 14, subcategory: "packages",
    title: { uz: "Hamyon", ru: "Кошелёк" },
    description: { uz: "Korxona profilini ochish va xizmatlar uchun so'mdagi balans va tarix", ru: "Баланс в сумах и история для открытия профилей и услуг" },
    route: "/cabinet?tab=credits", icon: Coins, duration: T.instant, users: "all", access: "login", price: T.freeLogin,
    howItWorks: [STEP.login, STEP.cabinet, STEP.result],
  },
];

export const serviceByNumber = (n: number) => SERVICES.find((s) => s.number === n);

/** Soha xizmatlari: o'z xizmatlari, keyin `alsoIn` orqali kelganlari. */
export function servicesOfSphere(sphereId: number): ServiceCatalogItem[] {
  return [
    ...SERVICES.filter((s) => s.sphere === sphereId),
    ...SERVICES.filter((s) => s.alsoIn?.includes(sphereId)),
  ];
}

/** Soha kartochkasidagi 2 ta xizmat. */
export function featuredOfSphere(sphereId: number): ServiceCatalogItem[] {
  const all = servicesOfSphere(sphereId).filter((s) => s.status === "live");
  const featured = all.filter((s) => s.featured);
  return [...featured, ...all.filter((s) => !s.featured)].slice(0, 2);
}

export const POPULAR = SERVICES.filter((s) => s.popularOrder).sort((a, b) => a.popularOrder! - b.popularOrder!);

/** Joriy sahifaga mos xizmat (breadcrumb va "#raqam haqida" qatori uchun). */
export function serviceForPath(pathname: string, search = ""): ServiceCatalogItem | undefined {
  const tab = new URLSearchParams(search).get("tab");
  const full = tab ? `${pathname}?tab=${tab}` : pathname;
  return SERVICES.find((s) => s.status === "live" && s.route === full)
    ?? SERVICES.find((s) => s.status === "live" && !s.route.includes("?") && s.route === pathname);
}

/** Qidiruv uchun: kichik harf, tutuq belgilarisiz. */
export const normalizeQuery = (s: string) => s.toLowerCase().replace(/[‘’ʼʻ`'"«»]/g, "").replace(/\s+/g, " ").trim();

const FREE: Access[] = ["open", "login"];

/** Soha sahifasi va qidiruv filtrlari: foydalanuvchi turi, narx (bepul/pullik) va matn (uz/ru, raqam, kalit so'zlar). */
export function matchesFilters(s: ServiceCatalogItem, user: string | null, price: string | null, q: string): boolean {
  if (user === "legal" && s.users === "individual") return false;
  if (user === "individual" && s.users === "legal") return false;
  if (price === "free" && !FREE.includes(s.access)) return false;
  if (price === "paid" && FREE.includes(s.access)) return false;
  if (q) {
    const text = [s.title, s.description].map((x) => `${translate(x, "uz")} ${translate(x, "ru")} ${translate(x, "cry")}`).join(" ");
    const hay = normalizeQuery(`${text} ${s.number} ${(s.keywords ?? []).join(" ")}`);
    if (!normalizeQuery(q).split(" ").every((w) => hay.includes(w))) return false;
  }
  return true;
}
