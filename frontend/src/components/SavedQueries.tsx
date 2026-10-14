import { useState } from "react";
import { Bookmark, Trash2 } from "lucide-react";
import { deleteSavedQuery, listSavedQueries, saveQuery, type SavedQuery } from "../api/partners";
import { useAuth } from "../contexts/AuthContext";
import useApi from "../hooks/useApi";

interface Props {
  kind: SavedQuery["kind"];
  current: Record<string, string | number | undefined>;
  onApply: (params: SavedQuery["params"]) => void;
}

/** "Mening so'rovlarim": joriy filtrni saqlash va saqlanganini qayta ochish (U-16, K-04). */
export default function SavedQueries({ kind, current, onApply }: Props) {
  const { isAuthenticated } = useAuth();
  const { data, reload } = useApi(() => (isAuthenticated ? listSavedQueries(kind) : Promise.resolve([])), [kind, isAuthenticated]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  if (!isAuthenticated) return null;
  const params = Object.fromEntries(Object.entries(current).filter(([, v]) => v !== undefined && v !== ""));

  const save = async () => {
    setError(null);
    try {
      await saveQuery(kind, name.trim() || "Nomsiz so'rov", params);
      setName("");
      reload();
    } catch {
      setError("Saqlab bo'lmadi");
    }
  };

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
      <h3 className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-1.5 mb-2">
        <Bookmark className="w-4 h-4 text-blue-600" /> Mening so'rovlarim
      </h3>
      <div className="flex gap-2">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="So'rov nomi" maxLength={120}
          className="min-w-0 flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
        <button type="button" onClick={save} disabled={Object.keys(params).length === 0}
          className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50">Saqlash</button>
      </div>
      {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
      <ul className="mt-2 space-y-1">
        {(data ?? []).map((q) => (
          <li key={q.id} className="flex items-center justify-between gap-2 text-sm">
            <button type="button" onClick={() => onApply(q.params)} className="text-left text-blue-700 dark:text-blue-300 hover:underline truncate">{q.name}</button>
            <button type="button" aria-label={`${q.name} — o'chirish`} onClick={async () => { await deleteSavedQuery(q.id); reload(); }} className="p-1 text-gray-400 hover:text-red-600">
              <Trash2 className="w-4 h-4" />
            </button>
          </li>
        ))}
        {data && data.length === 0 && <li className="text-xs text-gray-500">Hali saqlangan so'rov yo'q.</li>}
      </ul>
    </div>
  );
}
