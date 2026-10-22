import { useId } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, ResponsiveContainer } from "recharts";
import { Activity, ArrowDownRight, ArrowUpRight, Briefcase, Coins, EyeOff, Landmark, TrendingUp, Users, Wallet, type LucideIcon } from "lucide-react";
import type { HomeCardData } from "../../api/homeWidgets";
import type { HomeCardDef, HomeCardKey } from "../../config/homeWidgets";
import { useLang } from "../../i18n/LangContext";
import { ds } from "../../theme/tokens";

const nf = new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 });

const ICON: Record<HomeCardKey, LucideIcon> = {
  population: Users, gdp_growth: TrendingUp, unemployment: Briefcase, wage: Wallet, gdp_per_capita: Coins, grp: Landmark, informal: EyeOff, pop_growth: Activity,
};

/**
 * 3.3: ko'rsatkich kartochkasi — ikonka, katta raqam, o'zgarish belgisi (▲/▼ + matn, faqat rang emas), maydonli mini grafik,
 * hududlar orasidagi o'rin chizig'i, manba va davr. Butun kartochka havola. Hududda qiymat yo'q bo'lsa "Respublika bo'yicha" belgisi.
 */
export default function HomeStatCard({ def, data, showScopeNote }: { def: HomeCardDef; data: HomeCardData; showScopeNote: boolean }) {
  const { t } = useLang();
  const gid = useId();
  const Icon = ICON[def.key];
  const ch = data.change;
  // O'sish har doim ham yaxshi emas (masalan ishsizlik): o'zgarish neytral rangda, ma'nosi matn va belgi bilan
  const pill = "bg-mg-info text-mg-text";
  const Arrow = ch !== null && ch < 0 ? ArrowDownRight : ArrowUpRight;
  const rankPct = data.rank && data.of ? ((data.of - data.rank + 1) / data.of) * 100 : null;
  return (
    <Link to={`/regions?ind=${def.siat}`}
      className="group relative flex min-h-[200px] flex-col overflow-hidden rounded-[12px] border border-mg-border bg-mg-surface p-5 transition hover:border-mg-primary/50">
      <div className="flex items-start justify-between gap-3">
        <h3 className="text-[15px] font-semibold leading-5 text-mg-muted">{t({ uz: def.uz, ru: def.ru })}</h3>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-mg-info text-mg-primary transition group-hover:bg-mg-primary group-hover:text-white" aria-hidden="true">
          <Icon className="h-5 w-5" />
        </span>
      </div>

      <p className="mt-3 text-[30px] font-bold leading-9 tracking-tight tabular-nums text-mg-heading">{def.format(data.value)}</p>
      <p className="mt-0.5 text-xs text-mg-muted">
        {t(def.unit)}{data.preliminary && ` · ${t({ uz: "dastlabki", ru: "предварительно" })}`}
        {showScopeNote && data.scope === "country" && <span className="ml-1 rounded-full bg-mg-info px-2 py-0.5 font-medium text-mg-primary">{t({ uz: "Respublika bo'yicha", ru: "По республике" })}</span>}
      </p>

      <div className="mt-3 flex items-end justify-between gap-3">
        {ch !== null ? (
          <span className={`inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-sm font-bold ${pill}`}>
            <Arrow className="h-4 w-4" aria-hidden="true" />
            <span className="sr-only">{ch < 0 ? t({ uz: "pasayish", ru: "снижение" }) : t({ uz: "o'sish", ru: "рост" })}</span>
            {ch > 0 ? "+" : ch < 0 ? "−" : ""}{nf.format(Math.abs(ch))}{def.change === "pct" ? " %" : " p.p."}
          </span>
        ) : <span />}
        {data.series.length > 1 && (
          <span className="h-11 w-24 min-w-0" aria-hidden="true">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data.series.map((v, i) => ({ v, i }))} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id={gid} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={ds.primary} stopOpacity={0.35} />
                    <stop offset="100%" stopColor={ds.primary} stopOpacity={0} />
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={ds.primary} strokeWidth={2} fill={`url(#${gid})`} isAnimationActive={false}
                  dot={(p: { index?: number; cx?: number; cy?: number }) => (p.index === data.series.length - 1 ? <circle key="last" cx={p.cx} cy={p.cy} r={4} fill={ds.accentStrong} stroke="#fff" strokeWidth={1.5} /> : <g key={p.index} />)} />
              </AreaChart>
            </ResponsiveContainer>
          </span>
        )}
      </div>

      <div className="mt-auto pt-3">
        {rankPct !== null && (
          <div className="mb-1.5">
            <div className="h-1.5 overflow-hidden rounded-full bg-mg-info" role="presentation"><div className="h-full rounded-full bg-mg-primary" style={{ width: `${rankPct}%` }} /></div>
            <p className="mt-1 text-xs font-medium text-mg-text">{data.of} {t({ uz: "hududdan", ru: "регионов:" })} {data.rank}-{t({ uz: "o'rin", ru: "место" })}</p>
          </div>
        )}
        <p className="text-[11px] text-mg-muted">{data.sourceName} · {data.period}</p>
      </div>
    </Link>
  );
}
