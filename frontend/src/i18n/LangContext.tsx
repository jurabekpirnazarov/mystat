import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { toCyrillic } from "./translit";

/**
 * MG-02/MG-03: interfeys tili. uz — lotin (asosiy), cry — kirill (lotindan avtomatik), ru — rus (bo'lmasa uz).
 * URL'dagi ixtiyoriy prefiks (`/ru/...`) tilni o'rnatadi (App.tsx → Shell); tanlov localStorage'da saqlanadi.
 */
export type Lang = "uz" | "cry" | "ru";
export const LANGS: { code: Lang; label: string; short: string }[] = [
  { code: "uz", label: "O'zbekcha", short: "O'z" },
  { code: "cry", label: "Ўзбекча", short: "Ўз" },
  { code: "ru", label: "Русский", short: "Ру" },
];
export const isLang = (v: string | undefined): v is Lang => v === "uz" || v === "cry" || v === "ru";

/** Ko'p tilli matn: uz majburiy, ru ixtiyoriy (bo'lmasa uz), cry har doim uz dan. */
export type I18nText = string | { uz: string; ru?: string };

const STORAGE_KEY = "lang";

function readStored(): Lang {
  try {
    const v = localStorage.getItem(STORAGE_KEY) ?? undefined;
    return isLang(v) ? v : "uz";
  } catch {
    return "uz";
  }
}

export function translate(text: I18nText, lang: Lang): string {
  const t = typeof text === "string" ? { uz: text } : text;
  if (lang === "ru") return t.ru ?? t.uz;
  if (lang === "cry") return toCyrillic(t.uz);
  return t.uz;
}

interface LangValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (text: I18nText) => string;
}

const Ctx = createContext<LangValue | null>(null);

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(readStored);
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(STORAGE_KEY, l);
    } catch {
      /* xotira yopiq — til faqat shu sessiyada */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang === "ru" ? "ru" : lang === "cry" ? "uz-Cyrl" : "uz";
  }, [lang]);
  const t = useCallback((text: I18nText) => translate(text, lang), [lang]);
  const value = useMemo(() => ({ lang, setLang, t }), [lang, setLang, t]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useLang(): LangValue {
  const v = useContext(Ctx);
  if (!v) throw new Error("useLang LangProvider ichida ishlatilishi kerak");
  return v;
}
