import { Link } from "react-router-dom";
import { Bar, BarChart, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { fetchCompanyScoreDistribution, fetchMyCompanyScore } from "../../api/companyScores";
import useApi from "../../hooks/useApi";
import { useChartTheme } from "../../utils/chartTheme";
import { DemoBadge } from "../ui";
import CompanyScoreBadge from "./CompanyScoreBadge";

/** KORXONA_SCORING.md 6-bo'lim 7-band: kabinet bosh panelida mini kartochka (ball, sinf, eng zaif ustun). */
export function MyScoreMini() {
  const { data } = useApi(() => fetchMyCompanyScore().catch(() => null), []);
  if (!data) return null;
  const weakest = data.pillars_detail.filter((p) => p.applicable && p.score !== null).sort((a, b) => (a.score ?? 0) - (b.score ?? 0))[0];
  return (
    <section aria-label="Korxona bali" className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-center gap-4">
      <CompanyScoreBadge score={data} size="md" />
      <div className="flex-1 min-w-[200px] text-sm">
        <p className="font-medium text-gray-900 dark:text-white">Korxona bali: {data.klass_info.name} {data.is_synthetic && <DemoBadge />}</p>
        {weakest && <p className="text-gray-600 dark:text-gray-300">Eng zaif yo'nalish: {weakest.name} ({Math.round(weakest.score ?? 0)})</p>}
      </div>
      <Link to="/cabinet/organization" className="text-sm text-blue-600 hover:underline">Pasport va tavsiyalar →</Link>
    </section>
  );
}

/** 6-bo'lim 8-band: benchmark'da guruhdagi ball taqsimoti (gistogramma) va korxona nuqtasi; ustunlar bo'yicha p25–p75. */
export function ScoreBenchmark() {
  const chart = useChartTheme();
  const { data } = useApi(async () => {
    const own = await fetchMyCompanyScore().catch(() => null);
    if (!own) return null;
    const [oked, size] = own.peer_group.includes(":") ? own.peer_group.split(":") : [own.peer_group === "all" ? "" : own.peer_group, ""];
    const dist = await fetchCompanyScoreDistribution({ oked, size });
    return { own, dist };
  }, []);
  if (!data) return null;
  const { own, dist } = data;
  const ownBin = own.overall === null ? -1 : Math.min(9, Math.floor(own.overall / 10));
  const pillars = Object.fromEntries(own.pillars_detail.map((p) => [p.key, p.score]));

  return (
    <section aria-label="Korxona bali: guruhda taqsimot" className="space-y-3">
      <h3 className="flex items-center gap-2 text-sm font-semibold text-gray-800 dark:text-gray-100">
        Korxona bali: guruhdagi o'rningiz {(own.is_synthetic || dist.is_synthetic) && <DemoBadge />}
      </h3>
      <p className="text-xs text-gray-500">Guruh: {own.peer_label}. Ballingiz: <b>{own.overall === null ? "—" : Math.round(own.overall)}</b> ({own.klass_info.name}).</p>
      <figure className="h-48" aria-label="Ball taqsimoti gistogrammasi">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={dist.histogram ?? []} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <XAxis dataKey="from" tickFormatter={(v) => `${v}`} tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} />
            <YAxis width={36} tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} axisLine={false} />
            <Tooltip {...chart.tooltip} labelFormatter={(v) => `${v}–${Number(v) + 10} ball`} formatter={(v) => [String(v), "korxona"]} />
            <Bar dataKey="count" isAnimationActive={false}>
              {(dist.histogram ?? []).map((_, i) => <Cell key={i} fill={i === ownBin ? "#f97316" : "#93c5fd"} />)}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </figure>
      <ul className="space-y-2" aria-label="Ustunlar bo'yicha p25–p75">
        {dist.pillars.filter((p) => p.p25 !== null && p.p75 !== null).map((p) => {
          const v = pillars[p.key];
          return (
            <li key={p.key} className="text-xs">
              <div className="flex justify-between"><span>{p.name}</span><span className="tabular-nums text-gray-500">p25–p75: {Math.round(p.p25 ?? 0)}–{Math.round(p.p75 ?? 0)}{v !== null && v !== undefined && <> · siz <b className="text-orange-600">{Math.round(v)}</b></>}</span></div>
              <div className="relative mt-1 h-3 rounded bg-gray-100 dark:bg-gray-700">
                <div className="absolute inset-y-0 rounded bg-blue-200 dark:bg-blue-800" style={{ left: `${p.p25}%`, width: `${(p.p75 ?? 0) - (p.p25 ?? 0)}%` }} />
                {p.median !== null && <div className="absolute inset-y-0 w-0.5 bg-blue-700" style={{ left: `${p.median}%` }} />}
                {v !== null && v !== undefined && <div className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-gray-800" style={{ left: `${v}%` }} />}
              </div>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-gray-500">{dist.disclaimer} <Link to="/methodology/company-score" className="underline">Qanday hisoblanadi</Link></p>
    </section>
  );
}
