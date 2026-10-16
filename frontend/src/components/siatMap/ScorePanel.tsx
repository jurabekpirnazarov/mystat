import { useEffect, useState } from "react";
import { PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";
import { ArrowRight, BookOpen, GitCompare, Info, TrendingDown, TrendingUp } from "lucide-react";
import { fetchScoreDetail, type ScoreDetail, type ScoreQuery, type ScoreRecommendation, type ScoreSector } from "../../api/siatMap";
import { formatValue } from "../../utils/mapScale";
import { useChartTheme } from "../../utils/chartTheme";

interface Props {
  soato: string;
  compare?: string | null;
  query: ScoreQuery;
  onSelect?: (code: string) => void;
  onCompareWith?: (code: string) => void;
  onMethodology?: () => void;
}

const STATUS_STYLE: Record<string, string> = {
  ok: "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300",
  partial: "bg-amber-50 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300",
  insufficient: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
  not_created: "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
};

const LABEL_STYLE: Record<ScoreSector["label"], string> = {
  leading: "text-emerald-700 dark:text-emerald-400",
  growing: "text-blue-700 dark:text-blue-400",
  invest: "text-violet-700 dark:text-violet-400",
  slowing: "text-amber-700 dark:text-amber-400",
};

/** 0–100 ball rangi: 50 — o'rtacha; kartadagi ikki tomonlama shkala bilan bir xil ma'no. */
function scoreTone(score: number | null | undefined) {
  if (score === null || score === undefined) return "text-gray-400";
  if (score >= 60) return "text-blue-700 dark:text-blue-400";
  if (score <= 40) return "text-red-600 dark:text-red-400";
  return "text-gray-800 dark:text-gray-100";
}

/**
 * SCORING_MODEL.md 7-bo'lim, 2-band: hudud kartochkasidagi "Salohiyat" yorlig'i. Raqamlar va tavsiyalar backend
 * qoidalaridan (taxminiy tahlil, rasmiy baho emas).
 */
export default function ScorePanel({ soato, compare, query, onSelect, onCompareWith, onMethodology }: Props) {
  const [data, setData] = useState<ScoreDetail | null>(null);
  const [other, setOther] = useState<ScoreDetail | null>(null);
  const [error, setError] = useState(false);
  const { period, preset, weights } = query;

  useEffect(() => {
    const ctrl = new AbortController();
    setError(false);
    fetchScoreDetail(soato, { period, preset, weights }, ctrl.signal)
      .then(setData)
      .catch((e) => e?.name !== "CanceledError" && setError(true));
    return () => ctrl.abort();
  }, [soato, period, preset, weights]);

  useEffect(() => {
    setOther(null);
    if (!compare) return;
    const ctrl = new AbortController();
    fetchScoreDetail(compare, { period, preset, weights }, ctrl.signal).then(setOther).catch(() => undefined);
    return () => ctrl.abort();
  }, [compare, period, preset, weights]);

  if (error) return <p className="text-sm text-gray-500">Salohiyat bahosi bu hudud uchun hisoblanmagan.</p>;
  if (!data) return <div className="h-40 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/50" aria-busy="true" />;

  if (data.status === "not_created" || data.missing) {
    return (
      <div className="space-y-2 text-sm">
        <p className="font-medium">{data.index_name}, {data.period}</p>
        <p className={`inline-block rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[data.status]}`}>{data.status_label}</p>
        {data.gaps && data.gaps.length > 0 && (
          <p className="text-xs text-gray-500">Yetishmayotgan ko'rsatkichlar: {data.gaps.map((g) => g.name).join(", ")}.</p>
        )}
        <Disclaimer text={data.disclaimer} onMethodology={onMethodology} />
      </div>
    );
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <div>
          <p className="text-xs text-gray-500">{data.index_name}, {data.period}{data.forecast && " (prognoz)"}</p>
          <p className={`text-3xl font-bold tabular-nums ${scoreTone(data.score)}`}>
            {formatValue(data.score)}<span className="text-base font-normal text-gray-400">/100</span>
            {other && <span className="ml-3 text-violet-600">{formatValue(other.score)}</span>}
          </p>
          {data.rank && (
            <p className="text-xs text-gray-600 dark:text-gray-300">
              {data.of} dan <b>{data.rank}-o'rin</b>
              {data.rank_range && data.rank_range[0] !== data.rank_range[1] && <> ({data.rank_range[0]}–{data.rank_range[1]})</>}
              {data.rank_in_parent && <> · viloyatda {data.rank_in_parent[1]} dan {data.rank_in_parent[0]}-o'rin</>}
            </p>
          )}
        </div>
        <span className={`rounded-full px-2 py-0.5 text-xs ${STATUS_STYLE[data.status]}`}
          title={`To'liqlik: ${Math.round((data.coverage ?? 0) * 100)}%`}>● {data.status_label}</span>
      </div>
      {data.rank_unstable && (
        <p className="text-xs text-amber-700 dark:text-amber-300">O'rin vaznlarga sezgir: vaznlar biroz o'zgarsa, o'rin {data.rank_range?.[0]}–{data.rank_range?.[1]} oralig'ida bo'ladi.</p>
      )}
      {data.forecast_note && <p className="rounded-lg bg-violet-50 dark:bg-violet-900/20 px-3 py-2 text-xs text-violet-800 dark:text-violet-200">{data.forecast_note}</p>}

      {data.pillars && data.pillars.length > 2 ? (
        <PillarRadar data={data} other={other} />
      ) : (
        <PillarBars data={data} other={other} />
      )}

      {(data.strengths?.length || data.weaknesses?.length) ? (
        <div className="space-y-2">
          <Chips title="Kuchli tomonlar" items={data.strengths ?? []} tone="good" />
          <Chips title="Zaif tomonlar" items={data.weaknesses ?? []} tone="bad" />
        </div>
      ) : null}

      {data.recommendations && data.recommendations.length > 0 && (
        <section aria-label="Tavsiya etilgan yo'nalishlar">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">Tavsiya etilgan yo'nalishlar</h3>
          <ol className="space-y-2">
            {data.recommendations.map((r, i) => <Recommendation key={r.title} index={i + 1} rec={r} />)}
          </ol>
        </section>
      )}

      {data.sectors && data.sectors.length > 0 && <Sectors title="Ixtisoslashgan tarmoqlar" sectors={data.sectors} />}
      {data.parent_context && (
        <section aria-label="Viloyat konteksti" className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2 space-y-1.5">
          <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">
            Viloyat konteksti: {data.parent_context.name} — {formatValue(data.parent_context.score)}/100
            {data.parent_context.rank && <span className="font-normal"> ({data.parent_context.of} dan {data.parent_context.rank}-o'rin)</span>}
          </p>
          <p className="text-xs text-gray-500">{data.parent_context.pillars.map((p) => `${p.name}: ${formatValue(p.score)}`).join(" · ")}</p>
          {data.parent_context.sectors.length > 0 && <Sectors title="Viloyatda yetakchi tarmoqlar" sectors={data.parent_context.sectors.slice(0, 3)} compact />}
        </section>
      )}

      {data.peers && data.peers.length > 0 && (
        <section aria-label="O'xshash hududlar">
          <h3 className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-gray-500">O'xshash hududlar</h3>
          <ul className="space-y-1.5">
            {data.peers.map((p) => (
              <li key={p.soato} className="flex items-start gap-2">
                <button type="button" onClick={() => onSelect?.(p.soato)} className="text-left text-blue-600 hover:underline">
                  {p.name} <span className="tabular-nums text-gray-500">({formatValue(p.score)})</span>
                </button>
                {onCompareWith && (
                  <button type="button" onClick={() => onCompareWith(p.soato)} title="Solishtirishga qo'shish" aria-label={`${p.name} bilan solishtirish`}
                    className="ml-auto p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><GitCompare className="w-3.5 h-3.5" /></button>
                )}
                {p.ahead_in.length > 0 && (
                  <span className="basis-full -mt-1 text-xs text-gray-500">oldinda: {p.ahead_in.map((a) => a.name.toLowerCase()).join(", ")}</span>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {data.future && (
        <section aria-label="Kelajak" className="rounded-lg border border-dashed border-violet-300 dark:border-violet-700 px-3 py-2 space-y-1.5">
          <h3 className="text-xs font-semibold uppercase tracking-wide text-violet-700 dark:text-violet-300">Kelajak (prognoz)</h3>
          <p className="text-sm">
            {data.future.from_period}: {data.future.from_rank ?? "—"}-o'rin <ArrowRight className="inline w-3.5 h-3.5 text-gray-400" aria-hidden="true" />{" "}
            <b>{data.future.period}: {data.future.rank ?? "—"}-o'rin</b>
            {data.future.rank_range && data.future.rank_range[0] !== data.future.rank_range[1] && <span className="text-gray-500"> ({data.future.rank_range[0]}–{data.future.rank_range[1]})</span>}
            <span className="text-gray-500"> · {formatValue(data.future.score)}/100</span>
            <RankShift from={data.future.from_rank} to={data.future.rank} />
          </p>
          {data.future.recommendations.length > 0 && (
            <p className="text-xs text-gray-600 dark:text-gray-300">{data.future.period} ga kelib: {data.future.recommendations.map((r) => r.title).join("; ")}.</p>
          )}
          <p className="text-xs text-gray-500">{data.future.note}</p>
        </section>
      )}

      {data.gaps && data.gaps.length > 0 && (
        <p className="text-xs text-gray-500">Bahoga kirmagan: {data.gaps.map((g) => `${g.name.toLowerCase()} (${g.reason.toLowerCase()})`).join(", ")}.</p>
      )}
      <Disclaimer text={data.disclaimer} onMethodology={onMethodology} />
    </div>
  );
}

function RankShift({ from, to }: { from: number | null; to: number | null }) {
  if (!from || !to || from === to) return null;
  const up = to < from;
  return (
    <span className={`ml-2 inline-flex items-center gap-0.5 text-xs ${up ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
      {up ? <TrendingUp className="w-3.5 h-3.5" aria-hidden="true" /> : <TrendingDown className="w-3.5 h-3.5" aria-hidden="true" />}
      {up ? `+${from - to}` : `−${to - from}`}
    </span>
  );
}

function PillarRadar({ data, other }: { data: ScoreDetail; other: ScoreDetail | null }) {
  const chart = useChartTheme();
  const rows = (data.pillars ?? []).map((p) => ({
    name: p.name, a: p.score ?? 0, b: other?.pillars?.find((x) => x.key === p.key)?.score ?? null, avg: 50,
  }));
  return (
    <figure aria-label="Ustunlar bo'yicha baho">
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={rows} outerRadius="70%">
            <PolarGrid stroke={chart.grid} />
            <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: chart.axis }} />
            <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
            <Radar name="O'rtacha (50)" dataKey="avg" stroke={chart.axis} strokeDasharray="4 3" fill="none" isAnimationActive={false} />
            <Radar name={data.name} dataKey="a" stroke="#f97316" fill="#f97316" fillOpacity={0.25} animationDuration={400} />
            {other && <Radar name={other.name} dataKey="b" stroke="#7c3aed" fill="#7c3aed" fillOpacity={0.15} animationDuration={400} />}
            <Tooltip {...chart.tooltip} formatter={(v) => formatValue(Number(v))} />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      <figcaption className="text-xs text-gray-500">Har ustun 0–100: 50 — tengdoshlar o'rtachasi (uzuq chiziq).</figcaption>
      {other && <PillarDiff data={data} other={other} />}
    </figure>
  );
}

function PillarBars({ data, other }: { data: ScoreDetail; other: ScoreDetail | null }) {
  return (
    <div className="space-y-2" aria-label="Ustunlar bo'yicha baho">
      {(data.pillars ?? []).map((p) => {
        const o = other?.pillars?.find((x) => x.key === p.key)?.score;
        return (
          <div key={p.key}>
            <div className="flex justify-between text-xs"><span>{p.name}</span><span className="tabular-nums font-medium">{formatValue(p.score)}{o !== undefined && <span className="text-violet-600"> · {formatValue(o)}</span>}</span></div>
            <div className="relative mt-1 h-2 rounded-full bg-gray-100 dark:bg-gray-700">
              <span className="absolute inset-y-0 left-0 rounded-full bg-orange-500/80" style={{ width: `${p.score ?? 0}%` }} />
              {o !== undefined && o !== null && <span className="absolute -top-0.5 h-3 w-0.5 bg-violet-600" style={{ left: `${o}%` }} />}
              <span className="absolute -top-0.5 h-3 w-px bg-gray-500" style={{ left: "50%" }} aria-hidden="true" />
            </div>
          </div>
        );
      })}
      <p className="text-xs text-gray-500">Chiziq o'rtasi — tengdoshlar o'rtachasi (50).</p>
    </div>
  );
}

function PillarDiff({ data, other }: { data: ScoreDetail; other: ScoreDetail }) {
  return (
    <table className="mt-2 w-full text-xs">
      <thead><tr className="text-left text-gray-500"><th className="py-1">Ustun</th><th className="text-right">{data.name}</th><th className="text-right">{other.name}</th><th className="text-right">Farq</th></tr></thead>
      <tbody>
        {(data.pillars ?? []).map((p) => {
          const o = other.pillars?.find((x) => x.key === p.key)?.score ?? null;
          const diff = p.score !== null && o !== null ? p.score - o : null;
          return (
            <tr key={p.key} className="border-t border-gray-100 dark:border-gray-700">
              <td className="py-1 pr-2">{p.name}</td>
              <td className="text-right tabular-nums">{formatValue(p.score)}</td>
              <td className="text-right tabular-nums">{formatValue(o)}</td>
              <td className={`text-right tabular-nums ${diff === null ? "" : diff >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
                {diff === null ? "—" : `${diff >= 0 ? "+" : ""}${formatValue(diff)}`}
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Chips({ title, items, tone }: { title: string; items: { indicator: string; name: string; text: string }[]; tone: "good" | "bad" }) {
  if (!items.length) return null;
  const cls = tone === "good"
    ? "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200"
    : "bg-red-50 text-red-800 dark:bg-red-900/30 dark:text-red-200";
  return (
    <div>
      <p className="mb-1 text-xs text-gray-500">{title}:</p>
      <ul className="flex flex-wrap gap-1.5">
        {items.map((i) => <li key={i.indicator} title={i.text} className={`rounded-full px-2 py-0.5 text-xs ${cls}`}>{i.name}</li>)}
      </ul>
    </div>
  );
}

function Recommendation({ index, rec }: { index: number; rec: ScoreRecommendation }) {
  return (
    <li className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
      <p className="font-medium">
        {index}. {rec.title}
        {rec.tentative && <span className="ml-1.5 rounded bg-amber-100 dark:bg-amber-900/40 px-1.5 text-[11px] font-normal text-amber-800 dark:text-amber-200">taxminiy</span>}
      </p>
      {(rec.text || rec.evidence.length > 0) && (
        <details className="mt-1 text-xs text-gray-600 dark:text-gray-300">
          <summary className="cursor-pointer text-blue-600">Nega?</summary>
          {rec.text && <p className="mt-1">{rec.text}</p>}
          {rec.evidence.length > 0 && (
            <ul className="mt-1 list-disc pl-4 space-y-0.5">
              {rec.evidence.map((e) => <li key={e.text}>{e.text}</li>)}
            </ul>
          )}
        </details>
      )}
    </li>
  );
}

function Sectors({ title, sectors, compact }: { title: string; sectors: ScoreSector[]; compact?: boolean }) {
  return (
    <section aria-label={title}>
      <h3 className={`mb-1 text-xs font-semibold ${compact ? "text-gray-600 dark:text-gray-300" : "uppercase tracking-wide text-gray-500"}`}>{title}</h3>
      <ul className="space-y-1">
        {sectors.slice(0, compact ? 3 : 5).map((s) => (
          <li key={`${s.source}-${s.code}`} className="text-xs" title={s.text}>
            <span className={`font-medium ${LABEL_STYLE[s.label]}`}>{s.label_name}:</span> {s.name}
            <span className="text-gray-500 tabular-nums"> · respublikadan {formatValue(s.lq)} barobar{s.source === "investment" ? " (investitsiya)" : ""}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Disclaimer({ text, onMethodology }: { text: string; onMethodology?: () => void }) {
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1 border-t border-gray-100 dark:border-gray-700 pt-2 text-xs text-gray-500">
      <Info className="w-3.5 h-3.5" aria-hidden="true" /> {text} Manba: SIAT, CC BY 4.0.
      {onMethodology && (
        <button type="button" onClick={onMethodology} className="inline-flex items-center gap-1 text-blue-600 hover:underline">
          <BookOpen className="w-3.5 h-3.5" aria-hidden="true" /> Metodologiya
        </button>
      )}
    </p>
  );
}
