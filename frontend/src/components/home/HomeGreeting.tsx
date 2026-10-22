import { Moon, Sun, Sunrise, Sunset, type LucideIcon } from "lucide-react";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

const DAYS = {
  uz: ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"],
  ru: ["Воскресенье", "Понедельник", "Вторник", "Среда", "Четверг", "Пятница", "Суббота"],
};
const MONTHS = {
  uz: ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"],
  ru: ["января", "февраля", "марта", "апреля", "мая", "июня", "июля", "августа", "сентября", "октября", "ноября", "декабря"],
};

function partOfDay(h: number): { icon: LucideIcon; uz: string; ru: string } {
  if (h >= 5 && h < 11) return { icon: Sunrise, uz: "Xayrli tong", ru: "Доброе утро" };
  if (h >= 11 && h < 17) return { icon: Sun, uz: "Xayrli kun", ru: "Добрый день" };
  if (h >= 17 && h < 22) return { icon: Sunset, uz: "Xayrli kech", ru: "Добрый вечер" };
  return { icon: Moon, uz: "Xayrli tun", ru: "Доброй ночи" };
}

/** Hero panelidagi salom: sarlavha (h1), kun vaqtiga mos salomlashuv va bugungi sana. Dekorsiz — faqat matn va ikonka. */
export default function HomeGreeting() {
  const { t, lang } = useLang();
  const now = new Date();
  const k = lang === "ru" ? "ru" : "uz";
  const part = partOfDay(now.getHours());
  const Icon = part.icon;
  const date = `${DAYS[k][now.getDay()]}, ${now.getDate()} ${MONTHS[k][now.getMonth()]} ${now.getFullYear()}`;
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-2">
      <div className="flex items-center gap-4">
        <span aria-hidden="true" className="h-12 w-1.5 rounded-full bg-mg-primary" />
        <div>
          <p className="flex items-center gap-1.5 text-sm font-medium text-[rgb(var(--ds-on-panel-muted))]"><Icon className="h-4 w-4 text-[rgb(var(--ds-accent-strong))]" aria-hidden="true" />{t(part)}</p>
          <h1 id="hero-title" className="text-[30px] font-bold leading-9 tracking-tight text-[rgb(var(--ds-on-panel))] sm:text-[38px] sm:leading-[42px]">{t(UI.welcome)}</h1>
        </div>
      </div>
      <p className="text-sm text-[rgb(var(--ds-on-panel-muted))]">{date}</p>
    </div>
  );
}
