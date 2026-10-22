import axiosT from "./baseUrl";
import { fetchMapValues, fetchTerritory, type MapValues } from "./siatMap";
import { fetchDashboards } from "./statPublic";
import { HOME_CARDS, REPUBLIC, type HomeCardKey } from "../config/homeWidgets";

/** Mavjud manbalardan (dashboards — respublika, territory — hudud) bitta ko'rinishga keltirilgan kartochka ma'lumoti. */
export interface HomeCardData {
  key: HomeCardKey;
  value: number;
  period: string;
  preliminary: boolean;
  /** O'zgarish: `kind` bo'yicha (pct — %, pp — foiz punkti) */
  change: number | null;
  series: number[];
  /** `country` — hudud kesimi yo'q yoki hozir respublika qiymati ko'rsatilmoqda */
  scope: "region" | "country";
  rank: number | null;
  of: number | null;
  siatUrl: string;
  sourceName: string;
}

export type HomeCards = Partial<Record<HomeCardKey, HomeCardData>>;

const lastValues = (s: { value: number | null }[]) => s.map((p) => p.value).filter((v): v is number => v !== null).slice(-10);

function changeOf(kind: "pct" | "pp", series: number[]): number | null {
  if (series.length < 2) return null;
  const [a, b] = [series[series.length - 2], series[series.length - 1]];
  return kind === "pp" ? b - a : a ? ((b - a) / Math.abs(a)) * 100 : null;
}

const TTL = 5 * 60 * 1000;
function memo<T>(map: Map<string, { at: number; p: Promise<T> }>, key: string, load: () => Promise<T>): Promise<T> {
  const hit = map.get(key);
  if (hit && Date.now() - hit.at < TTL) return hit.p;
  const p = load();
  p.catch(() => map.delete(key));
  map.set(key, { at: Date.now(), p });
  return p;
}

const cardsCache = new Map<string, { at: number; p: Promise<HomeCards> }>();
const mapCache = new Map<string, { at: number; p: Promise<MapValues> }>();
const weatherCache = new Map<string, { at: number; p: Promise<Weather> }>();

/** Respublika — `fetchDashboards` (bosh sahifa banneri bilan umumiy kesh); hudud — bitta `territory` so'rovi, yetmaganlari respublikadan. */
export function loadHomeCards(region: string): Promise<HomeCards> {
  return memo(cardsCache, region, async () => {
    const dash = await fetchDashboards();
    const items = new Map(dash.panels.flatMap((p) => p.items).map((i) => [i.key, i]));
    const out: HomeCards = {};
    for (const def of HOME_CARDS) {
      const i = items.get(def.siat);
      if (!i) continue;
      const series = i.series.map((s) => s.value);
      out[def.key] = {
        key: def.key, value: i.value, period: i.period, preliminary: i.preliminary, change: i.change, series, scope: "country",
        rank: null, of: null, siatUrl: i.siat_url, sourceName: dash.source.name,
      };
    }
    if (region === REPUBLIC) return out;
    const t = await fetchTerritory(region);
    for (const ind of t.indicators) {
      const def = HOME_CARDS.find((c) => c.siat === ind.key);
      if (!def) continue;
      const series = lastValues(ind.series);
      out[def.key] = {
        key: def.key, value: ind.value, period: ind.period, preliminary: ind.preliminary, change: changeOf(def.change, series), series,
        scope: "region", rank: ind.rank, of: ind.of, siatUrl: ind.siat_url, sourceName: t.source.name,
      };
    }
    return out;
  });
}

export const loadMapValues = (indicator: string) =>
  memo(mapCache, indicator, () => fetchMapValues({ indicator, level: "region" }));

export interface Weather {
  city: string;
  soato: string;
  observed_at: string;
  current: { temp: number; feels_like: number; code: WeatherCode; wind_ms: number; humidity: number };
  daily: { date: string; code: WeatherCode; t_max: number; t_min: number }[];
  source: { name: string; url: string; license: string };
  stale: boolean;
}

export type WeatherCode = "clear" | "partly_cloudy" | "cloudy" | "fog" | "rain" | "snow" | "thunderstorm" | "wind";

export const loadWeather = (region: string) =>
  memo(weatherCache, region, async () => (await axiosT.get<Weather>("/common/weather/", { params: { region } })).data);
