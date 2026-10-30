import { Link } from "react-router-dom";
import { useEffect, useState } from "react";
import { ArrowRight, CalendarClock, CalendarDays, Users } from "lucide-react";
import type { PopulationClock as Clock, ReleaseItem } from "../../api/statPublic";
import { useHomeLayout } from "../../hooks/useHomeLayout";
import { estimatePopulation, formatInt } from "../../utils/statPublic";
import RegionSelect from "./RegionSelect";
import WeatherWidget from "./WeatherWidget";

const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

const longDate = (iso: string) => {
  const [y, m, d] = iso.split("-").map(Number);
  return y && m && d ? `${d} ${MONTHS[m - 1]} ${y}` : iso;
};

/** "bugun" / "ertaga" / "N kundan keyin" (sana farqi kun hisobida) */
const inDays = (iso: string, today: string) => {
  const n = Math.round((Date.parse(iso) - Date.parse(today)) / 86_400_000);
  return n <= 0 ? "bugun" : n === 1 ? "ertaga" : `${n} kundan keyin`;
};

/** Eng yaqin e'lon: kalendarning birinchi kutilayotgan yozuvi (haqiqiy ma'lumot) */
export function NextRelease({ item, today }: { item: ReleaseItem; today: string }) {
  return (
    <Link to="/release-calendar" className="group block rounded-mg border border-mg-border bg-mg-surface p-4 hover:border-mg-primary/50 sm:flex sm:items-center sm:gap-6">
      <span className="flex shrink-0 items-center gap-2 text-xs font-semibold uppercase tracking-wide text-mg-muted">
        <CalendarClock className="h-4 w-4 text-mg-primary" aria-hidden="true" />Eng yaqin e'lon
      </span>
      <span className="mt-2 line-clamp-2 block text-[15px] font-semibold leading-snug text-mg-heading sm:mt-0 sm:flex-1">{item.title}</span>
      <span className="mt-2 flex shrink-0 items-center justify-between gap-4 text-sm sm:mt-0">
        <span className="tnum text-mg-muted">{longDate(item.date)}</span>
        <span className="rounded-full bg-[rgb(var(--ds-primary-soft))] px-2.5 py-0.5 text-xs font-semibold text-mg-primary">{inDays(item.date, today)}</span>
      </span>
      <span className="mt-2 inline-flex shrink-0 items-center gap-1 text-sm font-medium text-mg-primary group-hover:underline sm:mt-0">Kalendarni ochish<ArrowRight className="h-4 w-4" aria-hidden="true" /></span>
    </Link>
  );
}

const WEEKDAYS = ["Yakshanba", "Dushanba", "Seshanba", "Chorshanba", "Payshanba", "Juma", "Shanba"];

/** Bugungi sana va Toshkent vaqti (jonli, har 30 soniya). Tashqi manba kerak emas. */
function Today() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(id);
  }, []);
  const tz = { timeZone: "Asia/Tashkent" } as const;
  const local = new Date(now.toLocaleString("en-US", tz));
  const time = new Intl.DateTimeFormat("en-GB", { ...tz, hour: "2-digit", minute: "2-digit" }).format(now);
  return (
    <div className="flex items-center justify-between text-sm text-[rgb(var(--ds-on-panel))]">
      <span className="inline-flex items-center gap-2 font-medium"><CalendarDays className="h-4 w-4 text-mg-primary" aria-hidden="true" />{WEEKDAYS[local.getDay()]}, {local.getDate()} {MONTHS[local.getMonth()]}</span>
      <span className="tnum rounded-full bg-[rgb(var(--ds-surface))] px-2.5 py-0.5 text-xs font-bold" title="Toshkent vaqti">{time}</span>
    </div>
  );
}

/** Aholi soni jonli (har soniya): yillik o'sish sur'atidan hisoblangan baho. Izohsiz; manba tooltip'da. */
function Population({ clock }: { clock: Clock }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[rgb(var(--ds-primary-soft))] text-mg-primary" aria-hidden="true"><Users className="h-5 w-5" /></span>
      <div title={`Baho: ${clock.source}`}>
        <p className="text-sm text-[rgb(var(--ds-on-panel-muted))]">Hozir O'zbekistonda taxminan</p>
        <p className="tnum text-[28px] font-bold leading-tight text-[rgb(var(--ds-on-panel))]">{formatInt(estimatePopulation(clock, now))} <span className="text-base font-normal text-[rgb(var(--ds-on-panel-muted))]">kishi</span></p>
      </div>
    </div>
  );
}

/**
 * Bosh sahifa o'ng ustuni: aholi soati, tanlangan hudud ob-havosi (3 kunlik prognoz) va eng yaqin e'lon.
 * Hudud `?r=` va brauzer xotirasida saqlanadi (`useHomeLayout`), shuning uchun eski bosh sahifa bilan bir xil.
 */
export default function HomeAside({ clock }: { clock: Clock | null }) {
  const api = useHomeLayout();
  return (
    <aside aria-label="Qisqa ma'lumotlar" className="relative flex h-full flex-col">
      {/* Bitta blok: aholi soni + ob-havo */}
      <div className="flex flex-1 flex-col justify-between gap-4 rounded-[12px] border border-[rgb(var(--ds-panel-line))] bg-[rgb(var(--ds-panel))] p-5">
        <Today />
        {clock && <div className="border-t border-[rgb(var(--ds-panel-line))] pt-4"><Population clock={clock} /></div>}
        <div className="flex-1 border-t border-[rgb(var(--ds-panel-line))] pt-4">
          <WeatherWidget region={api.layout.region} forecast bare headerRight={<RegionSelect compact value={api.layout.region} onChange={api.setRegion} />} />
        </div>
      </div>
    </aside>
  );
}
