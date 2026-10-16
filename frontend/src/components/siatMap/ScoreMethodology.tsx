import { useEffect, useRef, useState } from "react";
import { ExternalLink, X } from "lucide-react";
import { fetchForecastQuality, fetchScoreConfig, type ForecastQuality, type MethodologyLang, type ScoreConfig } from "../../api/siatMap";
import { formatValue } from "../../utils/mapScale";

interface Props {
  config: ScoreConfig;
  onClose: () => void;
}

const siatLink = (source: string) => (/^\d+$/.test(source) ? `https://siat.stat.uz/data/${source}/` : null);
const LANGS: [MethodologyLang, string][] = [["uz", "O'zb"], ["uzc", "Ўзб"], ["ru", "Рус"], ["en", "Eng"]];

/**
 * SCORING_MODEL.md KR-22: metodologiya 4 tilda. Matn va barcha raqamlar (chegaralar, vaznlar, ko'rsatkichlar) API orqali
 * `scoring.yaml` dan keladi — bu yerda qo'lda yozilgan raqam yo'q. Prognoz aniqligi (10.4, KR-28) — o'tgan yillardagi
 * sinov natijasi va prognoz/haqiqat monitoringi, usul oddiy tildagi nomi bilan.
 */
export default function ScoreMethodology({ config: initial, onClose }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [lang, setLang] = useState<MethodologyLang>("uz");
  const [loaded, setLoaded] = useState<Partial<Record<MethodologyLang, ScoreConfig>>>({ uz: initial });
  const config = loaded[lang] ?? initial;
  const [quality, setQuality] = useState<Partial<Record<MethodologyLang, ForecastQuality | null>>>({});
  const m = config.methodology;
  const L = m.labels;
  useEffect(() => {
    ref.current?.focus();
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);
  useEffect(() => {
    if (loaded[lang]) return;
    fetchScoreConfig(lang).then((c) => setLoaded((prev) => ({ ...prev, [lang]: c }))).catch(() => undefined);
  }, [lang, loaded]);

  useEffect(() => {
    if (lang in quality) return;
    fetchForecastQuality(lang).then((q) => setQuality((prev) => ({ ...prev, [lang]: q })))
      .catch(() => setQuality((prev) => ({ ...prev, [lang]: null })));
  }, [lang, quality]);
  const q = quality[lang];
  const fill = (tpl: string, vals: Record<string, string | number | null>) =>
    tpl.replace(/\{(\w+)\}/g, (_, k: string) => (vals[k] === null || vals[k] === undefined ? "—" : String(vals[k])));

  const section = (key: string) => m.sections.find((s) => s.key === key);
  const List = ({ k }: { k: string }) => {
    const s = section(k);
    if (!s) return null;
    return (
      <>
        <h3 className="mt-4 font-semibold">{s.title}</h3>
        {s.items.length > 0 && <ul className="mt-1 list-disc pl-5 space-y-1">{s.items.map((t) => <li key={t}>{t}</li>)}</ul>}
      </>
    );
  };

  return (
    <div className="fixed inset-0 z-[1300] flex items-end sm:items-center justify-center bg-black/40 p-0 sm:p-4" onClick={onClose}>
      <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={L.title} lang={lang === "uzc" ? "uz-Cyrl" : lang} onClick={(e) => e.stopPropagation()}
        className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-white dark:bg-gray-800 p-5 text-sm text-gray-700 dark:text-gray-200 shadow-xl outline-none">
        <div className="flex items-start justify-between gap-3">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{L.title} <span className="text-sm font-normal text-gray-500">v{config.version}</span></h2>
          <div className="flex items-center gap-2">
            <div role="group" aria-label="Til" className="inline-flex rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden text-xs">
              {LANGS.map(([code, label]) => (
                <button key={code} type="button" aria-pressed={lang === code} onClick={() => setLang(code)}
                  className={`px-2 py-1 ${lang === code ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900" : ""}`}>{label}</button>
              ))}
            </div>
            <button type="button" onClick={onClose} aria-label={L.close} className="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700"><X className="w-5 h-5" /></button>
          </div>
        </div>
        <p className="mt-1 text-amber-700 dark:text-amber-300">{config.disclaimer}</p>

        <List k="calc" />

        <h3 className="mt-4 font-semibold">{section("pillars")?.title}</h3>
        <div className="mt-1 overflow-x-auto">
          <table className="w-full text-xs">
            <thead><tr className="text-left text-gray-500"><th className="py-1 pr-2">{L.pillar}</th><th className="pr-2">{L.indicator}</th><th className="pr-2">{L.direction}</th><th>{L.level}</th></tr></thead>
            <tbody>
              {config.pillars.flatMap((pl) => pl.indicators.map((ind, i) => (
                <tr key={ind.id} className="border-t border-gray-100 dark:border-gray-700 align-top">
                  <td className="py-1 pr-2 font-medium">{i === 0 ? `${pl.key}. ${pl.name}` : ""}</td>
                  <td className="pr-2">
                    {ind.name}{ind.transform === "log" && <span className="text-gray-400"> (log)</span>}
                    {siatLink(ind.source) && <a href={siatLink(ind.source)!} target="_blank" rel="noopener noreferrer" className="ml-1 inline-flex text-blue-600"><ExternalLink className="w-3 h-3" aria-label="SIAT" /></a>}
                  </td>
                  <td className="pr-2">{ind.direction === "+" ? L.higher_better : L.lower_better}</td>
                  <td>{ind.level === "district" ? L.district : L.region}</td>
                </tr>
              )))}
            </tbody>
          </table>
        </div>
        {section("pillars")?.note && <p className="mt-1 text-xs text-gray-500">{section("pillars")?.note}</p>}

        <h3 className="mt-4 font-semibold">{section("weights")?.title}</h3>
        <table className="mt-1 w-full text-xs">
          <thead><tr className="text-left text-gray-500"><th className="py-1">{L.preset}</th>{config.pillars.map((pl) => <th key={pl.key} className="text-right">{pl.key}</th>)}</tr></thead>
          <tbody>
            {Object.entries(config.presets).map(([key, preset]) => (
              <tr key={key} className="border-t border-gray-100 dark:border-gray-700">
                <td className="py-1">{preset.name}</td>
                {preset.region.map((w, i) => <td key={i} className="text-right tabular-nums">{w}</td>)}
              </tr>
            ))}
          </tbody>
        </table>

        <List k="reliability" />
        <List k="analysis" />
        <List k="forecast" />
        {q && q.rows.length > 0 && (
          <>
            <h4 className="mt-3 font-medium">{L.fc_quality}</h4>
            <div className="mt-1 max-h-72 overflow-auto">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-white dark:bg-gray-800">
                  <tr className="text-left text-gray-500">
                    <th className="py-1 pr-2">{L.indicator}</th><th className="pr-2">{L.level}</th><th className="pr-2">{L.fc_horizon}</th>
                    <th className="pr-2">{L.fc_method}</th><th className="pr-2 text-right">{L.fc_error}</th>
                    <th className="pr-2 text-right">{L.fc_direction}</th><th className="text-right">{L.fc_coverage}</th>
                  </tr>
                </thead>
                <tbody>
                  {q.rows.map((r) => (
                    <tr key={`${r.indicator}-${r.level}-${r.horizon}`} className="border-t border-gray-100 dark:border-gray-700">
                      <td className="py-0.5 pr-2">{r.name}</td>
                      <td className="pr-2">{r.level}</td>
                      <td className="pr-2 tabular-nums">{fill(L.fc_years, { h: r.horizon })}</td>
                      <td className="pr-2">{r.method}</td>
                      <td className="pr-2 text-right tabular-nums">{r.error_pct === null ? "—" : `${formatValue(r.error_pct)}%`}</td>
                      <td className="pr-2 text-right tabular-nums">{r.direction_pct === null ? "—" : `${formatValue(r.direction_pct)}%`}</td>
                      <td className="text-right tabular-nums">{r.coverage_pct === null ? "—" : `${formatValue(r.coverage_pct)}%`}{r.small_sample && "*"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="mt-1 text-xs text-gray-500">{q.note} {L.fc_small}</p>
            <h4 className="mt-3 font-medium">{L.fc_monitoring}</h4>
            {q.monitoring.length ? (
              <ul className="mt-1 list-disc pl-5 space-y-0.5 text-xs">
                {q.monitoring.map((m) => (
                  <li key={m.indicator}>{fill(L.fc_monitoring_text, { name: m.name, error: m.error_pct === null ? null : formatValue(m.error_pct), inside: m.inside_pct === null ? null : formatValue(m.inside_pct), count: m.count })}</li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-xs text-gray-500">{L.fc_monitoring_empty}</p>
            )}
          </>
        )}
        <p className="mt-4 text-xs text-gray-500">{L.source}</p>
      </div>
    </div>
  );
}
