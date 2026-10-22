import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";
import { useAuth } from "../../contexts/AuthContext";
import { useNotifications } from "../../contexts/NotificationsContext";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { loginUrl } from "../../utils/loginRedirect";

/** Hujjat varag'i + belgi (my.gov.uz illyustratsiyasi o'rnida, CSS bilan chizilgan). */
function DocArt() {
  return (
    <div className="relative hidden h-32 w-36 shrink-0 sm:block" aria-hidden="true">
      <span className="absolute inset-2 rounded-full bg-white/50" />
      <span className="absolute left-4 top-6 h-24 w-20 -rotate-6 rounded-lg bg-white shadow-md dark:bg-gray-700" />
      <span className="absolute left-9 top-3 flex h-24 w-20 flex-col gap-2 rounded-lg bg-white p-3 shadow-lg dark:bg-gray-600">
        <span className="h-1.5 w-10 rounded bg-slate-500" />
        <span className="h-1 w-12 rounded bg-slate-200" />
        <span className="h-1 w-9 rounded bg-slate-200" />
        <span className="h-1 w-11 rounded bg-slate-200" />
      </span>
      <span className="absolute right-3 top-0 flex h-8 w-8 items-center justify-center rounded-full bg-[rgb(var(--ds-brand))] text-white">
        <Check className="h-4 w-4" />
      </span>
    </div>
  );
}

function BellArt({ count }: { count: number }) {
  return (
    <div className="relative hidden h-32 w-40 shrink-0 sm:block" aria-hidden="true">
      <span className="absolute inset-3 rounded-full bg-white/50" />
      <span className="absolute left-2 top-8 flex h-9 w-32 items-center gap-2 rounded-xl bg-white px-3 shadow-md dark:bg-gray-600">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-500" /><span className="h-1.5 w-16 rounded bg-slate-200" />
      </span>
      <span className="absolute left-6 top-[4.5rem] flex h-9 w-32 items-center gap-2 rounded-xl bg-white px-3 shadow-md dark:bg-gray-600">
        <span className="h-2.5 w-2.5 rounded-full bg-slate-400" /><span className="h-1.5 w-16 rounded bg-slate-200" />
      </span>
      {count > 0 && (
        <span className="absolute right-4 top-0 flex h-8 min-w-8 items-center justify-center rounded-full bg-[rgb(var(--ds-brand))] px-2 text-sm font-semibold text-white">
          {count > 99 ? "99+" : count}
        </span>
      )}
    </div>
  );
}

/**
 * MG-05: shaxsiy bloklar — my.gov.uz dagi "Elektron hujjatlaringiz" va "Shaxsiy xabarnomalar" o'rnida.
 * Yuridik shaxs va mehmon: "Hisobotlarim"; jismoniy shaxs: "Savollarim". Mehmon bosganda login'ga yuboriladi.
 */
export default function PersonalBlocks() {
  const { t } = useLang();
  const { isAuthenticated, user } = useAuth();
  const { unreadCount } = useNotifications();
  const citizen = user?.type === "individual";
  const first = citizen
    ? { title: UI.myQuestions, text: UI.myQuestionsText, to: "/cabinet?tab=questions" }
    : { title: UI.myReports, text: UI.myReportsText, to: "/cabinet?tab=reports" };
  const href = (to: string) => (isAuthenticated ? to : loginUrl(to));

  const card = "flex items-center justify-between gap-4 rounded-mg bg-[rgb(var(--ds-panel))] px-6 py-6 sm:min-h-[174px] sm:px-8 sm:py-3";
  return (
    <div className="grid gap-5 md:grid-cols-2">
      <section className={card} aria-labelledby="pb-first">
        <div>
          <h2 id="pb-first" className="mb-2 text-[21px] font-bold leading-tight text-mg-heading">{t(first.title)}</h2>
          <p className="max-w-xs text-base text-mg-muted">{t(first.text)}</p>
          <Link to={href(first.to)} className="mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-[rgb(var(--ds-on-panel))] hover:underline">
            {t(UI.more)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <DocArt />
      </section>
      <section className={card} aria-labelledby="pb-notif">
        <div>
          <h2 id="pb-notif" className="mb-2 text-[21px] font-bold leading-tight text-mg-heading">{t(UI.notifications)}</h2>
          <p className="max-w-xs text-base text-mg-muted">{t(UI.notificationsText)}</p>
          <Link to={href("/cabinet?tab=notifications")} className="mt-4 inline-flex items-center gap-2 text-[15px] font-semibold text-[rgb(var(--ds-on-panel))] hover:underline">
            {t(UI.more)} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
        <BellArt count={isAuthenticated ? unreadCount : 0} />
      </section>
    </div>
  );
}
