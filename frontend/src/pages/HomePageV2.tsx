import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowDownRight, ArrowRight, ArrowUpRight, BadgeCheck, BookOpen, Building2, CalendarClock, CalendarDays, Coins, Database, Factory, FolderOpen, Globe2, LayoutGrid, LineChart,
  ShoppingBasket, TrendingUp, Users, Wallet, type LucideIcon,
} from "lucide-react";
import { fetchDashboards, type DashboardItem, type DashboardPanel, fetchReleaseCalendar, type ReleaseItem } from "../api/statPublic";
import { fetchLatestBooks, type PublicBook } from "../api/books";
import { useAuth } from "../contexts/AuthContext";
import { SITUATIONS } from "../config/situations";
import { SERVICES } from "../config/serviceCatalog";
import { SPHERES } from "../config/spheres";
import { USEFUL_RESOURCES } from "../config/publicMenu";
import { useLang } from "../i18n/LangContext";
import { UI } from "../i18n/ui";
import useApi from "../hooks/useApi";
import { compactNumber, useServiceStats } from "../components/catalog/useServiceStats";
import HomeAside, { NextRelease } from "../components/home/HomeAside";
import TileArt, { hasTileArt } from "../components/home/TileArt";
import SearchPanel from "../components/search/SearchPanel";
import { ActionCard, CountGrid, IconChip, DocList, ExternalLink, LinkGrid, SectionHeader, type CountItem, type DocRow } from "../components/ui";

/** Bosh sahifa bloklari sarlavhasi: aksent chiziq bilan */
const Header = (props: React.ComponentProps<typeof SectionHeader>) => <SectionHeader accent {...props} />;

const fmtDate = (iso: string) => {
  const [y, m, d] = iso.split("-");
  return y && m && d ? `${d}.${m}.${y}` : iso;
};

const fmtNum = (n: number) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 1 }).format(n).replace(/,/g, " ");

/** Mini grafik: oddiy SVG (grafik kutubxonasi bosh sahifada yuklanmaydi). */
function Sparkline({ series, color }: { series: { value: number }[]; color: string }) {
  if (series.length < 2) return null;
  const vals = series.map((p) => p.value);
  const min = Math.min(...vals), max = Math.max(...vals), span = max - min || 1;
  const pts = vals.map((v, i) => `${(i / (vals.length - 1)) * 100},${34 - ((v - min) / span) * 28}`);
  return (
    <svg viewBox="0 0 100 40" preserveAspectRatio="none" className="h-12 w-full" aria-hidden="true">
      <polygon points={`0,40 ${pts.join(" ")} 100,40`} fill={color} opacity="0.12" />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth="2" strokeLinejoin="round" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/** Mavzu (panel) slug'i → mos ikonka; noma'lum mavzu uchun umumiy "ma'lumot" ikonkasi */
const TOPIC_ICONS: Record<string, LucideIcon> = {
  economy: TrendingUp, labour: Wallet, population: Users, prices: ShoppingBasket, trade: Globe2, industry: Factory, finance: Coins,
};
const topicIcon = (slug: string): LucideIcon => TOPIC_ICONS[slug] ?? Database;

function KeyIndicator({ it, icon }: { it: DashboardItem; icon: LucideIcon }) {
  const good = it.higher_is_better === null || it.change === null ? null : (it.change >= 0) === it.higher_is_better;
  const color = good === null ? "rgb(var(--ds-primary))" : good ? "rgb(var(--ds-success))" : "rgb(var(--ds-danger))";
  const pill = good === null ? "bg-[rgb(var(--ds-primary-soft))] text-mg-primary" : good ? "bg-[rgb(var(--ds-success-bg))] text-[rgb(var(--ds-success))]" : "bg-[rgb(var(--ds-danger-bg))] text-[rgb(var(--ds-danger))]";
  const Arrow = it.change !== null && it.change < 0 ? ArrowDownRight : ArrowUpRight;
  return (
    <Link to={`/indicators/${it.key}`} className="group relative flex flex-col overflow-hidden rounded-mg border border-mg-border bg-mg-surface p-4 pt-5 transition hover:border-mg-primary/50 hover:shadow-md">
      <span className="absolute inset-x-0 top-0 h-1" style={{ background: color }} aria-hidden="true" />
      <span className="flex items-start justify-between gap-2">
        <IconChip icon={icon} size="sm" />
        {it.change !== null && (
          <span className={`tnum inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-bold ${pill}`}>
            <Arrow className="h-3.5 w-3.5" aria-hidden="true" />{it.change > 0 ? "+" : ""}{fmtNum(it.change)} {it.change_kind === "pp" ? "p.p." : "%"}
          </span>
        )}
      </span>
      <span className="mt-3 line-clamp-2 min-h-[40px] text-sm font-medium leading-snug text-mg-text" title={it.name}>{it.name}</span>
      <span className="tnum mt-1 text-[30px] font-extrabold leading-none tracking-tight text-mg-heading">{fmtNum(it.value)}</span>
      <span className="mt-1 text-xs text-mg-muted">{it.unit}</span>
      <span className="mt-2"><Sparkline series={it.series} color={color} /></span>
      <span className="mt-1 text-xs font-semibold text-mg-muted">{it.period}{it.preliminary ? " · dastlabki" : ""}</span>
    </Link>
  );
}

const TYPE_NAMES = { electron: "Elektron", print: "Bosma", disk: "Disk" } as const;
const som = (v: string) => `${String(Math.round(Number(v))).replace(/\B(?=(\d{3})+(?!\d))/g, " ")} so'm`;

const bookRow = (b: PublicBook): DocRow => ({
  id: String(b.id),
  title: b.name_uz,
  to: `/books?q=${encodeURIComponent(b.name_uz)}`,
  meta: b.options.filter((o) => o.price).map((o) => `${TYPE_NAMES[o.book_type] ?? o.book_type}: ${som(o.price!)}`).join(" · "),
  date: b.year ? String(b.year) : "",
});

const releaseRow = (r: ReleaseItem): DocRow => ({
  id: `${r.key}-${r.date}`,
  title: r.title,
  to: r.map_url || "/release-calendar",
  meta: [r.theme_label, r.period].filter(Boolean).join(" · "),
  date: fmtDate(r.date),
});

/**
 * UI_QAYTA_TUZISH.md 4.4: bosh sahifa v3 (lex.uz andozasi): qidiruv paneli → mavzular → yangi e'lonlar → portaldagi
 * ma'lumotlar → ommabop xizmatlar → foydali resurslar. Grafik kutubxonasi bu sahifada import qilinmaydi.
 */
export default function HomePageV2() {
  const { t } = useLang();
  const { isAuthenticated } = useAuth();
  const dash = useApi(() => fetchDashboards(), []);
  const rel = useApi(() => fetchReleaseCalendar(), []);
  const { items: usage } = useServiceStats();
  const books = useApi(() => fetchLatestBooks(5), []);
  const [tab, setTab] = useState<"recent" | "upcoming">("recent");

  useEffect(() => {
    document.title = `my.stat.uz — ${t(UI.portalLine2)}`;
  }, [t]);

  const panels = dash.data?.panels;
  /** Eng ko'p ishlatiladigan xizmatlar: haqiqiy foydalanish soni bo'yicha, statistika kelmaguncha `popularOrder` tartibida */
  const ranked = useMemo(() => {
    const live = SERVICES.filter((x) => x.status === "live");
    const used = (n: number) => usage[String(n)]?.usage ?? 0;
    return [...live].sort((a, b) => used(b.number) - used(a.number) || (a.popularOrder ?? 99) - (b.popularOrder ?? 99));
  }, [usage]);
  /** "Asosiy ko'rsatkichlar" (4 ta) va ular takrorlanmasligi uchun mavzu kartalari shularni chetlab o'tadi */
  const keyItems = useMemo(
    () => (panels ?? []).flatMap((p) => p.items.slice(0, 2).map((it) => ({ it, icon: topicIcon(p.slug) }))).slice(0, 4),
    [panels],
  );
  const shown = useMemo(() => new Set(keyItems.map((x) => x.it.key)), [keyItems]);
  /** Mavzuning 2 ko'rsatkichi: yuqorida allaqachon ko'rsatilganlardan boshqalari, yetmasa — birinchilari */
  const topicItems = (p: DashboardPanel) => {
    const fresh = p.items.filter((it) => !shown.has(it.key));
    return (fresh.length >= 2 ? fresh : [...fresh, ...p.items.filter((it) => shown.has(it.key))]).slice(0, 2);
  };
  const counts: CountItem[] = useMemo(() => [
    { label: "Statistika mavzulari", icon: FolderOpen, value: panels ? panels.length : null, to: "/topics" },
    { label: "Ko'rsatkichlar", icon: LineChart, value: panels ? panels.reduce((n, p) => n + p.items.length, 0) : null, to: "/indicators" },
    { label: "E'lon qilingan ma'lumotlar", icon: BadgeCheck, value: rel.data ? rel.data.recent.length : null, to: "/release-calendar" },
    { label: "Kutilayotgan e'lonlar", icon: CalendarClock, value: rel.data ? rel.data.upcoming.length : null, to: "/release-calendar" },
    { label: "Davlat xizmatlari", icon: LayoutGrid, value: SERVICES.length, to: "/spheres" },
    { label: "Xizmat sohalari", icon: Building2, value: SPHERES.length, to: "/spheres" },
  ].concat(books.error ? [] : [{ label: "Nashrlar", icon: BookOpen, value: books.data ? books.data.count : null, to: "/books" }]), [panels, rel.data, books.data, books.error]);

  const rows = rel.data ? (tab === "recent" ? rel.data.recent : rel.data.upcoming).slice(0, 5).map(releaseRow) : [];
  const tabCls = (on: boolean) => `px-4 py-2 text-sm font-semibold border-b-2 ${on ? "border-mg-primary text-mg-primary" : "border-transparent text-mg-muted hover:text-mg-heading"}`;
  const section = "mt-[var(--ds-section-gap,32px)]";

  return (
    <div>
      <section aria-labelledby="home-search" className="relative">
        {/* Brend rangidagi hero chizig'i: sahifa kengligiga yoyiladi, bloklar uning ustiga chiqadi */}
        <div className="pointer-events-none absolute left-1/2 top-[-16px] h-[150px] w-screen -translate-x-1/2 bg-[rgb(var(--ds-brand))]" aria-hidden="true" />
        <div className="relative">
          <h1 id="home-search" className="text-[28px] font-bold leading-tight text-[rgb(var(--ds-on-brand))]">Rasmiy statistik ma'lumotlarni izlash</h1>
          <p className="mb-5 mt-1 max-w-2xl text-sm text-[rgb(var(--ds-on-brand-muted))]">Milliy statistika qo'mitasining ko'rsatkichlari, e'lonlari va xizmatlari bir joyda</p>
        </div>
        {/* Bitta qator: qidiruv | ko'p ishlatiladigan xizmatlar | aholi, ob-havo va e'lon */}
        <div className="relative grid gap-5 lg:grid-cols-[300px_1fr_300px] xl:grid-cols-[360px_1fr_340px]">
          <SearchPanel compact />
          <section aria-labelledby="home-top" className="rounded-mg border border-mg-border bg-mg-surface p-5">
            <h2 id="home-top" className="mb-3 text-sm font-semibold uppercase tracking-wide text-mg-muted">Ko'p ishlatiladigan xizmatlar</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-2 xl:grid-cols-3">
              {ranked.slice(0, 6).map((x) => (
                <li key={x.number}>
                  <Link to={`/service/${x.number}`} className="group flex h-full flex-col items-center rounded-mg border border-mg-border bg-mg-bg px-2 pb-3 pt-2 text-center transition hover:border-mg-primary/50 hover:bg-mg-surface hover:shadow-sm">
                    {hasTileArt(x.number)
                      ? <span className="flex h-[76px] w-[76px] items-center justify-center"><TileArt number={x.number} className="h-[76px] w-[76px] transition-transform duration-300 group-hover:scale-105" /></span>
                      : <span className="flex h-[76px] items-center"><IconChip icon={x.icon} /></span>}
                    <span className="mt-1 text-[14px] font-semibold leading-snug text-mg-primary">{t(x.title)}</span>
                    {usage[String(x.number)]?.usage ? (
                      <span className="tnum mt-1.5 rounded-full bg-[rgb(var(--ds-primary-soft))] px-2.5 py-0.5 text-xs font-bold text-mg-primary" title="Foydalanish soni">{compactNumber(usage[String(x.number)].usage)}</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
          <HomeAside clock={dash.data?.population_clock ?? null} />
        </div>
        {rel.data?.upcoming[0] && <div className="relative mt-5"><NextRelease item={rel.data.upcoming[0]} today={rel.data.today} /></div>}
      </section>

      {panels && panels.length > 0 && (
        <section aria-labelledby="home-key" className={section}>
          <Header id="home-key" title="Asosiy ko'rsatkichlar" moreHref="/indicators" moreLabel="Barcha ko'rsatkichlar" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {keyItems.map(({ it, icon }) => <KeyIndicator key={it.key} it={it} icon={icon} />)}
          </div>
        </section>
      )}

      {isAuthenticated && (
        <p className="mt-6 rounded-mg border-l-4 border-[rgb(var(--ds-accent))] bg-[rgb(var(--ds-warning-bg))] px-4 py-3 text-sm text-[rgb(var(--ds-text))]">
          Hisobot muddatlari va xabarlar: <Link to="/report-calendar" className="font-semibold text-mg-primary hover:underline">Hisobot kalendari</Link>
          {" · "}<Link to="/cabinet" className="font-semibold text-mg-primary hover:underline">Kabinetga o'tish →</Link>
        </p>
      )}

      <section aria-labelledby="home-topics" className={section}>
        <Header id="home-topics" title="Statistika mavzulari" moreHref="/topics" moreLabel="Barcha mavzular" />
        {panels ? (
          <ul className="grid gap-4 md:grid-cols-3">
            {panels.map((p) => {
              const Icon = topicIcon(p.slug);
              return (
                <li key={p.slug} className="flex flex-col overflow-hidden rounded-mg border border-mg-border bg-mg-surface">
                  <Link to={`/topics/${p.slug}`} className="flex items-center gap-3 border-b border-mg-border p-4 hover:bg-[rgb(var(--ds-primary-soft))]">
                    <IconChip icon={Icon} />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-lg font-semibold text-mg-heading">{p.title}</span>
                      <span className="text-xs text-mg-muted">{p.items.length} ko'rsatkich</span>
                    </span>
                    <ArrowRight className="h-5 w-5 shrink-0 text-mg-muted" aria-hidden="true" />
                  </Link>
                  {/* Mavzuning eng muhim 2 ko'rsatkichi: qiymati bilan, har biri o'z sahifasiga olib boradi */}
                  <ul className="flex-1 divide-y divide-mg-border">
                    {topicItems(p).map((it) => {
                      const good = it.higher_is_better === null || it.change === null ? null : (it.change >= 0) === it.higher_is_better;
                      const tone = good === null ? "text-mg-muted" : good ? "text-[rgb(var(--ds-success))]" : "text-[rgb(var(--ds-danger))]";
                      return (
                        <li key={it.key}>
                          <Link to={`/indicators/${it.key}`} className="flex items-center justify-between gap-3 px-4 py-2.5 text-sm hover:bg-[rgb(var(--ds-primary-soft))]">
                            <span className="line-clamp-2 min-w-0 flex-1 text-mg-text" title={it.name}>{it.name}</span>
                            <span className="shrink-0 text-right">
                              <span className="tnum block font-bold text-mg-heading">{fmtNum(it.value)}</span>
                              {it.change !== null && <span className={`tnum block text-xs font-semibold ${tone}`}>{it.change > 0 ? "+" : ""}{fmtNum(it.change)} {it.change_kind === "pp" ? "p.p." : "%"}</span>}
                            </span>
                          </Link>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        ) : <div className="h-24 animate-pulse rounded bg-gray-100 dark:bg-gray-800" role="status" aria-label="Yuklanmoqda" />}
      </section>

      {/* E'lonlar va nashrlar yonma-yon (lg+); nashrlar katalogi yuklanmasa (mehmon) e'lonlar to'liq kenglikda */}
      <div className={`${section} grid items-start gap-x-8 gap-y-[var(--ds-section-gap,32px)] ${books.error ? "" : "lg:grid-cols-2"}`}>
        <section aria-labelledby="home-releases" className="min-w-0">
          <Header id="home-releases" title="Yangi e'lon qilingan ma'lumotlar" moreHref="/release-calendar" moreLabel="Hammasini ko'rsatish" />
          <div role="tablist" aria-label="E'lonlar" className="mb-2 flex border-b border-mg-border">
            <button type="button" role="tab" aria-selected={tab === "recent"} className={tabCls(tab === "recent")} onClick={() => setTab("recent")}>E'lon qilingan</button>
            <button type="button" role="tab" aria-selected={tab === "upcoming"} className={tabCls(tab === "upcoming")} onClick={() => setTab("upcoming")}>Kutilayotgan</button>
          </div>
          {rel.loading ? <div className="h-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" role="status" aria-label="Yuklanmoqda" />
            : <DocList compact rows={rows} caption={tab === "recent" ? "E'lon qilingan ma'lumotlar" : "Kutilayotgan e'lonlar"} />}
        </section>

        {/* Katalog API'si kirish talab qiladi: yuklanmasa (mehmon) blok ko'rsatilmaydi, "Nashrlar" havolasi menyuda qoladi */}
        {!books.error && (
          <section aria-labelledby="home-books" className="min-w-0">
            <Header id="home-books" title="Yangi nashrlar" moreHref="/books" moreLabel="Barcha nashrlar" />
            {books.loading ? <div className="h-40 animate-pulse rounded bg-gray-100 dark:bg-gray-800" role="status" aria-label="Yuklanmoqda" />
              : <DocList compact rows={(books.data?.results ?? []).map(bookRow)} caption="Yangi nashrlar" emptyText="Nashrlar hozircha yo'q" />}
          </section>
        )}
      </div>

      <section aria-labelledby="home-actions" className={section}>
        <Header id="home-actions" title="Nima qilmoqchisiz?" />
        <div className="grid gap-5 md:grid-cols-3">
          <ActionCard icon={CalendarDays} title="Hisobot muddati" text="Shaklingiz bo'yicha topshirish muddatini va qolgan kunlarni biling." actionLabel="Kalendarni ochish" href="/report-calendar" />
          <ActionCard icon={LineChart} title="Ko'rsatkich topish" text="Iqtisodiyot, aholi, mehnat va narxlar bo'yicha rasmiy raqamlar." actionLabel="Ko'rsatkichlarga o'tish" href="/indicators" />
          <ActionCard icon={BadgeCheck} title="Kontragent tekshirish" text="STIR bo'yicha korxona ma'lumoti va ishonchlilik bahosi." actionLabel="STIR bo'yicha izlash" href="/check" />
        </div>
      </section>

      <section aria-labelledby="home-spheres" className={section}>
        <Header id="home-spheres" title="Xizmat sohalari" moreHref="/spheres" moreLabel="Barcha sohalar" />
        <LinkGrid id="home-spheres-grid" initial={12}
          items={SPHERES.map((sp) => ({ to: `/spheres/${sp.id}`, icon: sp.icon, label: t(sp.title), count: SERVICES.filter((x) => x.sphere === sp.id).length }))} />
      </section>

      <section aria-labelledby="home-situations" className={section}>
        <Header id="home-situations" title={t(UI.situations)} moreHref="/situations" moreLabel="Barcha tushuntirishlar" />
        <ul className="grid gap-x-8 md:grid-cols-2 lg:grid-cols-3">
          {SITUATIONS.map((x) => (
            <li key={x.slug} className="border-b border-mg-border">
              <Link to={`/situations/${x.slug}`} className="block py-2.5 hover:text-mg-primary">
                <span className="flex items-start gap-3"><IconChip icon={x.icon} /><span><span className="block text-[15px] font-medium text-mg-primary">{t(x.title)}</span>
                <span className="line-clamp-2 block text-sm text-mg-muted">{t(x.description)}</span></span></span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      {/* Portal raqamlari va ommabop xizmatlar yonma-yon (lg+) */}
      <div className={`${section} grid items-start gap-x-8 gap-y-[var(--ds-section-gap,32px)] lg:grid-cols-2`}>
        <section aria-labelledby="home-counts" className="min-w-0">
          <Header id="home-counts" title="Portaldagi ma'lumotlar" />
          <div className="rounded-mg border border-mg-border bg-mg-surface px-5 py-2"><CountGrid narrow items={counts} /></div>
        </section>

        <section aria-labelledby="home-popular" className="min-w-0">
          <Header id="home-popular" title="Yana ommabop xizmatlar" moreHref="/spheres" moreLabel={t(UI.allServices)} />
          <ol>
            {ranked.slice(6, 14).map((s) => (
              <li key={s.number} className="border-b border-mg-border">
                <Link to={s.status === "live" ? `/service/${s.number}` : "/spheres"} className="flex min-h-[44px] items-center gap-3 py-2 text-[15px] text-mg-primary hover:underline">
                  <IconChip icon={s.icon} size="sm" />
                  <span>{t(s.title)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      </div>

      <section aria-labelledby="home-links" className={section}>
        <Header id="home-links" title="Foydali resurslar" />
        <ul className="flex flex-wrap gap-3">
          {USEFUL_RESOURCES.map((l) => <li key={l.href} className="rounded-full border border-mg-border bg-mg-surface px-4 py-2 text-sm font-medium"><ExternalLink href={l.href}>{l.label}</ExternalLink></li>)}
        </ul>
      </section>
    </div>
  );
}
