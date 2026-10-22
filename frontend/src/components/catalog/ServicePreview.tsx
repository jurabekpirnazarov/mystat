import { useEffect, useState } from "react";
import { Line, LineChart, ResponsiveContainer } from "recharts";
import { fetchTradeDynamics, fetchTradeFlows, type TradeDynamicsPoint, type TradeFlowCountry } from "../../api/tradeFlows";
import { mg } from "../../theme/tokens";

let dyn: Promise<TradeDynamicsPoint[]> | null = null;
let top: Promise<TradeFlowCountry[]> | null = null;
const loadDynamics = () => (dyn ??= fetchTradeDynamics("total").catch(() => { dyn = null; return []; }));
const loadTop = () => (top ??= fetchTradeFlows({ flow: "export", limit: 3 }).then((r) => r.countries).catch(() => { top = null; return []; }));

/** 301: oxirgi yillar aylanmasi (eksport + import), kichik chiziqli grafik. */
function Sparkline() {
  const [pts, setPts] = useState<TradeDynamicsPoint[]>([]);
  useEffect(() => {
    let alive = true;
    void loadDynamics().then((d) => alive && setPts(d.filter((p) => p.value > 0)));
    return () => {
      alive = false;
    };
  }, []);
  if (pts.length < 2) return null;
  return (
    <span className="flex items-center gap-3" aria-label={`Aylanma, ${pts[0].year}–${pts[pts.length - 1].year}`} role="img">
      <span className="h-9 w-28">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={pts}><Line type="monotone" dataKey="value" stroke={mg.flow.total} strokeWidth={2} dot={false} isAnimationActive={false} /></LineChart>
        </ResponsiveContainer>
      </span>
      <span className="text-xs text-mg-muted">{pts[0].year}–{pts[pts.length - 1].year}</span>
    </span>
  );
}

/** 302: eng yirik 3 eksport hamkori (ulush ustunlari). */
function TopThree() {
  const [rows, setRows] = useState<TradeFlowCountry[]>([]);
  useEffect(() => {
    let alive = true;
    void loadTop().then((r) => alive && setRows(r));
    return () => {
      alive = false;
    };
  }, []);
  if (!rows.length) return null;
  const max = Math.max(...rows.map((r) => r.share));
  return (
    <span className="block space-y-1" aria-label="Eng yirik eksport hamkorlari">
      {rows.map((r) => (
        <span key={r.country_id} className="grid grid-cols-[84px_1fr_38px] items-center gap-2 text-xs text-mg-text">
          <span className="truncate">{r.country_name}</span>
          <span className="h-2 rounded-full bg-mg-info"><span className="block h-full rounded-full" style={{ width: `${(r.share / max) * 100}%`, background: mg.flow.export }} /></span>
          <span className="text-right tabular-nums">{r.share.toFixed(0)}%</span>
        </span>
      ))}
    </span>
  );
}

/** TI-05: modul kartasi prevyusi — real ma'lumotdan, GIF yo'q; boshqa xizmatlarda prevyu yo'q (ikonka yetarli). */
export default function ServicePreview({ number }: { number: number }) {
  if (number === 301) return <Sparkline />;
  if (number === 302) return <TopThree />;
  return null;
}
