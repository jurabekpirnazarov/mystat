import { useCallback, useEffect, useRef, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { CartesianGrid, Legend, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, Building2, Download, Info, Link2, MapPin } from "lucide-react";
import { fetchCompanyProfile, type BasisSection, type CompanyProfile as Profile, type DeepSection, type LockedSection as Locked } from "../../api/companyProfile";
import type { Klass } from "../../api/companyScores";
import CompanyScoreBadge from "../../components/company-score/CompanyScoreBadge";
import LockedSection from "../../components/company-score/LockedSection";
import ScoreWaterfall from "../../components/company-score/ScoreWaterfall";
import { KLASS_STYLE } from "../../components/company-score/klassStyle";
import { DemoBadge, ErrorState, Skeleton } from "../../components/ui";
import { useChartTheme } from "../../utils/chartTheme";
import { ProfileCardExtras } from "../../components/company-card/CardBlocks";
import { exportElementToPdf } from "../../utils/exportPdf";

type Tab = "general" | "basis" | "deep" | "watch";
const TABS: { id: Tab; label: string }[] = [
  { id: "general", label: "Umumiy ma'lumot" },
  { id: "basis", label: "Ball nimaga asoslangan" },
  { id: "deep", label: "Chuqur tahlil" },
  { id: "watch", label: "Kuzatish" },
];
const PILLAR_COLORS: Record<string, string> = { M: "#2563eb", O: "#16a34a", T: "#9333ea", X: "#ea580c", I: "#db2777", S: "#0891b2" };

const isLocked = (s: unknown): s is Locked => !!s && (s as Locked).locked === true;

function setMeta(property: string, content: string) {
  let el = document.querySelector<HTMLMetaElement>(`meta[property="${property}"]`);
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute("property", property);
    document.head.appendChild(el);
  }
  el.content = content;
}

function KlassDot({ klass, size = "h-6 w-6 text-xs" }: { klass: Klass; size?: string }) {
  const st = KLASS_STYLE[klass || "none"];
  return <span className={`inline-flex shrink-0 items-center justify-center rounded-full font-bold ${size} ${st.bg} ${st.text}`}>{klass || "—"}</span>;
}

function Card({ title, children, className = "", aside }: { title?: string; children: React.ReactNode; className?: string; aside?: React.ReactNode }) {
  return (
    <section className={`rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800 ${className}`}>
      {(title || aside) && (
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          {title && <h2 className="text-sm font-semibold text-gray-900 dark:text-white">{title}</h2>}
          {aside}
        </div>
      )}
      {children}
    </section>
  );
}

/**
 * KORXONA_SCORING.md KR-45: `/company/:stir` — har qanday KTUT korxonasining profili. Bo'limlar yorliqlarda (mobilda
 * ketma-ket). Bepul qism: rekvizitlar va umumiy ball; "Ball nimaga asoslangan" va "Chuqur tahlil" StatCoin bilan ochiladi —
 * ochilmagan bo'lim ma'lumoti backend'dan umuman kelmaydi. Begona korxonaning xom qiymatlari hech qayerda yo'q.
 */
export default function CompanyProfile() {
  const { stir = "" } = useParams();
  const [search, setSearch] = useSearchParams();
  const preset = search.get("csp") || "muvozanatli";
  const tab = (search.get("tab") as Tab) || "general";
  const [data, setData] = useState<Profile | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "notfound" | "error">("loading");
  const [copied, setCopied] = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const deepRef = useRef<HTMLDivElement>(null);

  const load = useCallback((quiet = false) => {
    if (!quiet) setState("loading");
    return fetchCompanyProfile(stir, preset)
      .then((d) => { setData(d); setState("ok"); })
      .catch((e) => setState((e as { response?: { status?: number } })?.response?.status === 404 ? "notfound" : "error"));
  }, [stir, preset]);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    if (!data) return;
    const s = data.general.score;
    const title = `${data.general.name ?? `STIR ${stir}`} — korxona profili`;
    document.title = `${title} | my.stat.uz`;
    setMeta("og:title", title);
    setMeta("og:description", s?.overall != null ? `Korxona bali: ${s.klass} · ${s.klass_name}, ${Math.round(s.overall)}/100 (taxminiy baho).` : "Korxona profili va bali.");
    setMeta("og:url", window.location.href);
  }, [data, stir]);

  const setParam = (k: string, v: string, def: string) => {
    const next = new URLSearchParams(search);
    if (v === def) next.delete(k); else next.set(k, v);
    setSearch(next, { replace: true });
  };

  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch { /* clipboard ruxsat yo'q */ }
  };

  const pdf = async () => {
    if (!deepRef.current || !data) return;
    setPdfBusy(true);
    try {
      await exportElementToPdf(deepRef.current, `korxona_${stir}.pdf`, data.is_synthetic);
    } finally {
      setPdfBusy(false);
    }
  };

  if (state === "loading" && !data) {
    return <main id="main-content" className="mx-auto max-w-6xl px-4 py-8"><Skeleton variant="card" /><Skeleton variant="chart" className="mt-4" /></main>;
  }
  if (state === "notfound") {
    return (
      <main id="main-content" className="mx-auto max-w-3xl px-4 py-16 text-center">
        <h1 className="text-xl font-semibold text-gray-900 dark:text-white">Korxona topilmadi</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-300">STIR {stir} bo'yicha korxona yoki uning bali yo'q.</p>
        <Link to="/partners" className="mt-4 inline-block text-blue-600 hover:underline">Hamkor qidiruviga qaytish</Link>
      </main>
    );
  }
  if (state === "error" || !data) {
    return <main id="main-content" className="mx-auto max-w-3xl px-4 py-16"><ErrorState title="Profilni yuklab bo'lmadi" onRetry={() => load()} /></main>;
  }

  const g = data.general;
  const s = g.score;
  const onUnlocked = () => load(true);
  const panel = (id: Tab) => `${tab === id ? "" : "sm:hidden"} space-y-4`;

  return (
    <main id="main-content" className="mx-auto max-w-6xl px-4 py-6 sm:py-8">
      <nav aria-label="Yo'l" className="mb-3 text-xs text-gray-500"><Link to="/partners" className="hover:underline">Hamkor qidiruvi</Link> / Korxona profili</nav>

      <header className="mb-4 flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <h1 className="flex flex-wrap items-center gap-2 text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">
            <Building2 className="h-6 w-6 shrink-0 text-gray-400" aria-hidden="true" />
            <span className="break-words">{g.name ?? `STIR ${stir}`}</span>
            {data.is_synthetic && <DemoBadge />}
          </h1>
          <p className="mt-1 text-sm text-gray-600 dark:text-gray-300">
            STIR {g.stir}{g.legal_form && ` · ${g.legal_form}`}{g.region && <> · <MapPin className="inline h-3 w-3" aria-hidden="true" /> {g.region}</>}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {s && <CompanyScoreBadge size="md" interactive={false} score={{ stir, year: s.year, preset: data.preset, overall: s.overall, klass: s.klass, klass_name: s.klass_name, coverage: s.coverage, partial: s.partial, data_source: s.data_source, is_synthetic: s.is_synthetic }} />}
          <button type="button" onClick={share} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
            <Link2 className="h-4 w-4" aria-hidden="true" /> {copied ? "Nusxalandi" : "Havolani ulashish"}
          </button>
        </div>
      </header>

      <div role="tablist" aria-label="Profil bo'limlari" className="mb-4 hidden gap-1 overflow-x-auto border-b border-gray-200 dark:border-gray-700 sm:flex">
        {TABS.map((t) => {
          const sec = t.id === "general" ? null : data[t.id];
          const locked = isLocked(sec);
          return (
            <button key={t.id} role="tab" type="button" aria-selected={tab === t.id} onClick={() => setParam("tab", t.id, "general")}
              className={`-mb-px whitespace-nowrap border-b-2 px-3 py-2 text-sm ${tab === t.id ? "border-blue-600 font-semibold text-blue-700 dark:text-blue-300" : "border-transparent text-gray-600 hover:text-gray-900 dark:text-gray-300"}`}>
              {t.label}{locked && <span aria-label="qulflangan"> 🔒</span>}
            </button>
          );
        })}
      </div>

      {/* 1. Umumiy ma'lumot — bepul */}
      <div className={panel("general")} role="tabpanel" aria-label="Umumiy ma'lumot">
        <div className="grid gap-4 md:grid-cols-3">
          <Card title="Rekvizitlar" className="md:col-span-2" aside={g.requisites_synthetic ? <span className="text-xs text-amber-700 dark:text-amber-300">{g.region_is_real ? "OKED va mulkchilik — namuna" : "OKED, hudud va mulkchilik — namuna"}</span> : undefined}>
            <dl className="grid grid-cols-1 gap-x-6 gap-y-2 text-sm sm:grid-cols-2">
              {([
                ["Nomi", g.name], ["STIR", g.stir], ["OKPO", g.okpo], ["Tashkiliy-huquqiy shakl", g.legal_form],
                ["OKED", g.oked_section ? `${g.oked_section}${g.oked_division ? ` · ${g.oked_division}` : ""}${g.oked_name ? ` — ${g.oked_name}` : ""}` : null],
                ["Hudud", ([g.region, g.district].filter(Boolean).join(", ") || null) && `${[g.region, g.district].filter(Boolean).join(", ")}${g.region_is_real ? " (sanoat reyestri)" : ""}`], ["Mulkchilik", g.ownership],
                ["Tashkil topgan yil", g.founded_year], ["Xodimlar (oraliq)", g.employees_range],
                ["Mahsulot turlari", g.products_count ? `${g.products_count} ta (sanoat reyestri)` : "—"],
              ] as [string, string | number | null][]).map(([k, v]) => (
                <div key={k} className="min-w-0"><dt className="text-xs text-gray-500">{k}</dt><dd className="break-words text-gray-900 dark:text-gray-100">{v ?? "—"}</dd></div>
              ))}
            </dl>
          </Card>
          <Card title={`Korxona bali${s ? `, ${s.year}` : ""}`}>
            {s ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <KlassDot klass={s.klass} size="h-12 w-12 text-2xl" />
                  <div>
                    <p className="text-3xl font-bold tabular-nums leading-none text-gray-900 dark:text-white">{s.overall == null ? "—" : Math.round(s.overall)}<span className="text-base font-normal text-gray-400">/100</span></p>
                    <p className="text-sm text-gray-600 dark:text-gray-300">{s.klass_name}{s.partial && <span className="ml-1 text-amber-600">· qisman ma'lumot</span>}</p>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-200">{s.meaning}</p>
                <p className="text-xs text-gray-500">To'liqlik: {Math.round(s.coverage * 100)}%</p>
                {g.real_fields.length > 0 && <p className="text-xs text-emerald-700 dark:text-emerald-400">Real manbadan: {g.real_fields.length} ta ko'rsatkich</p>}
              </div>
            ) : <p className="text-sm text-gray-500">Bu korxona uchun ball hali hisoblanmagan.</p>}
          </Card>
        </div>
        {/* IHAMKOR_MUQOBIL IH-02..IH-04: xulosa belgilari, statistik hisobotlar, ishlab chiqarish, rasmiy ma'lumotnoma */}
        <ProfileCardExtras stir={stir} />
        <p className="text-xs text-gray-500 sm:hidden">Quyida pullik bo'limlar.</p>
      </div>

      {/* 2. Ball nimaga asoslangan */}
      <div className={panel("basis")} role="tabpanel" aria-label="Ball nimaga asoslangan">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:hidden">Ball nimaga asoslangan</h2>
        {isLocked(data.basis)
          ? <LockedSection stir={stir} section={data.basis} balance={data.access.balance} onUnlocked={onUnlocked} />
          : <BasisView basis={data.basis} klass={s?.klass ?? ""} preset={preset} presets={data.presets} onPreset={(p) => setParam("csp", p, "muvozanatli")} deep={!isLocked(data.deep)} deepData={isLocked(data.deep) ? null : data.deep} until={data.access.unlocks.basis ?? data.access.unlocks.deep} privileged={data.access.privileged} />}
      </div>

      {/* 3. Chuqur tahlil */}
      <div className={panel("deep")} role="tabpanel" aria-label="Chuqur tahlil">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:hidden">Chuqur tahlil</h2>
        {isLocked(data.deep)
          ? <LockedSection stir={stir} section={data.deep} balance={data.access.balance} onUnlocked={onUnlocked} />
          : (
            <>
              <div className="flex justify-end">
                <button type="button" onClick={pdf} disabled={pdfBusy} className="inline-flex items-center gap-1 rounded-lg border border-gray-300 px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50 disabled:opacity-60 dark:border-gray-600 dark:text-gray-200 dark:hover:bg-gray-700">
                  <Download className="h-4 w-4" aria-hidden="true" /> {pdfBusy ? "Tayyorlanmoqda…" : "PDF"}
                </button>
              </div>
              <div ref={deepRef}><DeepView deep={data.deep} name={g.name ?? stir} until={data.access.unlocks.deep} privileged={data.access.privileged} /></div>
            </>
          )}
      </div>

      {/* 4. Kuzatish */}
      <div className={panel("watch")} role="tabpanel" aria-label="Kuzatish">
        <h2 className="text-base font-semibold text-gray-900 dark:text-white sm:hidden">Kuzatish</h2>
        <Card>
          <p className="text-sm text-gray-700 dark:text-gray-200">{data.watch.summary}</p>
          <p className="mt-2 text-sm text-gray-500">{data.watch.note}</p>
          <Link to="/tariffs#scoring" className="mt-3 inline-block text-sm text-blue-600 hover:underline">Tariflar bilan tanishish</Link>
        </Card>
      </div>

      <footer className="mt-6 flex flex-wrap items-center justify-between gap-2 border-t border-gray-200 pt-3 text-xs text-gray-500 dark:border-gray-700">
        <span className="inline-flex items-center gap-1"><Info className="h-3 w-3" aria-hidden="true" />{data.disclaimer}{data.sample_note && ` ${data.sample_note}`}</span>
        <Link to="/methodology/company-score" className="text-blue-600 hover:underline">Qanday hisoblanadi</Link>
      </footer>
    </main>
  );
}

function OpenUntil({ until, privileged }: { until?: string; privileged: boolean }) {
  if (privileged) return <span className="text-xs text-gray-500">To'liq ochiq</span>;
  if (!until) return null;
  const days = Math.max(0, Math.ceil((new Date(until).getTime() - Date.now()) / 86400000));
  return <span className="text-xs text-gray-500">Ochiq: yana {days} kun</span>;
}

function BasisView({ basis, klass, preset, presets, onPreset, deep, deepData, until, privileged }: {
  basis: BasisSection; klass: Klass; preset: string; presets: { key: string; name: string }[]; onPreset: (p: string) => void;
  deep: boolean; deepData: DeepSection | null; until?: string; privileged: boolean;
}) {
  const chart = useChartTheme();
  const radar = basis.pillars.filter((p) => p.applicable && p.score !== null).map((p) => ({ name: p.name, v: p.score ?? 0, avg: 50 }));
  const hex = KLASS_STYLE[klass || "none"].hex;
  return (
    <div className="grid gap-4 lg:grid-cols-5">
      <Card title="6 ustun" className="lg:col-span-2" aside={
        <label className="text-xs text-gray-500">Vaznlar{" "}
          <select value={preset} onChange={(e) => onPreset(e.target.value)} className="ml-1 rounded-lg border border-gray-300 bg-white px-2 py-1 text-sm text-gray-800 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-100">
            {presets.map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </label>}>
        {radar.length >= 3 ? (
          <figure aria-label="Ustunlar bo'yicha baho" className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart data={radar} outerRadius="68%">
                <PolarGrid stroke={chart.grid} />
                <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: chart.axis }} />
                <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                <Radar name="Guruh o'rtachasi (50)" dataKey="avg" stroke={chart.axis} strokeDasharray="4 3" fill="none" isAnimationActive={false} />
                <Radar name="Korxona" dataKey="v" stroke={hex} fill={hex} fillOpacity={0.3} isAnimationActive={false} />
                <Tooltip {...chart.tooltip} formatter={(v) => [Math.round(Number(v)), "Baho"]} />
              </RadarChart>
            </ResponsiveContainer>
          </figure>
        ) : <p className="text-sm text-gray-500">Radar uchun baholangan ustunlar kam.</p>}
        <p className="text-xs text-gray-600 dark:text-gray-300">
          Tengdoshlar: <b>{basis.peer_label}</b>
          {basis.rank && basis.ranked ? <>, <b>{basis.ranked} dan {basis.rank}-o'rin</b></> : null}
        </p>
        <OpenUntil until={until} privileged={privileged} />
      </Card>
      <Card title="Ball tarkibi" className="lg:col-span-3">
        {basis.contribution ? <ScoreWaterfall contribution={basis.contribution} klass={klass} indicators={deepData?.indicators ?? basis.indicators} showScores={deep} /> : <p className="text-sm text-gray-500">Ball yo'q.</p>}
        {basis.flags.length > 0 && (
          <ul className="mt-4 space-y-1" aria-label="Bayroqlar">
            {basis.flags.map((f) => (
              <li key={f.code} className="flex flex-wrap items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-800 dark:bg-red-900/30 dark:text-red-200">
                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> <b>{f.name}</b> — {f.effect}
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}

function PositionBar({ score }: { score: number | null | undefined }) {
  return (
    <span className="relative block h-3 w-full rounded bg-gray-100 dark:bg-gray-700">
      <span className="absolute inset-y-0 rounded bg-blue-100 dark:bg-blue-900/50" style={{ left: "25%", width: "50%" }} />
      <span className="absolute inset-y-0 w-0.5 bg-blue-700/60" style={{ left: "50%" }} />
      {typeof score === "number" && <span className="absolute top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-gray-800" style={{ left: `${Math.max(1, Math.min(99, score))}%` }} />}
    </span>
  );
}

function DeepView({ deep, name, until, privileged }: { deep: DeepSection; name: string; until?: string; privileged: boolean }) {
  const chart = useChartTheme();
  const pillarKeys = Object.keys(deep.dynamics[0]?.pillars ?? {});
  const dyn = deep.dynamics.map((d) => ({ year: d.year, overall: d.overall, ...d.pillars }));
  const sens = deep.sensitivity;
  const byPillar = new Map<string, typeof deep.indicators>();
  deep.indicators.forEach((i) => byPillar.set(i.pillar, [...(byPillar.get(i.pillar) ?? []), i]));
  return (
    <div className="space-y-4 bg-white dark:bg-gray-900">
      <p className="hidden text-sm font-semibold print:block">{name} — chuqur tahlil</p>
      <div className="flex justify-end"><OpenUntil until={until} privileged={privileged} /></div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Kuchli tomonlar">
          <ul className="space-y-1 text-sm">{deep.strengths.map((i) => <li key={i.code} className="flex justify-between gap-2"><span className="truncate">{i.name}</span><span className="tabular-nums text-emerald-700 dark:text-emerald-400">{Math.round(i.score ?? 0)}</span></li>)}</ul>
        </Card>
        <Card title="Zaif tomonlar">
          <ul className="space-y-1 text-sm">{deep.weaknesses.map((i) => <li key={i.code} className="flex justify-between gap-2"><span className="truncate">{i.name}</span><span className="tabular-nums text-orange-700 dark:text-orange-400">{Math.round(i.score ?? 0)}</span></li>)}</ul>
        </Card>
      </div>

      <Card title="Ko'rsatkichlar: guruhdagi o'rni">
        <p className="mb-2 text-xs text-gray-500">Nuqta — korxona o'rni (0–100, percentil). Ko'k oraliq — guruhning o'rta yarmi (p25–p75), chiziq — mediana. Xom qiymatlar ko'rsatilmaydi.</p>
        <div className="grid gap-x-8 gap-y-3 md:grid-cols-2">
          {[...byPillar.entries()].map(([p, inds]) => (
            <div key={p}>
              <p className="mb-1 text-xs font-semibold" style={{ color: PILLAR_COLORS[p] }}>{p}</p>
              <ul className="space-y-1.5">
                {inds.map((i) => (
                  <li key={i.code} className="grid grid-cols-[1fr_6rem_2rem] items-center gap-2 text-xs sm:grid-cols-[1fr_8rem_2rem]">
                    <span className="truncate" title={i.name}>{i.name}{i.kind === "absolute" && <span className="ml-1 text-gray-400">(norma)</span>}</span>
                    <PositionBar score={i.score} />
                    <span className="text-right tabular-nums">{typeof i.score === "number" ? Math.round(i.score) : "—"}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Card>

      {dyn.length > 1 && (
        <Card title="Ball va ustunlar dinamikasi">
          <figure className="h-64" aria-label="Yillar bo'yicha ball va ustunlar">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={dyn} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
                <CartesianGrid stroke={chart.grid} vertical={false} />
                <XAxis dataKey="year" tick={{ fontSize: 11, fill: chart.axis }} tickLine={false} />
                <YAxis domain={[0, 100]} width={28} tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} axisLine={false} />
                <Tooltip {...chart.tooltip} formatter={(v, n) => [v == null ? "—" : Math.round(Number(v)), String(n)]} />
                <Legend wrapperStyle={{ fontSize: 11 }} />
                <Line dataKey="overall" name="Umumiy ball" stroke="#111827" strokeWidth={3} dot={{ r: 3 }} isAnimationActive={false} />
                {pillarKeys.map((k) => <Line key={k} dataKey={k} name={k} stroke={PILLAR_COLORS[k]} strokeWidth={1.5} strokeDasharray="4 2" dot={false} connectNulls isAnimationActive={false} />)}
              </LineChart>
            </ResponsiveContainer>
          </figure>
        </Card>
      )}

      {sens && (
        <Card title="Nima bo'lsa: sezgirlik">
          {sens.next ? (
            sens.next.blocked_by_tax
              ? <p className="mb-3 text-sm text-red-700 dark:text-red-300">Soliq qarzi bor: ball cheklangan, {sens.next.klass} sinfga o'tish uchun avval qarzni yopish kerak.</p>
              : <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">{sens.next.klass} sinfgacha <b>{sens.next.gap.toFixed(1)} ball</b> yetishmaydi. Eng tez yetkazadigan ustunlar: {sens.next.fastest.map((f) => `${f.key} (+${f.points_needed ?? "?"} ball${f.reachable ? "" : ", yetarli emas"})`).join(", ")}.</p>
          ) : <p className="mb-3 text-sm text-gray-700 dark:text-gray-200">Korxona eng yuqori sinfda.</p>}
          <ul className="grid gap-1 text-xs sm:grid-cols-2">
            {sens.pillars.map((r) => (
              <li key={r.key} className="flex items-center justify-between gap-2 rounded bg-gray-50 px-2 py-1 dark:bg-gray-700/40">
                <span><b style={{ color: PILLAR_COLORS[r.key] }}>{r.key}</b> ustuni +{r.step.toFixed(0)} ball oshsa</span>
                <span className="tabular-nums">umumiy {r.delta >= 0 ? "+" : ""}{r.delta.toFixed(1)}{r.new_klass !== sens.klass && <> · sinf {sens.klass} → <b>{r.new_klass}</b></>}</span>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-gray-600 dark:text-gray-300">Presetlar bo'yicha sinf: {deep.presets.map((p) => `${p.name}: ${p.klass || "—"}`).join(" · ")}</p>
        </Card>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="O'xshash korxonalar">
          {deep.similar.length ? (
            <ul className="space-y-1.5 text-sm">
              {deep.similar.map((c) => (
                <li key={c.stir} className="flex items-center gap-2">
                  <KlassDot klass={c.klass} />
                  <Link to={`/company/${c.stir}`} className="min-w-0 flex-1 truncate text-blue-700 hover:underline dark:text-blue-300">{c.name ?? `STIR ${c.stir}`}</Link>
                  <span className="tabular-nums text-gray-600 dark:text-gray-300">{c.overall == null ? "—" : Math.round(c.overall)}</span>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-gray-500">Guruhda o'xshash korxona topilmadi.</p>}
          <p className="mt-2 text-xs text-gray-500">Shu tengdoshlar guruhida 6 ustun bo'yicha eng yaqinlar (faqat ball va sinf).</p>
        </Card>
        <Card title="Hududiy kontekst">
          {deep.region_context ? (
            <div className="space-y-1 text-sm">
              <p>{deep.region_context.region}: hudud salohiyati indeksi <b>{deep.region_context.score?.toFixed(1) ?? "—"}</b>{deep.region_context.rank && <>, {deep.region_context.of} hududdan {deep.region_context.rank}-o'rin</>} ({deep.region_context.year})</p>
              {deep.region_context.sectors.length > 0 && <p className="text-xs text-gray-600 dark:text-gray-300">Hudud ixtisosi: {deep.region_context.sectors.map((x) => `${x.label} (LQ ${x.lq?.toFixed(1)})`).join(", ")}</p>}
              <Link to={deep.region_context.link} className="text-xs text-blue-600 hover:underline">Hudud profili</Link>
            </div>
          ) : <p className="text-sm text-gray-500">Hudud indeksi mavjud emas.</p>}
          <div className="mt-3 border-t border-gray-100 pt-3 dark:border-gray-700">
            <p className="text-xs font-semibold text-gray-700 dark:text-gray-200">Shu OKED bo'limi va hududda sinflar {deep.distribution.is_synthetic && <DemoBadge />}</p>
            {deep.distribution.enough ? (
              <>
                <div className="mt-2 flex h-4 overflow-hidden rounded" role="img" aria-label={deep.distribution.classes.map((c) => `${c.key} ${c.share}%`).join(", ")}>
                  {deep.distribution.classes.map((c) => c.share > 0 && <span key={c.key} style={{ width: `${c.share}%`, background: KLASS_STYLE[c.key || "none"].hex }} title={`${c.key}: ${c.share}%`} />)}
                </div>
                <p className="mt-1 text-xs text-gray-500">{deep.distribution.scored} ta korxona, o'rtacha ball {deep.distribution.mean ?? "—"}. {deep.distribution.classes.map((c) => `${c.key} ${c.share}%`).join(" · ")}</p>
              </>
            ) : <p className="mt-1 text-xs text-gray-500">Ma'lumot yetarli emas ({deep.distribution.scored} ta korxona).</p>}
          </div>
        </Card>
      </div>
    </div>
  );
}
