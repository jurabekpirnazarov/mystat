import { Link } from "react-router-dom";
import { fetchCompanyScoreDistribution } from "../../api/companyScores";
import useApi from "../../hooks/useApi";
import { DemoBadge } from "../ui";
import { KLASS_STYLE } from "./klassStyle";

interface Props {
  /** Viloyat (4 xona) yoki tuman (7 xona) SOATO */
  soato: string;
  className?: string;
}

/**
 * KORXONA_SCORING.md KR-37: hudud kartochkasi va hududiy profilda "Korxonalar sifati" — sinflar taqsimoti, o'rtacha
 * ball, A–B ulushi (faqat agregat, alohida korxona yo'q). Baholangan korxona kam bo'lsa — "Ma'lumot yetarli emas".
 */
export default function CompanyQualityBlock({ soato, className = "" }: Props) {
  const q = soato.length === 4 ? { region: soato } : { district: soato };
  const { data, loading } = useApi(() => fetchCompanyScoreDistribution(q).catch(() => null), [soato]);
  if (loading && !data) return <div className={`h-24 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700/50 ${className}`} />;
  if (!data || !data.total) return null;

  return (
    <section aria-label="Korxonalar sifati" className={`rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2.5 space-y-2 ${className}`}>
      <h4 className="flex items-center gap-2 text-sm font-semibold">Korxonalar sifati {data.is_synthetic && <DemoBadge />}</h4>
      {!data.enough ? (
        <p className="text-xs text-gray-500">Ma'lumot yetarli emas: baholangan korxonalar {data.scored} ta.</p>
      ) : (
        <>
          <p className="text-xs text-gray-600 dark:text-gray-300">
            O'rtacha ball <b className="text-gray-900 dark:text-white">{data.mean}</b> · A–B sinf <b className="text-gray-900 dark:text-white">{data.ab_share}%</b> · baholangan {data.scored.toLocaleString("ru-RU")} korxona
          </p>
          <div className="flex h-3 overflow-hidden rounded" role="img"
            aria-label={`Sinflar: ${data.classes.map((c) => `${c.key} ${c.share}%`).join(", ")}`}>
            {data.classes.filter((c) => c.share > 0).map((c) => (
              <span key={c.key} className={KLASS_STYLE[c.key || "none"].bg} style={{ width: `${c.share}%` }} title={`${c.key} · ${c.name}: ${c.share}%`} />
            ))}
          </div>
          <ul className="flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-gray-500">
            {data.classes.map((c) => <li key={c.key}><b>{c.key}</b> {c.share}%</li>)}
          </ul>
        </>
      )}
      <p className="text-[11px] text-gray-400">{data.disclaimer} <Link to="/methodology/company-score" className="underline">Qanday hisoblanadi</Link></p>
    </section>
  );
}
