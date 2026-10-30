import { useCallback, useEffect, useRef, useState } from "react";
import { Accessibility, Moon, Sun } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { useLang } from "../../i18n/LangContext";
import { UI } from "../../i18n/ui";
import { useDismiss } from "./useDismiss";

const SCALES = [100, 112.5, 125, 150];
const KEY = "font-scale";
/** GV-06: qo'shimcha rejimlar `<html data-*>` atributlari orqali (stillar `theme/a11y.css` da). */
const MODES = [
  { key: "a11y-contrast", attr: "data-contrast", on: "high", label: { uz: "Yuqori kontrast", ru: "Высокий контраст" } },
  { key: "a11y-grayscale", attr: "data-grayscale", on: "on", label: { uz: "Rangsiz rejim", ru: "Без цвета" } },
  { key: "a11y-motion", attr: "data-motion", on: "reduce", label: { uz: "Animatsiyasiz", ru: "Без анимации" } },
] as const;

function readFlag(key: string) {
  try {
    return localStorage.getItem(key) === "1";
  } catch {
    return false;
  }
}

function readScale() {
  try {
    const v = Number(localStorage.getItem(KEY));
    return SCALES.includes(v) ? v : 100;
  } catch {
    return 100;
  }
}

/** MG-03: my.gov.uz dagi "maxsus imkoniyatlar" tugmasi o'rnida — shrift o'lchami va tungi rejim. */
export default function AccessibilityMenu() {
  const { t } = useLang();
  const { theme, toggleTheme } = useTheme();
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(readScale);
  const [flags, setFlags] = useState<Record<string, boolean>>(() => Object.fromEntries(MODES.map((m) => [m.key, readFlag(m.key)])));
  const ref = useRef<HTMLDivElement>(null);
  const close = useCallback(() => setOpen(false), []);
  useDismiss(ref, open, close);

  useEffect(() => {
    document.documentElement.style.fontSize = scale === 100 ? "" : `${scale}%`;
    try {
      localStorage.setItem(KEY, String(scale));
    } catch {
      /* xotira yopiq */
    }
  }, [scale]);

  useEffect(() => {
    const root = document.documentElement;
    for (const m of MODES) {
      if (flags[m.key]) root.setAttribute(m.attr, m.on);
      else root.removeAttribute(m.attr);
      try {
        localStorage.setItem(m.key, flags[m.key] ? "1" : "0");
      } catch {
        /* xotira yopiq */
      }
    }
  }, [flags]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="dialog" aria-expanded={open}
        aria-label={t(UI.accessibility)} title={t(UI.accessibility)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-mg-primary hover:bg-mg-info">
        <Accessibility className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div role="dialog" aria-label={t(UI.accessibility)}
          className="absolute right-0 top-full z-50 mt-2 w-72 rounded-mg border border-mg-border bg-mg-surface p-4 shadow-lg">
          <p className="text-sm font-semibold text-mg-heading">{t(UI.fontSize)}</p>
          <div className="mt-2 flex gap-2">
            {SCALES.map((s, i) => (
              <button key={s} type="button" onClick={() => setScale(s)} aria-pressed={scale === s}
                className={`flex-1 rounded-lg border py-1.5 font-semibold ${scale === s ? "border-mg-primary bg-mg-info text-mg-primary" : "border-mg-border text-mg-text"}`}
                style={{ fontSize: `${12 + i * 2.5}px` }}>
                A
              </button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {MODES.map((m) => (
              <button key={m.key} type="button" aria-pressed={flags[m.key]} onClick={() => setFlags((f) => ({ ...f, [m.key]: !f[m.key] }))}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${flags[m.key] ? "border-mg-primary bg-mg-info text-mg-primary" : "border-mg-border text-mg-text hover:bg-mg-info"}`}>
                {t(m.label)}
                <span aria-hidden="true" className="text-xs font-semibold">{flags[m.key] ? "ON" : "OFF"}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={toggleTheme}
            className="mt-2 flex w-full items-center justify-between rounded-lg border border-mg-border px-3 py-2 text-sm text-mg-text hover:bg-mg-info">
            {t(UI.darkMode)}
            {theme === "dark" ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  );
}
