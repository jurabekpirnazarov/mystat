import { useEffect, useMemo, useState } from "react";
import { ArrowDown, ArrowUp, ChevronDown, FileSpreadsheet } from "lucide-react";
import { downloadScoreTable, fetchScoreList, type GeoLevel, type ScoreList, type ScoreMover, type ScoreQuery } from "../../api/siatMap";
import { formatValue } from "../../utils/mapScale";

interface Props {
  level: GeoLevel;
  parent?: string;
  query: ScoreQuery;
  selected?: string | null;
  onSelect: (code: string) => void;
}

type SortKey = "score" | "A" | "B" | "C" | "D" | "E" | "change" | "rank_change";

/** SCORING_MODEL.md 7-bo'lim, 4-band: reyting jadvali — indeks, ustunlar, o'rin oralig'i; saralash va eksport.
 * 10.6 va 10.8.6: prognoz bo'lsa — "Kutilayotgan o'zgarish" va "O'rin o'zgarishi" ustunlari, eng ko'p ko'tariluvchi
 * va tushuvchi hududlar. */
export default function ScoreTable({ level, parent, query, selected, onSelect }: Props) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<ScoreList | null>(null);
  const [sort, setSort] = useState<SortKey>("score");
  const { period, preset, weights } = query;

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    fetchScoreList({ level, parent, period, preset, weights }, ctrl.signal).then(setData).catch(() => undefined);
    return () => ctrl.abort();
  }, [open, level, parent, period, preset, weights]);

  const rows = useMemo(() => {
    const value = (i: ScoreList["items"][number]) =>
      (sort === "score" ? i.score : sort === "change" ? i.outlook?.score_change : sort === "rank_change" ? i.outlook?.rank_change : i.pillars[sort]) ?? -Infinity;
    return [...(data?.items ?? [])].sort((a, b) => value(b) - value(a));
  }, [data, sort]);
  const params = { level, parent, period, preset, weights };

  return (
    <section aria-label="Reyting jadvali" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <button type="button" onClick={() => setOpen((v) => !v)} aria-expanded={open}
        className="w-full flex items-center justify-between gap-2 px-4 py-2.5 text-sm font-semibold">
        Reyting jadvali: indeks va ustunlar
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} aria-hidden="true" />
      </button>
      {open && (
        <div className="px-4 pb-3">
          <div className="mb-2 flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={() => downloadScoreTable(params, "csv")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600">
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" /> CSV
            </button>
            <button type="button" onClick={() => downloadScoreTable(params, "xlsx")} className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-600">
              <FileSpreadsheet className="w-4 h-4" aria-hidden="true" /> XLSX
            </button>
            {data && <span className="self-center text-xs text-gray-500">{data.index_name}, {data.period}{data.forecast ? " (prognoz)" : ""} · metodologiya v{data.methodology_version}</span>}
          </div>
          {data?.outlook && (data.outlook.up.length > 0 || data.outlook.down.length > 0) && (
            <div className="mb-2 grid gap-2 sm:grid-cols-2 text-xs">
              <Movers title={`Eng ko'p ko'tarilishi kutilgan (${data.outlook.from}→${data.outlook.to}, prognoz)`} rows={data.outlook.up} up onSelect={onSelect} />
              <Movers title={`Eng ko'p tushishi kutilgan (${data.outlook.from}→${data.outlook.to}, prognoz)`} rows={data.outlook.down} up={false} onSelect={onSelect} />
            </div>
          )}
          {!data ? (
            <div className="h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/50" />
          ) : (
            <div className="max-h-[420px] overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                  <tr className="text-left text-gray-500">
                    <th className="py-1.5 pr-2">#</th>
                    <th className="pr-2">Hudud</th>
                    <SortHeader label="Indeks" k="score" sort={sort} setSort={setSort} />
                    <th className="pr-2 text-right" title="Vaznlar ±20% o'zgarganda o'rin oralig'i">Oraliq</th>
                    {data.pillars.map((p) => <SortHeader key={p.key} label={p.key} title={p.name} k={p.key as SortKey} sort={sort} setSort={setSort} />)}
                    {data.outlook && <SortHeader label="Kutilayotgan o'zgarish" title={`Indeks o'zgarishi, ${data.outlook.from}→${data.outlook.to} (prognoz)`} k="change" sort={sort} setSort={setSort} />}
                    {data.outlook && <SortHeader label={`O'rin (${data.outlook.to})`} title={`O'rin o'zgarishi, ${data.outlook.from}→${data.outlook.to} (prognoz)`} k="rank_change" sort={sort} setSort={setSort} />}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((i) => (
                    <tr key={i.soato} onClick={() => onSelect(i.soato)} aria-current={i.soato === selected}
                      className={`cursor-pointer border-t border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 ${i.soato === selected ? "bg-orange-50 dark:bg-orange-900/20" : ""}`}>
                      <td className="py-1 pr-2 tabular-nums text-gray-500">{i.rank ?? "—"}</td>
                      <td className="pr-2">{i.name}{i.partial && <span className="text-amber-600" title="Qisman ma'lumot">*</span>}</td>
                      <td className="pr-2 text-right tabular-nums font-medium">{i.score === null ? <span className="font-normal text-gray-400">{i.status === "not_created" ? "tuzilmagan" : "yetarli emas"}</span> : formatValue(i.score)}</td>
                      <td className="pr-2 text-right tabular-nums text-gray-500">{i.rank_range ? (i.rank_range[0] === i.rank_range[1] ? i.rank_range[0] : `${i.rank_range[0]}–${i.rank_range[1]}`) : "—"}</td>
                      {data.pillars.map((p) => <td key={p.key} className="pr-2 text-right tabular-nums">{formatValue(i.pillars[p.key])}</td>)}
                      {data.outlook && <td className="pr-2 text-right tabular-nums">{signed(i.outlook?.score_change)}</td>}
                      {data.outlook && <td className="pr-2 text-right tabular-nums"><RankChange value={i.outlook?.rank_change} to={i.outlook?.to_rank} /></td>}
                    </tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-2 text-xs text-gray-500">{data.pillars.map((p) => `${p.key} — ${p.name}`).join(" · ")}. * — qisman ma'lumot. {data.disclaimer}</p>
            </div>
          )}
        </div>
      )}
    </section>
  );
}

const signed = (v: number | null | undefined) => (v === null || v === undefined ? "—" : `${v > 0 ? "+" : ""}${formatValue(v)}`);

function RankChange({ value, to }: { value: number | null | undefined; to: number | null | undefined }) {
  if (value === null || value === undefined) return <span className="text-gray-400">—</span>;
  const cls = value > 0 ? "text-emerald-700 dark:text-emerald-400" : value < 0 ? "text-red-600 dark:text-red-400" : "text-gray-500";
  return (
    <span className={cls} title={`Prognoz yilida ${to ?? "—"}-o'rin`}>
      {to ?? "—"} {value > 0 ? `↑${value}` : value < 0 ? `↓${-value}` : "="}
    </span>
  );
}

function Movers({ title, rows, up, onSelect }: { title: string; rows: ScoreMover[]; up: boolean; onSelect: (code: string) => void }) {
  if (!rows.length) return null;
  const Icon = up ? ArrowUp : ArrowDown;
  return (
    <div className="rounded-lg border border-violet-200 dark:border-violet-800 bg-violet-50/60 dark:bg-violet-900/10 px-3 py-2">
      <p className="mb-1 font-medium text-violet-900 dark:text-violet-100">{title}</p>
      <ul className="space-y-0.5">
        {rows.map((m) => (
          <li key={m.soato}>
            <button type="button" onClick={() => onSelect(m.soato)} className="inline-flex items-center gap-1 hover:underline">
              <Icon className={`w-3.5 h-3.5 ${up ? "text-emerald-600" : "text-red-600"}`} aria-hidden="true" />
              {m.name}: {m.from_rank}→{m.to_rank}-o'rin{m.score_change !== null ? ` (${signed(m.score_change)})` : ""}
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SortHeader({ label, title, k, sort, setSort }: { label: string; title?: string; k: SortKey; sort: SortKey; setSort: (k: SortKey) => void }) {
  return (
    <th className="pr-2 text-right" title={title} aria-sort={sort === k ? "descending" : "none"}>
      <button type="button" onClick={() => setSort(k)} className={`hover:underline ${sort === k ? "text-gray-900 dark:text-white" : ""}`}>{label}{sort === k ? " ↓" : ""}</button>
    </th>
  );
}
