import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { fetchPageFeedback, postPageFeedback } from "../../api/portal";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";

const sentKey = (path: string) => `page-feedback:${path}:${new Date().toISOString().slice(0, 10)}`;

function wasSent(path: string) {
  try {
    return localStorage.getItem(sentKey(path)) === "1";
  } catch {
    return false;
  }
}

/**
 * MG-11: har sahifa oxirida "Sahifadagi kontent sizga ma'qul keldimi?" — Ha / Yo'q, "Yo'q" da ixtiyoriy izoh.
 * Bir sahifaga bir brauzerdan kuniga bir marta (brauzer xotirasi + backend IP cheklovi).
 */
export default function PageFeedback() {
  const { pathname } = useLocation();
  const { t, lang } = useLang();
  const [likes, setLikes] = useState<number | null>(null);
  const [state, setState] = useState<"idle" | "comment" | "sent">(() => (wasSent(pathname) ? "sent" : "idle"));
  const [comment, setComment] = useState("");

  useEffect(() => {
    setState(wasSent(pathname) ? "sent" : "idle");
    setComment("");
    let alive = true;
    fetchPageFeedback(pathname).then((r) => alive && setLikes(r.likes)).catch(() => alive && setLikes(null));
    return () => {
      alive = false;
    };
  }, [pathname]);

  const send = (liked: boolean, text = "") => {
    void postPageFeedback({ path: pathname, liked, comment: text, lang }).catch(() => undefined);
    try {
      localStorage.setItem(sentKey(pathname), "1");
    } catch {
      /* xotira yopiq */
    }
    if (liked) setLikes((n) => (n ?? 0) + 1);
    setState("sent");
  };

  const built = new Date(__BUILD_DATE__);
  const btn = "inline-flex items-center gap-2 rounded-[10px] border border-[rgb(var(--ds-panel-line))] bg-mg-surface px-4 py-1.5 text-sm font-medium text-mg-text hover:bg-[rgb(var(--ds-panel))]";

  return (
    <section aria-label={t(UI.feedbackQuestion)} className="mt-12 border-t border-transparent pb-6">
      <p className="mb-6 text-right text-sm text-mg-text">
        {t(UI.lastUpdate)}: {built.toLocaleDateString("ru-RU")} {built.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
      </p>
      <p className="pb-3 text-[17px] font-medium text-mg-muted">{t(UI.feedbackQuestion)}</p>
      {state === "idle" && (
        <div className="flex gap-2">
          <button type="button" className={btn} onClick={() => send(true)}>{t(UI.yes)} <ThumbsUp className="h-4 w-4" aria-hidden="true" /></button>
          <button type="button" className={btn} onClick={() => setState("comment")}>{t(UI.no)} <ThumbsDown className="h-4 w-4" aria-hidden="true" /></button>
        </div>
      )}
      {state === "comment" && (
        <form className="max-w-xl space-y-2" onSubmit={(e) => { e.preventDefault(); send(false, comment.trim()); }}>
          <label htmlFor="page-feedback-comment" className="block text-sm text-mg-text">
            {t({ uz: "Nima yetishmadi? (ixtiyoriy)", ru: "Чего не хватило? (необязательно)" })}
          </label>
          <textarea id="page-feedback-comment" value={comment} maxLength={500} rows={3} onChange={(e) => setComment(e.target.value)}
            className="w-full rounded-[10px] border border-mg-border bg-mg-surface p-3 text-sm text-mg-text" />
          <div className="flex gap-2">
            <button type="submit" className="rounded-[10px] bg-[rgb(var(--ds-brand))] px-4 py-1.5 text-sm font-medium text-white">{t({ uz: "Yuborish", ru: "Отправить" })}</button>
            <button type="button" className={btn} onClick={() => setState("idle")}>{t({ uz: "Bekor qilish", ru: "Отмена" })}</button>
          </div>
        </form>
      )}
      {state === "sent" && <p className="text-sm text-mg-success">{t({ uz: "Rahmat! Fikringiz qabul qilindi.", ru: "Спасибо! Ваш отзыв принят." })}</p>}
      {likes !== null && likes > 0 && (
        <p className="mt-3 text-[15px] font-medium text-mg-muted">
          {t({ uz: `${likes} kishi bu sahifadagi kontentni ma'qul deb topdi`, ru: `${likes} человек(а) оценили содержимое страницы` })}
        </p>
      )}
    </section>
  );
}
