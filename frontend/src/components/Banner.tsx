import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, CalendarDays, ClipboardList, LayoutGrid, Map as MapIcon, Search, ShieldCheck } from "lucide-react";
import { banner_stat } from "../api/apiUrls";
import { getRequest } from "../api/request";
import { fetchDashboards, type PopulationClock } from "../api/statPublic";
import { loadBoundaries, polygons, type GeoFeature } from "../utils/mapGeo";
import { estimatePopulation, formatInt } from "../utils/statPublic";

/**
 * Bosh sahifa banneri: statistika portali uslubida.
 * - Chapda: platforma maqsadi, qidiruv (Navbar'dagi global qidiruvni ochadi) va asosiy statistik xizmatlarga yo'llar.
 * - O'ngda: jonli "Doimiy aholi soni" (stat.uz hisoblagichi bilan bir xil, JT-02).
 * - Pastda: portal faoliyati — faqat haqiqiy raqamlar. Ilgari "+12.5%" kabi o'zgarishlar kodga qattiq yozilgan edi.
 * Fonda O'zbekiston viloyatlari siluetti (public/geo/regions.geojson) — tashqi rasm yo'q.
 */

interface BannerStats {
  users_count: number;
  service_count: number;
  todays_services: number;
  current_year_services: number;
}

const QUICK_LINKS = [
  { to: "/regions", label: "Hududlar xaritasi", icon: MapIcon },
  { to: "/dashboards", label: "Mavzuli panellar", icon: LayoutGrid },
  { to: "/check", label: "Kontragentni tekshirish", icon: ShieldCheck },
  { to: "/release-calendar", label: "E'lonlar kalendari", icon: CalendarDays },
  { to: "/report-calendar", label: "Hisobot kalendari", icon: ClipboardList },
];

/** GeoJSON -> SVG path (teng masofali proyeksiya, kenglik bo'yicha cos tuzatish) */
function useCountryPaths() {
  const [features, setFeatures] = useState<GeoFeature[] | null>(null);
  useEffect(() => {
    loadBoundaries("regions").then((g) => setFeatures(g.features)).catch(() => setFeatures([]));
  }, []);
  return useMemo(() => {
    if (!features?.length) return null;
    const k = Math.cos((41 * Math.PI) / 180);
    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    for (const f of features) for (const poly of polygons(f)) for (const [x, y] of poly[0]) {
      minX = Math.min(minX, x * k); maxX = Math.max(maxX, x * k); minY = Math.min(minY, -y); maxY = Math.max(maxY, -y);
    }
    const w = 1000, scale = w / (maxX - minX), h = (maxY - minY) * scale;
    const paths = features.map((f) => polygons(f).map((poly) => poly.map((ring) =>
      "M" + ring.map(([x, y]) => `${((x * k - minX) * scale).toFixed(1)},${((-y - minY) * scale).toFixed(1)}`).join("L") + "Z",
    ).join("")).join(""));
    return { paths, w, h };
  }, [features]);
}

function LivePopulation({ clock }: { clock: PopulationClock }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const value = estimatePopulation(clock, now);
  const d = new Date(now);
  const midnight = new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const today = value - estimatePopulation(clock, Math.max(midnight, new Date(clock.base_at).getTime()));
  const every = clock.net_per_second ? Math.round(1 / clock.net_per_second) : null;
  return (
    <div className="rounded-2xl border border-white/15 bg-white/[0.07] p-6 backdrop-blur-sm sm:p-7">
      <div className="flex items-center gap-2">
        <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-60 motion-reduce:hidden" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
        </span>
        <p className="text-xs font-semibold uppercase tracking-[0.18em] text-blue-100">Doimiy aholi soni · real vaqtda</p>
      </div>
      <p className="mt-4 text-4xl font-bold tabular-nums tracking-tight text-white sm:text-5xl" aria-live="off">{formatInt(value)}</p>
      <p className="mt-1 text-sm text-blue-100">kishi, {d.toLocaleDateString("ru-RU")} holatiga</p>
      <dl className="mt-6 grid grid-cols-2 gap-3 border-t border-white/10 pt-4 text-white">
        <div><dt className="text-xs text-blue-200">Bugun qo'shildi</dt><dd className="text-lg font-semibold tabular-nums">+{formatInt(today)}</dd></div>
        <div><dt className="text-xs text-blue-200">Yillik o'sish</dt><dd className="text-lg font-semibold tabular-nums">{clock.annual_growth_pct.toFixed(2)}%</dd></div>
      </dl>
      <p className="mt-4 text-[11px] leading-relaxed text-blue-200">
        {every && <>Har ~{every} soniyada +1 kishi. </>}
        Manba: {clock.source_url ? <a href={clock.source_url} target="_blank" rel="noopener noreferrer" className="underline hover:text-white">stat.uz</a> : clock.source}
      </p>
    </div>
  );
}

const Banner = () => {
  const [stats, setStats] = useState<BannerStats | null>(null);
  const [clock, setClock] = useState<PopulationClock | null>(null);
  const country = useCountryPaths();

  useEffect(() => {
    getRequest(banner_stat).then((r) => setStats(r as BannerStats)).catch(() => setStats(null));
    fetchDashboards().then((d) => setClock(d.population_clock)).catch(() => setClock(null));
  }, []);

  const portal = [
    ["Ro'yxatdan o'tgan foydalanuvchilar", stats?.users_count],
    ["Interaktiv xizmatlar", stats?.service_count],
    ["Bugun ko'rsatilgan xizmatlar", stats?.todays_services],
    ["Yil boshidan ko'rsatilgan xizmatlar", stats?.current_year_services],
  ] as const;

  return (
    <section className="relative overflow-hidden bg-[#0b2a5b] text-white dark:bg-[#071a3a]">
      {/* Nuqtali to'r va xarita siluetti — statistik fon, kontrastni buzmaydi */}
      <div className="absolute inset-0 opacity-[0.18]" aria-hidden="true"
        style={{ backgroundImage: "radial-gradient(rgb(255 255 255 / 0.5) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />
      <div className="absolute inset-0 bg-gradient-to-br from-[#0b2a5b] via-[#0b2a5b]/80 to-[#123f86]/70" aria-hidden="true" />
      {country && (
        <svg viewBox={`0 0 ${country.w} ${country.h}`} aria-hidden="true"
          className="pointer-events-none absolute -right-24 top-1/2 hidden w-[860px] -translate-y-1/2 opacity-[0.16] lg:block">
          {country.paths.map((d, i) => <path key={i} d={d} fill="rgb(255 255 255 / 0.35)" stroke="white" strokeWidth={1.2} />)}
        </svg>
      )}

      <div className="relative mx-auto max-w-7xl px-4 pb-10 pt-14 sm:px-6 lg:px-8 lg:pt-20">
        <div className="grid items-center gap-10 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs font-medium text-blue-100">
              O'zbekiston Respublikasi Milliy statistika qo'mitasi
            </p>
            <h1 className="mt-5 text-4xl font-bold leading-tight md:text-5xl">Interaktiv xizmatlar platformasi</h1>
            <p className="mt-4 max-w-2xl text-lg leading-relaxed text-blue-100">
              Rasmiy statistik ma'lumotlar, hududlar va korxonalar tahlili hamda statistik hisobotlar bo'yicha interaktiv
              xizmatlar — bir joyda.
            </p>

            <button type="button" onClick={() => window.dispatchEvent(new Event("open-global-search"))}
              className="mt-8 flex w-full max-w-xl items-center gap-3 rounded-xl bg-white px-4 py-3.5 text-left text-slate-500 shadow-lg shadow-black/20 transition hover:ring-4 hover:ring-white/20">
              <Search className="h-5 w-5 text-blue-800" aria-hidden="true" />
              <span className="flex-1 text-sm sm:text-base">Ko'rsatkich, korxona (STIR) yoki xizmatni qidiring</span>
              <kbd className="hidden rounded border border-slate-200 px-1.5 py-0.5 text-xs text-slate-400 sm:inline">Ctrl K</kbd>
            </button>

            <nav aria-label="Asosiy statistik xizmatlar" className="mt-5 flex flex-wrap gap-2">
              {QUICK_LINKS.map(({ to, label, icon: Icon }) => (
                <Link key={to} to={to}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 bg-white/5 px-3 py-1.5 text-sm text-white transition hover:border-white/40 hover:bg-white/10">
                  <Icon className="h-4 w-4 text-blue-200" aria-hidden="true" />{label}
                </Link>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-5">
            {clock ? <LivePopulation clock={clock} /> : <div className="h-72 animate-pulse rounded-2xl bg-white/5" aria-hidden="true" />}
          </div>
        </div>

        <div className="mt-12 grid grid-cols-2 gap-y-4 border-t border-white/10 pt-6 md:grid-cols-4">
          {portal.map(([label, value]) => (
            <div key={label} className="pr-4">
              <p className="text-2xl font-bold tabular-nums">{value === undefined ? "—" : formatInt(value)}</p>
              <p className="text-xs text-blue-200">{label}</p>
            </div>
          ))}
        </div>
        <Link to="/services" className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-blue-100 hover:text-white">
          Barcha xizmatlar <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
};

export default Banner;
