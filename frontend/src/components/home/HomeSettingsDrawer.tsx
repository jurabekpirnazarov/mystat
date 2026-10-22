import { useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, X } from "lucide-react";
import { CARD_BY_KEY, MAX_CARDS, MIN_CARDS, type WidgetKey } from "../../config/homeWidgets";
import type { HomeLayoutApi } from "../../hooks/useHomeLayout";
import { useLang } from "../../i18n/LangContext";
import RegionSelect from "./RegionSelect";

function Switch({ checked, onChange, label, disabled }: { checked: boolean; onChange: () => void; label: string; disabled?: boolean }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} aria-disabled={disabled || undefined}
      onClick={() => !disabled && onChange()}
      className={`relative h-6 w-11 shrink-0 rounded-full transition ${checked ? "bg-mg-primary" : "bg-mg-border"} ${disabled ? "opacity-50" : ""}`}>
      <span className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all ${checked ? "left-[22px]" : "left-0.5"}`} />
    </button>
  );
}

function Mover({ onMove, first, last, label }: { onMove: (d: -1 | 1) => void; first: boolean; last: boolean; label: string }) {
  const cls = "rounded p-1 text-mg-muted hover:bg-mg-info disabled:opacity-30";
  return (
    <span className="flex">
      <button type="button" className={cls} disabled={first} onClick={() => onMove(-1)} aria-label={`${label}: yuqoriga`}><ArrowUp className="h-4 w-4" aria-hidden="true" /></button>
      <button type="button" className={cls} disabled={last} onClick={() => onMove(1)} aria-label={`${label}: pastga`}><ArrowDown className="h-4 w-4" aria-hidden="true" /></button>
    </span>
  );
}

/**
 * 6.1: "Bosh sahifani sozlash" — o'ng tomondan chiquvchi panel. Vidjet yoqish/o'chirish (`role="switch"`), tartib (↑/↓ tugmalari),
 * karta ko'rsatkichi, "Standartga qaytarish" (5 soniya ichida bekor qilinadi). Kamida 4 ta kartochka doim yoqilgan.
 * O'zgarishlar darhol sahifada ko'rinadi; `Escape` panelni yopadi va fokus "Sozlash" tugmasiga qaytadi.
 */
export default function HomeSettingsDrawer({ api, open, onClose }: { api: HomeLayoutApi; open: boolean; onClose: () => void }) {
  const { t } = useLang();
  const { layout } = api;
  const ref = useRef<HTMLDivElement>(null);
  const [note, setNote] = useState("");
  const [undo, setUndo] = useState<(() => void) | null>(null);

  useEffect(() => {
    if (!open) return;
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);
  useEffect(() => {
    if (!undo) return;
    const id = window.setTimeout(() => setUndo(null), 5000);
    return () => window.clearTimeout(id);
  }, [undo]);

  if (!open) return null;
  const widgetName = (k: WidgetKey) => (k === "map" ? t({ uz: "Karta", ru: "Карта" }) : t({ uz: "Ob-havo", ru: "Погода" }));
  const atMin = api.enabledCards <= MIN_CARDS;
  const announce = (text: string) => setNote(text);

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={t({ uz: "Bosh sahifani sozlash", ru: "Настройка главной страницы" })}
        className="flex h-full w-full max-w-md flex-col overflow-y-auto bg-mg-surface p-5 shadow-ds-popover outline-none">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-mg-heading">{t({ uz: "Bosh sahifani sozlash", ru: "Настройка главной страницы" })}</h2>
          <button type="button" onClick={onClose} aria-label={t({ uz: "Yopish", ru: "Закрыть" })} className="rounded p-1 hover:bg-mg-info"><X className="h-5 w-5" aria-hidden="true" /></button>
        </div>

        <div className="mt-4"><RegionSelect value={layout.region} onChange={api.setRegion} /></div>

        <h3 className="mt-6 text-sm font-semibold text-mg-heading">{t({ uz: "Vidjetlar", ru: "Виджеты" })}</h3>
        <ul className="mt-2 space-y-2">
          {layout.widgets.map((w, i) => (
            <li key={w.key} className="rounded-lg border border-mg-border p-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-medium text-mg-text">{widgetName(w.key)}</span>
                <span className="flex items-center gap-2">
                  <Mover label={widgetName(w.key)} first={i === 0} last={i === layout.widgets.length - 1}
                    onMove={(d) => { api.moveWidget(w.key, d); announce(`${widgetName(w.key)}: ${i + d + 1}-o'ringa ko'chirildi`); }} />
                  <Switch checked={w.enabled} onChange={() => api.toggleWidget(w.key)} label={widgetName(w.key)} />
                </span>
              </div>
              {w.key === "weather" && w.enabled && (
                <label className="mt-2 flex items-center gap-2 text-sm text-mg-muted">
                  <input type="checkbox" checked={layout.weather.forecast} onChange={(e) => api.setForecast(e.target.checked)} />
                  {t({ uz: "3 kunlik prognozni ko'rsatish", ru: "Показывать прогноз на 3 дня" })}
                </label>
              )}
            </li>
          ))}
        </ul>

        <h3 className="mt-6 flex items-center justify-between text-sm font-semibold text-mg-heading">
          <span>{t({ uz: "Ko'rsatkichlar", ru: "Показатели" })} <span className="font-normal text-mg-muted">({t({ uz: `kamida ${MIN_CARDS} ta`, ru: `минимум ${MIN_CARDS}` })})</span></span>
          <span className="tabular-nums text-mg-muted">{api.enabledCards} / {MAX_CARDS}</span>
        </h3>
        <ul className="mt-2 space-y-1">
          {layout.cards.map((c, i) => {
            const def = CARD_BY_KEY.get(c.key);
            if (!def) return null;
            const name = t({ uz: def.uz, ru: def.ru });
            const locked = c.enabled && atMin;
            return (
              <li key={c.key} className="flex items-center justify-between gap-2 rounded-lg px-2 py-1.5 hover:bg-mg-info/60">
                <span className={`text-sm ${c.enabled ? "text-mg-text" : "text-mg-muted"}`}>{name}</span>
                <span className="flex items-center gap-2">
                  <Mover label={name} first={i === 0} last={i === layout.cards.length - 1}
                    onMove={(d) => { api.moveCard(c.key, d); announce(`${name}: ${i + d + 1}-o'ringa ko'chirildi`); }} />
                  <Switch checked={c.enabled} onChange={() => api.toggleCard(c.key)} label={name} disabled={locked} />
                </span>
              </li>
            );
          })}
        </ul>
        {atMin && <p className="mt-2 text-xs text-mg-muted">{t({ uz: "Kamida 4 ta ko'rsatkich ko'rinib turadi. Boshqasini almashtirish uchun avval yangisini yoqing.", ru: "Минимум 4 показателя всегда видны. Чтобы заменить, сначала включите новый." })}</p>}

        <p role="status" aria-live="polite" className="sr-only">{note}</p>
        <p className="mt-4 text-xs text-mg-muted">{t({ uz: "Sozlamalar shu brauzerda saqlanadi.", ru: "Настройки сохраняются в этом браузере." })}</p>

        <div className="mt-auto flex items-center justify-between gap-3 pt-6">
          <button type="button" onClick={() => { const prev = layout; api.reset(); setUndo(() => () => api.restore(prev)); }}
            className="rounded-lg border border-mg-border px-3 py-2 text-sm hover:bg-mg-info">{t({ uz: "Standartga qaytarish", ru: "Сбросить" })}</button>
          <button type="button" onClick={onClose} className="rounded-lg bg-mg-primary px-4 py-2 text-sm font-semibold text-white">{t({ uz: "Tayyor", ru: "Готово" })}</button>
        </div>
        {undo && <p role="status" className="mt-3 text-xs text-mg-muted">{t({ uz: "Standart tiklandi.", ru: "Настройки сброшены." })} <button type="button" className="underline" onClick={() => { undo(); setUndo(null); }}>{t({ uz: "Bekor qilish", ru: "Отменить" })}</button></p>}
      </div>
    </div>
  );
}
