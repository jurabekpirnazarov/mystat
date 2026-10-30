import { useEffect, useMemo } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { fetchDashboards, type DashboardItem, type DashboardPanel } from "../../api/statPublic";
import useApi from "../../hooks/useApi";
import { DocList, ErrorState, LinkGrid, SectionHeader, Skeleton, type DocRow } from "../../components/ui";

const fmtDate = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "" : `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

const toRow = (panel: DashboardPanel, it: DashboardItem): DocRow => ({
  id: `${panel.slug}-${it.key}`,
  title: it.name,
  to: `/indicators/${it.key}`,
  meta: [panel.title, it.unit, it.period].filter(Boolean).join(" · "),
  date: fmtDate(it.source_updated_at),
});

function useTitle(title: string) {
  useEffect(() => { document.title = `${title} — my.stat.uz`; }, [title]);
}

/** UI_QAYTA_TUZISH.md 5-bo'lim: `/indicators` — chapda filtr (URL'da q, topic), o'ngda `DocList`; tartiblash: nom · yangilangan. */
export function Indicators() {
  useTitle("Barcha ko'rsatkichlar");
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const topic = params.get("topic") ?? "";
  const sort = params.get("sort") === "name" ? "name" : "updated";
  const { data, loading, error, reload } = useApi(() => fetchDashboards(), []);

  const rows = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const out = (data?.panels ?? [])
      .filter((p) => !topic || p.slug === topic)
      .flatMap((p) => p.items.filter((it) => !needle || it.name.toLowerCase().includes(needle)).map((it) => ({ it, row: toRow(p, it) })));
    out.sort((a, b) => (sort === "name" ? a.it.name.localeCompare(b.it.name, "uz")
      : (b.it.source_updated_at ?? "").localeCompare(a.it.source_updated_at ?? "")));
    return out.map((x) => x.row);
  }, [data, q, topic, sort]);

  const set = (key: string, value: string) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next, { replace: true });
  };
  const field = "min-h-[44px] w-full rounded-lg border border-mg-border bg-mg-surface px-3 text-[15px] text-mg-text";

  return (
    <div>
      <h1 className="text-[28px] font-semibold text-mg-heading">Barcha ko'rsatkichlar</h1>
      {error ? <ErrorState onRetry={reload} /> : (
        <div className="mt-6 grid gap-8 lg:grid-cols-[260px_1fr]">
          <form role="search" className="space-y-4 self-start" onSubmit={(e) => e.preventDefault()}>
            <div>
              <label htmlFor="ind-q" className="mb-1 block text-sm font-semibold text-mg-heading">Ko'rsatkich nomi</label>
              <input id="ind-q" type="search" value={q} onChange={(e) => set("q", e.target.value)} className={field} />
            </div>
            <div>
              <label htmlFor="ind-topic" className="mb-1 block text-sm font-semibold text-mg-heading">Mavzu</label>
              <select id="ind-topic" value={topic} onChange={(e) => set("topic", e.target.value)} className={field}>
                <option value="">Hammasi</option>
                {(data?.panels ?? []).map((p) => <option key={p.slug} value={p.slug}>{p.title}</option>)}
              </select>
            </div>
            <div>
              <label htmlFor="ind-sort" className="mb-1 block text-sm font-semibold text-mg-heading">Tartiblash</label>
              <select id="ind-sort" value={sort} onChange={(e) => set("sort", e.target.value === "updated" ? "" : e.target.value)} className={field}>
                <option value="updated">Yangilangan sana</option>
                <option value="name">Nomi</option>
              </select>
            </div>
            <button type="button" onClick={() => setParams({}, { replace: true })} className="text-sm text-mg-muted hover:text-mg-heading hover:underline">Filtrlarni tozalash</button>
          </form>
          <div>
            {loading ? <Skeleton variant="table" rows={8} /> : (
              <>
                <p className="mb-2 text-sm text-mg-muted" aria-live="polite">Topildi: <b className="tnum text-mg-heading">{rows.length}</b></p>
                <DocList rows={rows} caption="Ko'rsatkichlar ro'yxati" emptyText="Filtr bo'yicha ko'rsatkich topilmadi" />
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/** `/topics` (LinkGrid, ko'rsatkichlar soni bilan) va `/topics/:slug` (mavzu ko'rsatkichlari `DocList` da). */
export function Topics() {
  const { slug } = useParams();
  const { data, loading, error, reload } = useApi(() => fetchDashboards(), []);
  const panel = data?.panels.find((p) => p.slug === slug);
  useTitle(panel?.title ?? "Statistika mavzulari");

  if (error) return <ErrorState onRetry={reload} />;
  if (loading) return <Skeleton variant="table" rows={6} />;

  if (slug) {
    if (!panel) return <p className="py-8 text-mg-muted">Mavzu topilmadi. <Link to="/topics" className="text-mg-primary hover:underline">Barcha mavzular →</Link></p>;
    return (
      <div>
        <h1 className="text-[28px] font-semibold text-mg-heading">{panel.title}</h1>
        {panel.description && <p className="mt-2 max-w-3xl text-mg-muted">{panel.description}</p>}
        <section className="mt-8" aria-labelledby="topic-items">
          <SectionHeader id="topic-items" title="Ko'rsatkichlar" moreHref={`/dashboards/${panel.slug}`} moreLabel="Panelni grafiklar bilan ochish" />
          <DocList rows={panel.items.map((it) => toRow(panel, it))} caption={`${panel.title}: ko'rsatkichlar`} />
        </section>
      </div>
    );
  }
  return (
    <div>
      <h1 className="text-[28px] font-semibold text-mg-heading">Statistika mavzulari</h1>
      <div className="mt-6">
        <LinkGrid id="topics-all" initial={24}
          items={(data?.panels ?? []).map((p) => ({ to: `/topics/${p.slug}`, label: p.title, count: p.items.length }))} />
      </div>
    </div>
  );
}
