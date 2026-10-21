import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { X } from "lucide-react";
import { postTypoReport } from "../../api/portal";
import { useLang } from "../../i18n/LangContext";

/** MG-11: matnni belgilab Ctrl+Enter — "Matndagi xato" oynasi. Sahifa manzili va til avtomatik yuboriladi. */
export default function TypoReporter() {
  const { pathname } = useLocation();
  const { t, lang } = useLang();
  const [text, setText] = useState<string | null>(null);
  const [comment, setComment] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!(e.ctrlKey || e.metaKey) || e.key !== "Enter") return;
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "TEXTAREA" || target.tagName === "INPUT")) return;
      const selected = window.getSelection()?.toString().trim();
      if (!selected) return;
      e.preventDefault();
      setText(selected.slice(0, 1000));
      setComment("");
      setSent(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  if (text === null) return null;
  const close = () => setText(null);

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="dialog" aria-modal="true"
      aria-labelledby="typo-title" onKeyDown={(e) => e.key === "Escape" && close()}>
      <button type="button" aria-label={t({ uz: "Yopish", ru: "Закрыть" })} onClick={close} className="absolute inset-0 bg-slate-900/40" />
      <div className="relative w-full max-w-lg rounded-mg bg-mg-surface p-6 shadow-xl">
        <button type="button" onClick={close} aria-label={t({ uz: "Yopish", ru: "Закрыть" })} className="absolute right-3 top-3 rounded-lg p-1.5 text-mg-muted hover:bg-mg-info">
          <X className="h-5 w-5" aria-hidden="true" />
        </button>
        <h2 id="typo-title" className="text-lg font-bold text-mg-heading">{t({ uz: "Matndagi xato", ru: "Ошибка в тексте" })}</h2>
        {sent ? (
          <p className="mt-4 text-sm text-mg-success">{t({ uz: "Rahmat! Xabaringiz ma'muriyatga yuborildi.", ru: "Спасибо! Сообщение отправлено администрации." })}</p>
        ) : (
          <form className="mt-4 space-y-3" onSubmit={(e) => {
            e.preventDefault();
            void postTypoReport({ path: pathname, text, comment: comment.trim(), lang }).catch(() => undefined);
            setSent(true);
          }}>
            <blockquote className="max-h-32 overflow-auto rounded-lg bg-mg-info p-3 text-sm text-mg-text">{text}</blockquote>
            <label htmlFor="typo-comment" className="block text-sm text-mg-text">{t({ uz: "Izoh (ixtiyoriy)", ru: "Комментарий (необязательно)" })}</label>
            <textarea id="typo-comment" autoFocus rows={3} maxLength={500} value={comment} onChange={(e) => setComment(e.target.value)}
              className="w-full rounded-[10px] border border-mg-border bg-mg-surface p-3 text-sm text-mg-text" />
            <button type="submit" className="rounded-[10px] bg-mg-primary px-5 py-2 text-sm font-medium text-white">{t({ uz: "Yuborish", ru: "Отправить" })}</button>
          </form>
        )}
      </div>
    </div>
  );
}
