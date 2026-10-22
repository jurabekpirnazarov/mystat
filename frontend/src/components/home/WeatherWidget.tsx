import { useEffect, useState } from "react";
import { AlertTriangle, Droplets, Wind } from "lucide-react";
import { loadWeather, type Weather, type WeatherCode } from "../../api/homeWidgets";
import { useLang } from "../../i18n/LangContext";
import WeatherIcon, { WEATHER_LABEL } from "./weatherIcons";

const sign = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n))}°`;
const DAYS = { uz: ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"], ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] };
/** Tekis davlat navy yuzasi (gradient va shishasimon effekt yo'q); holat belgi va matn bilan beriladi */
const SKY: Record<WeatherCode, string> = {
  clear: "bg-[rgb(var(--ds-panel))]", partly_cloudy: "bg-[rgb(var(--ds-panel))]", cloudy: "bg-[rgb(var(--ds-panel))]", fog: "bg-[rgb(var(--ds-panel))]",
  rain: "bg-[rgb(var(--ds-panel))]", snow: "bg-[rgb(var(--ds-panel))]", thunderstorm: "bg-[rgb(var(--ds-panel))]", wind: "bg-[rgb(var(--ds-panel))]",
};
const STALE_MS = 2 * 60 * 60 * 1000;

/**
 * 3.2: tanlangan hudud markazi ob-havosi. Ma'lumot backend'dan (30 daqiqa kesh); xato bo'lsa faqat shu vidjet xabar beradi.
 * Harorat rangga bo'yalmaydi (kontrast va rang ko'rmaslik); `aria-live` hudud almashganda yangi qiymatni o'qiydi.
 */
export default function WeatherWidget({ region, forecast, onError }: { region: string; forecast: boolean; onError?: (failed: boolean) => void }) {
  const { t, lang } = useLang();
  const [w, setW] = useState<Weather | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let alive = true;
    setFailed(false);
    loadWeather(region).then((d) => alive && setW(d)).catch(() => alive && (setFailed(true), setW(null)));
    return () => {
      alive = false;
    };
  }, [region]);
  useEffect(() => onError?.(failed), [failed, onError]);

  const old = w ? Date.now() - new Date(w.observed_at).getTime() > STALE_MS : false;
  const day = (iso: string) => (DAYS[lang === "ru" ? "ru" : "uz"])[new Date(iso).getDay()];
  const sky = w ? SKY[w.current.code] : SKY.cloudy;

  return (
    <section aria-label={t({ uz: "Ob-havo", ru: "Погода" })}
      className={`relative flex flex-col overflow-hidden rounded-[12px] border border-[rgb(var(--ds-panel-line))] p-5 text-[rgb(var(--ds-on-panel))] ${failed ? "bg-slate-700" : sky}`}>
      <p className="relative text-xs font-semibold uppercase tracking-wider text-[rgb(var(--ds-on-panel-muted))]">{t({ uz: "Ob-havo", ru: "Погода" })}</p>
      <h3 className="relative text-xl font-bold">{w ? w.city : " "}</h3>
      {failed ? (
        <p role="alert" className="relative mt-6 text-sm text-[rgb(var(--ds-on-panel))]">{t({ uz: "Ob-havo hozircha mavjud emas", ru: "Погода временно недоступна" })}</p>
      ) : !w ? (
        <div className="relative mt-4 animate-pulse space-y-3" aria-busy="true"><div className="h-20 w-2/3 rounded-xl bg-mg-surface/80" /><div className="h-4 w-1/2 rounded bg-mg-surface/80" /><div className="h-24 rounded-xl bg-mg-surface/80" /></div>
      ) : (
        <>
          <div aria-live="polite" className="relative mt-2 flex items-center justify-between gap-2">
            <div>
              <p className="text-[40px] font-bold leading-none tracking-tight tabular-nums">{sign(w.current.temp)}</p>
              <p className="mt-1 text-sm font-medium">{t(WEATHER_LABEL[w.current.code])}</p>
              <p className="text-sm text-[rgb(var(--ds-on-panel-muted))]">{t({ uz: "his qilinadi", ru: "ощущается" })} {sign(w.current.feels_like)}</p>
            </div>
            <span className="text-[rgb(var(--ds-on-panel))]"><WeatherIcon code={w.current.code} size={60} /></span>
          </div>
          <p className="relative mt-3 flex flex-wrap gap-1.5 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mg-surface/80 px-2.5 py-0.5 text-xs"><Wind className="h-4 w-4" aria-hidden="true" />{w.current.wind_ms} {t({ uz: "m/s", ru: "м/с" })}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-mg-surface/80 px-2.5 py-0.5 text-xs"><Droplets className="h-4 w-4" aria-hidden="true" />{w.current.humidity}%</span>
          </p>
          {forecast && (
            <ul className="relative mt-3 grid grid-cols-3 gap-1.5">
              {w.daily.map((d) => (
                <li key={d.date} className="flex flex-col items-center rounded-xl bg-mg-surface/80 px-1 py-2 text-center">
                  <span className="text-sm font-semibold">{day(d.date)}</span>
                  <span className="my-1 text-[rgb(var(--ds-on-panel))]"><WeatherIcon code={d.code} size={24} /><span className="sr-only">{t(WEATHER_LABEL[d.code])}</span></span>
                  <span className="text-sm font-semibold tabular-nums">{sign(d.t_max)}</span>
                  <span className="text-xs tabular-nums text-[rgb(var(--ds-on-panel-muted))]">{sign(d.t_min)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="relative mt-3 text-[11px] text-[rgb(var(--ds-on-panel-muted))]">
            {t({ uz: "Manba", ru: "Источник" })}: <a href={w.source.url} className="underline" target="_blank" rel="noreferrer">{w.source.name}</a> ({w.source.license}) · {w.observed_at.slice(11, 16)}
            {(w.stale || old) && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-mg-surface px-2 py-0.5 font-medium"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{t({ uz: "Yangilanmagan", ru: "Не обновлено" })}</span>}
          </p>
        </>
      )}
    </section>
  );
}
