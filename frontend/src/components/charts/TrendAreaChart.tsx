import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface Props {
  labels: string[];
  dataPoints: number[];
  label?: string;
}

/** Silliq chiziqli (to'ldirilgan) trend grafigi. Q-03: Chart.js o'rniga Recharts. */
export default function TrendAreaChart({ labels, dataPoints, label = "" }: Props) {
  const data = labels.map((name, i) => ({ name, value: dataPoints[i] ?? 0 }));
  return (
    <div className="w-full h-80 pt-10">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 8, right: 12, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="trendFill" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="name" tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} />
          <YAxis allowDecimals={false} tick={{ fill: "#6b7280", fontSize: 12 }} axisLine={false} tickLine={false} width={40} />
          <Tooltip formatter={(v: number) => [v, label || "qiymat"]} />
          <Area
            type="monotone"
            dataKey="value"
            stroke="#3b82f6"
            strokeWidth={2}
            fill="url(#trendFill)"
            dot={{ r: 3, fill: "#fff", stroke: "#3b82f6" }}
            isAnimationActive={false}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
