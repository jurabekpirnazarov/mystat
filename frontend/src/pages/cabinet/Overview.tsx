import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Bell, BookOpen, FileText, MessageSquarePlus, Package, ShoppingCart, Activity, Tag } from "lucide-react";
import { fetchCabinetSummary, type CabinetSummary } from "../../api/cabinet";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, Skeleton, StatCard } from "../../components/ui";
import { formatDateTime, monthLabel, timeAgo } from "../../utils/format";

interface Props {
  onNavigate: (tab: string) => void;
}

const ACTIVITY_ICON = { usage: Activity, book_order: ShoppingCart, request: MessageSquarePlus, contract: FileText };

function LimitBar({ name, used, limit }: { name: string; used: number; limit: number }) {
  const pct = Math.min(100, Math.round((used / limit) * 100));
  const color = pct >= 100 ? "bg-red-500" : pct >= 80 ? "bg-amber-500" : "bg-blue-600";
  return (
    <div>
      <div className="flex justify-between gap-3 text-sm">
        <span className="text-gray-700 dark:text-gray-200 truncate">{name}</span>
        <span className="shrink-0 tabular-nums text-gray-500 dark:text-gray-400">
          {used} / {limit}
        </span>
      </div>
      <div
        className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden"
        role="progressbar"
        aria-valuenow={pct}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label={name}
      >
        <div className={`h-full rounded-full ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

function PackageCard({ summary }: { summary: CabinetSummary }) {
  const pkg = summary.package;
  if (!pkg) {
    return (
      <EmptyState
        icon={Tag}
        title="Sizda faol tarif paketi yo'q"
        description="Paket tanlang — statistik xizmatlardan limit bo'yicha foydalanasiz."
        action={
          <Link to="/services" className="inline-flex px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Tariflarni ko'rish
          </Link>
        }
      />
    );
  }
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{pkg.name_uz}</h3>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {formatDateTime(pkg.started_at, false)} dan
          {pkg.expires_at ? ` · ${formatDateTime(pkg.expires_at, false)} gacha` : ""}
        </span>
      </div>
      {summary.limits.length === 0 ? (
        <p className="text-sm text-gray-500 dark:text-gray-400">Paketda limitli xizmatlar yo'q.</p>
      ) : (
        <div className="space-y-3">
          {summary.limits.map((l) => (
            <LimitBar key={l.id} name={l.name_uz} used={l.used} limit={l.limit} />
          ))}
        </div>
      )}
    </div>
  );
}

export default function Overview({ onNavigate }: Props) {
  const { data, loading, error, reload } = useApi(fetchCabinetSummary, []);

  if (loading && !data) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => <Skeleton key={i} variant="card" />)}
        </div>
        <Skeleton variant="chart" />
      </div>
    );
  }
  if (error || !data) return <ErrorState onRetry={reload} />;

  const chartData = data.usage_by_month.map((m) => ({ name: monthLabel(m.month), count: m.count }));
  const activeContracts = (data.contracts.by_status.processing ?? 0) + (data.contracts.by_status.pending ?? 0);

  return (
    <div className="p-4 sm:p-6 space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <StatCard label="Faol paket" value={data.package?.name_uz ?? "—"} icon={Package} hint={data.package ? "joriy tarif" : "paket tanlanmagan"} />
        <StatCard label="Shartnomalar" value={data.contracts.total} icon={FileText} hint={`${activeContracts} ta jarayonda`} />
        <StatCard label="Ochiq so'rovlar" value={data.open_requests} icon={MessageSquarePlus} hint="javob kutilmoqda" />
        <StatCard
          label="O'qilmagan xabarlar"
          value={data.unread_notifications}
          icon={Bell}
          trend={data.usage_by_month.map((m) => m.count)}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <section className="xl:col-span-3 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Paket va limitlar</h2>
          <PackageCard summary={data} />
        </section>

        <section className="xl:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Tezkor amallar</h2>
          <div className="grid grid-cols-1 gap-2">
            <button type="button" onClick={() => onNavigate("requests")} className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50 text-left">
              <MessageSquarePlus className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Yangi xizmat so'rovi</span>
            </button>
            <Link to="/books" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <BookOpen className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Kitob do'koni</span>
            </Link>
            <Link to="/services" className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
              <Tag className="w-5 h-5 text-blue-600" aria-hidden="true" />
              <span className="text-sm font-medium text-gray-800 dark:text-gray-100">Tariflar</span>
            </Link>
          </div>
        </section>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-5 gap-6">
        <section className="xl:col-span-3 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Limit ishlatilishi — so'nggi 6 oy</h2>
          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="currentColor" className="text-gray-200 dark:text-gray-700" vertical={false} />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                <Tooltip formatter={(v: number) => [v, "foydalanish"]} cursor={{ fill: "rgba(37,99,235,0.08)" }} />
                <Bar dataKey="count" fill="#2563eb" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </section>

        <section className="xl:col-span-2 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
          <h2 className="font-semibold text-gray-900 dark:text-white mb-4">So'nggi faoliyat</h2>
          {data.recent_activity.length === 0 ? (
            <EmptyState title="Hozircha faoliyat yo'q" className="py-6" />
          ) : (
            <ol className="space-y-3">
              {data.recent_activity.map((e, i) => {
                const Icon = ACTIVITY_ICON[e.type] ?? Activity;
                return (
                  <li key={i} className="flex gap-3">
                    <div className="w-8 h-8 shrink-0 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <Icon className="w-4 h-4 text-gray-500 dark:text-gray-300" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm text-gray-800 dark:text-gray-100 truncate">{e.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{timeAgo(e.date)}</p>
                    </div>
                  </li>
                );
              })}
            </ol>
          )}
        </section>
      </div>
    </div>
  );
}
