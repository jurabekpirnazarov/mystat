import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarPlus, Check, Download, ExternalLink, Map as MapIcon } from "lucide-react";
import { fetchReleaseCalendar, releasesIcsUrl, type ReleaseCalendar as Data, type ReleaseItem } from "../../api/statPublic";
import { ApiErrorState, EmptyState, PageHeader, Skeleton } from "../../components/ui";

/**
 * JAHON_TAJRIBASI JT-10: e'lonlar kalendari — qo'mita qaysi ko'rsatkichni qachon e'lon qiladi.
 * Hisobot kalendaridan (/report-calendar: korxona qachon hisobot topshiradi) farq qiladi.
 * Rasmiy sana admin'da kiritiladi; bo'lmasa SIAT'dagi oxirgi yangilanish va davriylikdan taxminiy sana.
 */
const MONTHS = ["Yanvar", "Fevral", "Mart", "Aprel", "May", "Iyun", "Iyul", "Avgust", "Sentyabr", "Oktyabr", "Noyabr", "Dekabr"];
const MONTHS_SHORT = ["yan", "fev", "mar", "apr", "may", "iyn", "iyl", "avg", "sen", "okt", "noy", "dek"];

function dayLabel(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  return { day: d, month: MONTHS_SHORT[m - 1], year: y };
}

function KindBadge({ item }: { item: ReleaseItem }) {
  if (item.status === "postponed") return <span className="rounded bg-red-50 dark:bg-red-900/30 px-1.5 py-0.5 text-xs text-red-700 dark:text-red-300">Ko'chirildi</span>;
  if (item.status === "overdue") return <span className="rounded bg-amber-50 dark:bg-amber-900/30 px-1.5 py-0.5 text-xs text-amber-800 dark:text-amber-300" title="Taxminiy sana o'tdi, SIAT'da hali yangilanmagan">Kutilmoqda</span>;
  if (item.kind === "official") return <span className="rounded bg-emerald-50 dark:bg-emerald-900/30 px-1.5 py-0.5 text-xs text-emerald-700 dark:text-emerald-300">Rasmiy sana</span>;
  if (item.kind === "estimated") return <span className="rounded bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 text-xs text-gray-600 dark:text-gray-300" title="Oxirgi yangilanish sanasi va davriylikdan hisoblangan">Taxminiy</span>;
  return <span className="rounded bg-blue-50 dark:bg-blue-900/30 px-1.5 py-0.5 text-xs text-blue-700 dark:text-blue-300">E'lon qilindi</span>;
}

function Row({ item }: { item: ReleaseItem }) {
  const d = dayLabel(item.date);
  const link = item.url || item.siat_url;
  return (
    <li className="flex gap-4 py-3">
      <div className="w-14 shrink-0 text-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5">
        <div className="text-lg font-bold text-gray-900 dark:text-white leading-none">{d.day}</div>
        <div className="text-xs text-gray-500">{d.month}{item.time ? `, ${item.time}` : ""}</div>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-gray-900 dark:text-white leading-snug">
          {item.title}{item.period && <span className="text-gray-500 font-normal"> · {item.period}</span>}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
          <KindBadge item={item} />
          {item.theme_label && <span>{item.theme_label}</span>}
          {item.map_url && <Link to={item.map_url} className="inline-flex items-center gap-1 hover:text-blue-700"><MapIcon className="w-3.5 h-3.5" aria-hidden="true" />Xaritada</Link>}
          {link && <a href={link} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 hover:text-blue-700"><ExternalLink className="w-3.5 h-3.5" aria-hidden="true" />Manba</a>}
          {item.note && <span>{item.note}</span>}
        </div>
      </div>
    </li>
  );
}

export default function ReleaseCalendar() {
  const [data, setData] = useState<Data | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [attempt, setAttempt] = useState(0);
  const [theme, setTheme] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = "E'lonlar kalendari — my.stat.uz";
    const ctrl = new AbortController();
    setError(null);
    fetchReleaseCalendar(ctrl.signal).then(setData).catch((e) => !ctrl.signal.aborted && setError(e));
    return () => ctrl.abort();
  }, [attempt]);

  const filter = (items: ReleaseItem[]) => (theme ? items.filter((i) => i.theme === theme) : items);
  const months = useMemo(() => {
    const groups = new Map<string, ReleaseItem[]>();
    for (const item of filter(data?.upcoming ?? [])) {
      const key = item.date.slice(0, 7);
      groups.set(key, [...(groups.get(key) ?? []), item]);
    }
    return [...groups.entries()];
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [data, theme]);
  const recent = filter(data?.recent ?? []);
  const icsUrl = releasesIcsUrl();

  const copyIcs = async () => {
    try {
      await navigator.clipboard.writeText(icsUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch { /* ruxsat yo'q */ }
  };

  const btn = "inline-flex items-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-3 py-2 text-sm hover:border-blue-300";

  return (
    <div className="py-2">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="E'lonlar kalendari"
          description="Qaysi statistik ko'rsatkich qachon e'lon qilinadi. Korxonalar hisobot topshirish muddatlari — hisobot kalendarida."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Statistika", to: "/statistics" }, { label: "E'lonlar kalendari" }]}
          actions={
            <>
              <a href={icsUrl} className={btn} download><Download className="w-4 h-4" aria-hidden="true" /> .ics</a>
              <button type="button" onClick={copyIcs} className={btn} title="Google, Outlook yoki Apple kalendariga obuna bo'lish uchun manzil">
                {copied ? <Check className="w-4 h-4 text-emerald-600" aria-hidden="true" /> : <CalendarPlus className="w-4 h-4" aria-hidden="true" />}
                {copied ? "Manzil nusxalandi" : "Kalendarga obuna"}
              </button>
            </>
          }
        />

        <div className="mb-4 rounded-lg border border-blue-100 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 px-4 py-3 text-sm text-blue-900 dark:text-blue-200">
          <b>Taxminiy</b> sanalar SIAT'dagi oxirgi yangilanish va ko'rsatkich davriyligidan hisoblanadi. Qo'mita rasmiy sanani e'lon qilsa,
          u <b>Rasmiy sana</b> belgisi bilan chiqadi. Obuna manzilini kalendar ilovangizga qo'shsangiz, o'zgarishlar avtomatik keladi.
          <Link to="/report-calendar" className="ml-1 underline">Hisobot kalendari</Link>
        </div>

        {error ? (
          <ApiErrorState error={error} onRetry={() => setAttempt((a) => a + 1)} />
        ) : !data ? (
          <Skeleton variant="table" rows={8} />
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Mavzu bo'yicha saralash">
              {[{ key: "", label: "Hammasi" }, ...data.themes].map((t) => (
                <button key={t.key} type="button" onClick={() => setTheme(t.key)} aria-pressed={theme === t.key}
                  className={`rounded-full px-3 py-1 text-sm border ${theme === t.key
                    ? "bg-blue-600 border-blue-600 text-white"
                    : "bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-200 hover:border-blue-300"}`}>
                  {t.label}
                </button>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <section className="lg:col-span-2" aria-labelledby="upcoming">
                <h2 id="upcoming" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Kutilayotgan e'lonlar</h2>
                {months.length === 0 ? (
                  <EmptyState title="Yaqin 12 oyda e'lon yo'q" description="Mavzu filtrini o'zgartirib ko'ring." />
                ) : months.map(([key, items]) => {
                  const [y, m] = key.split("-").map(Number);
                  return (
                    <div key={key} className="mb-4">
                      <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700 pb-1">
                        {MONTHS[m - 1]} {y}
                      </h3>
                      <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {items.map((item) => <Row key={`${item.key}-${item.date}`} item={item} />)}
                      </ul>
                    </div>
                  );
                })}
              </section>
              <aside aria-labelledby="recent">
                <h2 id="recent" className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Yaqinda yangilandi</h2>
                {recent.length === 0 ? (
                  <p className="text-sm text-gray-500">Oxirgi 4 oyda yangilanish yo'q.</p>
                ) : (
                  <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {recent.map((item) => <Row key={`r-${item.key}-${item.date}`} item={item} />)}
                  </ul>
                )}
              </aside>
            </div>
            <p className="mt-6 text-xs text-gray-500 dark:text-gray-400">
              Manba: <a href={data.source.url} target="_blank" rel="noopener noreferrer" className="underline">{data.source.name}</a>.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
