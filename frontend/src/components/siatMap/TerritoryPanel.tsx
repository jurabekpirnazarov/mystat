import { useState } from "react";
import { Link } from "react-router-dom";
import { Area, CartesianGrid, ComposedChart, Legend, Line, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, ExternalLink, GitCompare, X } from "lucide-react";
import type { ForecastBlock, ScoreQuery, TerritoryCard, TerritoryIndicator } from "../../api/siatMap";
import { formatValue } from "../../utils/mapScale";
import { formatAxis, niceAxis, useChartTheme } from "../../utils/chartTheme";
import ScorePanel from "./ScorePanel";
import WhatIfPanel from "./WhatIfPanel";
import CompanyQualityBlock from "../company-score/CompanyQualityBlock";

/** "2024-M03" → "03.24", "2024-Q2" → "Q2.24"; yillik davr o'zgarmaydi. */
const shortPeriod = (p: string) => {
  const m = /^(\d{4})-([MQ])(\d+)$/.exec(p);
  if (!m) return p;
  return m[2] === "M" ? `${m[3].padStart(2, "0")}.${m[1].slice(2)}` : `Q${m[3]}.${m[1].slice(2)}`;
};

const KEY_INDICATORS = ["246", "d-density", "500", "1875", "660", "1299"];

function Rank({ ind }: { ind: TerritoryIndicator }) {
  if (!ind.rank) return null;
  const good = ind.higher_is_better === null ? null : (ind.vs_average_pct ?? 0) >= 0 === ind.higher_is_better;
  return (
    <p className="text-xs text-gray-500">
      {ind.of} dan {ind.rank}-o'rin
      {ind.vs_average_pct !== null && (
        <span className={`ml-2 inline-flex items-center ${good === null ? "" : good ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
          {ind.vs_average_pct >= 0 ? <ArrowUp className="w-3 h-3" aria-hidden="true" /> : <ArrowDown className="w-3 h-3" aria-hidden="true" />}
          o'rtachadan {formatValue(Math.abs(ind.vs_average_pct))}% {ind.vs_average_pct >= 0 ? "yuqori" : "past"}
        </span>
      )}
    </p>
  );
}

interface Props {
  card: TerritoryCard;
  other?: TerritoryCard | null;
  indicatorKey: string;
  /** Kartada tanlangan davr — grafikda vertikal chiziq bilan belgilanadi */
  period?: string;
  onClose: () => void;
  onCompare?: () => void;
  comparing?: boolean;
  onClearCompare?: () => void;
  /** "Salohiyat" yorlig'i (SCORING_MODEL.md 7-bo'lim): davr, preset/vaznlar */
  scoreQuery?: ScoreQuery;
  defaultTab?: "indicator" | "score";
  onSelectTerritory?: (code: string) => void;
  onCompareWith?: (code: string) => void;
  onMethodology?: () => void;
}

/** KR-09 hudud kartochkasi; KR-11 ikki hududni yonma-yon solishtirish; "Salohiyat" yorlig'i va prognoz (10.8). */
export default function TerritoryPanel({
  card, other, indicatorKey, period, onClose, onCompare, comparing, onClearCompare, scoreQuery, defaultTab = "indicator",
  onSelectTerritory, onCompareWith, onMethodology,
}: Props) {
  const [tab, setTab] = useState<"indicator" | "score">(defaultTab);
  const [shownFor, setShownFor] = useState(defaultTab);
  if (shownFor !== defaultTab) {
    // Ko'rsatkich "Salohiyat"ga almashsa yorliq ham almashadi
    setShownFor(defaultTab);
    setTab(defaultTab);
  }
  const current = card.indicators.find((i) => i.key === indicatorKey);
  const otherCurrent = other?.indicators.find((i) => i.key === indicatorKey);
  const keys = KEY_INDICATORS.filter((k) => k !== indicatorKey);
  const extra = keys.map((k) => card.indicators.find((i) => i.key === k)).filter(Boolean).slice(0, 5) as TerritoryIndicator[];
  const fallback = current ?? card.indicators.find((i) => i.key === "246") ?? card.indicators[0];

  return (
    <section aria-label={`${card.name} kartochkasi`} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-4">
      <div className="flex items-start justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">{card.parent ? card.parent.name : card.level === "region" ? "Viloyat" : ""}</p>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            {card.name}
            {other && <span className="text-violet-600"> · {other.name}</span>}
          </h2>
        </div>
        <button type="button" onClick={onClose} aria-label="Kartochkani yopish" className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="w-5 h-5" />
        </button>
      </div>

      {scoreQuery && (
        <div role="tablist" aria-label="Kartochka bo'limlari" className="flex gap-1 rounded-lg bg-gray-100 dark:bg-gray-700/60 p-1 text-sm">
          {([["indicator", "Ko'rsatkichlar"], ["score", "Salohiyat"]] as const).map(([key, label]) => (
            <button key={key} type="button" role="tab" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`flex-1 rounded-md px-3 py-1 ${tab === key ? "bg-white dark:bg-gray-800 shadow-sm font-medium" : "text-gray-600 dark:text-gray-300"}`}>
              {label}
            </button>
          ))}
        </div>
      )}

      {tab === "score" && scoreQuery ? (
        <>
          <ScorePanel soato={card.soato} compare={other?.soato} query={scoreQuery} onSelect={onSelectTerritory}
            onCompareWith={onCompareWith} onMethodology={onMethodology} />
          {/* KORXONA_SCORING.md KR-37 */}
          <CompanyQualityBlock soato={card.soato} />
        </>
      ) : (
        <>
          {fallback ? (
            <div className={other ? "grid grid-cols-2 gap-3" : ""}>
              <div>
                <p className="text-xs text-gray-500">{fallback.name}, {fallback.period}</p>
                <p className="text-2xl font-bold tabular-nums text-orange-600">
                  {formatValue(fallback.value)} <span className="text-xs font-normal text-gray-500">{fallback.unit}</span>
                  {fallback.preliminary && <span className="text-xs text-amber-600" title="Dastlabki ma'lumot"> *</span>}
                </p>
                <Rank ind={fallback} />
              </div>
              {other && (
                <div>
                  <p className="text-xs text-gray-500">{other.name}, {(otherCurrent ?? other.indicators.find((i) => i.key === fallback.key))?.period ?? "—"}</p>
                  <p className="text-2xl font-bold tabular-nums text-violet-600">{formatValue((otherCurrent ?? other.indicators.find((i) => i.key === fallback.key))?.value)}</p>
                  {otherCurrent && <Rank ind={otherCurrent} />}
                </div>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-500">Bu hudud uchun tanlangan ko'rsatkich bo'yicha ma'lumot yo'q.</p>
          )}

          {fallback && (
            <Dynamics ind={fallback} card={card} other={other} otherInd={other?.indicators.find((i) => i.key === fallback.key)} period={period} />
          )}

          {!other && extra.length > 0 && (
            <dl className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-2">
              {extra.map((i) => (
                <div key={i.key} className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                  <dt className="text-xs text-gray-500">{i.name}, {i.period}</dt>
                  <dd className="font-semibold tabular-nums">{formatValue(i.value)} <span className="text-xs font-normal text-gray-500">{i.unit}</span></dd>
                  <Rank ind={i} />
                </div>
              ))}
            </dl>
          )}

          {other && (
            <table className="w-full text-xs">
              <thead><tr className="text-left text-gray-500"><th className="py-1">Ko'rsatkich</th><th className="text-right">{card.name}</th><th className="text-right">{other.name}</th></tr></thead>
              <tbody>
                {card.indicators.map((i) => {
                  const o = other.indicators.find((x) => x.key === i.key);
                  return (
                    <tr key={i.key} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-1 pr-2">{i.name}</td>
                      <td className="text-right tabular-nums">{formatValue(i.value)}</td>
                      <td className="text-right tabular-nums">{formatValue(o?.value)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </>
      )}

      <div className="flex flex-wrap gap-2 text-sm">
        {card.profile && (
          <Link to={card.profile} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 text-white hover:bg-blue-700">To'liq profil</Link>
        )}
        {other ? (
          <button type="button" onClick={onClearCompare} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600">
            <X className="w-4 h-4" aria-hidden="true" /> Solishtirishni bekor qilish
          </button>
        ) : (
          onCompare && (
            <button type="button" onClick={onCompare} aria-pressed={comparing}
              className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border ${comparing ? "border-violet-500 text-violet-700" : "border-gray-300 dark:border-gray-600"}`}>
              <GitCompare className="w-4 h-4" aria-hidden="true" /> {comparing ? "Kartada ikkinchi hududni tanlang" : "Solishtirish"}
            </button>
          )
        )}
        {tab === "indicator" && current?.siat_url && (
          <a href={current.siat_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600">
            SIAT'da ochish <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
      {tab === "indicator" && current?.derived_from && <p className="text-xs text-gray-500">{current.derived_from}</p>}
    </section>
  );
}

interface Row {
  period: string;
  a: number | null;
  b: number | null;
  f: number | null;
  band: [number, number] | null;
  scen: [number, number] | null;
}

/** Dinamika: tarixiy chiziq, prognoz (uzuq chiziq), 80% oraliq (lenta) va ssenariylar (och lenta). */
function Dynamics({ ind, card, other, otherInd, period }: { ind: TerritoryIndicator; card: TerritoryCard; other?: TerritoryCard | null; otherInd?: TerritoryIndicator; period?: string }) {
  const chart = useChartTheme();
  const [showScenarios, setShowScenarios] = useState(false);
  const fc = !other ? ind.forecast ?? null : null;
  const rows: Row[] = ind.series.map((p) => ({
    period: p.period, a: p.value, b: otherInd?.series.find((x) => x.period === p.period)?.value ?? null, f: null, band: null, scen: null,
  }));
  if (fc && rows.length) {
    const last = rows[rows.length - 1];
    if (last.a !== null) {
      last.f = last.a;
      last.band = [last.a, last.a];
      if (showScenarios) last.scen = [last.a, last.a];
    }
    const scenPeriods = new Set([...fc.forecast.map((p) => p.period), ...fc.scenarios.optimistic.map((p) => p.period)]);
    [...scenPeriods].sort().forEach((p) => {
      const point = fc.forecast.find((x) => x.period === p);
      const opt = fc.scenarios.optimistic.find((x) => x.period === p)?.value;
      const pes = fc.scenarios.pessimistic.find((x) => x.period === p)?.value;
      if (!point && !showScenarios) return;
      rows.push({
        period: p, a: null, b: null, f: point?.value ?? null,
        band: point && point.lo80 !== null && point.hi80 !== null ? [point.lo80, point.hi80] : null,
        scen: showScenarios && opt !== undefined && pes !== undefined ? [Math.min(opt, pes), Math.max(opt, pes)] : null,
      });
    });
  }
  if (rows.length < 2) return null;
  const known = rows.filter((p) => p.a !== null);
  const first = known[0]?.a;
  const lastActual = known[known.length - 1]?.a;
  const change = first && lastActual !== undefined && lastActual !== null && known.length > 1 ? ((lastActual - first) / Math.abs(first)) * 100 : null;
  const preliminary = new Set(ind.preliminary ? [ind.period] : []);
  const forecastPeriods = new Set(fc?.forecast.map((p) => p.period) ?? []);
  const marker = period && rows.some((p) => p.period === period) ? period : ind.period;
  const axisValues = rows.flatMap((p) => [p.a, p.b, p.f, ...(p.band ?? []), ...(p.scen ?? [])]);

  return (
    <figure aria-label={`${ind.name} dinamikasi`}>
      <figcaption className="flex items-baseline justify-between gap-2 text-xs text-gray-500">
        <span>Dinamika, {ind.unit}</span>
        {change !== null && (
          <span className="tabular-nums">
            {known[0].period}–{known[known.length - 1].period}: <b className="text-gray-700 dark:text-gray-200">{change >= 0 ? "+" : ""}{formatValue(change)}%</b>
          </span>
        )}
      </figcaption>
      <div className="h-48 mt-1">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart data={rows} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid stroke={chart.grid} vertical={false} />
            <XAxis dataKey="period" tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} axisLine={{ stroke: chart.grid }}
              interval="preserveStartEnd" minTickGap={18} tickFormatter={shortPeriod} />
            <YAxis tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} axisLine={false} width={48}
              {...niceAxis(axisValues)} tickFormatter={(v) => formatAxis(Number(v))} />
            <Tooltip {...chart.tooltip}
              labelFormatter={(p) => `${p}${preliminary.has(String(p)) ? " (dastlabki)" : ""}${forecastPeriods.has(String(p)) ? " (prognoz)" : ""}`}
              formatter={(v, name) => {
                if (Array.isArray(v)) return [`${formatValue(Number(v[0]))} – ${formatValue(Number(v[1]))} ${ind.unit}`, name];
                return [`${formatValue(v === null ? null : Number(v))} ${ind.unit}`, name];
              }} />
            {(other || fc) && <Legend wrapperStyle={{ fontSize: 11 }} iconType="plainline" />}
            {showScenarios && <Area dataKey="scen" name="Ssenariylar" stroke="none" fill="#a78bfa" fillOpacity={0.15} isAnimationActive={false} connectNulls />}
            {fc && <Area dataKey="band" name="80% oraliq" stroke="none" fill="#f97316" fillOpacity={0.18} isAnimationActive={false} connectNulls />}
            <Line type="monotone" dataKey="a" name={card.name} stroke="#f97316" strokeWidth={2} animationDuration={400}
              dot={rows.length <= 20 ? { r: 2.5, fill: chart.dotFill, strokeWidth: 1.5 } : false} activeDot={{ r: 4 }} connectNulls={false} />
            {fc && (
              <Line type="monotone" dataKey="f" name="Prognoz" stroke="#f97316" strokeWidth={2} strokeDasharray="5 4" animationDuration={400}
                dot={{ r: 2.5, fill: chart.dotFill, strokeWidth: 1.5 }} connectNulls />
            )}
            {other && (
              <Line type="monotone" dataKey="b" name={other.name} stroke="#7c3aed" strokeWidth={2} animationDuration={400}
                dot={rows.length <= 20 ? { r: 2.5, fill: chart.dotFill, strokeWidth: 1.5 } : false} activeDot={{ r: 4 }} />
            )}
            {marker && <ReferenceLine x={marker} stroke={chart.axis} strokeDasharray="3 3" />}
          </ComposedChart>
        </ResponsiveContainer>
      </div>
      {fc && <ForecastSummary fc={fc} showScenarios={showScenarios} onToggle={() => setShowScenarios((v) => !v)}
        whatIf={card.level === "district" ? card.soato : null} />}
    </figure>
  );
}

const signed = (v: number | null, unit: string) => (v === null ? "—" : `${v >= 0 ? "+" : "−"}${formatValue(Math.abs(v))}${unit === "%" ? "%" : ` ${unit}`}`);

function ForecastSummary({ fc, showScenarios, onToggle, whatIf }: { fc: ForecastBlock; showScenarios: boolean; onToggle: () => void; whatIf: string | null }) {
  const g = fc.growth;
  const per = g.unit === "%" ? "%" : "p.p.";
  return (
    <div className="mt-2 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
      {g.per_year !== null && (
        <p>
          {Number(g.from) + 1}–{g.to} kutilayotgan o'sish: <b className="text-gray-800 dark:text-gray-100">yiliga {signed(g.per_year, per)}</b>
          {g.lo !== null && g.hi !== null && <> (oraliq {signed(g.lo, per)} … {signed(g.hi, per)})</>}
          {g.national !== null && <>, respublikada {signed(g.national, per)}</>}.
          {g.direction_uncertain && <span className="ml-1 text-amber-700 dark:text-amber-300">Yo'nalish noaniq: oraliq pasayishni ham, o'sishni ham qamraydi.</span>}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
        <button type="button" onClick={onToggle} aria-pressed={showScenarios} className="text-blue-600 hover:underline">
          {showScenarios ? "Ssenariylarni yashirish" : "Ijobiy va salbiy ssenariylar (5 yil)"}
        </button>
        <details className="basis-full">
          <summary className="cursor-pointer text-blue-600">Nega shunday prognoz?</summary>
          {fc.basis === "factors" && fc.drivers.length > 0 ? (
            <>
              <p className="mt-1">Prognozga eng ko'p ta'sir qilgan omillar:</p>
              <ul className="mt-0.5 space-y-0.5">
                {fc.drivers.map((d) => (
                  <li key={d.feature} className="flex items-center gap-1">
                    {d.effect === "up" ? <ArrowUp className="w-3 h-3 text-emerald-600" aria-label="oshiradi" /> : <ArrowDown className="w-3 h-3 text-red-600" aria-label="kamaytiradi" />}
                    {d.name}
                  </li>
                ))}
              </ul>
              <p className="mt-1 text-gray-500">Bu statistik bog'liqlik, sabab-oqibat emas.</p>
            </>
          ) : (
            <p className="mt-1">Prognoz shu hududning o'tgan yillardagi o'sish sur'atiga asoslangan.</p>
          )}
        </details>
        {whatIf && <WhatIfPanel soato={whatIf} />}
      </div>
      {fc.model && (
        <p className="text-gray-500">
          Usul: {fc.model.method}
          {fc.model.error_pct !== null && <> · o'tgan yillarda 1 yillik prognozning o'rtacha xatosi {formatValue(fc.model.error_pct)}%</>}
          {fc.model.error_pct_last !== null && fc.model.horizons[1] > 1 && <>, {fc.model.horizons[1]} yillikniki {formatValue(fc.model.error_pct_last)}%</>}
          {fc.model.direction_pct !== null && <> · o'sish yo'nalishi {formatValue(fc.model.direction_pct)}% hollarda to'g'ri</>}.
        </p>
      )}
      <p className="text-gray-500">Prognoz rasmiy emas: SIAT ma'lumotiga asoslangan statistik baho. Lenta — 80% ishonch oralig'i.</p>
    </div>
  );
}
