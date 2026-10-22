import type { ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowDownRight, ArrowRight, ArrowUpRight } from "lucide-react";

const nf = (v: number, d = 1) => new Intl.NumberFormat("ru-RU", { maximumFractionDigits: d }).format(v);

/** O'zgarish: belgi (▲/▼) va matn — rang yagona belgi emas (a11y). `unreliable` — taqqoslangan yil ma'lumoti to'liq emas. */
export function ChangeBadge({ pct, since, unreliable }: { pct: number | null | undefined; since?: string; unreliable?: boolean }) {
  if (pct === null || pct === undefined) return <span className="text-mg-muted">—</span>;
  const up = pct >= 0;
  const Icon = up ? ArrowUpRight : ArrowDownRight;
  return (
    <span className={`inline-flex items-center gap-1 font-semibold ${unreliable ? "text-mg-muted" : up ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}
      title={unreliable ? "Taqqoslangan yil ma'lumoti to'liq emas — ishonchsiz" : undefined}>
      {unreliable ? <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" /> : <Icon className="h-3.5 w-3.5" aria-hidden="true" />}
      <span className="sr-only">{up ? "o'sish" : "pasayish"}</span>
      {up ? "+" : "−"}{nf(Math.abs(pct))}%
      {since && <span className="font-normal text-mg-muted"> ({since})</span>}
    </span>
  );
}

/** Holat yorlig'i (Faol / Tugatilgan ...). */
export function StatusPill({ text, tone = "ok" }: { text: string; tone?: "ok" | "warn" | "off" }) {
  const cls = { ok: "bg-emerald-50 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-200", warn: "bg-amber-50 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200", off: "bg-slate-100 text-slate-600 dark:bg-gray-700 dark:text-gray-300" }[tone];
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{text}</span>;
}

/**
 * TI-08: yagona natija kartasi. Bitta asosiy raqam katta, qolganlari kichik kulrang matnda.
 *  - `variant="country"`: davlat natijasi (o'rin, qiymat, ulush, o'zgarish, narx);
 *  - `variant="company"`: korxona natijasi (nom, holat, ball, STIR, joy, OKED, o'lcham).
 */
export type ResultCardProps =
  | {
      variant: "country";
      rank?: number;
      title: string;
      flowLabel: string;
      value: string;
      unit: string;
      share?: number;
      changePct?: number | null;
      changeSince?: string;
      unreliable?: boolean;
      price?: number | null;
      to?: string;
      onClick?: () => void;
      selected?: boolean;
    }
  | {
      variant: "company";
      title: string;
      status?: string;
      statusTone?: "ok" | "warn" | "off";
      score?: ReactNode;
      meta: string[];
      to: string;
      linkLabel?: string;
    };

const base = "rounded-mg border bg-mg-surface p-4 transition";

export default function ResultCard(p: ResultCardProps) {
  if (p.variant === "company") {
    return (
      <article className={`${base} border-mg-border hover:border-mg-primary/40 hover:shadow-sm`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h3 className="flex flex-wrap items-center gap-2 text-base font-semibold text-mg-heading">
            {p.title}
            {p.status && <StatusPill text={p.status} tone={p.statusTone} />}
          </h3>
          {p.score}
        </div>
        {p.meta.map((m, i) => <p key={i} className="mt-1 text-sm text-mg-muted">{m}</p>)}
        <div className="mt-3 text-right">
          <Link to={p.to} className="inline-flex items-center gap-1 text-sm font-medium text-mg-primary hover:underline">
            {p.linkLabel ?? "Profil"} <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </article>
    );
  }
  const body = (
    <>
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="text-base font-semibold text-mg-heading">{p.title}</h3>
        {p.rank != null && <span className="text-sm font-medium text-mg-muted">{p.rank}-o'rin</span>}
      </div>
      <p className="mt-1.5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-xl font-bold tabular-nums text-mg-heading">{p.value}</span>
        <span className="text-xs text-mg-muted">{p.flowLabel}, {p.unit}</span>
      </p>
      <p className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-mg-muted">
        {p.share != null && <span>ulush {nf(p.share)}%</span>}
        {p.changePct !== undefined && <ChangeBadge pct={p.changePct} since={p.changeSince} unreliable={p.unreliable} />}
        {p.price != null && <span>o'rtacha narx {nf(p.price, 2)} USD/kg</span>}
      </p>
    </>
  );
  const cls = `${base} block w-full text-left ${p.selected ? "border-mg-primary bg-mg-info/50" : "border-mg-border hover:border-mg-primary/40"}`;
  if (p.to) return <Link to={p.to} className={cls}>{body}</Link>;
  return <button type="button" onClick={p.onClick} aria-pressed={p.selected} className={cls}>{body}</button>;
}
