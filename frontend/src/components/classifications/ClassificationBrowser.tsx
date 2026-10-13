import { useEffect, useMemo, useState } from "react";
import { Calendar, Download, FileDown, FileText, Layers, Search, X } from "lucide-react";
import {
  getStatisticalClassificationCategories,
  getStatisticalClassifications,
  type StatisticalClassificationItem as Item,
} from "../../api/statisticalClassifications";
import useApi from "../../hooks/useApi";
import { DemoBadge, EmptyState, ErrorState, Skeleton } from "../ui";
import { formatDateTime } from "../../utils/format";

type Lang = "uz" | "ru" | "cry";
const LANGS: { id: Lang; label: string }[] = [
  { id: "uz", label: "O'zbekcha" },
  { id: "ru", label: "Русский" },
  { id: "cry", label: "Ўзбекча" },
];

function useDebounced<T>(value: T, ms = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = window.setTimeout(() => setDebounced(value), ms);
    return () => window.clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

function exportCsv(rows: Item[], lang: Lang, filename: string) {
  const header = ["#", "Nomi", "Xalqaro analog", "Tasdiqlovchi hujjat", "Sana", "Kategoriya"];
  const esc = (v: unknown) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  const lines = rows.map((r, i) =>
    [i + 1, r[`name_${lang}`], r[`analog_${lang}`] || r.analog_uz, r.confirm_document, r.date, r.category_name ?? r.category].map(esc).join(",")
  );
  // BOM — Excel UTF-8 ni to'g'ri ochishi uchun
  const blob = new Blob(["﻿" + [header.map(esc).join(","), ...lines].join("\r\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

function DetailPanel({ item, onClose }: { item: Item; onClose: () => void }) {
  return (
    <aside className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4" aria-label="Tafsilot">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-gray-500 dark:text-gray-400">{item.category_name}</p>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{item.name_uz}</h3>
        </div>
        <button type="button" onClick={onClose} aria-label="Yopish" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <X className="w-5 h-5 text-gray-500" />
        </button>
      </div>
      <dl className="space-y-3 text-sm">
        {LANGS.map((l) => (
          <div key={l.id}>
            <dt className="text-gray-500 dark:text-gray-400">{l.label}</dt>
            <dd className="text-gray-900 dark:text-gray-100">{item[`name_${l.id}`] || "—"}</dd>
          </div>
        ))}
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Xalqaro analog</dt>
          <dd className="text-gray-900 dark:text-gray-100">{item.analog_uz || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Tasdiqlovchi hujjat</dt>
          <dd className="text-gray-900 dark:text-gray-100">{item.confirm_document || "—"}</dd>
        </div>
        <div>
          <dt className="text-gray-500 dark:text-gray-400">Sana</dt>
          <dd className="text-gray-900 dark:text-gray-100">{formatDateTime(item.date, false)}</dd>
        </div>
      </dl>
      {item.file ? (
        <a href={item.file} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
          <Download className="w-4 h-4" /> Rasmiy faylni yuklab olish
        </a>
      ) : (
        <p className="text-sm text-gray-500 dark:text-gray-400">Bu klassifikator uchun fayl yuklanmagan.</p>
      )}
    </aside>
  );
}

/** Klassifikatorlar: kategoriyalar, 3 tilda qidiruv, tafsilot va CSV eksport. U-07. */
export default function ClassificationBrowser() {
  const [category, setCategory] = useState<number | null>(null);
  const [query, setQuery] = useState("");
  const [lang, setLang] = useState<Lang>("uz");
  const [selected, setSelected] = useState<Item | null>(null);
  const search = useDebounced(query.trim());

  const categories = useApi(getStatisticalClassificationCategories, []);
  const items = useApi(
    () => getStatisticalClassifications({ category: category ?? undefined, search: search.length >= 2 ? search : undefined }),
    [category, search]
  );
  const rows = useMemo(() => items.data?.results ?? [], [items.data]);
  const total = (categories.data ?? []).reduce((s, c) => s + c.items_count, 0);
  const anySynthetic = rows.some((r) => r.is_synthetic);
  const currentName = categories.data?.find((c) => c.id === category)?.name ?? "Barcha klassifikatorlar";

  const catBtn = (active: boolean) =>
    `w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg text-sm text-left transition ${
      active ? "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium" : "text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700/50"
    }`;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-6">
      <nav aria-label="Kategoriyalar" className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3 h-fit">
        <p className="px-3 pb-2 text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 flex items-center gap-2">
          <Layers className="w-4 h-4" /> Kategoriyalar
        </p>
        {categories.loading && !categories.data ? (
          <Skeleton rows={6} className="px-3" />
        ) : (
          <ul className="space-y-1">
            <li>
              <button type="button" className={catBtn(category === null)} onClick={() => setCategory(null)}>
                <span>Hammasi</span>
                <span className="text-xs tabular-nums text-gray-500">{total}</span>
              </button>
            </li>
            {(categories.data ?? []).map((c) => (
              <li key={c.id}>
                <button type="button" className={catBtn(category === c.id)} onClick={() => setCategory(c.id)}>
                  <span className="truncate">{c.name.replace(/^\[DEMO\]\s*/, "")}</span>
                  <span className="text-xs tabular-nums text-gray-500">{c.items_count}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </nav>

      <div className="space-y-4 min-w-0">
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
            <input
              type="search"
              aria-label="Klassifikatorlarni qidirish"
              placeholder="Nomi, analogi yoki hujjat bo'yicha (3 tilda)…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            aria-label="Til"
            value={lang}
            onChange={(e) => setLang(e.target.value as Lang)}
            className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-800 dark:text-gray-100"
          >
            {LANGS.map((l) => <option key={l.id} value={l.id}>{l.label}</option>)}
          </select>
          <button
            type="button"
            disabled={rows.length === 0}
            onClick={() => exportCsv(rows, lang, `klassifikatorlar-${category ?? "hammasi"}.csv`)}
            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50"
          >
            <FileDown className="w-4 h-4" /> CSV
          </button>
        </div>

        <div className="flex items-center gap-2">
          <h2 className="font-semibold text-gray-900 dark:text-white">{currentName.replace(/^\[DEMO\]\s*/, "")}</h2>
          <span className="text-sm text-gray-500">· {rows.length} ta</span>
          <DemoBadge show={anySynthetic} />
        </div>

        <div className={`grid gap-4 ${selected ? "xl:grid-cols-[1fr_22rem]" : ""}`}>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            {items.loading && !items.data ? (
              <Skeleton variant="table" className="p-4" />
            ) : items.error ? (
              <ErrorState onRetry={items.reload} />
            ) : rows.length === 0 ? (
              <EmptyState icon={FileText} title="Klassifikator topilmadi" description={search ? "Boshqa so'z bilan qidirib ko'ring." : "Bu kategoriyada hali klassifikator yo'q."} />
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-gray-700">
                {rows.map((item, i) => (
                  <li key={item.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(item)}
                      className={`w-full text-left px-4 py-3 flex gap-3 hover:bg-gray-50 dark:hover:bg-gray-700/40 focus:outline-none focus-visible:bg-blue-50 ${selected?.id === item.id ? "bg-blue-50/70 dark:bg-blue-900/20" : ""}`}
                    >
                      <span className="w-7 h-7 shrink-0 rounded-full bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300 text-xs font-semibold flex items-center justify-center">{i + 1}</span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-medium text-gray-900 dark:text-white">{item[`name_${lang}`] || item.name_uz}</span>
                        <span className="mt-0.5 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-500 dark:text-gray-400">
                          <span>{item.analog_uz}</span>
                          <span className="inline-flex items-center gap-1"><Calendar className="w-3.5 h-3.5" />{formatDateTime(item.date, false)}</span>
                          {item.file && <span className="text-blue-600">fayl bor</span>}
                        </span>
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
          {selected && <DetailPanel item={selected} onClose={() => setSelected(null)} />}
        </div>
      </div>
    </div>
  );
}
