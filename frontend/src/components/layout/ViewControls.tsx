import { useEffect, useState } from "react";
import { Contrast } from "lucide-react";

const SCALES = [100, 115, 130] as const;
const SCALE_KEY = "font-scale";
const CONTRAST_KEY = "a11y-contrast";

const read = (key: string) => {
  try { return localStorage.getItem(key); } catch { return null; }
};
const write = (key: string, value: string) => {
  try { localStorage.setItem(key, value); } catch { /* xotira yopiq */ }
};

/** LX-01: "Ko'rinish" + A A A (100 / 115 / 130 %, `aria-pressed`) va kontrast tugmasi. Tanlov sahifalar orasida saqlanadi. */
export default function ViewControls({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const [scale, setScale] = useState<number>(() => {
    const v = Number(read(SCALE_KEY));
    return (SCALES as readonly number[]).includes(v) ? v : 100;
  });
  const [contrast, setContrast] = useState(() => read(CONTRAST_KEY) === "1");

  useEffect(() => {
    const root = document.documentElement;
    root.style.fontSize = scale === 100 ? "" : `${scale}%`;
    if (scale === 100) root.removeAttribute("data-font-scale");
    else root.setAttribute("data-font-scale", String(scale));
    write(SCALE_KEY, String(scale));
  }, [scale]);

  useEffect(() => {
    const root = document.documentElement;
    if (contrast) root.setAttribute("data-contrast", "high");
    else root.removeAttribute("data-contrast");
    write(CONTRAST_KEY, contrast ? "1" : "0");
  }, [contrast]);

  const base = tone === "dark" ? "text-white/90 hover:bg-white/15" : "text-mg-text hover:bg-mg-info";
  const on = tone === "dark" ? "bg-white text-[rgb(var(--ds-ink))]" : "bg-mg-primary text-white";
  return (
    <div className="flex items-center gap-1" role="group" aria-label="Ko'rinish">
      <span className="mr-1 text-xs opacity-80">Ko'rinish</span>
      {SCALES.map((s, i) => (
        <button key={s} type="button" aria-pressed={scale === s} aria-label={`Matn o'lchami ${s}%`} title={`${s}%`} onClick={() => setScale(s)}
          className={`flex h-7 min-w-[28px] items-center justify-center rounded font-semibold ${scale === s ? on : base}`} style={{ fontSize: `${12 + i * 2}px` }}>
          A
        </button>
      ))}
      <button type="button" aria-pressed={contrast} aria-label="Yuqori kontrast" title="Yuqori kontrast" onClick={() => setContrast((v) => !v)}
        className={`flex h-7 w-7 items-center justify-center rounded ${contrast ? on : base}`}>
        <Contrast className="h-4 w-4" aria-hidden="true" />
      </button>
    </div>
  );
}
