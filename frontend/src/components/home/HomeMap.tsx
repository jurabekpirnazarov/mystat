import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { loadMapValues } from "../../api/homeWidgets";
import type { MapValues } from "../../api/siatMap";
import { CARD_BY_KEY, HOME_CARDS, REPUBLIC, type HomeCardKey } from "../../config/homeWidgets";
import { useLang } from "../../i18n/LangContext";
import { loadBoundaries, type GeoFeature } from "../../utils/mapGeo";
import { buildScale, colorFor, legendRows, MISSING_COLOR } from "../../utils/mapScale";
import InteractiveMap, { type MapTip } from "./InteractiveMap";

const MAP_CARDS = HOME_CARDS.filter((c) => c.regional);

/** Elementni birinchi marta ko'rinish zonasiga kirganda `true` qiladi (tarmoq so'rovlarini kechiktiradi). */
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
 * 3.1: 14 hudud kartasi (SOATO kodi bo'yicha), tanlangan ko'rsatkich bo'yicha bo'yalgan. Qiymatlar kartochkalar bilan bir xil
 * formatda (masalan YaIM o'sishi: manbadagi 107,2 indeksi "7,2 %" ko'rinadi). Hududni bosish tanlovni o'zgartiradi, qayta bosish — Respublika.
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
  const ranked = useMemo(() => [...byCode.values()].filter((i) => i.value !== null).sort((a, b) => (b.value as number) - (a.value as number)), [byCode]);
  const scale = useMemo(() => {
    if (!values) return null;
    const cur = ranked.map((i) => i.value as number);
    const input = cur.length ? { ...values.scale, min: Math.min(...cur), max: Math.max(...cur), quantiles: values.scale.current_quantiles } : values.scale;
    return buildScale(input, "quantile", values.higher_is_better);
  }, [values, ranked]);
  const fill = useCallback((code: string) => colorFor(byCode.get(code)?.value ?? null, scale), [byCode, scale]);
  const tip = useCallback((code: string): MapTip => {
    const it = byCode.get(code);
    if (!it || it.value === null) return { name: it?.name ?? code, value: t({ uz: "ma'lumot yo'q", ru: "нет данных" }), share: null, rank: "" };
    const rank = ranked.findIndex((x) => x.code === code) + 1;
    return {
      name: it.name, value: def.format(it.value) + (it.preliminary ? ` (${t({ uz: "dastlabki", ru: "предв." })})` : ""),
      share: ranked.length > 1 ? 1 - (rank - 1) / (ranked.length - 1) : 1,
      rank: `${ranked.length} ${t({ uz: "hududdan", ru: "регионов:" })} ${rank}-${t({ uz: "o'rin", ru: "место" })}`,
    };
  }, [byCode, ranked, def, t]);

  const sel = region === REPUBLIC ? null : region;
  const focus = sel ? byCode.get(sel) : null;
  const focusRank = focus?.value != null ? ranked.findIndex((x) => x.code === sel) + 1 : 0;
  const rows = scale ? legendRows(scale) : [];
  const best = ranked.length ? `${ranked[0].name}: ${def.format(ranked[0].value as number)}; ${ranked[ranked.length - 1].name}: ${def.format(ranked[ranked.length - 1].value as number)}` : "";
  const link = `/regions?ind=${def.siat}${sel ? `&t=${sel}` : ""}`;
  const unit = t(def.unit);

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
            {focus ? (focus.value !== null ? def.format(focus.value) : "—") : values?.republic != null ? def.format(values.republic) : "—"}
          </p>
          <p className="mt-1 text-xs text-mg-muted">
            {unit}{values ? ` · ${values.period}` : ""}
            {focusRank ? ` · ${ranked.length} ${t({ uz: "dan", ru: "из" })} ${focusRank}-${t({ uz: "o'rin", ru: "место" })}` : ""}
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

      <div role="group" aria-label={`${t({ uz: def.uz, ru: def.ru })}. ${best}`} className="relative mt-2 min-h-[280px] flex-1">
        {failed ? (
          <p role="alert" className="p-4 text-sm text-mg-muted">{t({ uz: "Karta hozircha mavjud emas", ru: "Карта временно недоступна" })}</p>
        ) : features && values ? (
          <InteractiveMap features={features} fill={fill} tip={tip} selected={sel} label={t({ uz: def.uz, ru: def.ru })}
            onSelect={(code) => onRegion(code === region ? REPUBLIC : code)} />
        ) : (
          <div className="h-full min-h-[280px] animate-pulse rounded-xl bg-mg-info" aria-busy="true" />
        )}
      </div>

      {values && rows.length > 0 && (
        <div className="relative mt-2 flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-mg-muted">
          <div className="flex min-w-[220px] flex-1 overflow-hidden rounded-full ring-1 ring-mg-border" role="list" aria-label={t({ uz: "Rang shkalasi", ru: "Цветовая шкала" })}>
            {rows.map((r) => (
              <span key={r.color + r.from} role="listitem" className="flex-1 px-1 py-0.5 text-center font-medium tabular-nums text-black/80" style={{ background: r.color }}
                title={`${def.format(r.from)} – ${def.format(r.to)}`}>{def.format(r.from)}</span>
            ))}
          </div>
          <span className="inline-flex items-center gap-1"><span className="h-3 w-3 rounded-sm ring-1 ring-mg-border" style={{ background: MISSING_COLOR }} />{t({ uz: "ma'lumot yo'q", ru: "нет данных" })}</span>
          {values.preliminary && <span>{t({ uz: "dastlabki", ru: "предварительно" })}</span>}
        </div>
      )}
      <p className="relative mt-2 flex flex-wrap items-center justify-between gap-2 text-xs text-mg-muted">
        <span>{values ? `${values.source.name} · ${t({ uz: "hududni bosing", ru: "нажмите на регион" })}` : " "}</span>
        <Link to={link} className="inline-flex items-center gap-1 text-sm font-semibold text-mg-primary hover:underline">{t({ uz: "Kartani to'liq ochish", ru: "Открыть карту полностью" })}<ArrowRight className="h-4 w-4" aria-hidden="true" /></Link>
      </p>
    </section>
  );
}
