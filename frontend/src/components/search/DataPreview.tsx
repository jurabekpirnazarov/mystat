import { useEffect, useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Loader2, Lock } from "lucide-react";
import { agentPreview, type AgentPreview, type AgentSample } from "../../api/dataAgent";

const PAGE = 25;
const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });
const cell = (v: string | number | null) => (typeof v === "number" && !Number.isInteger(v) ? nf.format(v) : v ?? "");
/** Yil kabi butun sonlar ("2 024" emas) va tartib raqamlari formatlanmaydi; qiymat ustunlari formatlanadi. */
const isMoney = (col: string) => col.startsWith("Qiymat") || col === "Miqdor";

/**
 * Sotib olishdan OLDIN: ustunlar va yashirilgan namuna qatorlar (qulf bilan). Haqiqiy qiymat serverdan kelmaydi,
 * shuning uchun brauzerda ochib bo'lmaydi. Foydalanuvchi faylda nimalar borligini ko'radi, ichini emas.
 */
export function SamplePeek({ sample }: { sample: AgentSample }) {
  return (
    <div className="mt-2 w-full overflow-hidden rounded-xl border border-dashed border-mg-border bg-[var(--pp-soft)]/60">
      <div className="flex items-center gap-2 px-3 py-1.5 text-xs text-mg-muted">
        <Lock className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        <span>Namuna (qiymatlar sotib olgandan keyin ochiladi) · {sample.coverage}</span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[420px] border-t border-mg-border text-left text-xs">
          <thead>
            <tr>{sample.columns.map((c) => <th key={c} scope="col" className="whitespace-nowrap px-3 py-1.5 font-semibold text-mg-muted">{c}</th>)}</tr>
          </thead>
          <tbody>
            {sample.rows.map((r, i) => (
              <tr key={i} className="border-t border-mg-border/60">
                {r.map((v, j) => (
                  <td key={j} className="px-3 py-1.5">
                    {v === "•••" ? <span aria-label="yashirin" className="select-none rounded bg-mg-border/70 px-2 text-transparent">xxxxxx</span> : v}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/** Sotib olingan to'plam: yillar bo'yicha diagramma va sahifalab jadval (to'liq ma'lumot yuklab olinadi). */
export default function DataPreview({ purchaseId }: { purchaseId: number }) {
  const [data, setData] = useState<AgentPreview | null>(null);
  const [rows, setRows] = useState<AgentPreview["rows"]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);

  const load = (offset: number) => {
    setLoading(true);
    agentPreview(purchaseId, offset, PAGE)
      .then((d) => {
        setData(d);
        setRows((prev) => (offset === 0 ? d.rows : [...prev, ...d.rows]));
        setFailed(false);
      })
      .catch(() => setFailed(true))
      .finally(() => setLoading(false));
  };
  useEffect(() => load(0), [purchaseId]); // eslint-disable-line react-hooks/exhaustive-deps

  if (failed) return <p role="alert" className="m-0 mt-2 text-sm text-red-700">Ma'lumotni ko'rsatib bo'lmadi. Yuklab olishingiz mumkin.</p>;
  if (!data) return <p role="status" className="m-0 mt-2 flex items-center gap-2 text-sm text-mg-muted"><Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />Yuklanmoqda…</p>;

  const hasChart = data.chart.length > 1;
  const flows = (["Eksport", "Import"] as const).filter((f) => data.chart.some((c) => c[f] !== undefined));
  return (
    <div className="mt-3 w-full space-y-3">
      {hasChart && (
        <div className="rounded-xl border border-mg-border p-3">
          <p className="m-0 mb-1 text-xs font-semibold text-mg-muted">Yillar bo'yicha qiymat, {data.unit}</p>
          <div className="h-48" role="img" aria-label="Yillar bo'yicha qiymat diagrammasi">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.chart} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--pp-line)" />
                <XAxis dataKey="year" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} tickFormatter={(v: number) => nf.format(v)} width={56} />
                <Tooltip formatter={(v: number) => nf.format(v)} />
                {flows.length > 1 && <Legend />}
                {flows.includes("Eksport") && <Bar dataKey="Eksport" fill="var(--btn)" radius={[6, 6, 0, 0]} />}
                {flows.includes("Import") && <Bar dataKey="Import" fill="var(--p800)" radius={[6, 6, 0, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
      <div className="overflow-hidden rounded-xl border border-mg-border">
        <div className="max-h-80 overflow-auto">
          <table className="w-full min-w-[460px] text-left text-sm">
            <thead className="sticky top-0 bg-[var(--pp-soft)]">
              <tr>{data.columns.map((c) => <th key={c} scope="col" className={`whitespace-nowrap px-3 py-2 text-xs font-semibold text-mg-muted ${isMoney(c) ? "text-right" : ""}`}>{c}</th>)}</tr>
            </thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={i} className="border-t border-mg-border/60">
                  {r.map((v, j) => <td key={j} className={`px-3 py-1.5 ${isMoney(data.columns[j]) ? "mono text-right" : ""}`}>{cell(v)}</td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-mg-border bg-[var(--pp-soft)] px-3 py-2 text-xs text-mg-muted">
          <span>{rows.length} / {data.total} qator ko'rsatilmoqda</span>
          {rows.length < data.total && (
            <button type="button" disabled={loading} onClick={() => load(rows.length)} className="inline-flex items-center gap-1 rounded-full border border-mg-border bg-mg-surface px-3 py-1 font-semibold text-[var(--pp-text)] hover:bg-mg-info disabled:opacity-60">
              {loading && <Loader2 className="h-3 w-3 animate-spin" aria-hidden="true" />}Yana {Math.min(PAGE, data.total - rows.length)} ta
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
