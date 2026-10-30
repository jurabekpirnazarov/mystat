import { useEffect, useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchDashboards } from "../../api/statPublic";
import { POPULAR_QUERIES, SEARCH_TYPES, indicatorsUrl, searchUrl } from "../../config/searchFilters";

/**
 * LX-04: ikki tabli qidiruv paneli. "Tezkor" — xizmatlar, korxonalar, savollar va boshqalar bo'yicha (`/search`);
 * "Kengaytirilgan" — ko'rsatkichlar bo'yicha nom va mavzu (`/indicators`). Hamma filtr URL'da.
 */
export default function SearchPanel({ initialQuery = "", initialType = "", compact = false }: { initialQuery?: string; initialType?: string; compact?: boolean }) {
  const navigate = useNavigate();
  const [tab, setTab] = useState<"quick" | "advanced">("quick");
  const [q, setQ] = useState(initialQuery);
  const [type, setType] = useState(initialType);
  const [topic, setTopic] = useState("");
  const [topics, setTopics] = useState<{ slug: string; title: string }[]>([]);

  useEffect(() => {
    fetchDashboards().then((d) => setTopics(d.panels.map((p) => ({ slug: p.slug, title: p.title })))).catch(() => undefined);
  }, []);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const num = /^#?(\d{3,4})$/.exec(q.trim());
    if (tab === "quick" && num) return navigate(`/service/${num[1]}`);
    navigate(tab === "quick" ? searchUrl(q, type) : indicatorsUrl(q, topic));
  };
  const clear = () => { setQ(""); setType(""); setTopic(""); };

  const tabCls = (on: boolean) => `whitespace-nowrap px-3 py-2 text-sm font-semibold border-b-2 ${on ? "border-mg-primary text-mg-primary" : "border-transparent text-mg-muted hover:text-mg-heading"}`;
  const chip = (on: boolean) => `rounded-full border px-3 py-1 text-sm ${on ? "border-mg-primary bg-mg-primary text-white" : "border-mg-border text-mg-text hover:bg-mg-info"}`;
  return (
    <form role="search" onSubmit={submit} className="rounded-mg border border-mg-border bg-mg-surface p-4 sm:p-5">
      <div role="tablist" aria-label="Qidiruv turi" className="mb-4 flex border-b border-mg-border">
        <button type="button" role="tab" aria-selected={tab === "quick"} className={tabCls(tab === "quick")} onClick={() => setTab("quick")}>{compact ? "Tezkor" : "Tezkor qidiruv"}</button>
        <button type="button" role="tab" aria-selected={tab === "advanced"} className={tabCls(tab === "advanced")} onClick={() => setTab("advanced")}>{compact ? "Kengaytirilgan" : "Kengaytirilgan qidiruv"}</button>
      </div>

      {tab === "advanced" && (
        <label htmlFor="sp-q" className="mb-1 block text-sm font-semibold text-mg-heading">Ko'rsatkich nomi</label>
      )}
      <div className={`flex flex-col gap-2 ${compact ? "" : "sm:flex-row"}`}>
        {tab === "quick" && <label htmlFor="sp-q" className="sr-only">Qidiruv matni</label>}
        <input id="sp-q" type="search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder={tab === "quick" ? (compact ? "Masalan: tashqi savdo" : "Masalan: tashqi savdo, STIR yoki #302") : (compact ? "Masalan: ish haqi" : "Masalan: yalpi ichki mahsulot")}
          className="min-h-[44px] w-full rounded-lg border border-mg-border bg-mg-bg px-3 text-[15px] text-mg-text outline-none focus-visible:border-mg-primary" />
        <button type="submit" className="inline-flex min-h-[44px] shrink-0 items-center justify-center gap-2 rounded-lg bg-mg-primary px-5 text-sm font-semibold text-white hover:opacity-90">
          <Search className="h-4 w-4" aria-hidden="true" />Izlash
        </button>
      </div>

      {tab === "quick" ? (
        <>
          <fieldset className="mt-4">
            <legend className="mb-2 text-sm font-semibold text-mg-heading">Ma'lumot turi</legend>
            <div className="flex flex-wrap gap-2">
              {SEARCH_TYPES.map((t) => (
                <button key={t.key} type="button" aria-pressed={type === t.key} className={chip(type === t.key)} onClick={() => setType(t.key)}>{t.label}</button>
              ))}
            </div>
          </fieldset>
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-sm">
            <span className="text-mg-muted">Ommabop:</span>
            {POPULAR_QUERIES.map((p) => <Link key={p} to={searchUrl(p)} className="text-mg-primary hover:underline">{p}</Link>)}
          </div>
        </>
      ) : (
        <div className="mt-4">
          <label htmlFor="sp-topic" className="mb-1 block text-sm font-semibold text-mg-heading">Mavzu</label>
          <select id="sp-topic" value={topic} onChange={(e) => setTopic(e.target.value)}
            className={`min-h-[44px] w-full rounded-lg border border-mg-border bg-mg-bg px-3 text-[15px] text-mg-text ${compact ? "" : "sm:w-80"}`}>
            <option value="">Hammasi</option>
            {topics.map((t) => <option key={t.slug} value={t.slug}>{t.title}</option>)}
          </select>
          <p className="mt-3 text-xs text-mg-muted">Ko'rsatkichlar ro'yxatida nom va mavzu bo'yicha qidiriladi.</p>
        </div>
      )}

      {(q || type || topic) && (
        <button type="button" onClick={clear} className="mt-3 block whitespace-nowrap text-sm text-mg-muted hover:text-mg-heading hover:underline">Filtrlarni tozalash</button>
      )}
    </form>
  );
}
