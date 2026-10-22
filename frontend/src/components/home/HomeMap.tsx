import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { loadMapValues } from "../../api/homeWidgets";
import type { MapValues } from "../../api/siatMap";
import { CARD_BY_KEY, HOME_CARDS, REPUBLIC, type HomeCardKey } from "../../config/homeWidgets";
import { useLang } from "../../i18n/LangContext";
import { loadBoundaries, type GeoFeature } from "../../utils/mapGeo";
import { buildScale, colorFor, formatValue } from "../../utils/mapScale";
import MapLegend from "../siatMap/MapLegend";

// Leaflet og'ir — karta faqat ko'rinish zonasiga kirganda yuklanadi
const ChoroplethMap = lazy(() => import("../maps/ChoroplethMap"));

const MAP_CARDS = HOME_CARDS.filter((c) => c.regional);

/** Elementni birinchi marta ko'rinish zonasiga kirganda `true` qiladi (tarmoq va Leaflet yuklanishini kechiktiradi). */
function useInView<T extends Element>() {
  const ref = useRef<T>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    if (seen || !ref.current) return;
    if (typeof IntersectionObserver === "undefined") return setSeen(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && (setSeen(true), io.disconnect()), { rootMargin: "200px" });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [seen]);
  return [ref, seen] as const;
}

/**
 * 3.1: 14 hudud kartasi, tanlangan ko'rsatkich bo'yicha bo'yalgan (mavjud `ChoroplethMap`, SOATO kodi bo'yicha).
 * Hududni bosish tanlovni o'zgartiradi, qayta bosish Respublikaga qaytaradi.
 */
export default function HomeMap({ region, indicator, onIndicator, onRegion }: {
  region: string;
  indicator: HomeCardKey;
  onIndicator: (k: HomeCardKey) => void;
  onRegion: (soato: string) => void;
}) {
  const { t } = useLang();
  const [box, seen] = useInView<HTMLElement>();
  const def = CARD_BY_KEY.get(indicator) ?? MAP_CARDS[0];
  const [features, setFeatures] = useState<GeoFeature[] | null>(null);
  const [values, setValues] = useState<MapValues | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (seen) loadBoundaries("regions").then((g) => setFeatures(g.features)).catch(() => setFailed(true));
  }, [seen]);
  useEffect(() => {
    if (!seen) return;
    let alive = true;
    setFailed(false);
    loadMapValues(def.siat).then((v) => alive && setValues(v)).catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [seen, def.siat]);

  const byCode = useMemo(() => new Map((values?.items ?? []).map((i) => [i.code, i])), [values]);
  const scale = useMemo(() => {
    if (!values) return null;
    const cur = values.items.map((i) => i.value).filter((v): v is number => v !== null);
    const input = cur.length ? { ...values.scale, min: Math.min(...cur), max: Math.max(...cur), quantiles: values.scale.current_quantiles } : values.scale;
    return buildScale(input, "quantile", values.higher_is_better);
  }, [values]);
  const fill = useCallback((code: string) => colorFor(byCode.get(code)?.value ?? null, scale), [byCode, scale]);
  const tooltip = useCallback((code: string) => {
    const it = byCode.get(code);
    if (!it || it.value === null) return `${it?.name ?? code}: ${t({ uz: "ma'lumot yo'q", ru: "нет данных" })}`;
    const rank = [...byCode.values()].filter((x) => x.value !== null && x.value > (it.value as number)).length + 1;
    return `${it.name}: ${formatValue(it.value)} ${values?.unit ?? ""} · ${values?.period} · ${rank}/${byCode.size}${it.preliminary ? ` (${t({ uz: "dastlabki", ru: "предв." })})` : ""}`;
  }, [byCode, values, t]);

  const sel = region === REPUBLIC ? null : region;
  const best = useMemo(() => {
    const vals = [...byCode.values()].filter((i) => i.value !== null);
    if (!vals.length) return "";
    const hi = vals.reduce((a, b) => ((b.value as number) > (a.value as number) ? b : a));
    const lo = vals.reduce((a, b) => ((b.value as number) < (a.value as number) ? b : a));
    return `${hi.name}: ${formatValue(hi.value)}; ${lo.name}: ${formatValue(lo.value)}`;
  }, [byCode]);

  const link = `/regions?ind=${def.siat}${sel ? `&t=${sel}` : ""}`;
  const focus = sel ? byCode.get(sel) : null;
  const rank = focus?.value != null ? [...byCode.values()].filter((x) => x.value !== null && x.value > (focus.value as number)).length + 1 : null;
  return (
    <section ref={box} aria-label={t({ uz: "O'zbekiston kartasi", ru: "Карта Узбекистана" })}
      className="relative flex h-full min-h-[420px] flex-col overflow-hidden rounded-2xl border border-mg-border bg-gradient-to-br from-mg-info via-mg-surface to-mg-surface p-5">
      <div aria-hidden="true" className="pointer-events-none absolute -right-16 -top-16 h-56 w-56 rounded-full bg-mg-primary/10 blur-3xl" />
      <div className="relative flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-mg-primary">{t({ uz: "Hududlar kesimida", ru: "По регионам" })}</p>
          <h3 className="mt-0.5 text-xl font-bold text-mg-heading">{focus ? focus.name : t({ uz: "O'zbekiston", ru: "Узбекистан" })}</h3>
        </div>
        <div className="text-right">
          <p className="text-3xl font-extrabold leading-none tabular-nums text-mg-heading">
            {focus ? formatValue(focus.value) : formatValue(values?.republic)}
          </p>
          <p className="mt-1 text-xs text-mg-muted">
            {values ? `${values.unit} · ${values.period}` : " "}
            {rank ? ` · ${byCode.size} ${t({ uz: "dan", ru: "из" })} ${rank}-${t({ uz: "o'rin", ru: "место" })}` : ""}
          </p>
        </div>
      </div>

      <div role="group" aria-label={t({ uz: "Karta ko'rsatkichi", ru: "Показатель карты" })} className="relative mt-4 flex gap-2 overflow-x-auto pb-1">
        {MAP_CARDS.map((c) => (
          <button key={c.key} type="button" aria-pressed={c.key === indicator} onClick={() => onIndicator(c.key)}
            className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${c.key === indicator ? "border-mg-primary bg-mg-primary text-white shadow-sm" : "border-mg-border bg-mg-surface/80 text-mg-text hover:border-mg-primary/50"}`}>
            {t({ uz: c.uz, ru: c.ru })}
          </button>
        ))}
      </div>

      <div role="img" aria-label={`${t({ uz: def.uz, ru: def.ru })}. ${best}`} className="relative mt-4 min-h-[260px] flex-1 overflow-hidden rounded-xl ring-1 ring-mg-border/70">
        {failed ? (
          <p role="alert" className="p-4 text-sm text-mg-muted">{t({ uz: "Karta hozircha mavjud emas", ru: "Карта временно недоступна" })}</p>
        ) : features && values ? (
          <Suspense fallback={<div className="h-full animate-pulse bg-mg-info" />}>
            <ChoroplethMap features={features} fill={fill} tooltip={tooltip} selected={sel} height="100%" label={t({ uz: def.uz, ru: def.ru })}
              onSelect={(code) => onRegion(code === region ? REPUBLIC : code)} />
          </Suspense>
        ) : (
          <div className="h-full min-h-[260px] animate-pulse bg-mg-info" aria-busy="true" />
        )}
      </div>
      {values && <div className="relative mt-3"><MapLegend scale={scale} unit={`${values.unit} · ${values.period}`} republic={values.republic} preliminary={values.preliminary}
        missingCount={values.items.filter((i) => i.value === null).length} /></div>}
      <p className="relative mt-3 flex flex-wrap items-center justify-between gap-2 text-xs text-mg-muted">
        <span>{values ? `${values.source.name} · ${t({ uz: "hududni bosing", ru: "нажмите на регион" })}` : " "}</span>
        <Link to={link} className="inline-flex items-center gap-1 text-sm font-semibold text-mg-primary hover:underline">{t({ uz: "Kartani to'liq ochish", ru: "Открыть карту полностью" })}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </p>
    </section>
  );
}
