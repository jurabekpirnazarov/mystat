import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CartesianGrid, Line, LineChart, PolarAngleAxis, PolarGrid, PolarRadiusAxis, Radar, RadarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { AlertTriangle, ArrowRight, Info } from "lucide-react";
import { fetchCompanyScore, fetchMyCompanyScore, PRESETS, type CompanyScoreDetail, type CompanyScoreIndicator, type CompanyScoreLocked } from "../../api/companyScores";
import { useChartTheme } from "../../utils/chartTheme";
import { formatValue } from "../../utils/mapScale";
import { DemoBadge } from "../ui";
import { KLASS_STYLE } from "./klassStyle";

interface Props {
  /** Begona korxona STIR'i (mode="public"); "own" da kerak emas — /me/ */
  stir?: string;
  mode?: "public" | "own";
  /** Boshlang'ich preset (URL `csp=`) */
  preset?: string;
  onPresetChange?: (preset: string) => void;
  className?: string;
}

const isAbort = (e: unknown) => (e as { name?: string })?.name === "CanceledError" || (e as { name?: string })?.name === "AbortError";

function formatOwn(i: CompanyScoreIndicator, v: number | null | undefined) {
  if (v === null || v === undefined) return "—";
  switch (i.fmt) {
    case "pct": return `${formatValue(v * 100)}%`;
    case "mln": return `${formatValue(v)} mln so'm`;
    case "int": return String(Math.round(v));
    case "ratio": return formatValue(v);
    default: return formatValue(v);
  }
}

/**
 * KORXONA_SCORING.md 6-bo'lim: ball, sinf, radar (6 ustun), tengdoshlar guruhi, bayroqlar, to'liqlik, preset tanlagich,
 * "Qanday hisoblanadi" havolasi. `mode="own"` — tavsiyalar, o'z qiymatlari (guruh medianasi bilan) va yillar dinamikasi.
 * Begona korxona uchun xom qiymatlar API'dan kelmaydi. Sintetik ball — "Namuna" belgisi bilan.
 */
export default function CompanyScoreCard({ stir, mode = "public", preset: initial, onPresetChange, className = "" }: Props) {
  const chart = useChartTheme();
  const [preset, setPreset] = useState(initial || "muvozanatli");
  const [data, setData] = useState<CompanyScoreDetail | CompanyScoreLocked | null>(null);
  const [state, setState] = useState<"loading" | "ok" | "none" | "error">("loading");

  useEffect(() => {
    let alive = true;
    setState("loading");
    const req = mode === "own" ? fetchMyCompanyScore({ preset }) : fetchCompanyScore(stir ?? "", { preset });
    req.then((d) => { if (alive) { setData(d); setState("ok"); } })
      .catch((e) => {
        if (!alive || isAbort(e)) return;
        setState((e as { response?: { status?: number } })?.response?.status === 404 ? "none" : "error");
      });
    return () => { alive = false; };
  }, [stir, mode, preset]);

  const changePreset = (p: string) => {
    setPreset(p);
    onPresetChange?.(p);
  };

  const box = `rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 ${className}`;
  if (state === "loading") return <div className={`${box} h-48 animate-pulse`} aria-busy="true" />;
  if (state === "none" || !data) {
    return (
      <section aria-label="Korxona bali" className={box}>
        <h3 className="text-sm font-semibold">Korxona bali</h3>
        <p className="mt-1 text-sm text-gray-500">{state === "error" ? "Ballni yuklab bo'lmadi." : "Bu korxona uchun ball hisoblanmagan yoki ochiq emas."}</p>
      </section>
    );
  }

  const klass = data.klass || "none";
  const none = klass === "none";
  const profileUrl = `/company/${data.stir}`;
  if (data.locked) return <LockedCard data={data} box={box} />;
  // Baholanmagan ustun radarda 0 bo'lib chizilmasin (chalg'itadi) — faqat bahosi borlari
  const radar = data.pillars_detail.filter((p) => p.applicable && p.score !== null).map((p) => ({ name: p.name, v: p.score ?? 0, avg: 50 }));
  const byPillar = data.pillars_detail.map((p) => ({ ...p, indicators: data.indicators.filter((i) => i.pillar === p.key) }));

  return (
    <section aria-label="Korxona bali" className={`${box} space-y-4`}>
      <header className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="flex items-center gap-2 text-sm font-semibold">
            Korxona bali, {data.year}
            {data.is_synthetic && <DemoBadge />}
          </h3>
          <div className="mt-1 flex items-center gap-3">
            <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${KLASS_STYLE[klass].bg} ${KLASS_STYLE[klass].text}`}>
              {none ? "—" : data.klass}
            </span>
            <div>
              <p className="text-3xl font-bold tabular-nums leading-none">{none ? "—" : Math.round(data.overall ?? 0)}<span className="text-base font-normal text-gray-400">/100</span></p>
              <p className="text-sm text-gray-600 dark:text-gray-300">{data.klass_info.name}{data.partial && <span className="ml-1 text-amber-600">· qisman ma'lumot</span>}</p>
            </div>
          </div>
        </div>
        <label className="text-xs text-gray-500">
          Vaznlar
          <select value={preset} onChange={(e) => changePreset(e.target.value)} className="mt-1 block rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1 text-sm text-gray-800 dark:text-gray-100">
            {(data.presets.length ? data.presets : PRESETS).map((p) => <option key={p.key} value={p.key}>{p.name}</option>)}
          </select>
        </label>
      </header>

      <p className="text-xs text-gray-600 dark:text-gray-300">
        Tengdoshlar guruhi: <b>{data.peer_label}</b> · to'liqlik {Math.round(data.coverage * 100)}%
      </p>

      {data.flags_detail.length > 0 && (
        <ul className="flex flex-wrap gap-2" aria-label="Bayroqlar">
          {data.flags_detail.map((f) => (
            <li key={f.code} className="inline-flex items-center gap-1 rounded-full bg-red-50 dark:bg-red-900/30 px-2 py-0.5 text-xs text-red-700 dark:text-red-300">
              <AlertTriangle className="h-3 w-3" aria-hidden="true" /> {f.name}
            </li>
          ))}
        </ul>
      )}

      {!none && radar.length >= 3 && (
        <figure aria-label="Ustunlar bo'yicha baho" className="h-60">
          <ResponsiveContainer width="100%" height="100%">
            <RadarChart data={radar} outerRadius="70%">
              <PolarGrid stroke={chart.grid} />
              <PolarAngleAxis dataKey="name" tick={{ fontSize: 10, fill: chart.axis }} />
              <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="Guruh o'rtachasi (50)" dataKey="avg" stroke={chart.axis} strokeDasharray="4 3" fill="none" isAnimationActive={false} />
              <Radar name="Korxona" dataKey="v" stroke={KLASS_STYLE[klass].hex} fill={KLASS_STYLE[klass].hex} fillOpacity={0.3} isAnimationActive={false} />
              <Tooltip {...chart.tooltip} formatter={(v) => [formatValue(Number(v)), "Baho"]} />
            </RadarChart>
          </ResponsiveContainer>
        </figure>
      )}

      <details>
        <summary className="cursor-pointer text-sm text-blue-600">Ustunlar va ko'rsatkichlar</summary>
        <div className="mt-2 space-y-3">
          {byPillar.map((p) => (
            <div key={p.key}>
              <p className="flex justify-between text-xs font-semibold">
                <span>{p.key}. {p.name}</span>
                <span className="tabular-nums">{p.applicable ? (p.score === null ? "—" : Math.round(p.score)) : "tegishli emas"}</span>
              </p>
              <ul className="mt-1 space-y-0.5">
                {p.indicators.filter((i) => i.applicable).map((i) => (
                  <li key={i.code} className="flex items-center gap-2 text-xs">
                    <span className="min-w-0 flex-1 truncate" title={i.name}>
                      {i.name}
                      {data.real_fields.includes(i.code) && <span className="ml-1 rounded bg-emerald-100 dark:bg-emerald-900/40 px-1 text-[10px] text-emerald-800 dark:text-emerald-300">Real</span>}
                    </span>
                    {mode === "own" && <span className="w-28 text-right tabular-nums text-gray-600 dark:text-gray-300" title={`Guruh medianasi: ${formatOwn(i, i.median)}`}>{formatOwn(i, i.value)}</span>}
                    <span className="relative h-1.5 w-20 rounded bg-gray-100 dark:bg-gray-700">
                      {i.score !== null && <span className="absolute inset-y-0 left-0 rounded bg-blue-500" style={{ width: `${Math.max(2, i.score)}%` }} />}
                    </span>
                    <span className="w-6 text-right tabular-nums">{i.score === null ? "—" : Math.round(i.score)}</span>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {mode === "own" && <p className="text-xs text-gray-500">Qiymat ustiga olib boring — guruh medianasi. Baho 0–100: guruh ichidagi o'rningiz (50 — o'rtacha).</p>}
        </div>
      </details>

      {mode === "own" && data.recommendations && data.recommendations.length > 0 && (
        <section aria-label="Tavsiyalar">
          <h4 className="text-sm font-semibold">Nimani yaxshilash mumkin</h4>
          <ul className="mt-1 space-y-1.5 text-sm">
            {data.recommendations.map((r) => (
              <li key={r.code} className="rounded-lg bg-gray-50 dark:bg-gray-700/40 px-3 py-2">
                {r.text}
                {r.link && <Link to={r.link} className="ml-1 inline-flex items-center text-blue-600 hover:underline">Ochish <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>}
              </li>
            ))}
          </ul>
        </section>
      )}

      {mode === "own" && data.dynamics.length > 1 && (
        <figure aria-label="Yillar bo'yicha ball" className="h-36">
          <figcaption className="text-xs text-gray-500">Yillar bo'yicha ball</figcaption>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data.dynamics} margin={{ top: 8, right: 10, left: 0, bottom: 0 }}>
              <CartesianGrid stroke={chart.grid} vertical={false} />
              <XAxis dataKey="year" tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} />
              <YAxis domain={[0, 100]} width={28} tick={{ fontSize: 10, fill: chart.axis }} tickLine={false} axisLine={false} />
              <Tooltip {...chart.tooltip} formatter={(v) => [formatValue(Number(v)), "Ball"]} />
              <Line dataKey="overall" stroke="#2563eb" strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </figure>
      )}

      <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 dark:border-gray-700 pt-2 text-xs text-gray-500">
        <span className="inline-flex items-center gap-1"><Info className="h-3 w-3" aria-hidden="true" />{data.disclaimer}{data.sample_note && ` ${data.sample_note}`}</span>
        <span className="flex gap-3">
          {mode === "public" && <Link to={profileUrl} className="text-blue-600 hover:underline">Profilni ochish</Link>}
          <Link to="/methodology/company-score" className="text-blue-600 hover:underline">Qanday hisoblanadi</Link>
        </span>
      </footer>
    </section>
  );
}

/** KR-39, KR-46: ochilmagan korxona — faqat umumiy ball, sinf va profilga havola (ustunlar backend'dan kelmaydi). */
function LockedCard({ data, box }: { data: CompanyScoreLocked; box: string }) {
  const klass = data.klass || "none";
  const none = klass === "none";
  const basis = data.unlock_options.find((o) => o.level === "basis");
  return (
    <section aria-label="Korxona bali" className={`${box} space-y-3`}>
      <h3 className="flex items-center gap-2 text-sm font-semibold">Korxona bali, {data.year} {data.is_synthetic && <DemoBadge />}</h3>
      <div className="flex items-center gap-3">
        <span className={`inline-flex h-12 w-12 items-center justify-center rounded-full text-2xl font-bold ${KLASS_STYLE[klass].bg} ${KLASS_STYLE[klass].text}`}>{none ? "—" : data.klass}</span>
        <div>
          <p className="text-3xl font-bold tabular-nums leading-none">{none ? "—" : Math.round(data.overall ?? 0)}<span className="text-base font-normal text-gray-400">/100</span></p>
          <p className="text-sm text-gray-600 dark:text-gray-300">{data.klass_info.name}{data.partial && <span className="ml-1 text-amber-600">· qisman ma'lumot</span>}</p>
        </div>
      </div>
      {!none && (
        <p className="text-sm text-gray-700 dark:text-gray-200">
          Ball nimaga asoslangan (6 ustun, ball tarkibi, tengdoshlar orasidagi o'rin) — korxona profilida{basis?.credits ? `, ${basis.credits} kredit` : ""}.
        </p>
      )}
      <div className="flex flex-wrap items-center justify-between gap-2 border-t border-gray-100 pt-2 text-xs text-gray-500 dark:border-gray-700">
        <span className="inline-flex items-center gap-1"><Info className="h-3 w-3" aria-hidden="true" />{data.disclaimer}</span>
        <Link to={data.profile_url} className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700">Profilni ochish <ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}

