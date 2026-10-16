import CompanyScoreBadge from "../components/company-score/CompanyScoreBadge";
import CompanyScoreCard from "../components/company-score/CompanyScoreCard";
import { useCompanyScores, type CompanyScoreShort, type Klass } from "../api/companyScores";
import { PageHeader } from "../components/ui";
import useApi from "../hooks/useApi";
import { searchPartners } from "../api/partners";

const pillars = { M: 62, O: 48, T: null, X: 55, I: 70, S: 81 };
const make = (klass: Klass, overall: number | null, extra: Partial<CompanyScoreShort> = {}): CompanyScoreShort => ({
  stir: "000000000", year: 2025, preset: "muvozanatli", overall, klass,
  klass_name: { A: "Yuqori", B: "Yaxshi", C: "O'rta", D: "Past", E: "Xavf zonasi", "": "Ma'lumot yetarli emas" }[klass],
  coverage: overall === null ? 0.4 : 0.95, partial: false, data_source: "synthetic", is_synthetic: false, pillars, flags: [],
  ...extra,
});

const STATES: [string, CompanyScoreShort][] = [
  ["A", make("A", 76)], ["B", make("B", 63)], ["C", make("C", 51)], ["D", make("D", 39)], ["E", make("E", 28)],
  ["— (to'liqlik < 0.6)", make("", null)], ["Qisman ma'lumot", make("B", 60, { partial: true, coverage: 0.7 })],
  ["Bayroqlar", make("C", 57, { flags: ["soliq_qarzi", "zarar_bilan_ishlagan"] })], ["Namuna", make("B", 66, { is_synthetic: true })],
];

/**
 * KORXONA_SCORING.md KR-34: badge va kartochkaning barcha holatlari bir sahifada (Storybook o'rniga). E2E testi
 * shu sahifani 375px kenglikda ham tekshiradi. Kartochkalar — bazadagi haqiqiy (namuna) ballar bilan.
 */
export default function CompanyScoreShowcase() {
  // Bazadagi birinchi uchta korxona (hamkorlar qidiruvi, ball bo'yicha) — haqiqiy namuna kartochkalari uchun
  const sample = useApi(() => searchPartners({ ordering: "-score" } as never), []);
  const stirs = (sample.data?.results ?? []).slice(0, 3).map((r) => r.stir);
  const live = useCompanyScores(stirs);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      <PageHeader title="Korxona bali: komponentlar" description="Badge va kartochkaning barcha holatlari (KR-34)" />
      <section aria-label="Badge holatlari">
        <h2 className="mb-3 text-sm font-semibold">CompanyScoreBadge</h2>
        <ul className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {STATES.map(([label, score]) => (
            <li key={label} className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm">
              <span>{label}</span>
              <CompanyScoreBadge score={score} />
            </li>
          ))}
          <li className="flex items-center justify-between gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm">
            <span>Yuklanmoqda</span><CompanyScoreBadge score={undefined} />
          </li>
        </ul>
      </section>
      <section aria-label="Kartochkalar" className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {stirs.map((s) => (
          <div key={s}>
            <p className="mb-1 text-xs text-gray-500">STIR {s} <CompanyScoreBadge score={live[s]} /></p>
            <CompanyScoreCard stir={s} />
          </div>
        ))}
        <CompanyScoreCard stir="000000000" />
      </section>
    </div>
  );
}
