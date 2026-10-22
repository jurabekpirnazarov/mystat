import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mg } from "../../../theme/tokens";
import { niceAxis, useChartTheme } from "../../../utils/chartTheme";
import type { TradeFlow } from "../../../api/tradeFlows";

export interface DynamicsRow {
  year: number;
  /** x o'qidagi yorliq (to'liq bo'lmagan yil uchun "2025*") */
  label: string;
  period_label?: string;
  export?: number | null;
  import?: number | null;
}

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} mlrd` : n >= 1e3 ? `${(n / 1e3).toFixed(0)} mln` : String(Math.round(n)));
const full = (n: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(n);

/**
 * TI-09: yillar bo'yicha dinamika — eksport va import ikki chiziq (oqim ranglari tokenlardan). `flow="total"`
 * bo'lsa uchinchi, aylanma chizig'i ham chiziladi. Qiymatlar ming AQSh dollarida.
 */
export default function YearlyDynamicsChart({ rows, flow, unit = "ming AQSh $" }: { rows: DynamicsRow[]; flow: TradeFlow; unit?: string }) {
  const t = useChartTheme();
  const data = rows.map((r) => ({ ...r, total: (r.export ?? 0) + (r.import ?? 0) }));
  const values = data.flatMap((r) => [r.export, r.import, flow === "total" ? r.total : null]);
  const dim = (f: TradeFlow) => (flow === "total" || flow === f ? 1 : 0.3);
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={t.grid} />
        <XAxis dataKey="label" tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
        <YAxis {...niceAxis(values)} tickFormatter={compact} tick={{ fontSize: 11, fill: t.axis }} axisLine={false} tickLine={false} width={64} />
        <Tooltip {...t.tooltip} formatter={(v: number, name) => [`${full(v)} ${unit}`, name]}
          labelFormatter={(l, p) => `${l}${p?.[0]?.payload?.period_label ? ` · ${p[0].payload.period_label}` : ""}`} />
        <Legend />
        <Line type="monotone" dataKey="export" name="Eksport" stroke={mg.flow.export} strokeWidth={2.5} strokeOpacity={dim("export")} dot={{ r: 3 }} isAnimationActive={false} connectNulls />
        <Line type="monotone" dataKey="import" name="Import" stroke={mg.flow.import} strokeWidth={2.5} strokeOpacity={dim("import")} dot={{ r: 3 }} isAnimationActive={false} connectNulls />
        {flow === "total" && <Line type="monotone" dataKey="total" name="Aylanma" stroke={mg.flow.total} strokeWidth={2} strokeDasharray="5 4" dot={false} isAnimationActive={false} />}
      </LineChart>
    </ResponsiveContainer>
  );
}
