import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, Tooltip, XAxis } from "recharts";
import { ArrowRight, BookOpen, Building2, Factory, Globe2, LayoutGrid, Star, Users } from "lucide-react";
import axiosT from "../../api/baseUrl";
import { fetchTradeFlows, TRADE_VALUE_UNIT } from "../../api/tradeFlows";
import useApi from "../../hooks/useApi";
import { ErrorState, Skeleton } from "../ui";

interface HomeStats {
  enterprises: number;
  trade_records: number;
  industrial_products: number;
  books: number;
  services: number;
  users: number;
}
interface MonthUserStat {
  year: number;
  months: Record<string, number>;
}
interface ServiceShort {
  id: number;
  name_uz: string;
  slug: string | null;
  average_rating: number | null;
  ratings_total: number;
}

const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n)).replace(/,/g, " ");
const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} mln` : n >= 1e4 ? `${Math.round(n / 1e3)} ming` : fmt(n));

/** Raqam 0 dan qiymatgacha sanaladi (prefers-reduced-motion bo'lsa — darhol). */
function CountUp({ value }: { value: number }) {
  const [shown, setShown] = useState(0);
  const frame = useRef<number>();
  useEffect(() => {
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) {
      setShown(value);
      return;
    }
    const start = performance.now();
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / 900);
      setShown(value * (1 - Math.pow(1 - p, 3)));
      if (p < 1) frame.current = requestAnimationFrame(tick);
    };
    frame.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(frame.current!);
  }, [value]);
  return <>{compact(shown)}</>;
}

function Card({ title, link, children }: { title: string; link?: { to: string; label: string }; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 flex flex-col">
      <div className="flex items-center justify-between gap-2 mb-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">{title}</h3>
        {link && (
          <Link to={link.to} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            {link.label} <ArrowRight className="w-4 h-4" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

function NumbersStrip() {
  const { data, loading, error, reload } = useApi(async () => (await axiosT.get<HomeStats>("/common/home-stats/")).data, []);
  if (loading && !data) return <div className="grid grid-cols-2 lg:grid-cols-6 gap-3">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} variant="card" />)}</div>;
  if (error || !data) return <ErrorState onRetry={reload} className="py-4" />;
  const items = [
    { label: "Korxonalar (KTUT)", value: data.enterprises, icon: Building2, to: "/organizations-ktut" },
    { label: "Tashqi savdo yozuvlari", value: data.trade_records, icon: Globe2, to: "/trade-flows" },
    { label: "Sanoat mahsulotlari", value: data.industrial_products, icon: Factory, to: "/industry" },
    { label: "Statistik nashrlar", value: data.books, icon: BookOpen, to: "/books" },
    { label: "Xizmatlar", value: data.services, icon: LayoutGrid, to: "/services" },
    { label: "Foydalanuvchilar", value: data.users, icon: Users, to: "/statistics" },
  ];
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
      {items.map(({ label, value, icon: Icon, to }) => (
        <Link key={label} to={to} className="group rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:border-blue-300 hover:shadow-sm transition">
          <Icon className="w-5 h-5 text-blue-600 mb-2" aria-hidden="true" />
          <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums"><CountUp value={value} /></p>
          <p className="text-xs text-gray-500 dark:text-gray-400 group-hover:text-blue-600">{label}</p>
        </Link>
      ))}
    </div>
  );
}

function MonthlyUsers() {
  const { data, loading, error, reload } = useApi(async () => (await axiosT.get<MonthUserStat>("/accounts/month-user-stat")).data, []);
  if (loading && !data) return <Skeleton variant="chart" />;
  // Kutilmagan javobda (masalan proxy'siz index.html) butun bosh sahifa ErrorBoundary'ga tushmasin
  if (error || !data?.months) return <ErrorState onRetry={reload} className="py-4" />;
  const now = new Date();
  const rows = Object.entries(data.months)
    .slice(0, data.year === now.getFullYear() ? now.getMonth() + 1 : 12)
    .map(([m, n]) => ({ m: m.slice(0, 3), n }));
  const total = rows.reduce((s, r) => s + r.n, 0);
  return (
    <>
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2 mb-2">{data.year}-yilda {fmt(total)} ta yangi foydalanuvchi</p>
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={rows} margin={{ top: 4, right: 4, left: 4, bottom: 0 }}>
            <defs>
              <linearGradient id="usersFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#2563eb" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#2563eb" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="m" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} />
            <Tooltip formatter={(v: number) => [fmt(v), "yangi"]} />
            <Area type="monotone" dataKey="n" stroke="#2563eb" strokeWidth={2} fill="url(#usersFill)" isAnimationActive={false} />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </>
  );
}

function TradeSnapshot() {
  const { data, loading, error, reload } = useApi(
    () => Promise.all([fetchTradeFlows({ flow: "export", limit: 5 }), fetchTradeFlows({ flow: "import", limit: 5 })]),
    []
  );
  if (loading && !data) return <Skeleton rows={6} />;
  if (error || !data) return <ErrorState onRetry={reload} className="py-4" />;
  const [exp, imp] = data;
  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500 dark:text-gray-400 -mt-2">{exp.year}-yil {exp.period_label}, {TRADE_VALUE_UNIT}</p>
      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-lg bg-emerald-50 dark:bg-emerald-900/20 p-3">
          <p className="text-xs text-emerald-700 dark:text-emerald-300">Eksport</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{compact(exp.total_value)}</p>
        </div>
        <div className="rounded-lg bg-sky-50 dark:bg-sky-900/20 p-3">
          <p className="text-xs text-sky-700 dark:text-sky-300">Import</p>
          <p className="text-lg font-bold text-gray-900 dark:text-white">{compact(imp.total_value)}</p>
        </div>
      </div>
      <div>
        <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Top-5 eksport hamkori</p>
        <ul className="space-y-1.5">
          {exp.countries.map((c) => (
            <li key={c.country_id} className="flex items-center gap-2 text-sm">
              <span className="w-28 sm:w-36 truncate text-gray-800 dark:text-gray-100">{c.country_name}</span>
              <div className="flex-1 h-1.5 rounded bg-gray-100 dark:bg-gray-700 overflow-hidden">
                <div className="h-full bg-emerald-500" style={{ width: `${Math.min(100, (c.value / (exp.countries[0]?.value || 1)) * 100)}%` }} />
              </div>
              <span className="w-12 text-right text-xs tabular-nums text-gray-500">{c.share.toFixed(1)}%</span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function PopularServices() {
  const { data, loading, error, reload } = useApi(async () => {
    const res = (await axiosT.get<{ results: ServiceShort[] } | ServiceShort[]>("/services/service/")).data;
    const list = Array.isArray(res) ? res : res.results;
    return [...list].filter((s) => s.ratings_total > 0).sort((a, b) => (b.average_rating ?? 0) - (a.average_rating ?? 0) || b.ratings_total - a.ratings_total).slice(0, 3);
  }, []);
  if (loading && !data) return <Skeleton rows={4} />;
  if (error || !data) return <ErrorState onRetry={reload} className="py-4" />;
  if (data.length === 0) return <p className="text-sm text-gray-500">Hali baholar yo'q.</p>;
  return (
    <ol className="space-y-3">
      {data.map((s, i) => (
        <li key={s.id}>
          <Link to={s.slug && !s.slug.startsWith("http") ? `/${s.slug}` : "/services"} className="flex items-start gap-3 group">
            <span className="w-7 h-7 shrink-0 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 text-sm font-bold flex items-center justify-center">{i + 1}</span>
            <span className="min-w-0">
              <span className="block text-sm font-medium text-gray-900 dark:text-white group-hover:text-blue-600 line-clamp-2">{s.name_uz}</span>
              <span className="inline-flex items-center gap-1 text-xs text-gray-500">
                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-400" aria-hidden="true" />
                {(s.average_rating ?? 0).toFixed(1)} · {s.ratings_total} ta baho
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ol>
  );
}

/** Bosh sahifa: jonli ko'rsatkichlar. Har bir blok mustaqil yuklanadi. U-08. */
export default function HomeHighlights() {
  return (
    <section aria-labelledby="highlights-title" className="space-y-6">
      <div>
        <h2 id="highlights-title" className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white">Raqamlarda platforma</h2>
        <p className="text-gray-600 dark:text-gray-300 mt-1">Bazadagi ochiq statistik ma'lumotlar va platformadan foydalanish</p>
      </div>
      <NumbersStrip />
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card title="Tashqi savdo qisqacha" link={{ to: "/trade-flows", label: "Batafsil" }}>
          <TradeSnapshot />
        </Card>
        <Card title="Oylik yangi foydalanuvchilar" link={{ to: "/statistics", label: "Statistika" }}>
          <MonthlyUsers />
        </Card>
        <Card title="Ommabop xizmatlar" link={{ to: "/services", label: "Barchasi" }}>
          <PopularServices />
        </Card>
      </div>
    </section>
  );
}
