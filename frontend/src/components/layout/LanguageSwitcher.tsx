import { useCallback, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronDown } from "lucide-react";
import { LANGS, isLang, useLang, type Lang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { useDismiss } from "./useDismiss";

/** MG-03: til almashtirgich — "O'zbekcha · Ўзбекча · Русский". URL'da til prefiksi bo'lsa, u ham almashadi. */
export default function LanguageSwitcher({ variant = "menu" }: { variant?: "menu" | "inline" }) {
  const { lang, setLang, t } = useLang();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);
  const { pathname, search, hash } = useLocation();
  const navigate = useNavigate();
  const current = LANGS.find((l) => l.code === lang)!;

  const choose = (code: Lang) => {
    setLang(code);
    setOpen(false);
    const first = pathname.split("/")[1];
    if (isLang(first)) navigate(`/${code}${pathname.slice(first.length + 1)}${search}${hash}`, { replace: true });
  };

  // LX-01: til kodlari qatorda (O'ZB · ЎЗБ · РУС), joriysi qalin va aria-current
  const CODES: Record<Lang, string> = { uz: "O'ZB", cry: "ЎЗБ", ru: "РУС" };
  const HTML_LANG: Record<Lang, string> = { uz: "uz-Latn", cry: "uz-Cyrl", ru: "ru" };
  if (variant === "inline") {
    return (
      <ul className="flex items-center gap-0.5" aria-label={t(UI.language)}>
        {LANGS.map((l) => (
          <li key={l.code}>
            <button type="button" lang={HTML_LANG[l.code]} onClick={() => choose(l.code)} aria-current={l.code === lang ? "true" : undefined}
              className={`rounded px-1.5 py-1 text-xs hover:bg-white/15 ${l.code === lang ? "font-bold underline underline-offset-4" : "font-medium opacity-85"}`}>
              {CODES[l.code]}
            </button>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="listbox" aria-expanded={open}
        aria-label={`${t(UI.language)}: ${current.label}`}
        className="flex h-9 items-center gap-1 rounded-full px-2.5 text-sm font-bold text-mg-heading hover:bg-mg-info">
        {current.short}
        <ChevronDown className={`h-4 w-4 text-mg-muted transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <ul role="listbox" aria-label={t(UI.language)}
          className="absolute right-0 top-full z-50 mt-2 w-40 overflow-hidden rounded-mg border border-mg-border bg-mg-surface py-1 shadow-lg">
          {LANGS.map((l) => (
            <li key={l.code}>
              <button type="button" role="option" aria-selected={l.code === lang} onClick={() => choose(l.code)}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-mg-info ${l.code === lang ? "font-semibold text-mg-primary" : "text-mg-text"}`}>
                {l.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
