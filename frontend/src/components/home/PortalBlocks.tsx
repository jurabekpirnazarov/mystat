import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, BadgeCheck, BellRing, Database, Star, UserRound, Wallet, Users, Layers, LineChart } from "lucide-react";
import axiosT from "../../api/baseUrl";
import { banner_stat } from "../../api/apiUrls";
import { SERVICES } from "../../config/serviceCatalog";
import { useLang, type I18nText } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { useServiceStats } from "../catalog/useServiceStats";

const FEATURES: { icon: typeof Star; title: I18nText; text: I18nText }[] = [
  { icon: UserRound, title: { uz: "Shaxsiy kabinet", ru: "Личный кабинет" }, text: { uz: "Shartnomalar, paket limitlari, hisobotlar va buyurtmalar bir joyda.", ru: "Договоры, лимиты пакета, отчёты и заказы в одном месте." } },
  { icon: Database, title: { uz: "Ochiq ma'lumotlar", ru: "Открытые данные" }, text: { uz: "Rasmiy ko'rsatkichlarni ko'rish, yuklab olish va API orqali olish.", ru: "Официальные показатели: просмотр, выгрузка и API." } },
  { icon: BellRing, title: { uz: "Xabarnomalar", ru: "Уведомления" }, text: { uz: "Hisobot muddatlari va ko'rsatkichlar yangilanishi haqida eslatmalar.", ru: "Напоминания о сроках отчётов и обновлениях показателей." } },
  { icon: Star, title: { uz: "Xizmatlarni baholash", ru: "Оценка услуг" }, text: { uz: "Xizmat sifatini baholang, sharh qoldiring va taklif bildiring.", ru: "Оценивайте качество услуг, оставляйте отзывы и предложения." } },
  { icon: Wallet, title: { uz: "Onlayn to'lov", ru: "Онлайн-оплата" }, text: { uz: "Statistik nashrlarni Click orqali onlayn buyurtma qilish va to'lash.", ru: "Заказ и онлайн-оплата статистических изданий через Click." } },
  { icon: BadgeCheck, title: { uz: "Kontragentni tekshirish", ru: "Проверка контрагента" }, text: { uz: "Korxona kartasi va statistik kodlar ma'lumotnomasini bepul olish.", ru: "Бесплатная карточка предприятия и справка о статистических кодах." } },
];

/** MG-00: "Portal imkoniyatlari" — ikonka, sarlavha va qisqa izoh, 2 ustun. */
export function PortalFeatures() {
  const { t } = useLang();
  return (
    <div className="grid gap-x-12 gap-y-7 rounded-mg border border-mg-border bg-mg-surface p-6 sm:p-8 md:grid-cols-2">
      {FEATURES.map(({ icon: Icon, title, text }) => (
        <div key={t(title)}>
          <Icon className="h-7 w-7 text-[rgb(var(--ds-on-panel-muted))]" aria-hidden="true" />
          <h3 className="mt-2 text-base font-bold text-black dark:text-white">{t(title)}</h3>
          <p className="mt-0.5 text-sm leading-relaxed text-mg-text">{t(text)}</p>
        </div>
      ))}
    </div>
  );
}

/** MG-00: "Portal imkoniyatlarini raqamlarda kashf eting" — haqiqiy raqamlar, batafsili `/statistics` da (MG-13). */
export function PortalNumbers() {
  const { t } = useLang();
  const [users, setUsers] = useState<number | null>(null);
  const { items } = useServiceStats();
  useEffect(() => {
    axiosT.get<{ users_count: number }>(banner_stat).then((r) => setUsers(r.data.users_count)).catch(() => setUsers(null));
  }, []);
  const live = SERVICES.filter((s) => s.status === "live").length;
  const usage = Object.values(items).reduce((n, x) => n + x.usage, 0);
  const stats = [
    { icon: Users, value: users !== null ? users.toLocaleString("ru-RU") : "—", label: t({ uz: "Foydalanuvchilar", ru: "Пользователи" }) },
    { icon: Layers, value: String(live), label: t({ uz: "Onlayn xizmat", ru: "Онлайн-услуг" }) },
    { icon: LineChart, value: usage ? usage.toLocaleString("ru-RU") : "—", label: t({ uz: "Xizmatdan foydalanish", ru: "Использований услуг" }) },
  ];
  // Ixcham, bir qatorli: matn va tugma chapda, uch raqam o'ngda (avval 3 ta katta plitka ~560 px joy olardi)
  return (
    <section aria-labelledby="home-numbers" className="grid items-center gap-6 rounded-mg border border-[rgb(var(--ds-panel-line))] bg-[rgb(var(--ds-panel))] p-5 sm:p-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,3fr)]">
      <div>
        <h2 id="home-numbers" className="text-xl font-bold leading-snug text-mg-heading sm:text-2xl">{t(UI.inNumbers)}</h2>
        <p className="mt-2 text-sm text-[rgb(var(--ds-on-panel-muted))] sm:text-base">{t(UI.inNumbersText)}</p>
        <Link to="/statistics" className="mt-4 inline-flex items-center gap-2 rounded-mg bg-[rgb(var(--ds-brand))] px-4 py-2 text-sm font-medium text-white hover:brightness-125">
          {t(UI.learnMore)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <dl className="grid grid-cols-3 gap-2 sm:gap-3">
        {stats.map(({ icon: Icon, value, label }) => (
          <div key={label} className="flex min-w-0 flex-col rounded-mg border border-mg-border bg-mg-surface p-3 sm:p-4">
            <Icon className="h-5 w-5 text-[rgb(var(--ds-on-panel-muted))]" aria-hidden="true" />
            <dd className="order-2 mt-2 text-xl font-bold tabular-nums leading-7 text-mg-heading sm:text-[28px] sm:leading-8">{value}</dd>
            <dt className="order-3 mt-0.5 text-[11px] leading-tight text-mg-muted sm:text-xs">{label}</dt>
          </div>
        ))}
      </dl>
    </section>
  );
}
