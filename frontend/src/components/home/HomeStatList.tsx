import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Briefcase, Coins, EyeOff, Landmark, TrendingUp, Users, Wallet, Activity, type LucideIcon } from "lucide-react";
import type { HomeCards } from "../../api/homeWidgets";
import { ArrowRight } from "lucide-react";
import { CARD_BY_KEY, HOME_REGIONS, REPUBLIC, type HomeCardKey } from "../../config/homeWidgets";
import { useLang } from "../../i18n/LangContext";
import { ds } from "../../theme/tokens";

const ICON: Record<HomeCardKey, LucideIcon> = {
  population: Users, gdp_growth: TrendingUp, unemployment: Briefcase, wage: Wallet, gdp_per_capita: Coins, grp: Landmark, informal: EyeOff, pop_growth: Activity,
};
const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

/**
 * Yon ustun: asosiy ko'rsatkichlar ixcham qator-ro'yxat ko'rinishida — ikonka, qiymat, o'zgarish (▲/▼ + matn, neytral rang),
 * mini grafik. Har qator ko'rsatkichning xarita sahifasiga havola. Ma'lumoti yo'q ko'rsatkich qatori chiqmaydi.
 */
export default function HomeStatList({ keys, cards, region }: { keys: HomeCardKey[]; cards: HomeCards | null; region: string }) {
  const { t } = useLang();
  const reg = HOME_REGIONS.find((r) => r.soato === region);
  return (
    <section aria-label={t({ uz: "Asosiy ko'rsatkichlar", ru: "Основные показатели" })} className="flex flex-1 flex-col rounded-[12px] border border-mg-border bg-mg-surface p-4">
      <div className="flex items-start justify-between gap-2">
        <h3 className="whitespace-nowrap text-sm font-bold text-mg-heading">{t({ uz: "Asosiy ko'rsatkichlar", ru: "Основные показатели" })}</h3>
        {reg && <span className="max-w-[46%] truncate rounded-full bg-mg-info px-2.5 py-0.5 text-[11px] font-semibold text-mg-text">{t(reg).replace(/\s+(viloyati|Respublikasi|область)$/i, "").replace(/^Республика /, "")}</span>}
      </div>
      <ul className="mt-3 flex flex-col gap-1.5">
        {!cards
          ? Array.from({ length: 4 }, (_, i) => <li key={i} className="h-[72px] animate-pulse" aria-busy="true"><span className="block h-full rounded-lg bg-mg-info" /></li>)
          : keys.map((k) => {
              const def = CARD_BY_KEY.get(k);
              const d = cards[k];
              if (!def || !d) return null;
              const Icon = ICON[k];
              const ch = d.change;
              const Arrow = ch !== null && ch < 0 ? ArrowDownRight : ArrowUpRight;
              return (
                <li key={k}>
                  <Link to={`/regions?ind=${def.siat}`} className="group flex h-full flex-col justify-center gap-1 rounded-lg border border-transparent bg-mg-bg/60 px-3 py-2 transition hover:border-mg-border hover:bg-mg-info">
                    <span className="flex items-center justify-between gap-2">
                      <span className="flex min-w-0 items-center gap-1.5 text-xs font-semibold text-mg-muted">
                        <Icon className="h-3.5 w-3.5 shrink-0 text-mg-primary" aria-hidden="true" /><span className="truncate">{t({ uz: def.uz, ru: def.ru })}</span>
                      </span>
                      {ch !== null && (
                        <span className="inline-flex shrink-0 items-center gap-0.5 whitespace-nowrap rounded-md border border-mg-border bg-mg-surface px-1.5 py-0.5 text-[11px] font-bold text-mg-text">
                          <Arrow className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">{ch < 0 ? t({ uz: "pasayish", ru: "снижение" }) : t({ uz: "o'sish", ru: "рост" })}</span>
                          {ch > 0 ? "+" : ch < 0 ? "−" : ""}{nf.format(Math.abs(ch))}{def.change === "pct" ? " %" : " p.p."}
                        </span>
                      )}
                    </span>
                    <span className="flex items-end justify-between gap-2">
                      <span className="leading-6">
                        <span className="text-[22px] font-bold tabular-nums text-mg-heading">{def.format(d.value)}</span>
                        <span className="ml-1.5 text-[11px] text-mg-muted">{d.period}{d.scope === "country" && region !== REPUBLIC ? ` · ${t({ uz: "Resp.", ru: "Респ." })}` : ""}</span>
                      </span>
                      {d.series.length > 1 && (
                        <span className="h-6 w-14 shrink-0" aria-hidden="true">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={d.series.map((v, i) => ({ v, i }))} margin={{ top: 2, right: 3, left: 0, bottom: 0 }}>
                              <YAxis hide domain={["dataMin", "dataMax"]} />
                              <Area type="monotone" dataKey="v" stroke={ds.primary} strokeWidth={1.8} fill={ds.primary} fillOpacity={0.12} isAnimationActive={false}
                                dot={(p: { index?: number; cx?: number; cy?: number }) => (p.index === d.series.length - 1 ? <circle key="l" cx={p.cx} cy={p.cy} r={3} fill={ds.accentStrong} /> : <g key={p.index} />)} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
      </ul>
      <div className="mt-auto flex items-center justify-between gap-2 pt-3 text-[11px] text-mg-muted">
        <span className="truncate">{cards ? Object.values(cards)[0]?.sourceName : " "}</span>
        <Link to="/regions" className="inline-flex shrink-0 items-center gap-1 font-semibold text-mg-primary hover:underline">{t({ uz: "Barchasi", ru: "Все" })}<ArrowRight className="h-3 w-3" aria-hidden="true" /></Link>
      </div>
    </section>
  );
}
