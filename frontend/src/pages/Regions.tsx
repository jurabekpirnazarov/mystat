import { useCallback, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CartesianGrid, ResponsiveContainer, Scatter, ScatterChart, Tooltip, XAxis, YAxis } from "recharts";
import { ChevronLeft, Download, ExternalLink, FileSpreadsheet, Info, LocateFixed, MapPin, Pause, Play, Search } from "lucide-react";
import {
  downloadMapTable, fetchMapCatalog, fetchMapValues, fetchTerritories, fetchTerritory,
  type GeoLevel, type MapIndicator, type MapValues, type TerritoryCard, type TerritoryName,
} from "../api/siatMap";
import useApi from "../hooks/useApi";
import { ErrorState, PageHeader, Skeleton } from "../components/ui";
import ChoroplethMap from "../components/maps/ChoroplethMap";
import MapLegend from "../components/siatMap/MapLegend";
import TerritoryPanel from "../components/siatMap/TerritoryPanel";
import { featureAt, loadBoundaries, renderMapPng, type GeoFeature } from "../utils/mapGeo";
import { BIVARIATE, bivariateColor, buildScale, colorFor, formatValue, legendRows, tertiles, type ScaleMode } from "../utils/mapScale";

const PLAY_MS = 1200;
const isAbort = (e: unknown) => (e as { name?: string })?.name === "CanceledError" || (e as { name?: string })?.name === "AbortError";

/**
 * SIAT_KARTA_TAHLIL KR-06..KR-13: hududlar xaritasi (SIAT ma'lumoti, SOATO kodi bo'yicha).
 * Holat URL'da: ?ind=246&p=2026&lvl=district&r=1735&t=1735204&c=1703&b=A&s=l&ind2=500 — havola bilan ulashiladi.
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
  const scaleMode: ScaleMode = get("s") === "l" ? "linear" : "quantile";
  const selected = get("t") || null;
  const compare = get("c") || null;
  const ind2Key = get("ind2");
  const ind2 = indicators.find((i) => i.key === ind2Key && i.key !== indicator?.key && (level === "region" || i.geo_level === "district"));
  const period = indicator && indicator.periods.includes(get("p")) ? get("p") : indicator?.last_period ?? "";

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
    fetchMapValues({ indicator: indicator.key, period, level, parent: region || undefined, breakdown: breakdown || undefined }, ctrl.signal)
      .then(setValues)
      .catch((e) => !isAbort(e) && setValuesError(e))
      .finally(() => !ctrl.signal.aborted && setValuesLoading(false));
    return () => ctrl.abort();
  }, [indicator, period, level, region, breakdown, retry]);

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
  const onMap = useMemo(() => new Set((features ?? []).map((f) => f.properties.soato)), [features]);

  // Rang
  const byCode = useMemo(() => new Map((values?.items ?? []).map((i) => [i.code, i])), [values]);
  const byCode2 = useMemo(() => new Map((values2?.items ?? []).map((i) => [i.code, i])), [values2]);
  // Odatda shkala joriy davr bo'yicha; animatsiyada yoki "bir xil shkala" tanlansa — barcha davrlar bo'yicha (KR-08)
  const [playing, setPlaying] = useState(false);
  const fixedScale = playing || get("fix") === "1";
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
      if (!item || item.value === null) return `${name}: ma'lumot yo'q`;
      let text = `${name}: ${formatValue(item.value)} ${unit}${item.preliminary ? " (dastlabki)" : ""}`;
      if (values2) text += ` · ${values2.name}: ${formatValue(byCode2.get(code)?.value)} ${values2.unit}`;
      return text;
    },
    [byCode, byCode2, unit, values2]
  );

  // Vaqt slayderi (KR-08)
  const periods = useMemo(() => values?.periods ?? indicator?.periods ?? [], [values, indicator]);
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
  const tableParams = { indicator: indicator?.key ?? "", period: values?.period, level, parent: region || undefined, breakdown: breakdown || undefined };

  const sorted = useMemo(
    () => [...(values?.items ?? [])].sort((a, b) => (b.value ?? -Infinity) - (a.value ?? -Infinity)),
    [values]
  );
  const missingCount = (values?.items ?? []).filter((i) => i.value === null).length;
  const noPolygon = (values?.items ?? []).filter((i) => features && !onMap.has(i.code));
  const themes = catalog.data?.themes ?? [];
  const regionName = region ? (values?.parent?.name || regionsGeo?.find((f) => f.properties.soato === region)?.properties.name_uz || region) : "";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
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
                <select value={indicator.key} onChange={(e) => update({ ind: e.target.value, p: null, b: null, ind2: null })}
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
              {!bivar && (
                <div role="group" aria-label="Shkala" className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
                  <button type="button" aria-pressed={scaleMode === "quantile"} onClick={() => update({ s: null })} className={`px-3 py-1 ${scaleMode === "quantile" ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900" : ""}`}>Kvantil</button>
                  <button type="button" aria-pressed={scaleMode === "linear"} onClick={() => update({ s: "l" })} className={`px-3 py-1 ${scaleMode === "linear" ? "bg-gray-800 text-white dark:bg-gray-200 dark:text-gray-900" : ""}`}>Chiziqli</button>
                </div>
              )}
              {!bivar && periods.length > 1 && (
                <label className="inline-flex items-center gap-1.5 text-xs" title="Animatsiyada ranglar yillar bo'yicha taqqoslanadigan bo'lishi uchun">
                  <input type="checkbox" checked={fixedScale} disabled={playing} onChange={(e) => update({ fix: e.target.checked ? "1" : null })} />
                  Barcha yillar uchun bir xil shkala
                </label>
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

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-3">
                <div className="relative">
                  {geoError ? (
                    <ErrorState description="Chegaralar fayli yuklanmadi." onRetry={() => window.location.reload()} />
                  ) : !features ? (
                    <Skeleton variant="chart" />
                  ) : (
                    <ChoroplethMap features={features} context={context} fill={fill} tooltip={tooltip} selected={selected} compare={compare}
                      onSelect={select} fitKey={`${level}:${region}`} height="min(62vh, 560px)" label={`${values?.name ?? indicator.name} xaritasi`} />
                  )}
                  {valuesLoading && <div className="absolute top-2 left-1/2 -translate-x-1/2 z-[1000] px-3 py-1 rounded-full bg-white/90 dark:bg-gray-800/90 text-xs shadow">Yuklanmoqda…</div>}
                  {pickCompare && <div className="absolute top-2 left-2 z-[1000] px-3 py-1 rounded-full bg-violet-600 text-white text-xs shadow">Solishtirish uchun ikkinchi hududni bosing</div>}
                  <div className="hidden sm:block absolute bottom-3 left-3 z-[1000] w-56">
                    {bivar ? <BivariateLegend x={values?.name ?? ""} y={values2?.name ?? ""} /> : (
                      <MapLegend scale={scale} unit={unit} republic={values?.republic ?? null} parent={values?.parent} preliminary={!!values?.preliminary} missingCount={missingCount} />
                    )}
                  </div>
                </div>
                <div className="sm:hidden">
                  {bivar ? <BivariateLegend x={values?.name ?? ""} y={values2?.name ?? ""} /> : (
                    <MapLegend scale={scale} unit={unit} republic={values?.republic ?? null} parent={values?.parent} preliminary={!!values?.preliminary} missingCount={missingCount} />
                  )}
                </div>
                {valuesError ? <ErrorState onRetry={() => setRetry((n) => n + 1)} description="Bu davr yoki hudud uchun ma'lumot topilmadi." /> : null}

                {/* Vaqt slayderi (KR-08) */}
                {periods.length > 1 && (
                  <div className="flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2">
                    <button type="button" onClick={() => { if (index >= periods.length - 1) update({ p: periods[0] }); setPlaying((v) => !v); }}
                      aria-label={playing ? "To'xtatish" : "Animatsiya"} className="p-1.5 rounded-full bg-blue-600 text-white">
                      {playing ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                    </button>
                    <input type="range" min={0} max={periods.length - 1} value={index} aria-label="Davr"
                      onChange={(e) => { setPlaying(false); update({ p: periods[Number(e.target.value)] }); }} className="flex-1 accent-blue-600" />
                    <span className="w-20 text-right font-semibold tabular-nums">{periods[index]}{values?.preliminary ? "*" : ""}</span>
                  </div>
                )}

                {bivar && values && values2 && <BivariateScatter values={values} values2={values2} />}

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
                    <TerritoryPanel card={card} other={other} indicatorKey={indicator.key}
                      onClose={() => update({ t: null, c: null })} onCompare={() => setPickCompare((v) => !v)} comparing={pickCompare}
                      onClearCompare={() => update({ c: null })} />
                  </div>
                )}
                <section aria-label="Reyting" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
                  <h2 className="px-4 pt-3 text-sm font-semibold">{values?.name ?? indicator.name}{values ? `, ${values.period}` : ""}</h2>
                  <ol className="divide-y divide-gray-100 dark:divide-gray-700 max-h-[480px] overflow-y-auto">
                    {sorted.map((r, i) => (
                      <li key={r.code}>
                        <button type="button" onClick={() => select(r.code)} aria-current={r.code === selected}
                          className={`w-full flex items-center gap-3 px-4 py-2 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 ${r.code === selected ? "bg-orange-50 dark:bg-orange-900/20" : ""}`}>
                          <span className="w-6 text-xs text-gray-500 tabular-nums">{r.value === null ? "—" : i + 1}</span>
                          <span className="w-3 h-3 rounded-sm shrink-0 border border-gray-300" style={{ background: fill(r.code) ?? "repeating-linear-gradient(45deg,#f3f4f6 0 3px,#9ca3af 3px 4px)" }} />
                          <span className="flex-1 text-sm">{r.name}{features && !onMap.has(r.code) && <MapPin className="inline w-3 h-3 ml-1 text-gray-400" aria-label="kartada chegarasi yo'q" />}</span>
                          <span className="text-sm tabular-nums font-medium">{r.value === null ? <span className="text-gray-400 font-normal">ma'lumot yo'q</span> : <>{formatValue(r.value)}{r.preliminary ? "*" : ""}</>}</span>
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
    </div>
  );
}

function BivariateLegend({ x, y }: { x: string; y: string }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white/95 dark:bg-gray-800/95 p-3 text-xs">
      <div className="flex gap-2 items-end">
        <span className="[writing-mode:vertical-rl] rotate-180 text-gray-600 max-h-24 overflow-hidden">{y} →</span>
        <div>
          <div className="grid grid-cols-3 w-20 h-20" aria-hidden="true">
            {[2, 1, 0].map((row) => [0, 1, 2].map((col) => <span key={`${row}${col}`} style={{ background: BIVARIATE[row][col] }} />))}
          </div>
          <p className="mt-1 text-gray-600 line-clamp-2">{x} →</p>
        </div>
      </div>
      <p className="mt-1 text-gray-500">Har o'q 3 sinf (tertil)</p>
    </div>
  );
}

function BivariateScatter({ values, values2 }: { values: MapValues; values2: MapValues }) {
  const ys = new Map(values2.items.map((i) => [i.code, i.value]));
  const points = values.items
    .filter((i) => i.value !== null && ys.get(i.code) !== null && ys.get(i.code) !== undefined)
    .map((i) => ({ name: i.name, x: i.value as number, y: ys.get(i.code) as number }));
  return (
    <section aria-label="Tarqalish diagrammasi" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
      <h2 className="text-sm font-semibold mb-2">{values.name} ({values.period}) × {values2.name} ({values2.period})</h2>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis type="number" dataKey="x" name={values.name} fontSize={11} tickFormatter={(v) => formatValue(Number(v))} />
            <YAxis type="number" dataKey="y" name={values2.name} fontSize={11} width={60} tickFormatter={(v) => formatValue(Number(v))} />
            <Tooltip cursor={{ strokeDasharray: "3 3" }} content={({ payload }) => {
              const p = payload?.[0]?.payload as { name: string; x: number; y: number } | undefined;
              return p ? <div className="rounded bg-white dark:bg-gray-800 border px-2 py-1 text-xs shadow">{p.name}<br />{formatValue(p.x)} · {formatValue(p.y)}</div> : null;
            }} />
            <Scatter data={points} fill="#2563eb" />
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}
