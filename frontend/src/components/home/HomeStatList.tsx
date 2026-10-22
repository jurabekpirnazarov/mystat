import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer, YAxis } from "recharts";
import { ArrowDownRight, ArrowUpRight, Briefcase, Coins, EyeOff, Landmark, TrendingUp, Users, Wallet, Activity, type LucideIcon } from "lucide-react";
import type { HomeCards } from "../../api/homeWidgets";
import { CARD_BY_KEY, REPUBLIC, type HomeCardKey } from "../../config/homeWidgets";
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
  return (
    <section aria-label={t({ uz: "Asosiy ko'rsatkichlar", ru: "Основные показатели" })} className="flex flex-1 flex-col rounded-[12px] border border-mg-border bg-mg-surface p-4">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-mg-primary">{t({ uz: "Asosiy ko'rsatkichlar", ru: "Основные показатели" })}</h3>
      <ul className="mt-2 flex flex-1 flex-col divide-y divide-mg-border">
        {!cards
          ? Array.from({ length: 4 }, (_, i) => <li key={i} className="h-[68px] animate-pulse py-3" aria-busy="true"><span className="block h-full rounded bg-mg-info" /></li>)
          : keys.map((k) => {
              const def = CARD_BY_KEY.get(k);
              const d = cards[k];
              if (!def || !d) return null;
              const Icon = ICON[k];
              const ch = d.change;
              const Arrow = ch !== null && ch < 0 ? ArrowDownRight : ArrowUpRight;
              return (
                <li key={k} className="flex-1">
                  <Link to={`/regions?ind=${def.siat}`} className="group flex h-full min-h-[64px] items-center gap-3 py-2.5">
                    <span aria-hidden="true" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-mg-info text-mg-primary transition group-hover:bg-mg-primary group-hover:text-white"><Icon className="h-[18px] w-[18px]" /></span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-xs font-medium leading-4 text-mg-muted">{t({ uz: def.uz, ru: def.ru })}</span>
                      <span className="block text-[19px] font-bold leading-6 tabular-nums text-mg-heading">{def.format(d.value)}</span>
                      <span className="block truncate text-[11px] text-mg-muted">
                        {d.period}{d.scope === "country" && region !== REPUBLIC ? ` · ${t({ uz: "Respublika", ru: "Республика" })}` : ""}
                      </span>
                    </span>
                    <span className="flex shrink-0 flex-col items-end gap-1">
                      {d.series.length > 1 && (
                        <span className="h-6 w-14" aria-hidden="true">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={d.series.map((v, i) => ({ v, i }))} margin={{ top: 2, right: 2, left: 0, bottom: 0 }}>
                              <YAxis hide domain={["dataMin", "dataMax"]} />
                              <Area type="monotone" dataKey="v" stroke={ds.primary} strokeWidth={1.8} fill={ds.primary} fillOpacity={0.12} isAnimationActive={false} dot={false} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </span>
                      )}
                      {ch !== null && (
                        <span className="inline-flex items-center gap-0.5 whitespace-nowrap rounded-full bg-mg-info px-2 py-0.5 text-[11px] font-bold text-mg-text">
                          <Arrow className="h-3 w-3" aria-hidden="true" />
                          <span className="sr-only">{ch < 0 ? t({ uz: "pasayish", ru: "снижение" }) : t({ uz: "o'sish", ru: "рост" })}</span>
                          {ch > 0 ? "+" : ch < 0 ? "−" : ""}{nf.format(Math.abs(ch))}{def.change === "pct" ? " %" : " p.p."}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
      </ul>
      <p className="mt-1 text-[11px] text-mg-muted">{cards ? Object.values(cards)[0]?.sourceName : " "}</p>
    </section>
  );
}
