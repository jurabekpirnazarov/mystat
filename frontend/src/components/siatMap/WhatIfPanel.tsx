import { useEffect, useState } from "react";
import { fetchWhatIf, type WhatIf } from "../../api/siatMap";
import { formatValue } from "../../utils/mapScale";

const isAbort = (e: unknown) => (e as { name?: string })?.name === "CanceledError" || (e as { name?: string })?.name === "AbortError";

/**
 * SCORING_MODEL.md 10.5 "Maqsadli ssenariy" (P2): ishsizlik X p.p. o'zgarsa, tumanning boshqa ko'rsatkichlari prognozi
 * qanday o'zgarishi. Qiymatlar o'qitish vaqtida hisoblangan; bu bog'liqlik, sabab-oqibat emas. Faqat ochilganda yuklanadi.
 */
export default function WhatIfPanel({ soato }: { soato: string }) {
  const [open, setOpen] = useState(false);
  const [delta, setDelta] = useState(-1);
  const [data, setData] = useState<WhatIf | null>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (!open) return;
    const ctrl = new AbortController();
    setFailed(false);
    fetchWhatIf(soato, delta, ctrl.signal).then(setData).catch((e) => !isAbort(e) && setFailed(true));
    return () => ctrl.abort();
  }, [open, soato, delta]);

  const deltas = data?.deltas ?? [-3, -2, -1, 1, 2];
  return (
    <details className="basis-full" onToggle={(e) => setOpen((e.target as HTMLDetailsElement).open)}>
      <summary className="cursor-pointer text-blue-600">Agar ishsizlik o'zgarsa?</summary>
      {open && (
        <div className="mt-1 space-y-1.5">
          <div role="group" aria-label="Ishsizlik o'zgarishi" className="inline-flex flex-wrap rounded-lg border border-gray-300 dark:border-gray-600 overflow-hidden">
            {deltas.map((d) => (
              <button key={d} type="button" aria-pressed={delta === d} onClick={() => setDelta(d)}
                className={`px-2 py-0.5 tabular-nums ${delta === d ? "bg-blue-600 text-white" : ""}`}>
                {d > 0 ? "+" : "−"}{Math.abs(d)} p.p.
              </button>
            ))}
          </div>
          {failed ? (
            <p className="text-gray-500">Bu tuman uchun maqsadli ssenariy hisoblanmagan.</p>
          ) : !data ? (
            <div className="h-12 animate-pulse rounded bg-gray-100 dark:bg-gray-700/50" />
          ) : (
            <table className="w-full">
              <thead>
                <tr className="text-left text-gray-500">
                  <th className="font-normal">Ko'rsatkich</th>
                  {data.indicators[0]?.rows.map((r) => <th key={r.period} className="font-normal text-right">{r.period}</th>)}
                </tr>
              </thead>
              <tbody>
                {data.indicators.map((ind) => (
                  <tr key={ind.indicator} className="border-t border-gray-100 dark:border-gray-700">
                    <td className="py-0.5 pr-2">{ind.name}</td>
                    {ind.rows.map((r) => (
                      <td key={r.period} className="text-right tabular-nums" title={`Bazaviy ${formatValue(r.base)} → ${formatValue(r.value)} ${ind.unit}`}>
                        {r.change_pct === null ? "—" : `${r.change_pct > 0 ? "+" : r.change_pct < 0 ? "−" : ""}${formatValue(Math.abs(r.change_pct))}%`}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <p className="text-gray-500">Bazaviy prognozga nisbatan farq. {data?.note ?? "Bu bog'liqlik, sabab-oqibat emas."}</p>
        </div>
      )}
    </details>
  );
}
