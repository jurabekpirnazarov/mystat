import { useEffect, useMemo, useState } from "react";
import { Link, useLocation, useParams } from "react-router-dom";
import { Line, LineChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Link2 } from "lucide-react";
import { fetchDashboards, fetchIndicatorCard } from "../../api/statPublic";
import useApi from "../../hooks/useApi";
import { DocList, ErrorState, Skeleton, type DocRow } from "../../components/ui";

const TABS = [
  { id: "data", label: "Ma'lumot" },
  { id: "requisites", label: "Asosiy rekvizitlar" },
  { id: "method", label: "Metodologiya" },
  { id: "related", label: "Bog'liq ko'rsatkichlar" },
] as const;
type TabId = (typeof TABS)[number]["id"];

const fmtNum = (n: number) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 2 }).format(n).replace(/,/g, " ");
const fmtDate = (iso: string | null) => {
  if (!iso) return "—";
  const d = new Date(iso);
  return Number.isNaN(d.getTime()) ? "—" : `${String(d.getDate()).padStart(2, "0")}.${String(d.getMonth() + 1).padStart(2, "0")}.${d.getFullYear()}`;
};

/** LX-11: havolani nusxalash (anchor bilan). Ikonkali tugma — `aria-label` majburiy (GV-15). */
function CopyLink({ anchor, label }: { anchor: string; label: string }) {
  const [done, setDone] = useState(false);
  const copy = async () => {
    const url = `${window.location.origin}${window.location.pathname}#${anchor}`;
    try { await navigator.clipboard.writeText(url); setDone(true); window.setTimeout(() => setDone(false), 1800); } catch { /* clipboard yopiq */ }
  };
  return (
    <button type="button" onClick={copy} aria-label={label} title={label}
      className="inline-flex items-center gap-1 rounded px-1.5 py-1 text-xs text-mg-muted hover:bg-mg-info hover:text-mg-primary">
      <Link2 className="h-4 w-4" aria-hidden="true" />{done ? "Nusxalandi" : null}
    </button>
  );
}

/**
 * UI_QAYTA_TUZISH.md 4.5: ko'rsatkich sahifasi — rekvizitlar bloki (LX-08), tablar (LX-10), element havolasi (LX-11).
 * Nashrlar tarixi (LX-09, `?asof=`) backend'da yo'q: yangi maydon qo'shilmaydi, shuning uchun `VintageNav` ko'rsatilmaydi (OS-LX-02).
 */
export default function IndicatorPage() {
  const { key = "" } = useParams();
  const { hash } = useLocation();
  const card = useApi(() => fetchIndicatorCard(key), [key]);
  const dash = useApi(() => fetchDashboards(), []);
  const initial = (TABS.find((t) => `#tab=${t.id}` === hash)?.id ?? "data") as TabId;
  const [tab, setTab] = useState<TabId>(initial);

  const it = card.data;
  const panel = dash.data?.panels.find((p) => p.items.some((x) => x.key === key));
  useEffect(() => { document.title = `${it?.name ?? "Ko'rsatkich"} — my.stat.uz`; }, [it]);

  const related: DocRow[] = useMemo(() => (panel?.items ?? []).filter((x) => x.key !== key)
    .map((x) => ({ id: x.key, title: x.name, to: `/indicators/${x.key}`, meta: [x.unit, x.period].filter(Boolean).join(" · "), date: fmtDate(x.source_updated_at) })), [panel, key]);

  const choose = (id: TabId) => { setTab(id); window.history.replaceState(null, "", `#tab=${id}`); };

  if (card.error) return <ErrorState title="Ko'rsatkich topilmadi" description="Havola noto'g'ri yoki ko'rsatkich olib tashlangan." onRetry={card.reload} />;
  if (card.loading || !it) return <Skeleton variant="chart" />;

  const status = it.preliminary ? "Dastlabki" : "Amaldagi";
  const facts: [string, string][] = [
    ["Kod", it.key], ["Manba", it.source?.name ?? "—"], ["Birlik", it.unit || "—"], ["Davr", it.period || "—"],
    ["So'nggi yangilanish", fmtDate(it.source_updated_at)], ["Holat", status],
  ];

  return (
    <div>
      <p className="mb-2 text-sm text-mg-muted"><Link to="/topics" className="hover:underline">Statistika mavzulari</Link>{panel && <> › <Link to={`/topics/${panel.slug}`} className="hover:underline">{panel.title}</Link></>}</p>
      <section aria-labelledby="ind-title" className="rounded-mg border border-mg-border bg-mg-surface p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h1 id="ind-title" className="max-w-3xl text-[26px] font-semibold leading-tight text-mg-heading">{it.name}</h1>
          <span className={`rounded px-2 py-1 text-xs font-semibold ${it.preliminary ? "bg-[rgb(var(--ds-warning-bg))] text-[rgb(var(--ds-warning))]" : "bg-[rgb(var(--ds-success-bg))] text-[rgb(var(--ds-success))]"}`}>{status}</span>
        </div>
        <p className="mt-3 text-3xl font-bold tnum text-mg-heading">{fmtNum(it.value)} <span className="text-base font-normal text-mg-muted">{it.unit}</span></p>
        <dl className="mt-4 grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {facts.map(([k, v]) => (
            <div key={k} className="flex gap-2"><dt className="text-mg-muted">{k}:</dt><dd className="font-medium text-mg-text">{v}</dd></div>
          ))}
        </dl>
      </section>

      <div role="tablist" aria-label="Ko'rsatkich bo'limlari" className="mt-6 flex flex-wrap border-b border-mg-border">
        {TABS.map((t) => (
          <button key={t.id} type="button" role="tab" id={`tab-${t.id}`} aria-selected={tab === t.id} aria-controls={`panel-${t.id}`} onClick={() => choose(t.id)}
            className={`px-4 py-2.5 text-sm font-semibold border-b-2 ${tab === t.id ? "border-mg-primary text-mg-primary" : "border-transparent text-mg-muted hover:text-mg-heading"}`}>
            {t.label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${tab}`} aria-labelledby={`tab-${tab}`} className="mt-5">
        {tab === "data" && (
          <div>
            <div id="grafik" className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-mg-heading">Dinamika</h2>
              <CopyLink anchor="grafik" label="Grafikka havolani nusxalash" />
            </div>
            <div className="mt-3 h-64 w-full" role="img" aria-label={`${it.name}: ${it.series.length} davr dinamikasi`}>
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={it.series}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgb(var(--ds-border))" />
                  <XAxis dataKey="period" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => fmtNum(v)} width={72} />
                  <Tooltip formatter={(v: number) => fmtNum(v)} />
                  <Line type="monotone" dataKey="value" stroke="rgb(var(--ds-primary))" strokeWidth={2} dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div id="jadval" className="mt-6 flex items-center justify-between">
              <h2 className="text-lg font-semibold text-mg-heading">Jadval</h2>
              <CopyLink anchor="jadval" label="Jadvalga havolani nusxalash" />
            </div>
            <table className="mt-2 w-full border-collapse text-[15px]">
              <caption className="sr-only">{it.name}: qiymatlar jadvali</caption>
              <thead><tr className="border-b border-mg-border text-left text-xs uppercase tracking-wide text-mg-muted"><th scope="col" className="py-2 font-semibold">Davr</th><th scope="col" className="py-2 text-right font-semibold">Qiymat, {it.unit}</th><th scope="col" className="w-10" /></tr></thead>
              <tbody>
                {[...it.series].reverse().map((r) => (
                  <tr key={r.period} id={`qator-${r.period}`} className="border-b border-mg-border">
                    <td className="py-2 tnum">{r.period}</td>
                    <td className="py-2 text-right tnum">{fmtNum(r.value)}</td>
                    <td className="py-1 text-right"><CopyLink anchor={`qator-${r.period}`} label={`${r.period} qatoriga havolani nusxalash`} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <p className="mt-3 text-sm text-mg-muted">Manba: {it.source?.name} ({it.source?.license}) · Davr: {it.period}</p>
          </div>
        )}
        {tab === "requisites" && (
          <dl className="grid max-w-3xl gap-y-2 text-[15px] sm:grid-cols-[200px_1fr]">
            {facts.concat([["O'zgarish", it.change === null ? "—" : `${fmtNum(it.change)} ${it.change_kind === "pp" ? "p.p." : "%"}`], ["Mavzu", panel?.title ?? "—"]]).flatMap(([k, v]) => [
              <dt key={`${k}-t`} className="text-mg-muted">{k}</dt>, <dd key={`${k}-d`} className="font-medium text-mg-text">{v}</dd>,
            ])}
          </dl>
        )}
        {tab === "method" && (
          <div className="max-w-3xl space-y-3 text-[15px] leading-relaxed text-mg-text">
            <div className="ds-note">
              <p className="font-semibold text-mg-heading">Metodologik izoh</p>
              <p className="mt-1">Qiymatlar rasmiy statistik manbadan olinadi; dastlabki ma'lumotlar keyinchalik qayta ko'rib chiqilishi mumkin.{it.derived_from && ` Ko'rsatkich ${it.derived_from} asosida hisoblangan.`}</p>
            </div>
            {it.siat_url && <p><a href={it.siat_url} target="_blank" rel="noopener noreferrer" className="text-mg-primary hover:underline">Birlamchi manba: SIAT<span className="sr-only"> (yangi oynada ochiladi)</span> ↗</a></p>}
          </div>
        )}
        {tab === "related" && <DocList rows={related} caption="Bog'liq ko'rsatkichlar" emptyText="Bog'liq ko'rsatkichlar yo'q" />}
      </div>
    </div>
  );
}
