import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, ExternalLink, Map as MapIcon, Minus } from "lucide-react";
import type { DashboardItem } from "../../api/statPublic";
import ShareBar from "../share/ShareBar";
import { formatValue } from "../../utils/statPublic";

/** JT-17 / JT-15: ko'rsatkich kartochkasi — oxirgi qiymat, o'zgarish, kichik grafik va manba. */

function changeText(item: DashboardItem) {
  if (item.change === null) return null;
  const sign = item.change > 0 ? "+" : "";
  return item.change_kind === "pp" ? `${sign}${formatValue(item.change)} p.p.` : `${sign}${formatValue(item.change)}%`;
}

function changeTone(item: DashboardItem) {
  if (item.change === null || item.change === 0 || item.higher_is_better === null) {
    return "text-gray-600 dark:text-gray-300 bg-gray-100 dark:bg-gray-700";
  }
  const good = item.change > 0 === item.higher_is_better;
  return good
    ? "text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/30"
    : "text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30";
}

interface Props {
  item: DashboardItem;
  /** Embed rejimida ichki havolalar yangi oynada ochiladi */
  external?: boolean;
  tall?: boolean;
  /** JT-15: havola, embed kodi va iqtibos tugmalari */
  share?: boolean;
}

export default function IndicatorTile({ item, external, tall, share }: Props) {
  const ChangeIcon = item.change === null || item.change === 0 ? Minus : item.change > 0 ? ArrowUpRight : ArrowDownRight;
  const text = changeText(item);
  const gradientId = `tile-${item.key.replace(/[^a-z0-9]/gi, "")}`;
  const mapLink = item.map_url
    ? external
      ? <a href={item.map_url} target="_blank" rel="noopener" className="inline-flex items-center gap-1 hover:text-blue-700"><MapIcon className="w-3.5 h-3.5" aria-hidden="true" />Hududlar</a>
      : <Link to={item.map_url} className="inline-flex items-center gap-1 hover:text-blue-700"><MapIcon className="w-3.5 h-3.5" aria-hidden="true" />Hududlar kesimida</Link>
    : null;

  return (
    <article className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 flex flex-col">
      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-200 leading-snug min-h-[2.5rem]">{item.name}</h3>
      <div className="mt-2 flex items-baseline gap-2 flex-wrap">
        <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">{formatValue(item.value)}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400">{item.unit}</span>
      </div>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className="text-gray-500 dark:text-gray-400">{item.period}-yil</span>
        {item.preliminary && <span className="rounded bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 text-amber-800 dark:text-amber-300">Dastlabki</span>}
        {text && (
          <span className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold ${changeTone(item)}`}
            title={item.change_kind === "pp" ? "O'tgan davrga nisbatan, foiz punktida" : "O'tgan davrga nisbatan"}>
            <ChangeIcon className="w-3 h-3" aria-hidden="true" />{text}
          </span>
        )}
      </div>
      <div className={`${tall ? "h-40" : "h-16"} mt-3 -mx-1`} aria-hidden="true">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={item.series} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.25} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            {tall && <XAxis dataKey="period" tick={{ fill: "#6b7280", fontSize: 11 }} axisLine={false} tickLine={false} />}
            <Tooltip formatter={(v: number) => [`${formatValue(v)} ${item.unit}`, ""]} labelFormatter={(l) => `${l}-yil`} separator="" />
            <Area type="monotone" dataKey="value" stroke="#2563eb" strokeWidth={2} fill={`url(#${gradientId})`} isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="mt-auto pt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
        {mapLink}
        {item.siat_url && (
          <a href={item.siat_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-blue-700">
            <ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />SIAT
          </a>
        )}
        {!item.siat_url && item.derived_from && <span title="Hisoblash manbasi">Hisoblangan: {item.derived_from}</span>}
      </div>
      {share && !external && (
        <div className="pt-3 mt-3 border-t border-gray-100 dark:border-gray-700">
          <ShareBar title={item.name} embedKey={item.key} year={item.period} compact />
        </div>
      )}
    </article>
  );
}
