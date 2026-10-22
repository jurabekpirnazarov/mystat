import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchTradeDynamics, fetchTradeFlows, TRADE_VALUE_UNIT, type TradeDynamicsPoint, type TradeFlowsResponse } from "../../api/tradeFlows";
import { fetchTradeSummary, type TradeSummary } from "../../api/tradeHub";
import { serviceByNumber } from "../../config/serviceCatalog";
import ServiceCard from "../catalog/ServiceCard";
import ServicePreview from "../catalog/ServicePreview";
import { ServiceAbout, ServiceFaq } from "../catalog/ServiceAbout";
import { useServiceStats } from "../catalog/useServiceStats";
import FlowToggle from "./FlowToggle";
import TradeSearch from "./TradeSearch";
import TradeStats from "./TradeStats";
import ChartCard from "./charts/ChartCard";
import ShareStack from "./charts/ShareStack";
import TopCountriesChart from "./charts/TopCountriesChart";
import YearlyDynamicsChart, { type DynamicsRow } from "./charts/YearlyDynamicsChart";
import { useFlow } from "./useFlow";

const RELATED = [302, 303, 401, 102];

/**
 * TRADEINT_DIZAYN 5-bo'lim, `/ex-trade` tartibi: sarlavha + yangilanish sanasi → TI-01 qidiruv → TI-03 raqamlar → TI-02 oqim →
 * TI-09 dinamika va top-10 → TI-05 bog'liq xizmatlar → TI-04 "Ma'lumot haqida" va TI-12 savol-javob. Pastda parametrli tahlil (3 qadam).
 */
export default function TradeHub() {
  const navigate = useNavigate();
  const [flow, setFlow] = useFlow();
  const { items: stats } = useServiceStats();
  const [summary, setSummary] = useState<TradeSummary | null>(null);
  const [exp, setExp] = useState<TradeDynamicsPoint[] | null>(null);
  const [imp, setImp] = useState<TradeDynamicsPoint[] | null>(null);
  const [flows, setFlows] = useState<TradeFlowsResponse | null>(null);

  useEffect(() => {
    let alive = true;
    void fetchTradeSummary().then((d) => alive && setSummary(d)).catch(() => undefined);
    void Promise.all([fetchTradeDynamics("export"), fetchTradeDynamics("import")])
      .then(([e, i]) => alive && (setExp(e), setImp(i))).catch(() => alive && (setExp([]), setImp([])));
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    let alive = true;
    setFlows(null);
    void fetchTradeFlows({ flow, limit: 10 }).then((r) => alive && setFlows(r)).catch(() => alive && setFlows(null));
    return () => {
      alive = false;
    };
  }, [flow]);

  const rows: DynamicsRow[] = useMemo(() => {
    const byYear = new Map<number, DynamicsRow>();
    for (const [key, list] of [["export", exp], ["import", imp]] as const) {
      for (const p of list ?? []) {
        const mark = p.period !== "M12" ? "*" : summary?.quality[String(p.year)] ? " ⚠" : "";
        const row = byYear.get(p.year) ?? { year: p.year, label: `${p.year}${mark}`, period_label: p.period_label };
        row[key] = p.value;
        byYear.set(p.year, row);
      }
    }
    return [...byYear.values()].sort((a, b) => a.year - b.year);
  }, [exp, imp, summary]);

  const top = flows?.countries.slice(0, 10) ?? [];
  const source = `Manba: Statistika qo'mitasi, bojxona ma'lumotlari · qiymat: ${TRADE_VALUE_UNIT}`;
  const flowName = { export: "Eksport", import: "Import", total: "Aylanma" }[flow];

  return (
    <div className="mx-auto max-w-6xl space-y-6 px-1 pb-8">
      <header>
        <h2 className="text-2xl font-semibold text-mg-primary">Tashqi savdo statistikasi</h2>
        <p className="mt-1 text-sm text-mg-muted">
          Eksport va import mahsulot (HS) va davlat kesimida.
          {summary && <> Oxirgi yangilanish: {summary.latest.year}-yil {summary.latest.period_label}.</>}
        </p>
      </header>

      <TradeSearch flow={flow} />
      <TradeStats showQuality />

      <div className="flex flex-wrap items-center justify-between gap-3">
        <FlowToggle value={flow} onChange={setFlow} />
        {flows && <span className="text-sm text-mg-muted">Davr: {flows.year}-yil {flows.period_label}</span>}
      </div>

      <div className="grid gap-5 lg:grid-cols-2">
        <ChartCard title="Yillar bo'yicha dinamika" source={`${source} · * — yil to'liq emas`} empty={exp !== null && rows.length === 0} fileName="tashqi-savdo-dinamika">
          <YearlyDynamicsChart rows={rows} flow={flow} />
        </ChartCard>
        <ChartCard title={`Top-10 hamkor davlat · ${flowName.toLowerCase()}`} height={340}
          source={flows ? `${source} · ${flows.year}-yil ${flows.period_label}` : source} empty={flows !== null && top.length === 0} fileName="top-10-davlat">
          <TopCountriesChart flow={flow} rows={top.map((c) => ({ id: c.country_id, name: c.country_name, value: c.value, share: c.share }))}
            onSelect={(id) => navigate(`/trade-flows?country=${id}&flow=${flow}`)} />
        </ChartCard>
      </div>
      {top.length > 0 && (
        <ChartCard title="Ulush tarkibi" height={170} source={`${flowName}: top-5 hamkorning umumiy qiymatdagi ulushi`} fileName="ulush-tarkibi">
          <ShareStack flow={flow} rows={top.map((c) => ({ name: c.country_name, share: c.share }))} />
        </ChartCard>
      )}

      <section aria-labelledby="related-title">
        <h2 id="related-title" className="mb-4 text-[28px] text-black dark:text-white">Tashqi savdo xizmatlari</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {RELATED.map((n) => {
            const s = serviceByNumber(n);
            return s ? <ServiceCard key={n} s={s} stats={stats[n]} rich preview={<ServicePreview number={n} />} /> : null;
          })}
        </div>
      </section>

      <ServiceAbout number={301} />
      <ServiceFaq number={301} />
    </div>
  );
}
