import { useEffect, useRef, useState } from "react";
import { Accessibility, Moon, Sun } from "lucide-react";

/** Maxsus imkoniyatlar: shrift 100-150%, yuqori kontrast, rangsiz, animatsiyasiz, tungi rejim. Holat localStorage'da, `<html data-*>` orqali. */
const SCALES = [100, 112.5, 125, 150];
const MODES = [
  { key: "a11y-contrast", attr: "data-contrast", on: "high", label: "Yuqori kontrast" },
  { key: "a11y-grayscale", attr: "data-grayscale", on: "on", label: "Rangsiz rejim" },
  { key: "a11y-motion", attr: "data-motion", on: "reduce", label: "Animatsiyasiz" },
] as const;

const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const write = (k: string, v: string) => { try { localStorage.setItem(k, v); } catch { /* xotira yopiq */ } };

export default function AccessibilityMenu() {
  const [open, setOpen] = useState(false);
  const [scale, setScale] = useState(() => (SCALES.includes(Number(read("font-scale"))) ? Number(read("font-scale")) : 100));
  const [flags, setFlags] = useState<Record<string, boolean>>(() => Object.fromEntries(MODES.map((m) => [m.key, read(m.key) === "1"])));
  const [dark, setDark] = useState(() => read("theme") === "dark");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    document.documentElement.style.fontSize = scale === 100 ? "" : `${scale}%`;
    write("font-scale", String(scale));
  }, [scale]);
  useEffect(() => {
    const root = document.documentElement;
    for (const m of MODES) {
      if (flags[m.key]) root.setAttribute(m.attr, m.on); else root.removeAttribute(m.attr);
      write(m.key, flags[m.key] ? "1" : "0");
    }
  }, [flags]);
  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
    document.documentElement.setAttribute("data-theme", dark ? "dark" : "light");
    write("theme", dark ? "dark" : "light");
  }, [dark]);
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button type="button" onClick={() => setOpen((v) => !v)} aria-haspopup="dialog" aria-expanded={open} aria-label="Maxsus imkoniyatlar" title="Maxsus imkoniyatlar"
        className="flex h-9 w-9 items-center justify-center rounded-full text-mg-primary hover:bg-mg-info">
        <Accessibility className="h-5 w-5" aria-hidden="true" />
      </button>
      {open && (
        <div role="dialog" aria-label="Maxsus imkoniyatlar" className="absolute right-0 top-full z-50 mt-2 w-72 rounded-mg border border-mg-border bg-mg-surface p-4 shadow-lg">
          <p className="text-sm font-semibold text-mg-heading">Shrift o'lchami</p>
          <div className="mt-2 flex gap-2">
            {SCALES.map((s, i) => (
              <button key={s} type="button" onClick={() => setScale(s)} aria-pressed={scale === s} aria-label={`${s}%`}
                className={`flex-1 rounded-lg border py-1.5 font-semibold ${scale === s ? "border-mg-primary bg-mg-info text-mg-primary" : "border-mg-border text-mg-text"}`}
                style={{ fontSize: `${12 + i * 2.5}px` }}>A</button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            {MODES.map((m) => (
              <button key={m.key} type="button" aria-pressed={flags[m.key]} onClick={() => setFlags((f) => ({ ...f, [m.key]: !f[m.key] }))}
                className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-sm ${flags[m.key] ? "border-mg-primary bg-mg-info text-mg-primary" : "border-mg-border text-mg-text hover:bg-mg-info"}`}>
                {m.label}<span aria-hidden="true" className="text-xs font-semibold">{flags[m.key] ? "ON" : "OFF"}</span>
              </button>
            ))}
          </div>
          <button type="button" onClick={() => setDark((d) => !d)} className="mt-2 flex w-full items-center justify-between rounded-lg border border-mg-border px-3 py-2 text-sm text-mg-text hover:bg-mg-info">
            Tungi rejim {dark ? <Sun className="h-4 w-4" aria-hidden="true" /> : <Moon className="h-4 w-4" aria-hidden="true" />}
          </button>
        </div>
      )}
    </div>
  );
}
