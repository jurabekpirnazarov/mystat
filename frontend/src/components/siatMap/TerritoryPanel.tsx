import { Link } from "react-router-dom";
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDown, ArrowUp, ExternalLink, GitCompare, X } from "lucide-react";
import type { TerritoryCard, TerritoryIndicator } from "../../api/siatMap";
import { formatValue } from "../../utils/mapScale";

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
  onClose: () => void;
  onCompare?: () => void;
  comparing?: boolean;
  onClearCompare?: () => void;
}

/** KR-09 hudud kartochkasi; KR-11 ikki hududni yonma-yon solishtirish. */
export default function TerritoryPanel({ card, other, indicatorKey, onClose, onCompare, comparing, onClearCompare }: Props) {
  const current = card.indicators.find((i) => i.key === indicatorKey);
  const otherCurrent = other?.indicators.find((i) => i.key === indicatorKey);
  const series = (current?.series ?? []).map((p) => ({
    period: p.period,
    a: p.value,
    b: otherCurrent?.series.find((x) => x.period === p.period)?.value ?? null,
  }));
  const keys = KEY_INDICATORS.filter((k) => k !== indicatorKey);
  const extra = keys.map((k) => card.indicators.find((i) => i.key === k)).filter(Boolean).slice(0, 5) as TerritoryIndicator[];

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

      {current ? (
        <div className={other ? "grid grid-cols-2 gap-3" : ""}>
          <div>
            <p className="text-xs text-gray-500">{current.name}, {current.period}</p>
            <p className="text-2xl font-bold tabular-nums text-orange-600">
              {formatValue(current.value)} <span className="text-xs font-normal text-gray-500">{current.unit}</span>
              {current.preliminary && <span className="text-xs text-amber-600" title="Dastlabki ma'lumot"> *</span>}
            </p>
            <Rank ind={current} />
          </div>
          {other && (
            <div>
              <p className="text-xs text-gray-500">{other.name}, {otherCurrent?.period ?? "—"}</p>
              <p className="text-2xl font-bold tabular-nums text-violet-600">{formatValue(otherCurrent?.value)}</p>
              {otherCurrent && <Rank ind={otherCurrent} />}
            </div>
          )}
        </div>
      ) : (
        <p className="text-sm text-gray-500">Bu hudud uchun tanlangan ko'rsatkich bo'yicha ma'lumot yo'q.</p>
      )}

      {series.length > 1 && (
        <div className="h-40" aria-label="Dinamika grafigi">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={series} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="period" fontSize={10} tickMargin={4} />
              <YAxis fontSize={10} width={52} tickFormatter={(v) => formatValue(Number(v))} />
              <Tooltip formatter={(v) => formatValue(v === null ? null : Number(v))} />
              {other && <Legend wrapperStyle={{ fontSize: 11 }} />}
              <Line type="monotone" dataKey="a" name={card.name} stroke="#f97316" strokeWidth={2} dot={false} connectNulls={false} />
              {other && <Line type="monotone" dataKey="b" name={other.name} stroke="#7c3aed" strokeWidth={2} dot={false} />}
            </LineChart>
          </ResponsiveContainer>
        </div>
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
        {current?.siat_url && (
          <a href={current.siat_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600">
            SIAT'da ochish <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />
          </a>
        )}
      </div>
      {current?.derived_from && <p className="text-xs text-gray-500">{current.derived_from}</p>}
    </section>
  );
}
