import { useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import type { TradeFlow } from "../../api/tradeFlows";
import { isFlow } from "./FlowToggle";

const KEY = "trade-flow";

function stored(): TradeFlow {
  try {
    const v = sessionStorage.getItem(KEY);
    return isFlow(v) ? v : "export";
  } catch {
    return "export";
  }
}

/** TI-02: oqim `?flow=` da; URL'da bo'lmasa — sahifalar o'rtasida o'tganda eslab qolingan oxirgi tanlov. */
export function useFlow(fallback?: TradeFlow): [TradeFlow, (f: TradeFlow) => void] {
  const [params, setParams] = useSearchParams();
  const fromUrl = params.get("flow");
  const flow: TradeFlow = isFlow(fromUrl) ? fromUrl : fallback ?? stored();
  const setFlow = useCallback((f: TradeFlow) => {
    try {
      sessionStorage.setItem(KEY, f);
    } catch {
      /* xotira yopiq */
    }
    const next = new URLSearchParams(params);
    next.set("flow", f);
    setParams(next, { replace: true });
  }, [params, setParams]);
  return [flow, setFlow];
}
