import { ArrowDownToLine, ArrowUpFromLine, Scale, Repeat2 } from "lucide-react";
import { fetchTradeFlows, TRADE_VALUE_UNIT } from "../../api/tradeFlows";
import useApi from "../../hooks/useApi";

const fmt = (n: number, d = 1) => new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: d }).format(n).replace(/,/g, " ");
/** Qiymat ming AQSh $ da: 16 433 974 -> "16,4 mlrd" */
const big = (n: number) => {
  const a = Math.abs(n);
  const s = a >= 1e6 ? `${fmt(a / 1e6)} mlrd` : a >= 1e3 ? `${fmt(a / 1e3)} mln` : fmt(a, 0);
  return n < 0 ? `−${s}` : s;
};

/**
 * Savdo oqimlari tepasidagi to'rtta katta ko'rsatkich: eksport, import, savdo balansi, aylanma.
 * Eksport/import bir yil va TN VED bo'yicha olinadi; balans va qoplanish ulushi shulardan hisoblanadi.
 */
export default function TradeKpiBand({ year, hs, periodLabel }: { year?: number; hs?: string; periodLabel?: string }) {
  const code = hs && hs.length >= 2 ? hs : undefined;
  const exp = useApi(() => fetchTradeFlows({ flow: "export", year, hs: code, limit: 1 }), [year, code]);
  const imp = useApi(() => fetchTradeFlows({ flow: "import", year, hs: code, limit: 1 }), [year, code]);
  const e = exp.data?.total_value ?? 0;
  const i = imp.data?.total_value ?? 0;
  if (!exp.data || !imp.data) {
    return <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">{[0, 1, 2, 3].map((k) => <div key={k} className="h-[150px] animate-pulse rounded-[24px] bg-[var(--pp-soft)]" />)}</div>;
  }
  const bal = e - i;
  const sum = e + i || 1;
  const cover = i ? (e / i) * 100 : 0;
  const tile = "relative flex min-w-0 flex-col gap-2 overflow-hidden rounded-[24px] border border-[var(--pp-line)] bg-[var(--pp-card)] p-5";
  const cap = "flex items-center gap-2 text-xs font-bold tracking-[0.1em] text-[var(--pp-muted)]";
  const icon = (c: string) => `flex h-9 w-9 items-center justify-center rounded-[12px] ${c}`;
  return (
    <div className="space-y-3">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <div className={tile}>
          <span className={cap}><span className={icon("bg-[#E4F7E8] text-[#12691F]")}><ArrowUpFromLine className="h-[18px] w-[18px]" aria-hidden="true" /></span>EKSPORT</span>
          <span className="mono text-[38px] font-extrabold leading-none tracking-[-0.04em] text-[#12691F] dark:text-[#6fdc86]">{big(e)}</span>
          <span className="text-xs text-[var(--pp-muted)]">{TRADE_VALUE_UNIT} · {periodLabel}</span>
        </div>
        <div className={tile}>
          <span className={cap}><span className={icon("bg-[var(--p50)] text-[var(--p800)]")}><ArrowDownToLine className="h-[18px] w-[18px]" aria-hidden="true" /></span>IMPORT</span>
          <span className="mono text-[38px] font-extrabold leading-none tracking-[-0.04em] text-[var(--btn)]">{big(i)}</span>
          <span className="text-xs text-[var(--pp-muted)]">{TRADE_VALUE_UNIT} · {periodLabel}</span>
        </div>
        <div className={tile}>
          <span className={cap}><span className={icon(bal < 0 ? "bg-[#FDE8EC] text-[#B3263F]" : "bg-[#E4F7E8] text-[#12691F]")}><Scale className="h-[18px] w-[18px]" aria-hidden="true" /></span>SAVDO BALANSI</span>
          <span className={`mono text-[38px] font-extrabold leading-none tracking-[-0.04em] ${bal < 0 ? "text-[#B3263F] dark:text-[#ff8a9c]" : "text-[#12691F] dark:text-[#6fdc86]"}`}>{bal > 0 ? "+" : ""}{big(bal)}</span>
          <span className="text-xs text-[var(--pp-muted)]">{bal < 0 ? "defitsit" : "profitsit"} · eksport importni {fmt(cover, 0)}% qoplaydi</span>
        </div>
        <div className={tile}>
          <span className={cap}><span className={icon("bg-[#EEE9FB] text-[#4B3A99]")}><Repeat2 className="h-[18px] w-[18px]" aria-hidden="true" /></span>AYLANMA</span>
          <span className="mono text-[38px] font-extrabold leading-none tracking-[-0.04em]">{big(e + i)}</span>
          <span className="text-xs text-[var(--pp-muted)]">eksport + import</span>
        </div>
      </div>
      <div className="rounded-[20px] border border-[var(--pp-line)] bg-[var(--pp-card)] px-5 py-3" role="img" aria-label={`Eksport ulushi ${fmt((e / sum) * 100, 0)}%, import ulushi ${fmt((i / sum) * 100, 0)}%`}>
        <div className="flex h-3 overflow-hidden rounded-full bg-[var(--pp-soft)]">
          <span className="block h-full bg-[linear-gradient(90deg,#1eb53a,#5be37a)] transition-[width] duration-700" style={{ width: `${(e / sum) * 100}%` }} />
          <span className="block h-full flex-1 bg-[linear-gradient(90deg,var(--btn),var(--pacc))]" />
        </div>
        <div className="mt-1.5 flex justify-between text-xs font-semibold text-[var(--pp-muted)]">
          <span>Eksport {fmt((e / sum) * 100, 0)}%</span><span>Import {fmt((i / sum) * 100, 0)}%</span>
        </div>
      </div>
    </div>
  );
}
