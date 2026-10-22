import { useEffect, useRef, useState } from "react";
import { Settings2 } from "lucide-react";
import { loadHomeCards, type HomeCards } from "../../api/homeWidgets";
import { CARD_BY_KEY, HOME_CARDS, MIN_CARDS, REPUBLIC } from "../../config/homeWidgets";
import { useHomeLayout } from "../../hooks/useHomeLayout";
import { useLang } from "../../i18n/LangContext";
import HomeMap from "./HomeMap";
import HomeSettingsDrawer from "./HomeSettingsDrawer";
import HomeStatCard from "./HomeStatCard";
import RegionSelect from "./RegionSelect";
import WeatherWidget from "./WeatherWidget";

/**
 * BOSH_SAHIFA_VIDJETLAR 1a-blok: "O'zbekiston bugun". Hudud tanlovi uchala vidjetni (karta, ob-havo, kartochkalar) birga o'zgartiradi.
 * Ma'lumot mavjud manbalardan (SIAT karta API'si, dashboards), ob-havo — backend keshi orqali. Bitta vidjet xatosi boshqalarni to'xtatmaydi.
 * Mobilda tartib: kartochkalar → ob-havo → karta.
 */
export default function HomeDashboard({ className = "mt-10" }: { className?: string }) {
  const { t } = useLang();
  const api = useHomeLayout();
  const { layout } = api;
  const [cards, setCards] = useState<HomeCards | null>(null);
  const [cardsFailed, setCardsFailed] = useState(false);
  const [open, setOpen] = useState(false);
  const [weatherFailed, setWeatherFailed] = useState(false);
  const opener = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    let alive = true;
    setCardsFailed(false);
    loadHomeCards(layout.region).then((c) => alive && setCards(c)).catch(() => alive && (setCardsFailed(true), setCards({})));
    return () => {
      alive = false;
    };
  }, [layout.region]);

  const close = () => {
    setOpen(false);
    opener.current?.focus();
  };

  // Ma'lumoti bor yoqilgan kartochkalar; 4 tadan kam bo'lsa — katalogdagi navbatdagi ma'lumotli kartochkalar bilan to'ldiriladi (faqat ko'rinishda)
  const visible = (() => {
    if (!cards) return [];
    const chosen = layout.cards.filter((c) => c.enabled && cards[c.key]).map((c) => c.key);
    for (const def of HOME_CARDS) {
      if (chosen.length >= MIN_CARDS) break;
      if (cards[def.key] && !chosen.includes(def.key)) chosen.push(def.key);
    }
    return chosen;
  })();

  const on = (k: "map" | "weather") => layout.widgets.find((w) => w.key === k)?.enabled;
  const weatherOn = !!on("weather") && !weatherFailed;
  const mapOn = !!on("map");
  const order = layout.widgets.map((w) => w.key);
  const both = weatherOn && mapOn;
  const span = (k: "map" | "weather") => (both ? (k === "map" ? "lg:col-span-7" : "lg:col-span-5") : "lg:col-span-12");
  // Mobil: kartochkalar (order-1) → ob-havo (order-2) → karta (order-3)
  const mobile = { map: "order-3", weather: "order-2" } as const;

  const widget = (k: "map" | "weather") => (
    <div key={k} className={`${mobile[k]} lg:order-none ${span(k)}`}>
      {k === "map" ? (
        <HomeMap region={layout.region} indicator={layout.map.indicator} onIndicator={api.setMapIndicator} onRegion={api.setRegion} />
      ) : (
        <WeatherWidget region={layout.region} forecast={layout.weather.forecast} onError={setWeatherFailed} />
      )}
    </div>
  );

  return (
    <section aria-labelledby="home-today" className={className}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h2 id="home-today" className="text-[24.5px] font-normal leading-9 text-mg-primary">{t({ uz: "O'zbekiston bugun", ru: "Узбекистан сегодня" })}</h2>
        <div className="flex flex-wrap items-center gap-3">
          <RegionSelect value={layout.region} onChange={api.setRegion} />
          <button ref={opener} type="button" onClick={() => setOpen(true)} aria-haspopup="dialog"
            className="inline-flex items-center gap-2 rounded-lg border border-mg-border bg-mg-surface px-3 py-2 text-sm font-medium text-mg-text hover:bg-mg-info">
            <Settings2 className="h-4 w-4" aria-hidden="true" />{t({ uz: "Sozlash", ru: "Настроить" })}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-12">
        <div className="order-1 col-span-1 lg:order-last lg:col-span-12">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-[repeat(auto-fill,minmax(220px,1fr))]">
            {!cards
              ? Array.from({ length: MIN_CARDS }, (_, i) => <div key={i} className="min-h-[168px] animate-pulse rounded-mg border border-mg-border bg-mg-surface" aria-busy="true" />)
              : visible.map((k) => {
                  const def = CARD_BY_KEY.get(k);
                  const data = cards[k];
                  return def && data ? <HomeStatCard key={k} def={def} data={data} showScopeNote={layout.region !== REPUBLIC} /> : null;
                })}
          </div>
          {cardsFailed && <p role="alert" className="mt-3 text-sm text-mg-muted">{t({ uz: "Ko'rsatkichlarni yuklab bo'lmadi.", ru: "Не удалось загрузить показатели." })}</p>}
        </div>
        {(order[0] === "weather" ? ["weather", "map"] as const : ["map", "weather"] as const).map((k) => (on(k) && (k !== "weather" || !weatherFailed) ? widget(k) : null))}
      </div>
      <p className="mt-2 text-xs text-mg-muted">{t({ uz: "Aholi soni — yil boshiga rasmiy qiymat; bosh sahifa tepasidagi jonli hisoblagich boshqa usulda hisoblanadi.", ru: "Население — официальные данные на начало года; счётчик вверху страницы считается иначе." })}</p>

      <HomeSettingsDrawer api={api} open={open} onClose={close} />
    </section>
  );
}
