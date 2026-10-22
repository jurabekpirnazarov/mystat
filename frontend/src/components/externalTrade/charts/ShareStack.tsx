import { mg } from "../../../theme/tokens";
import type { TradeFlow } from "../../../api/tradeFlows";

export interface ShareRow {
  name: string;
  share: number;
}

const SHADES = [1, 0.8, 0.62, 0.46, 0.32];

/**
 * TI-09: ulush tarkibi — bitta 100% ustun (pirog grafik emas). Top-5 davlat va "Boshqalar"; har bo'lakda matn
 * yorlig'i bor, rang yagona belgi emas (a11y).
 */
export default function ShareStack({ rows, flow }: { rows: ShareRow[]; flow: TradeFlow }) {
  const top = rows.slice(0, 5);
  const others = Math.max(0, 100 - top.reduce((s, r) => s + r.share, 0));
  const color = mg.flow[flow];
  return (
    <div className="flex h-full flex-col justify-center gap-4">
      <div className="flex h-12 w-full overflow-hidden rounded-mg" role="img"
        aria-label={`Ulushlar: ${top.map((r) => `${r.name} ${r.share.toFixed(1)}%`).join(", ")}, boshqalar ${others.toFixed(1)}%`}>
        {top.map((r, i) => (
          <div key={r.name} style={{ width: `${r.share}%`, background: color, opacity: SHADES[i] }} title={`${r.name}: ${r.share.toFixed(1)}%`} />
        ))}
        <div style={{ width: `${others}%` }} className="bg-slate-200 dark:bg-gray-700" title={`Boshqalar: ${others.toFixed(1)}%`} />
      </div>
      <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
        {top.map((r, i) => (
          <li key={r.name} className="flex items-center justify-between gap-3">
            <span className="flex items-center gap-2 text-mg-text">
              <span className="h-3 w-3 shrink-0 rounded-sm" style={{ background: color, opacity: SHADES[i] }} aria-hidden="true" />{r.name}
            </span>
            <span className="tabular-nums font-semibold text-mg-heading">{r.share.toFixed(1)}%</span>
          </li>
        ))}
        <li className="flex items-center justify-between gap-3">
          <span className="flex items-center gap-2 text-mg-text"><span className="h-3 w-3 shrink-0 rounded-sm bg-slate-200 dark:bg-gray-700" aria-hidden="true" />Boshqalar</span>
          <span className="tabular-nums font-semibold text-mg-heading">{others.toFixed(1)}%</span>
        </li>
      </ul>
    </div>
  );
}
