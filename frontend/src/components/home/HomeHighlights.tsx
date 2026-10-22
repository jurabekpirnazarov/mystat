import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { ArrowDownRight, ArrowRight, ArrowUpRight, BookOpen, Building2, CalendarDays, Database, Factory, Globe2, Minus } from "lucide-react";
import axiosT from "../../api/baseUrl";
import { fetchTradeFlows, TRADE_VALUE_UNIT } from "../../api/tradeFlows";
import useApi from "../../hooks/useApi";
import { ErrorState, Skeleton } from "../ui";
import { fetchDashboards, fetchReleaseCalendar, type DashboardItem, type ReleaseItem } from "../../api/statPublic";
import { formatInt, formatValue } from "../../utils/statPublic";

/**
 * Bosh sahifa: "O'zbekiston raqamlarda" — rasmiy statistika (U-08, JT-10, JT-17).
 * Aholi soati va portal faoliyati — bannerda (Banner.tsx). Bu yerda: asosiy ko'rsatkichlar 10 yillik dinamika bilan,
 * tashqi savdo (eksport/import va saldo), e'lonlar kalendari, ochiq ma'lumotlar bazasi. Har raqam to'liq, davr va manba
 * bilan; har blok mustaqil yuklanadi.
 */

interface HomeStats {
  enterprises: number;
  trade_records: number;
  industrial_products: number;
  books: number;
}

const SOURCE = "O'zbekiston Respublikasi Milliy statistika qo'mitasi";
// SIAT kaliti -> qisqa nom, qisqa birlik, rang (kartochka yuqori chizig'i va grafik)
const KEY_INDICATORS: { key: string; label: string; unit: string; color: string }[] = [
  { key: "658", label: "YaIM o'sish sur'ati", unit: "o'tgan yilga, %", color: "#1d4ed8" },
  { key: "660", label: "Aholi jon boshiga YaIM", unit: "ming so'm", color: "#0f766e" },
  { key: "500", label: "O'rtacha oylik ish haqi", unit: "so'm", color: "#7c3aed" },
  { key: "1875", label: "Ishsizlik darajasi", unit: "%", color: "#b45309" },
];
const MONTHS = ["yanvar", "fevral", "mart", "aprel", "may", "iyun", "iyul", "avgust", "sentabr", "oktabr", "noyabr", "dekabr"];

function Panel({ title, icon: Icon, link, children, source, className = "" }: {
  title: string; icon: typeof Globe2; link?: { to: string; label: string }; children: React.ReactNode; source?: string;
  className?: string;
}) {
  return (
    <section className={`flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      <header className="flex items-center justify-between gap-2 px-5 pt-4">
        <h3 className="flex items-center gap-2 font-semibold text-slate-900 dark:text-white">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 dark:bg-blue-900/30">
            <Icon className="h-4 w-4 text-blue-800 dark:text-blue-300" aria-hidden="true" />
          </span>
          {title}
        </h3>
        {link && (
          <Link to={link.to} className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-blue-800 hover:underline dark:text-blue-300">
            {link.label} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        )}
      </header>
      <div className="flex-1 px-5 py-4">{children}</div>
      {source && <p className="border-t border-slate-100 bg-slate-50/60 px-5 py-2 text-[11px] text-slate-500 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400">Manba: {source}</p>}
    </section>
  );
}

// --- Asosiy ko'rsatkichlar ---------------------------------------------------------------------------------------

/** Grafik ostidagi xulosa: daraja ko'rsatkichlari — davr boshidan o'sish; foizli (p.p.) — davr o'rtachasi va eng yuqori yil */
function seriesSummary(item: DashboardItem): string | null {
  const s = item.series;
  if (s.length < 2) return null;
  const first = s[0], last = s[s.length - 1];
  if (item.change_kind === "pp") {
    const avg = s.reduce((a, p) => a + p.value, 0) / s.length;
    const peak = s.reduce((a, p) => (p.value > a.value ? p : a), s[0]);
    return `${first.period}–${last.period} o'rtachasi ${formatValue(avg)} · eng yuqori ${formatValue(peak.value)} (${peak.period})`;
  }
  if (!first.value) return null;
  const pct = (last.value / first.value - 1) * 100;
  const ratio = last.value / first.value;
  return pct >= 100
    ? `${first.period}-yildan beri ${ratio.toFixed(1).replace(".", ",")} barobar oshgan`
    : `${first.period}-yildan beri ${pct > 0 ? "+" : ""}${formatValue(pct)}%`;
}

function SparkTooltip({ active, payload, unit }: { active?: boolean; payload?: { payload: { period: string; value: number } }[]; unit: string }) {
  if (!active || !payload?.length) return null;
  const p = payload[0].payload;
  return (
    <div className="rounded-md border border-slate-200 bg-white px-2.5 py-1.5 text-xs shadow-md dark:border-gray-600 dark:bg-gray-800">
      <p className="text-slate-500">{p.period}-yil</p>
      <p className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatValue(p.value)} <span className="font-normal text-slate-500">{unit}</span></p>
    </div>
  );
}

function IndicatorTile({ item, label, unit, color }: { item: DashboardItem; label: string; unit: string; color: string }) {
  const good = item.change === null || item.change === 0 || item.higher_is_better === null ? null : (item.change > 0) === item.higher_is_better;
  const Icon = item.change === null || item.change === 0 ? Minus : item.change > 0 ? ArrowUpRight : ArrowDownRight;
  const change = item.change === null ? null : `${item.change > 0 ? "+" : ""}${formatValue(item.change)}${item.change_kind === "pp" ? " p.p." : "%"}`;
  const series = item.series;
  const values = series.map((p) => p.value);
  const lo = Math.min(...values), hi = Math.max(...values);
  const pad = (hi - lo) * 0.15 || Math.abs(hi) * 0.05 || 1;
  const lastIdx = series.length - 1;
  const summary = seriesSummary(item);
  return (
    <Link to={item.map_url || "/dashboards"} className="group relative flex flex-col overflow-hidden rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:border-gray-700 dark:bg-gray-800">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} aria-hidden="true" />
      <p className="text-sm font-medium text-slate-600 dark:text-gray-300">{label}</p>
      <p className="mt-2 flex items-baseline gap-1.5">
        <span className="text-3xl font-bold tabular-nums tracking-tight text-slate-900 dark:text-white">{formatValue(item.value)}</span>
        <span className="text-xs text-slate-500">{unit}</span>
      </p>
      <div className="mt-1 flex items-center gap-2 text-xs">
        <span className="text-slate-500">{item.period}-yil</span>
        {change && (
          <span title="O'tgan yilga nisbatan" className={`inline-flex items-center gap-0.5 rounded px-1.5 py-0.5 font-semibold ${good === null ? "bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-200" : good ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300" : "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300"}`}>
            <Icon className="h-3 w-3" aria-hidden="true" />{change}
          </span>
        )}
      </div>
      <div className="-mx-2 mt-4 h-20" role="img" aria-label={`${label}: ${series.map((p) => `${p.period} — ${formatValue(p.value)}`).join(", ")}`}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 8, right: 10, left: 10, bottom: 0 }}>
            <defs>
              <linearGradient id={`hl-${item.key}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.28} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="3 3" />
            {/* Shkala ma'lumot oralig'ida (+ zaxira): YaIM o'sishi 105–108% atrofida, 0 dan boshlansa chiziq tekis ko'rinadi */}
            <YAxis hide domain={[lo - pad, hi + pad]} />
            {/* Yillar xulosa qatorida ("2016–2025 …"), o'qda takrorlanmaydi */}
            <XAxis dataKey="period" hide />
            <Tooltip content={<SparkTooltip unit={unit} />} cursor={{ stroke: color, strokeOpacity: 0.35 }} />
            <Area type="monotone" dataKey="value" stroke={color} strokeWidth={2.25} fill={`url(#hl-${item.key})`} isAnimationActive={false}
              dot={(props: { cx?: number; cy?: number; index?: number }) => props.index === lastIdx && props.cx !== undefined
                ? <circle key="last" cx={props.cx} cy={props.cy} r={4} fill={color} stroke="#fff" strokeWidth={2} />
                : <g key={`d${props.index}`} />}
              activeDot={{ r: 4, fill: color, stroke: "#fff", strokeWidth: 2 }} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      {summary && <p className="mt-2 text-xs text-slate-600 dark:text-gray-300">{summary}</p>}
    </Link>
  );
}

function KeyIndicators() {
  const { data, loading } = useApi(() => fetchDashboards(), []);
  if (loading && !data) return <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{KEY_INDICATORS.map((k) => <Skeleton key={k.key} variant="card" />)}</div>;
  if (!data) return null;
  const byKey = new Map(data.panels.flatMap((p) => p.items).map((i) => [i.key, i]));
  return (
    <div className="space-y-2">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {KEY_INDICATORS.map(({ key, label, unit, color }) => {
          const item = byKey.get(key);
          return item ? <IndicatorTile key={key} item={item} label={label} unit={unit} color={color} /> : null;
        })}
      </div>
      <p className="text-[11px] text-slate-500 dark:text-gray-400">
        Manba: SIAT, {SOURCE}. Kartochkani bosing — ko'rsatkich hududlar kesimida ochiladi.
      </p>
    </div>
  );
}

// --- Tashqi savdo ------------------------------------------------------------------------------------------------

function TradeSnapshot() {
  const { data, loading, error, reload } = useApi(
    () => Promise.all([fetchTradeFlows({ flow: "export", limit: 5 }), fetchTradeFlows({ flow: "import", limit: 5 })]),
    []
  );
  return (
    <Panel title="Tashqi savdo" icon={Globe2} link={{ to: "/trade-flows", label: "Batafsil" }} source={SOURCE} className="lg:col-span-2">
      {loading && !data ? <Skeleton rows={6} /> : error || !data ? <ErrorState onRetry={reload} className="py-4" /> : (() => {
        const [exp, imp] = data;
        const turnover = exp.total_value + imp.total_value;
        const balance = exp.total_value - imp.total_value;
        const expShare = turnover ? (exp.total_value / turnover) * 100 : 50;
        return (
          <div className="grid gap-6 md:grid-cols-2">
            <div>
              <p className="text-xs text-slate-500">{exp.year}-yil {exp.period_label}, {TRADE_VALUE_UNIT}</p>
              <p className="mt-3 text-xs font-medium uppercase tracking-wide text-slate-500">Tashqi savdo aylanmasi</p>
              <p className="text-3xl font-bold tabular-nums text-slate-900 dark:text-white">{formatInt(turnover)}</p>
              <div className="mt-4 flex h-3 overflow-hidden rounded-full" role="img" aria-label={`Eksport ${expShare.toFixed(0)}%, import ${(100 - expShare).toFixed(0)}%`}>
                <span className="bg-emerald-600" style={{ width: `${expShare}%` }} />
                <span className="bg-blue-800" style={{ width: `${100 - expShare}%` }} />
              </div>
              <dl className="mt-3 grid grid-cols-2 gap-3 text-sm">
                <div><dt className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-emerald-600" />Eksport</dt><dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatInt(exp.total_value)}</dd></div>
                <div><dt className="flex items-center gap-1.5 text-xs text-slate-500"><span className="h-2 w-2 rounded-full bg-blue-800" />Import</dt><dd className="font-semibold tabular-nums text-slate-900 dark:text-white">{formatInt(imp.total_value)}</dd></div>
              </dl>
              <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-sm dark:bg-gray-700/50">
                <span className="text-slate-500">Savdo saldosi: </span>
                <span className={`font-semibold tabular-nums ${balance < 0 ? "text-red-700 dark:text-red-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                  {balance > 0 ? "+" : ""}{formatInt(balance)}
                </span>
              </p>
            </div>
            <div>
              <p className="mb-3 text-xs font-medium uppercase tracking-wide text-slate-500">Eksport bo'yicha asosiy hamkorlar</p>
              <ol className="space-y-2.5">
                {exp.countries.map((c, i) => (
                  <li key={c.country_id} className="text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="truncate text-slate-800 dark:text-gray-100"><span className="mr-2 tabular-nums text-slate-400">{i + 1}</span>{c.country_name}</span>
                      <span className="tabular-nums text-slate-500">{c.share.toFixed(1)}%</span>
                    </div>
                    <span className="mt-1 block h-1.5 overflow-hidden rounded bg-slate-100 dark:bg-gray-700">
                      <span className="block h-full rounded bg-emerald-600" style={{ width: `${Math.min(100, (c.value / (exp.countries[0]?.value || 1)) * 100)}%` }} />
                    </span>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        );
      })()}
    </Panel>
  );
}

// --- E'lonlar kalendari ------------------------------------------------------------------------------------------

function UpcomingReleases() {
  const { data, loading, error, reload } = useApi(() => fetchReleaseCalendar(), []);
  // Bir kunda bir nechta ko'rsatkich e'lon qilinadi — sanalar bo'yicha guruhlanadi
  const groups: [string, ReleaseItem[]][] = [];
  for (const r of data?.upcoming ?? []) {
    const last = groups[groups.length - 1];
    if (last && last[0] === r.date) last[1].push(r);
    else groups.push([r.date, [r]]);
  }
  return (
    <Panel title="E'lonlar kalendari" icon={CalendarDays} link={{ to: "/release-calendar", label: "Kalendar" }} source={SOURCE}>
      {loading && !data ? <Skeleton rows={4} /> : error || !data ? <ErrorState onRetry={reload} className="py-4" /> : groups.length === 0 ? (
        <p className="text-sm text-slate-500">Yaqin oylarda rejalashtirilgan e'lon yo'q.</p>
      ) : (
        <ol className="relative ml-1.5 space-y-4 border-l-2 border-slate-100 pl-5 dark:border-gray-700">
          {groups.slice(0, 3).map(([date, items]) => {
            const [y, m, d] = date.split("-").map(Number);
            return (
              <li key={date} className="relative">
                <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full border-2 border-white bg-blue-800 dark:border-gray-800" aria-hidden="true" />
                <p className="text-sm font-semibold text-slate-900 dark:text-white">{d}-{MONTHS[m - 1]} {y}</p>
                <p className="text-xs text-slate-500">{items.length} ta ko'rsatkich · {items.some((i) => i.kind === "official") ? "rasmiy sana" : "taxminiy sana"}</p>
                <ul className="mt-1.5 space-y-1">
                  {items.slice(0, 2).map((i) => <li key={i.key} className="line-clamp-1 text-sm text-slate-700 dark:text-gray-200">{i.title}</li>)}
                  {items.length > 2 && <li className="text-xs text-blue-800 dark:text-blue-300">va yana {items.length - 2} ta</li>}
                </ul>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}

// --- Ochiq ma'lumotlar bazasi ------------------------------------------------------------------------------------

function DataAssets() {
  const { data } = useApi(async () => (await axiosT.get<HomeStats>("/common/home-stats/")).data, []);
  const rows = [
    { label: "Korxonalar (KTUT)", value: data?.enterprises, icon: Building2, to: "/check" },
    { label: "Tashqi savdo yozuvlari", value: data?.trade_records, icon: Globe2, to: "/trade-flows" },
    { label: "Sanoat mahsulotlari yozuvlari", value: data?.industrial_products, icon: Factory, to: "/industry" },
    { label: "Statistik nashrlar", value: data?.books, icon: BookOpen, to: "/books" },
  ];
  return (
    <div className="rounded-xl border border-slate-200 bg-mg-info/60 p-5 dark:border-gray-700 ">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm font-semibold text-slate-900 dark:text-white">
          <Database className="h-4 w-4 text-blue-800 dark:text-blue-300" aria-hidden="true" />Ochiq ma'lumotlar bazasi
        </p>
        <Link to="/developers" className="inline-flex items-center gap-1 text-sm font-medium text-blue-800 hover:underline dark:text-blue-300">
          API orqali olish <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <ul className="mt-4 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {rows.map(({ label, value, icon: Icon, to }) => (
          <li key={label}>
            <Link to={to} className="group flex items-center gap-3">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white shadow-sm ring-1 ring-slate-200 dark:bg-gray-700 dark:ring-gray-600">
                <Icon className="h-5 w-5 text-blue-800 dark:text-blue-300" aria-hidden="true" />
              </span>
              <span className="min-w-0">
                <span className="block text-lg font-bold tabular-nums text-slate-900 group-hover:text-blue-800 dark:text-white">{value === undefined ? "—" : formatInt(value)}</span>
                <span className="block truncate text-xs text-slate-500">{label}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function HomeHighlights() {
  return (
    <section aria-labelledby="official-title" className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div className="border-l-4 border-blue-900 pl-4 dark:border-blue-400">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-900 dark:text-blue-300">Rasmiy statistika</p>
          <h2 id="official-title" className="mt-1 text-2xl font-bold text-slate-900 dark:text-white md:text-3xl">O'zbekiston raqamlarda</h2>
          <p className="mt-1 text-sm text-slate-600 dark:text-gray-300">So'nggi rasmiy ma'lumotlar — davri va manbasi bilan.</p>
        </div>
        <Link to="/dashboards" className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-800 hover:border-blue-800 hover:text-blue-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
          Barcha ko'rsatkichlar <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
      <KeyIndicators />
      <div className="grid gap-4 lg:grid-cols-3">
        <TradeSnapshot />
        <UpcomingReleases />
      </div>
      <DataAssets />
    </section>
  );
}
