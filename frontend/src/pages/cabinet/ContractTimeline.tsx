import { useState } from "react";
import { Check, ChevronDown, ChevronUp, Circle, XCircle } from "lucide-react";
import { fetchContractTimeline, type ContractTimeline as Timeline } from "../../api/contracts";
import { formatDateTime } from "../../utils/format";

/** K-08: shartnoma qadamlari chizig'i (bosilganda yuklanadi). */
export default function ContractTimeline({ contractId }: { contractId: number }) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Timeline | null>(null);
  const [error, setError] = useState(false);

  const toggle = async () => {
    const next = !open;
    setOpen(next);
    if (next && !data) {
      try {
        setData(await fetchContractTimeline(contractId));
      } catch {
        setError(true);
      }
    }
  };

  return (
    <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-2">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className="inline-flex items-center gap-1 text-sm text-blue-600 dark:text-blue-400 hover:underline"
      >
        {open ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />} Shartnoma holati
      </button>
      {open && (
        <div className="mt-3">
          {error ? (
            <p className="text-sm text-red-600">Holatni yuklab bo'lmadi.</p>
          ) : !data ? (
            <div className="h-10 animate-pulse rounded bg-gray-100 dark:bg-gray-700" />
          ) : (
            <>
              {data.cancelled && (
                <p className="mb-2 inline-flex items-center gap-1 text-sm text-red-600">
                  <XCircle className="w-4 h-4" /> Shartnoma bekor qilingan
                </p>
              )}
              <ol className="flex flex-col sm:flex-row gap-3 sm:gap-0">
                {data.steps.map((s, i) => {
                  const current = s.key === data.current;
                  return (
                    <li key={s.key} className="flex sm:flex-col items-start sm:items-center gap-2 sm:flex-1 relative">
                      {i > 0 && (
                        <span
                          aria-hidden="true"
                          className={`hidden sm:block absolute top-3 right-1/2 w-full h-0.5 -z-0 ${s.done ? "bg-emerald-400" : "bg-gray-200 dark:bg-gray-700"}`}
                        />
                      )}
                      <span
                        className={`relative z-10 w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                          s.done ? "bg-emerald-500 text-white" : current ? "bg-blue-600 text-white ring-4 ring-blue-100 dark:ring-blue-900/40" : "bg-gray-200 dark:bg-gray-700 text-gray-400"
                        }`}
                      >
                        {s.done ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-2.5 h-2.5" />}
                      </span>
                      <span className="sm:text-center">
                        <span className={`block text-xs font-medium ${current ? "text-blue-700 dark:text-blue-300" : "text-gray-700 dark:text-gray-200"}`}>
                          {s.label}
                        </span>
                        {s.date && <span className="block text-[11px] text-gray-500">{formatDateTime(s.date, false)}</span>}
                        {s.note && <span className="block text-[11px] text-gray-500">{s.note}</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
        </div>
      )}
    </div>
  );
}
