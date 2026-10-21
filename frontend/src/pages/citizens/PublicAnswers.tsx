import { useState } from "react";
import { Link } from "react-router-dom";
import { Search } from "lucide-react";
import { fetchPublicAnswers } from "../../api/citizens";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

/** FQ-10: ochiq savol-javob bazasi (fuqaro rozilik bergan va javob berilgan savollar). */
export default function PublicAnswers() {
  const [q, setQ] = useState("");
  const [query, setQuery] = useState("");
  const { data, loading, error, reload } = useApi(() => fetchPublicAnswers(query || undefined), [query]);
  return (
    <div className="py-2">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader title="Fuqarolar savollariga javoblar" description="Statistika xodimlari javob bergan savollar. O'z savolingizni kabinetdan yuboring."
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Savol-javoblar" }]}
          actions={<Link to="/cabinet" state={{ name: "questions" }} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Savol berish</Link>} />
        <form className="relative mb-6" onSubmit={(e) => { e.preventDefault(); setQuery(q.trim()); }}>
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish (masalan: maktab)" aria-label="Qidirish" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
        </form>
        {loading && !data ? <Skeleton rows={6} /> : error || !data ? <ErrorState onRetry={reload} /> : data.length === 0 ? <EmptyState title="Hech narsa topilmadi" /> : (
          <ul className="space-y-3">
            {data.map((x) => (
              <li key={x.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <p className="text-xs text-gray-500">{x.category}{x.region ? ` · ${x.region}` : ""} · {formatDateTime(x.answered_at, false)}</p>
                <p className="mt-1 font-medium">{x.question}</p>
                <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">{x.answer}</p>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
