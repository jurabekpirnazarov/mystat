import { FLOW_LABEL, type TradeFlow } from "../../api/tradeFlows";

const ORDER: TradeFlow[] = ["export", "import", "total"];

/**
 * TI-02: Eksport · Import · Aylanma — uch sahifada (`/ex-trade`, `/trade-flows`, `/market-report`) bir xil segment tugma.
 * Tanlov URL'da (`?flow=export|import|total`); `useFlowParam` sahifalar o'rtasida ham saqlaydi.
 */
export default function FlowToggle({ value, onChange, options = ORDER, className = "" }: {
  value: TradeFlow;
  onChange: (flow: TradeFlow) => void;
  options?: TradeFlow[];
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label="Savdo oqimi" className={`inline-flex rounded-mg border border-mg-border bg-mg-surface p-1 ${className}`}>
      {options.map((f) => {
        const active = f === value;
        return (
          <button key={f} type="button" role="radio" aria-checked={active} onClick={() => onChange(f)}
            className={`rounded-[10px] px-4 py-1.5 text-sm font-semibold transition ${active ? "bg-mg-primary text-white" : "text-mg-text hover:bg-mg-info"}`}>
            {FLOW_LABEL[f]}
          </button>
        );
      })}
    </div>
  );
}

export const isFlow = (v: string | null | undefined): v is TradeFlow => v === "export" || v === "import" || v === "total";
