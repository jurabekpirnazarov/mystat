import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchGlossary } from "../../api/citizens";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui";

/** FQ-07: atamalar lug'ati — alifbo bo'yicha guruhlangan, qidiruv. */
export default function Glossary() {
  const [lang, setLang] = useState("uz");
  const { data, loading, error, reload } = useApi(() => fetchGlossary(undefined, lang), [lang]);
  const [q, setQ] = useState("");
  const groups = useMemo(() => {
    const needle = q.trim().toLowerCase();
    const items = (data ?? []).filter((t) => !needle || t.term.toLowerCase().includes(needle) || t.definition.toLowerCase().includes(needle));
    const map = new Map<string, typeof items>();
    [...items].sort((a, b) => a.term.localeCompare(b.term, lang === "ru" ? "ru" : "uz")).forEach((t) => {
      const letter = t.term[0].toUpperCase();
      map.set(letter, [...(map.get(letter) ?? []), t]);
    });
    return [...map.entries()];
  }, [data, q, lang]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title="Statistik atamalar lug'ati" breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Lug'at" }]}
          actions={<Link to="/learn" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Maqolalar →</Link>} />
        <div className="flex flex-wrap gap-3 mb-6">
          <label className="relative flex-1 min-w-[220px]">
            <span className="sr-only">Qidirish</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Atama yoki ta'rif bo'yicha qidirish" className="w-full pl-9 pr-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </label>
          <select aria-label="Til" value={lang} onChange={(e) => setLang(e.target.value)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            <option value="uz">O'zbekcha</option><option value="cry">Ўзбекча</option><option value="ru">Русский</option>
          </select>
        </div>
        {loading && !data ? (
          <Skeleton rows={10} />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : groups.length === 0 ? (
          <EmptyState title="Atama topilmadi" />
        ) : (
          <div className="space-y-6">
            {groups.map(([letter, items]) => (
              <section key={letter}>
                <h2 className="text-lg font-bold text-blue-700 dark:text-blue-300 mb-2">{letter}</h2>
                <dl className="space-y-3">
                  {items.map((t) => (
                    <div key={t.slug} id={t.slug} className="rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 p-4 scroll-mt-24">
                      <dt className="font-semibold text-gray-900 dark:text-white">{t.term}</dt>
                      <dd className="mt-1 text-sm text-gray-700 dark:text-gray-300">{t.definition}</dd>
                      {t.example && <dd className="mt-1 text-xs text-gray-500">Masalan: {t.example}</dd>}
                      {t.article && <dd className="mt-1"><Link to={`/learn/${t.article}`} className="text-xs text-blue-600 hover:underline">Maqola →</Link></dd>}
                    </div>
                  ))}
                </dl>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
