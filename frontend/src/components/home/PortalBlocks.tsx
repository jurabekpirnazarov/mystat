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
          <Icon className="h-7 w-7 text-mg-primary" aria-hidden="true" />
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
  const tile = "relative flex flex-col justify-end rounded-mg p-5 text-white";
  return (
    <div className="rounded-mg border border-mg-border bg-mg-surface p-6 sm:p-8">
      <h2 className="text-2xl font-bold text-black sm:text-[34px] sm:leading-tight dark:text-white">{t(UI.inNumbers)}</h2>
      <p className="mt-3 max-w-3xl text-mg-text">{t(UI.inNumbersText)}</p>
      <Link to="/statistics" className="mt-5 inline-flex items-center gap-2 rounded-mg bg-mg-primary px-5 py-2 text-sm font-medium text-white shadow-lg hover:brightness-110">
        {t(UI.learnMore)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
      </Link>
      <div className="mt-6 grid max-w-xl gap-4 sm:grid-cols-2">
        <div className={`${tile} min-h-[150px] bg-slate-400 sm:row-span-2 sm:min-h-[300px]`}>
          <Users className="absolute right-4 top-4 h-10 w-10 rounded-lg bg-white/30 p-2" aria-hidden="true" />
          <p className="text-4xl font-bold">{users !== null ? users.toLocaleString("ru-RU") : "—"}</p>
          <p className="text-lg font-semibold">{t({ uz: "Foydalanuvchilar", ru: "Пользователи" })}</p>
        </div>
        <div className={`${tile} min-h-[140px] bg-emerald-500/80`}>
          <Layers className="absolute right-4 top-4 h-10 w-10 rounded-lg bg-white/30 p-2" aria-hidden="true" />
          <p className="text-4xl font-bold">{live}</p>
          <p className="text-lg font-semibold">{t({ uz: "onlayn xizmat", ru: "онлайн-услуг" })}</p>
        </div>
        <div className={`${tile} min-h-[140px] bg-mg-primary-light/80`}>
          <LineChart className="absolute right-4 top-4 h-10 w-10 rounded-lg bg-white/30 p-2" aria-hidden="true" />
          <p className="text-4xl font-bold">{usage ? usage.toLocaleString("ru-RU") : "—"}</p>
          <p className="text-lg font-semibold">{t({ uz: "xizmatdan foydalanish", ru: "использований услуг" })}</p>
        </div>
      </div>
    </div>
  );
}
