import { useEffect, useState } from "react";
import { AlertTriangle, Droplets, Wind } from "lucide-react";
import { loadWeather, type Weather, type WeatherCode } from "../../api/homeWidgets";
import { useLang } from "../../i18n/LangContext";
import WeatherIcon, { WEATHER_LABEL } from "./weatherIcons";

const sign = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(Math.round(n))}°`;
const DAYS = { uz: ["Yak", "Dush", "Sesh", "Chor", "Pay", "Jum", "Shan"], ru: ["Вс", "Пн", "Вт", "Ср", "Чт", "Пт", "Сб"] };
/** Tekis davlat navy yuzasi (gradient va shishasimon effekt yo'q); holat belgi va matn bilan beriladi */
const SKY: Record<WeatherCode, string> = {
  clear: "bg-[rgb(var(--ds-brand))]", partly_cloudy: "bg-[rgb(var(--ds-brand))]", cloudy: "bg-[rgb(var(--ds-brand))]", fog: "bg-[rgb(var(--ds-brand))]",
  rain: "bg-[rgb(var(--ds-brand))]", snow: "bg-[rgb(var(--ds-brand))]", thunderstorm: "bg-[rgb(var(--ds-brand))]", wind: "bg-[rgb(var(--ds-brand))]",
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
      className={`relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-[12px] p-5 text-white ${failed ? "bg-slate-700" : sky}`}>
      <p className="relative text-xs font-semibold uppercase tracking-wider text-white/80">{t({ uz: "Ob-havo", ru: "Погода" })}</p>
      <h3 className="relative text-xl font-bold">{w ? w.city : " "}</h3>
      {failed ? (
        <p role="alert" className="relative mt-6 text-sm text-white/90">{t({ uz: "Ob-havo hozircha mavjud emas", ru: "Погода временно недоступна" })}</p>
      ) : !w ? (
        <div className="relative mt-4 animate-pulse space-y-3" aria-busy="true"><div className="h-20 w-2/3 rounded-xl bg-white/10" /><div className="h-4 w-1/2 rounded bg-white/10" /><div className="h-24 rounded-xl bg-white/10" /></div>
      ) : (
        <>
          <div aria-live="polite" className="relative mt-4 flex items-center justify-between gap-3">
            <div>
              <p className="text-[56px] font-bold leading-none tracking-tight tabular-nums">{sign(w.current.temp)}</p>
              <p className="mt-2 text-base font-medium">{t(WEATHER_LABEL[w.current.code])}</p>
              <p className="text-sm text-white/80">{t({ uz: "his qilinadi", ru: "ощущается" })} {sign(w.current.feels_like)}</p>
            </div>
            <span className="text-white "><WeatherIcon code={w.current.code} size={96} /></span>
          </div>
          <p className="relative mt-4 flex flex-wrap gap-2 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1"><Wind className="h-4 w-4" aria-hidden="true" />{w.current.wind_ms} {t({ uz: "m/s", ru: "м/с" })}</span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1"><Droplets className="h-4 w-4" aria-hidden="true" />{w.current.humidity}%</span>
          </p>
          {forecast && (
            <ul className="relative mt-5 grid grid-cols-3 gap-2">
              {w.daily.map((d) => (
                <li key={d.date} className="flex flex-col items-center rounded-xl bg-white/10 px-2 py-3 text-center">
                  <span className="text-sm font-semibold">{day(d.date)}</span>
                  <span className="my-1 text-white"><WeatherIcon code={d.code} size={32} /><span className="sr-only">{t(WEATHER_LABEL[d.code])}</span></span>
                  <span className="text-sm font-semibold tabular-nums">{sign(d.t_max)}</span>
                  <span className="text-xs tabular-nums text-white/75">{sign(d.t_min)}</span>
                </li>
              ))}
            </ul>
          )}
          <p className="relative mt-auto pt-4 text-xs text-white/80">
            {t({ uz: "Manba", ru: "Источник" })}: <a href={w.source.url} className="underline" target="_blank" rel="noreferrer">{w.source.name}</a> ({w.source.license}) · {w.observed_at.slice(11, 16)}
            {(w.stale || old) && <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-black/25 px-2 py-0.5 font-medium"><AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />{t({ uz: "Yangilanmagan", ru: "Не обновлено" })}</span>}
          </p>
        </>
      )}
    </section>
  );
}
