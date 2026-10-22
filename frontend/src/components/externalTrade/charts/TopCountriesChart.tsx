import { Bar, BarChart, CartesianGrid, LabelList, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { mg } from "../../../theme/tokens";
import { useChartTheme } from "../../../utils/chartTheme";
import type { TradeFlow } from "../../../api/tradeFlows";

export interface TopCountryRow {
  id?: number;
  name: string;
  value: number;
  share?: number;
}

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)} mlrd` : n >= 1e3 ? `${(n / 1e3).toFixed(1)} mln` : String(Math.round(n)));
const full = (n: number) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(n);

/** TI-09: top-10 davlat — gorizontal ustun, qiymat yorlig'i bilan; ustunni bosish davlatni tanlaydi. */
export default function TopCountriesChart({ rows, flow, unit = "ming AQSh $", onSelect }: {
  rows: TopCountryRow[];
  flow: TradeFlow;
  unit?: string;
  onSelect?: (id: number) => void;
}) {
  const t = useChartTheme();
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={rows} layout="vertical" margin={{ top: 4, right: 84, left: 8, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={t.grid} />
        <XAxis type="number" hide />
        <YAxis type="category" dataKey="name" width={112} tick={{ fontSize: 12, fill: t.axis }} axisLine={false} tickLine={false} />
        <Tooltip {...t.tooltip} cursor={{ fill: "rgba(0,104,224,0.06)" }}
          formatter={(v: number, _n, p) => [`${full(v)} ${unit}${p?.payload?.share != null ? ` · ${p.payload.share.toFixed(1)}%` : ""}`, "Qiymat"]} />
        <Bar dataKey="value" fill={mg.flow[flow]} radius={[0, 6, 6, 0]} isAnimationActive={false} barSize={18}
          cursor={onSelect ? "pointer" : undefined}
          onClick={(d) => {
            const id = (d as unknown as { payload?: { id?: number } }).payload?.id;
            if (id != null) onSelect?.(id);
          }}>
          <LabelList dataKey="value" position="right" formatter={(v: unknown) => compact(Number(v))} style={{ fontSize: 11, fill: t.axis }} />
        </Bar>
      </BarChart>
    </ResponsiveContainer>
  );
}
