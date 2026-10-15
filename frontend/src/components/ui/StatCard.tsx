import type { ReactNode } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import type { LucideIcon } from "lucide-react";

interface StatCardProps {
  label: string;
  value: ReactNode;
  icon?: LucideIcon;
  /** Foizdagi o'zgarish, masalan 12.5 yoki -3 */
  change?: number;
  hint?: string;
  trend?: number[];
  className?: string;
}

export default function StatCard({ label, value, icon: Icon, change, hint, trend, className = "" }: StatCardProps) {
  const changeColor =
    change === undefined ? "" : change >= 0 ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400";

  return (
    <div className={`rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{label}</p>
          <p className="mt-1 text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
        </div>
        {Icon && (
          <div className="w-10 h-10 shrink-0 rounded-lg bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center">
            <Icon className="w-5 h-5 text-blue-600 dark:text-blue-400" aria-hidden="true" />
          </div>
        )}
      </div>
      <div className="mt-2 flex items-center justify-between gap-3 min-h-[24px]">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {change !== undefined && (
            <span className={`font-semibold mr-1 ${changeColor}`}>
              {change >= 0 ? "+" : ""}
              {change.toFixed(1)}%
            </span>
          )}
          {hint}
        </p>
        {trend && trend.length > 1 && (
          <div className="w-20 h-6" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trend.map((v, i) => ({ i, v }))}>
                <Line type="monotone" dataKey="v" stroke="#2563eb" strokeWidth={2} dot={false} isAnimationActive={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}
