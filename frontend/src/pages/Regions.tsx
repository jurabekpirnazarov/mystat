import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CartesianGrid, Cell, ReferenceDot, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, ChevronLeft, Download, ExternalLink, FileSpreadsheet, Info, LocateFixed, MapPin, Pause, Play, Search, Sparkles } from "lucide-react";
import {
  downloadMapTable, fetchMapCatalog, fetchMapValues, fetchScoreConfig, fetchTerritories, fetchTerritory, isScoreKey,
  type GeoLevel, type MapIndicator, type MapValues, type ScoreConfig, type TerritoryCard, type TerritoryName,
} from "../api/siatMap";
import useApi from "../hooks/useApi";
import { ErrorState, PageHeader, Skeleton } from "../components/ui";
import ChoroplethMap from "../components/maps/ChoroplethMap";
import MapLegend, { HATCH_CSS } from "../components/siatMap/MapLegend";
import TerritoryPanel from "../components/siatMap/TerritoryPanel";
import WeightsPanel from "../components/siatMap/WeightsPanel";
import ScoreMethodology from "../components/siatMap/ScoreMethodology";
import ScoreTable from "../components/siatMap/ScoreTable";
import { featureAt, loadBoundaries, renderMapPng, type GeoFeature } from "../utils/mapGeo";
import { formatAxis, niceAxis, useChartTheme } from "../utils/chartTheme";
import { BIVARIATE, bivariateColor, buildScale, colorFor, formatValue, legendRows, tertiles, type ScaleMode } from "../utils/mapScale";

const PLAY_MS = 1200;
const isAbort = (e: unknown) => (e as { name?: string })?.name === "CanceledError" || (e as { name?: string })?.name === "AbortError";

/**
 * SIAT_KARTA_TAHLIL KR-06..KR-13: hududlar xaritasi (SIAT ma'lumoti, SOATO kodi bo'yicha).
 * Holat URL'da: ?ind=246&p=2026&lvl=district&r=1735&t=1735204&c=1703&b=A&s=l&ind2=500 — havola bilan ulashiladi.
 * SCORING_MODEL.md: `ind=score[-A..E]` — salohiyat indeksi, `sp` (preset) / `sw` (vaznlar); prognoz yili (`p=2028`)
 * va `v=g` — kutilayotgan yillik o'sish, `sc=opt|pes` — ijobiy/salbiy ssenariy (bazaviy — parametrsiz).
 */
export default function Regions() {
  const [params, setParams] = useSearchParams();
  const get = (k: string) => params.get(k) ?? "";
  const update = useCallback(
    (patch: Record<string, string | null>) =>
      setParams((prev) => {
        const next = new URLSearchParams(prev);
        Object.entries(patch).forEach(([k, v]) => (v ? next.set(k, v) : next.delete(k)));
        return next;
      }, { replace: true }),
    [setParams]
  );

  const catalog = useApi(() => fetchMapCatalog(), []);
  const indicators = catalog.data?.indicators ?? [];
  const indicator: MapIndicator | undefined = indicators.find((i) => i.key === get("ind")) ?? indicators.find((i) => i.key === "246") ?? indicators[0];
  const canDistrict = indicator?.geo_level === "district";
  const region = canDistrict ? get("r") : "";
  const level: GeoLevel = region || (canDistrict && get("lvl") === "district") ? "district" : "region";
  const breakdown = indicator?.breakdowns.length ? get("b") || indicator.breakdowns[0].code : "";
  const isScore = isScoreKey(indicator?.key);
  const preset = isScore ? get("sp") : "";
  const weights = isScore ? get("sw") : "";
  const scaleMode: ScaleMode = get("s") === "l" ? "linear" : "quantile";
  const selected = get("t") || null;
  const compare = get("c") || null;
  const ind2Key = get("ind2");
  const ind2 = indicators.find((i) => i.key === ind2Key && i.key !== indicator?.key && (level === "region" || i.geo_level === "district"));
  const forecastPeriods = useMemo(() => indicator?.forecast_periods ?? [], [indicator]);
  const period = indicator && (indicator.periods.includes(get("p")) || forecastPeriods.includes(get("p"))) ? get("p") : indicator?.last_period ?? "";
  const growthView = !isScore && forecastPeriods.includes(period) && get("v") === "g";
  const scenario = !isScore && forecastPeriods.includes(period) && (get("sc") === "opt" || get("sc") === "pes") ? (get("sc") as "opt" | "pes") : undefined;

  // Chegaralar
  const [regionsGeo, setRegionsGeo] = useState<GeoFeature[] | null>(null);
  const [districtsGeo, setDistrictsGeo] = useState<GeoFeature[] | null>(null);
  const [geoError, setGeoError] = useState(false);
  useEffect(() => {
    loadBoundaries("regions").then((g) => setRegionsGeo(g.features)).catch(() => setGeoError(true));
  }, []);
  useEffect(() => {
    if (level === "district" && !districtsGeo) loadBoundaries("districts").then((g) => setDistrictsGeo(g.features)).catch(() => setGeoError(true));
  }, [level, districtsGeo]);

  // Qiymatlar: ko'rsatkich almashganda eski so'rov bekor qilinadi (KR-06, 4-qadam)
  const [values, setValues] = useState<MapValues | null>(null);
  const [valuesError, setValuesError] = useState<unknown>(null);
  const [valuesLoading, setValuesLoading] = useState(false);
  const [retry, setRetry] = useState(0);
  useEffect(() => {
    if (!indicator) return;
    const ctrl = new AbortController();
    setValuesLoading(true);
    setValuesError(null);
    fetchMapValues({
      indicator: indicator.key, period, level, parent: region || undefined, breakdown: breakdown || undefined,
      preset: preset || undefined, weights: weights || undefined, view: growthView ? "growth" : undefined, scenario,
    }, ctrl.signal)
      .then(setValues)
      .catch((e) => !isAbort(e) && setValuesError(e))
      .finally(() => !ctrl.signal.aborted && setValuesLoading(false));
    return () => ctrl.abort();
  }, [indicator, period, level, region, breakdown, preset, weights, growthView, scenario, retry]);

  // Salohiyat konfiguratsiyasi: vaznlar paneli va metodologiya uchun
  const [scoreConfig, setScoreConfig] = useState<ScoreConfig | null>(null);
  const [showMethodology, setShowMethodology] = useState(false);
  useEffect(() => {
    if ((isScore || showMethodology) && !scoreConfig) fetchScoreConfig().then(setScoreConfig).catch(() => undefined);
  }, [isScore, showMethodology, scoreConfig]);
  const isForecast = !!values?.forecast;

  const [values2, setValues2] = useState<MapValues | null>(null);
  useEffect(() => {
    setValues2(null);
    if (!ind2) return;
    const ctrl = new AbortController();
    const p2 = ind2.periods.includes(period) ? period : [...ind2.periods].reverse().find((p) => p.slice(0, 4) <= period.slice(0, 4)) ?? ind2.last_period;
    fetchMapValues({ indicator: ind2.key, period: p2, level, parent: region || undefined }, ctrl.signal).then(setValues2).catch(() => undefined);
    return () => ctrl.abort();
  }, [ind2, period, level, region]);

  // Hudud kartochkalari (KR-09, KR-11)
  const [card, setCard] = useState<TerritoryCard | null>(null);
  const [other, setOther] = useState<TerritoryCard | null>(null);
  useEffect(() => {
    setCard(null);
    if (!selected) return;
    const ctrl = new AbortController();
    fetchTerritory(selected, ctrl.signal).then(setCard).catch(() => undefined);
    return () => ctrl.abort();
  }, [selected]);
  useEffect(() => {
    setOther(null);
    if (!compare) return;
    const ctrl = new AbortController();
    fetchTerritory(compare, ctrl.signal).then(setOther).catch(() => undefined);
    return () => ctrl.abort();
  }, [compare]);
  const [pickCompare, setPickCompare] = useState(false);

  // Geometriya
  const features = useMemo(() => {
    if (level === "region") return regionsGeo;
    if (!districtsGeo) return null;
    return region ? districtsGeo.filter((f) => f.properties.soato.startsWith(region)) : districtsGeo;
  }, [level, region, regionsGeo, districtsGeo]);
  const context = useMemo(() => (region && regionsGeo ? regionsGeo.filter((f) => f.properties.soato !== region) : undefined), [region, regionsGeo]);
  const underlay = useMemo(
    () => (level === "district" && regionsGeo ? (region ? regionsGeo.filter((f) => f.properties.soato === region) : regionsGeo) : undefined),
    [level, region, regionsGeo]
  );
  const onMap = useMemo(() => new Set((features ?? []).map((f) => f.properties.soato)), [features]);

  // Rang
  const byCode = useMemo(() => new Map((values?.items ?? []).map((i) => [i.code, i])), [values]);
  const byCode2 = useMemo(() => new Map((values2?.items ?? []).map((i) => [i.code, i])), [values2]);
  // Odatda shkala joriy davr bo'yicha; animatsiyada yoki "bir xil shkala" tanlansa — barcha davrlar bo'yicha (KR-08)
  const [playing, setPlaying] = useState(false);
  const fixedScale = playing || get("fix") === "1" || isScore; // salohiyat: 0–100 qat'iy shkala (KR-08)
  const scale = useMemo(() => {
    if (!values) return null;
    const current = values.items.map((i) => i.value).filter((v): v is number => v !== null);
    const input = fixedScale || !current.length
      ? values.scale
      : { ...values.scale, min: Math.min(...current), max: Math.max(...current), quantiles: values.scale.current_quantiles };
    return buildScale(input, scaleMode, values.higher_is_better);
  }, [values, scaleMode, fixedScale]);
  const bivar = useMemo(() => {
    if (!values2 || !values) return null;
    const xs = values.items.map((i) => i.value).filter((v): v is number => v !== null);
    const ys = values2.items.map((i) => i.value).filter((v): v is number => v !== null);
    return { tx: tertiles(xs), ty: tertiles(ys) };
  }, [values, values2]);
  const fill = useCallback(
    (code: string) => {
      const v = byCode.get(code)?.value ?? null;
      if (bivar) return bivariateColor(v, byCode2.get(code)?.value ?? null, bivar.tx, bivar.ty);
      return colorFor(v, scale);
    },
    [byCode, byCode2, scale, bivar]
  );
  const unit = values?.unit ?? indicator?.unit ?? "";
  const tooltip = useCallback(
    (code: string) => {
      const item = byCode.get(code);
      const name = item?.name ?? code;
      if (!item || item.value === null) return `${name}: ${item?.note ?? "ma'lumot yo'q"}`;
      let text = `${name}: ${formatValue(item.value)} ${unit}${item.preliminary ? (isScore ? " (qisman ma'lumot)" : " (dastlabki)") : ""}`;
      if (item.forecast && item.lo80 != null && item.hi80 != null) text += ` · prognoz, 80%: ${formatValue(item.lo80)}–${formatValue(item.hi80)}`;
      if (values2) text += ` · ${values2.name}: ${formatValue(byCode2.get(code)?.value)} ${values2.unit}`;
      return text;
    },
    [byCode, byCode2, unit, values2, isScore]
  );

  // Vaqt slayderi (KR-08)
  const periods = useMemo(
    () => [...new Set([...(values?.periods ?? indicator?.periods ?? []), ...forecastPeriods])].sort(),
    [values, indicator, forecastPeriods]
  );
  const firstForecast = periods.findIndex((p) => forecastPeriods.includes(p));
  const index = Math.max(0, periods.indexOf(values?.period ?? period));
  useEffect(() => {
    if (!playing) return;
    if (index >= periods.length - 1) {
      setPlaying(false);
      return;
    }
    const id = window.setTimeout(() => !valuesLoading && update({ p: periods[index + 1] }), PLAY_MS);
    return () => window.clearTimeout(id);
  }, [playing, index, periods, valuesLoading, update]);

  const select = useCallback(
    (code: string) => {
      if (pickCompare) {
        setPickCompare(false);
        if (code !== selected) update({ c: code });
        return;
      }
      if (code.length === 4 && level === "region" && canDistrict) update({ r: code, t: code, lvl: "district" });
      else update({ t: code });
    },
    [pickCompare, selected, level, canDistrict, update]
  );

  // Qidiruv va "Mening hududim" (KR-13)
  const [territories, setTerritories] = useState<TerritoryName[] | null>(null);
  const [query, setQuery] = useState("");
  const [notice, setNotice] = useState("");
  const loadTerritories = () => !territories && fetchTerritories().then(setTerritories).catch(() => undefined);
  const goTo = (code: string) => {
    if (code.length === 7) update(canDistrict ? { r: code.slice(0, 4), t: code, lvl: "district" } : { t: code.slice(0, 4), r: null });
    else update({ t: code, r: canDistrict ? code : null, lvl: canDistrict ? "district" : null });
  };
  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2 || !territories) return [];
    return territories.filter((t) => Object.values(t.names).some((n) => n.toLowerCase().includes(q))).slice(0, 8);
  }, [query, territories]);
  const parentName = (code: string | null) => territories?.find((t) => t.code === code)?.names.uz ?? "";
  const locate = () => {
    setNotice("");
    if (!navigator.geolocation) {
      setNotice("Brauzer joylashuvni aniqlay olmaydi.");
      return;
    }
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const geo = await loadBoundaries("districts").catch(() => null);
        const f = geo && featureAt([pos.coords.longitude, pos.coords.latitude], geo.features);
        if (f) goTo(f.properties.soato);
        else setNotice("Joylashuvingiz O'zbekiston tumanlari ichida topilmadi.");
      },
      () => setNotice("Joylashuvga ruxsat berilmadi — hududni qidiruv orqali tanlang."),
      { timeout: 10000 }
    );
  };

  const exportPng = () => {
    if (!features || !values) return;
    const legend = bivar
      ? []
      : [...(scale ? legendRows(scale).map((r) => ({ color: r.color, label: `${formatValue(r.from)}–${formatValue(r.to)}` })) : []), { color: "hatch", label: "Ma'lumot yo'q" }];
    const src = values.siat_url || indicator?.derived_from || "";
    renderMapPng({
      features, context, fill,
      title: values.name + (values.breakdown ? ` — ${values.breakdown.name}` : ""),
      subtitle: `${values.period}${values.preliminary ? " (dastlabki)" : ""}${values.parent ? ` · ${values.parent.name}` : ""}${unit ? ` · ${unit}` : ""}`,
      legend,
      footer: `Manba: SIAT, O'zbekiston Respublikasi Milliy statistika qo'mitasi, CC BY 4.0 ${src ? "· " + src : ""}\nmy.stat.uz · ${new Date().toLocaleDateString("ru-RU")}`,
      filename: `siat-${values.indicator}-${values.period}.png`,
    });
  };
  const tableParams = {
    indicator: indicator?.key ?? "", period: values?.period, level, parent: region || undefined, breakdown: breakdown || undefined,
    preset: preset || undefined, weights: weights || undefined, view: growthView ? ("growth" as const) : undefined, scenario,
  };
  const scoreQuery = { period: isScore ? values?.period : undefined, preset: preset || undefined, weights: weights || undefined };

  const sorted = useMemo(
    () => [...(values?.items ?? [])].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity)),
    [values]
  );
  const maxAbs = Math.max(0, ...sorted.map((r) => Math.abs(r.value ?? 0)));
  const missingCount = (values?.items ?? []).filter((i) => i.value === null).length;
  const noPolygon = (values?.items ?? []).filter((i) => features && !onMap.has(i.code));
  const themes = catalog.data?.themes ?? [];
  const regionName = region ? (values?.parent?.name || regionsGeo?.find((f) => f.properties.soato === region)?.properties.name_uz || region) : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-gray-100 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Hududlar xaritasi"
          description="Rasmiy statistika (SIAT) viloyat va tumanlar kesimida. Hududni bosing — kartochka, viloyatni bosing — tumanlari."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Fuqarolar uchun", to: "/citizens" }, { label: "Hududlar" }]}
        />

        {catalog.loading && !catalog.data ? (
          <Skeleton variant="chart" />
        ) : catalog.error || !indicator ? (
          <ErrorState onRetry={catalog.reload} description={catalog.error ? undefined : "Kartada ko'rsatiladigan ko'rsatkichlar hali yuklanmagan (SIAT sinxronlash)."} />
        ) : (
          <>
            {/* Boshqaruv */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              <label className="text-sm lg:col-span-2">
                Ko'rsatkich
                <select value={indicator.key} onChange={(e) => update({ ind: e.target.value, p: null, b: null, ind2: null, v: null, sc: null, ...(isScoreKey(e.target.value) ? {} : { sp: null, sw: null }) })}
                  className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                  {themes.map((t) => (
                    <optgroup key={t.key} label={t.label}>
                      {indicators.filter((i) => i.theme === t.key).map((i) => (
                        <option key={i.key} value={i.key}>{i.name}{i.geo_level === "district" ? " · tumanlar" : ""}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </label>
              {indicator.breakdowns.length > 0 ? (
                <label className="text-sm">
                  Faoliyat turi
                  <select value={breakdown} onChange={(e) => update({ b: e.target.value })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    {indicator.breakdowns.map((b) => <option key={b.code} value={b.code}>{b.name}</option>)}
                  </select>
                </label>
              ) : (
                <label className="text-sm">
                  Ikkinchi ko'rsatkich (taqqoslash)
                  <select value={ind2?.key ?? ""} onChange={(e) => update({ ind2: e.target.value || null })}
                    className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
                    <option value="">— yo'q —</option>
                    {indicators.filter((i) => i.key !== indicator.key && !i.breakdowns.length && (level === "region" || i.geo_level === "district"))
                      .map((i) => <option key={i.key} value={i.key}>{i.name}</option>)}
                  </select>
                </label>
              )}
              <div className="relative text-sm">
                <label htmlFor="territory-search">Hudud qidirish</label>
                <div className="mt-1 flex gap-2">
                  <div className="relative flex-1">
                    <Search className="w-4 h-4 absolute left-2.5 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
                    <input id="territory-search" value={query} onFocus={loadTerritories} onChange={(e) => setQuery(e.target.value)}
                      placeholder="Tuman yoki shahar" autoComplete="off" role="combobox" aria-expanded={matches.length > 0} aria-controls="territory-results"
                      className="w-full pl-8 pr-2 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
                  </div>
                  <button type="button" onClick={locate} title="Mening hududim" aria-label="Mening hududim (joylashuv bo'yicha)"
                    className="px-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800"><LocateFixed className="w-4 h-4" /></button>
                </div>
                {matches.length > 0 && (
                  <ul id="territory-results" role="listbox" className="absolute z-[1200] mt-1 w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
                    {matches.map((t) => (
                      <li key={t.code} role="option" aria-selected={false}>
                        <button type="button" onClick={() => { goTo(t.code); setQuery(""); }} className="w-full text-left px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-700">
                          {t.names.uz} {t.parent && t.parent !== "1700" && <span className="text-xs text-gray-500">· {parentName(t.parent)}</span>}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
            {notice && <p role="status" className="mb-3 text-sm text-amber-700 dark:text-amber-300">{notice}</p>}

            <div className="flex flex-wrap items-center gap-2 mb-3 text-sm">
              {/* Drill-down (KR-07) */}
              <nav aria-label="Hudud darajasi" className="flex items-center gap-1 mr-auto">
                {region && (
                  <button type="button" onClick={() => update({ r: null, lvl: null, t: region })} className="inline-flex items-center gap-1 px-2 py-1 rounded-lg border border-gray-300 dark:border-gray-600">
                    <ChevronLeft className="w-4 h-4" aria-hidden="true" /> Orqaga
                  </button>
                )}
                <button type="button" onClick={() => update({ r: null, t: null, c: null, lvl: null })} className="text-blue-600 hover:underline">O'zbekiston</button>
                {region && <><span className="text-gray-400">›</span><button type="button" onClick={() => update({ t: region })} className="text-blue-600 hover:underline">{regionName}</button></>}
                {selected && selected.length === 7 && card && <><span className="text-gray-400">›</span><span>{card.name}</span></>}
              </nav>
              <div role="group" aria-label="Daraja" className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                <button type="button" aria-pressed={level === "region"} onClick={() => update({ lvl: null, r: null })}
                  className={`px-3 py-1 ${level === "region" ? "bg-blue-600 text-white" : ""}`}>Viloyatlar</button>
                <button type="button" aria-pressed={level === "district"} disabled={!canDistrict} title={canDistrict ? "" : "Bu ko'rsatkich tumanlar kesimida yo'q"}
                  onClick={() => update({ lvl: "district" })}
                  className={`px-3 py-1 disabled:opacity-40 disabled:cursor-not-allowed ${level === "district" ? "bg-blue-600 text-white" : ""}`}>Tumanlar</button>
              </div>
              {!bivar && !isScore && (
                <div role="group" aria-label="Shkala" className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button type="button" aria-pressed={scaleMode === "quantile"} onClick={() => update({ s: null })} className={`px-3 py-1 ${scaleMode === "quantile" ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900" : ""}`}>Kvantil</button>
                  <button type="button" aria-pressed={scaleMode === "linear"} onClick={() => update({ s: "l" })} className={`px-3 py-1 ${scaleMode === "linear" ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900" : ""}`}>Chiziqli</button>
                </div>
              )}
              {!bivar && !isScore && periods.length > 1 && (
                <label className="inline-flex items-center gap-1.5 text-xs" title="Animatsiyada ranglar yillar bo'yicha taqqoslanadigan bo'lishi uchun">
                  <input type="checkbox" checked={fixedScale} disabled={playing} onChange={(e) => update({ fix: e.target.checked ? "1" : null })} />
                  Barcha yillar uchun bir xil shkala
                </label>
              )}
              {(isScore || isForecast) && (
                <button type="button" onClick={() => setShowMethodology(true)} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600">
                  <BookOpen className="w-4 h-4" aria-hidden="true" /> Metodologiya
                </button>
              )}
              <button type="button" onClick={exportPng} disabled={!values || !features} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40">
                <Download className="w-4 h-4" aria-hidden="true" /> PNG
              </button>
              <button type="button" onClick={() => downloadMapTable(tableParams, "csv")} disabled={!values} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40">
                <FileSpreadsheet className="w-4 h-4" aria-hidden="true" /> CSV
              </button>
              <button type="button" onClick={() => downloadMapTable(tableParams, "xlsx")} disabled={!values} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600 disabled:opacity-40">
                <FileSpreadsheet className="w-4 h-4" aria-hidden="true" /> XLSX
              </button>
            </div>

            {isScore && scoreConfig && (
              <div className="mb-3">
                <WeightsPanel config={scoreConfig} level={level} preset={preset} weights={weights} onChange={(patch) => update(patch)} />
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                {isForecast && (
                  <div role="status" className="flex flex-wrap items-center gap-x-3 gap-y-2 rounded-xl border border-violet-200 dark:border-violet-800 bg-violet-50 dark:bg-violet-900/20 px-3 py-2 text-sm text-violet-900 dark:text-violet-100">
                    <Sparkles className="w-4 h-4 shrink-0" aria-hidden="true" />
                    <span className="flex-1 min-w-[12rem]">
                      <b>Prognoz, {values?.period}.</b> {isScore ? "Indeks prognoz qiymatlaridan hisoblangan." : "Taxminiy qiymat, 80% ishonch oralig'i kartochkada."} Rasmiy ma'lumot emas.
                    </span>
                    {!isScore && (
                      <div role="group" aria-label="Prognoz ko'rinishi" className="inline-flex rounded-lg border border-violet-300 dark:border-violet-700 overflow-hidden text-xs">
                        <button type="button" aria-pressed={!growthView} onClick={() => update({ v: null })} className={`px-2.5 py-1 ${!growthView ? "bg-violet-600 text-white" : ""}`}>Qiymat</button>
                        <button type="button" aria-pressed={growthView} onClick={() => update({ v: "g" })} className={`px-2.5 py-1 ${growthView ? "bg-violet-600 text-white" : ""}`}>Yillik o'sish</button>
                      </div>
                    )}
                    {!isScore && (
                      <div role="group" aria-label="Prognoz ssenariysi" className="inline-flex rounded-lg border border-violet-300 dark:border-violet-700 overflow-hidden text-xs">
                        {([[undefined, "Bazaviy"], ["pes", "Salbiy"], ["opt", "Ijobiy"]] as const).map(([sc, label]) => (
                          <button key={label} type="button" aria-pressed={scenario === sc} onClick={() => update({ sc: sc ?? null })}
                            title={sc ? "O'xshash hududlarning o'sish sur'ati choragi bo'yicha (oraliqsiz)" : "Asosiy prognoz, 80% oraliq bilan"}
                            className={`px-2.5 py-1 ${scenario === sc ? "bg-violet-600 text-white" : ""}`}>{label}</button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
                <div className="relative">
                  {geoError ? (
                    <ErrorState description="Chegaralar fayli yuklanmadi." onRetry={() => window.location.reload()} />
                  ) : !features ? (
                    <Skeleton variant="chart" />
                  ) : (
                    <ChoroplethMap features={features} context={context} underlay={underlay} fill={fill} tooltip={tooltip} selected={selected} compare={compare}
                      onSelect={select} fitKey={`${level}:${region}`} height="min(62vh, 560px)" label={`${values?.name ?? indicator.name} xaritasi`} dim={isForecast} />
                  )}
                  {valuesLoading && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1 rounded-full bg-white/90 dark:bg-gray-800/90 text-xs shadow">Yuklanmoqda…</div>}
                  {pickCompare && <div className="absolute top-2 left-14 z-[1000] px-3 py-1 rounded-full bg-violet-600 text-white text-xs shadow">Solishtirish uchun ikkinchi hududni bosing</div>}
                </div>
                {bivar ? <BivariateLegend x={values?.name ?? ""} y={values2?.name ?? ""} /> : (
                  <MapLegend scale={scale} unit={unit} republic={values?.republic ?? null} parent={values?.parent} preliminary={!!values?.preliminary} missingCount={missingCount}
                    hideRepublic={isScore} note={isScore ? "50 — tengdoshlar o'rtachasi. " + (values?.disclaimer ?? "") : isForecast ? values?.note ?? undefined : undefined}
                    missingLabel={isScore ? "Ma'lumot yetarli emas" : undefined} />
                )}
                {valuesError ? <ErrorState onRetry={() => setRetry((n) => n + 1)} description="Bu davr yoki hudud uchun ma'lumot topilmadi." /> : null}

                {/* Vaqt slayderi (KR-08) */}
                {periods.length > 1 && (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                    <button type="button" onClick={() => { if (index >= periods.length - 1) update({ p: periods[0] }); setPlaying((v) => !v); }}
                      aria-label={playing ? "To'xtatish" : "Animatsiya"} className="p-1.5 rounded-full bg-blue-600 text-white">
                      {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <div className="relative flex-1">
                      <input type="range" min={0} max={periods.length - 1} value={index} aria-label="Davr"
                        aria-valuetext={`${periods[index]}${forecastPeriods.includes(periods[index]) ? " (prognoz)" : ""}`}
                        onChange={(e) => { setPlaying(false); update({ p: periods[Number(e.target.value)] }); }}
                        className={`w-full ${isForecast ? "accent-violet-600" : "accent-blue-600"}`} />
                      {firstForecast > 0 && (
                        <span aria-hidden="true" className="pointer-events-none absolute -bottom-1.5 h-1 rounded-full bg-violet-400/70"
                          style={{ left: `calc(${(firstForecast - 0.5) / (periods.length - 1) * 100}% )`, right: 0 }} />
                      )}
                    </div>
                    <span className={`w-24 text-right font-semibold tabular-nums ${isForecast ? "text-violet-700 dark:text-violet-300" : ""}`}>
                      {periods[index]}{isForecast ? " P" : values?.preliminary ? "*" : ""}
                    </span>
                  </div>
                )}
                {firstForecast > 0 && (
                  <p className="-mt-1 text-xs text-gray-500">
                    <span className="inline-block w-3 h-1 align-middle rounded-full bg-violet-400/70 mr-1" aria-hidden="true" />
                    Prognoz yillari (P): {forecastPeriods[0]}–{forecastPeriods[forecastPeriods.length - 1]}
                  </p>
                )}
                {isScore && <ScoreTable level={level} parent={region || undefined} query={scoreQuery} selected={selected} onSelect={select} />}

                {bivar && values && values2 && <BivariateScatter values={values} values2={values2} selected={selected} onSelect={select} />}

                {/* Manba va metodika (KR-12) */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-xs text-gray-600 dark:text-gray-300 space-y-1">
                  <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <span>Manba: <b>SIAT</b>, Milliy statistika qo'mitasi · {catalog.data?.source.license}</span>
                    {indicator.source_updated_at && <span>SIAT'da yangilangan: {new Date(indicator.source_updated_at).toLocaleDateString("ru-RU")}</span>}
                    {indicator.siat_url && (
                      <a href={indicator.siat_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-blue-600 hover:underline">
                        SIAT'da ochish <ExternalLink className="w-3 h-3" aria-hidden="true" />
                      </a>
                    )}
                  </p>
                  {indicator.derived_from && <p>{indicator.derived_from}</p>}
                  {indicator.notes && <p><Info className="inline w-3.5 h-3.5 mr-1" aria-hidden="true" />{indicator.notes}</p>}
                  {indicator.methodology && (
                    <details><summary className="cursor-pointer text-blue-600">Hisoblash metodikasi</summary><p className="mt-1 whitespace-pre-line">{indicator.methodology}</p></details>
                  )}
                  {noPolygon.length > 0 && (
                    <p>Chegarasi kartada yo'q (yangi tuzilgan, ochiq chegaralar faylida hali mavjud emas): {noPolygon.map((i) => i.name).join(", ")} — qiymatlari ro'yxatda.</p>
                  )}
                </div>
              </div>

              <aside className="space-y-4">
                {card && (
                  <div className="fixed inset-x-0 bottom-0 z-[1100] max-h-[50vh] overflow-y-auto shadow-2xl lg:static lg:max-h-none lg:overflow-visible lg:shadow-none">
                    <TerritoryPanel card={card} other={other} indicatorKey={indicator.key} period={values?.period}
                      onClose={() => update({ t: null, c: null })} onCompare={() => setPickCompare((v) => !v)} comparing={pickCompare}
                      onClearCompare={() => update({ c: null })} scoreQuery={scoreQuery} defaultTab={isScore ? "score" : "indicator"}
                      onSelectTerritory={goTo} onCompareWith={(code) => update({ c: code })} onMethodology={() => setShowMethodology(true)} />
                  </div>
                )}
                <section aria-label="Reyting" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h2 className="px-4 pt-3 text-sm font-semibold">
                    {values?.name ?? indicator.name}{values ? `, ${values.period}` : ""}{isForecast && <span className="ml-1 text-violet-600">(prognoz{growthView ? ", yillik o'sish" : ""}{scenario ? `, ${scenario === "opt" ? "ijobiy" : "salbiy"} ssenariy` : ""})</span>}
                  </h2>
                  <ol className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[560px] overflow-y-auto">
                    {sorted.map((r, i) => (
                      <li key={r.code}>
                        <button type="button" onClick={() => select(r.code)} aria-current={r.code === selected}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 ${r.code === selected ? "bg-orange-50 dark:bg-orange-900/20" : ""}`}>
                          <span className="w-6 text-xs text-gray-500 tabular-nums">{r.value === null ? "—" : i + 1}</span>
                          <span className="w-3 h-3 rounded-sm shrink-0 border border-gray-300 dark:border-gray-600" style={{ background: fill(r.code) ?? HATCH_CSS }} />
                          <span className="flex-1 min-w-0 text-sm">
                            {r.name}{features && !onMap.has(r.code) && <MapPin className="inline w-3 h-3 ml-1 text-gray-400" aria-label="kartada chegarasi yo'q" />}
                            {r.value !== null && maxAbs > 0 && (
                              <span className="mt-1 block h-1 rounded-full bg-gray-100 dark:bg-gray-700" aria-hidden="true">
                                <span className="block h-full rounded-full bg-blue-500/70" style={{ width: `${(Math.abs(r.value) / maxAbs) * 100}%` }} />
                              </span>
                            )}
                          </span>
                          <span className="text-sm tabular-nums font-medium">{r.value === null ? <span className="text-gray-400 font-normal">{r.note ?? "ma'lumot yo'q"}</span> : <>{formatValue(r.value)}{r.preliminary ? "*" : ""}</>}</span>
                        </button>
                      </li>
                    ))}
                  </ol>
                </section>
              </aside>
            </div>
          </>
        )}
      </div>
      {showMethodology && scoreConfig && <ScoreMethodology config={scoreConfig} onClose={() => setShowMethodology(false)} />}
    </div>
  );
}

function BivariateLegend({ x, y }: { x: string; y: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2.5 text-xs flex items-center gap-4">
      <div className="flex items-end gap-1.5 shrink-0">
        <span className="self-start text-gray-500">{"Y ↑"}</span>
        <div>
          <div className="grid grid-cols-3 w-16 h-16 rounded overflow-hidden" aria-hidden="true">
            {[2, 1, 0].map((row) => [0, 1, 2].map((col) => <span key={`${row}${col}`} style={{ background: BIVARIATE[row][col] }} />))}
          </div>
          <p className="text-gray-500 text-center">{"X →"}</p>
        </div>
      </div>
      <div className="min-w-0 space-y-1 text-gray-700 dark:text-gray-300">
        <p><b>X:</b> {x}</p>
        <p><b>Y:</b> {y}</p>
        <p className="text-gray-500">Har o'q 3 sinfga (past / o'rta / yuqori) bo'lingan. To'q rang — ikkalasi ham yuqori.</p>
      </div>
    </div>
  );
}

function BivariateScatter({ values, values2, selected, onSelect }: { values: MapValues; values2: MapValues; selected: string | null; onSelect: (code: string) => void }) {
  const chart = useChartTheme();
  const ys = new Map(values2.items.map((i) => [i.code, i.value]));
  const points = values.items
    .filter((i) => i.value !== null && ys.get(i.code) !== null && ys.get(i.code) !== undefined)
    .map((i) => ({ code: i.code, name: i.name, x: i.value as number, y: ys.get(i.code) as number }));
  // Kartadagi bilan bir xil sinflar (Regions: bivar)
  const tx = tertiles(values.items.map((i) => i.value).filter((v): v is number => v !== null));
  const ty = tertiles(values2.items.map((i) => i.value).filter((v): v is number => v !== null));
  const r = pearson(points);
  const active = points.find((p) => p.code === selected);
  return (
    <section aria-label="Tarqalish diagrammasi" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2 mb-2">
        <h2 className="text-sm font-semibold">{values.name} va {values2.name}</h2>
        {r !== null && (
          <span className="text-xs text-gray-500" title="Pirson korrelyatsiya koeffitsiyenti: -1 dan 1 gacha">
            Bog'liqlik: <b className="text-gray-700 dark:text-gray-200 tabular-nums">r = {r.toFixed(2)}</b> ({correlationLabel(r)})
          </span>
        )}
      </div>
      <div className="h-72">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 8, bottom: 24 }}>
            <CartesianGrid stroke={chart.grid} />
            <XAxis type="number" dataKey="x" name={values.name} {...niceAxis(points.map((p) => p.x))} tick={{ fontSize: 11, fill: chart.axis }}
              tickFormatter={(v) => formatAxis(Number(v))}
              label={{ value: `${values.name}, ${values.unit} (${values.period})`, position: "insideBottom", offset: -16, fontSize: 11, fill: chart.axis }} />
            <YAxis type="number" dataKey="y" name={values2.name} {...niceAxis(points.map((p) => p.y))} tick={{ fontSize: 11, fill: chart.axis }} width={64}
              tickFormatter={(v) => formatAxis(Number(v))}
              label={{ value: `${values2.unit} (${values2.period})`, angle: -90, position: "insideLeft", offset: 0, fontSize: 11, fill: chart.axis, style: { textAnchor: "middle" } }} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
              const p = payload?.[0]?.payload as { name: string; x: number; y: number } | undefined;
              return p ? (
                <div className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 px-2.5 py-1.5 text-xs shadow">
                  <b>{p.name}</b><br />
                  {values.name}: {formatValue(p.x)} {values.unit}<br />
                  {values2.name}: {formatValue(p.y)} {values2.unit}
                </div>
              ) : null;
            }} />
            <Scatter data={points} onClick={(p) => onSelect((p as unknown as { code: string }).code)} cursor="pointer">
              {points.map((p) => (
                <Cell key={p.code} fill={bivariateColor(p.x, p.y, tx, ty) ?? "#9ca3af"} stroke={p.code === selected ? "#f97316" : "#374151"}
                  strokeWidth={p.code === selected ? 2.5 : 0.75} r={p.code === selected ? 7 : 5} />
              ))}
            </Scatter>
            {active && <ReferenceDot x={active.x} y={active.y} r={10} fill="none" stroke="#f97316" strokeWidth={1.5} ifOverflow="extendDomain" />}
          </ScatterChart>
        </ResponsiveContainer>
      </div>
      <p className="mt-1 text-xs text-gray-500">Har nuqta — hudud, rangi kartadagi bilan bir xil. Nuqtani bossangiz, hudud tanlanadi.</p>
    </section>
  );
}

function pearson(points: { x: number; y: number }[]) {
  const n = points.length;
  if (n < 3) return null;
  const mx = points.reduce((a, p) => a + p.x, 0) / n;
  const my = points.reduce((a, p) => a + p.y, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (const p of points) {
    sxy += (p.x - mx) * (p.y - my);
    sxx += (p.x - mx) ** 2;
    syy += (p.y - my) ** 2;
  }
  return sxx && syy ? sxy / Math.sqrt(sxx * syy) : null;
}

function correlationLabel(r: number) {
  const a = Math.abs(r);
  const strength = a >= 0.7 ? "kuchli" : a >= 0.4 ? "o'rtacha" : a >= 0.2 ? "kuchsiz" : "deyarli yo'q";
  return a < 0.2 ? strength : `${strength}, ${r > 0 ? "to'g'ri" : "teskari"}`;
}
