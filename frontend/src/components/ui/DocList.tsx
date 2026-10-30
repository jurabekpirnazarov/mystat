import { Link } from "react-router-dom";
import type { ReactNode } from "react";

export interface DocAction {
  /** CSV | XLSX | PDF */
  label: string;
  href: string;
}

export interface DocRow {
  id: string;
  title: string;
  to: string;
  /** mavzu · hudud · davr · manba */
  meta?: string;
  date?: string;
  badge?: ReactNode;
  actions?: DocAction[];
}

/** X-11: ustunlar doim bir xil; formati yo'q katak bo'sh qoladi, ekran o'quvchiga "mavjud emas" deyiladi. */
const FORMATS = ["CSV", "XLSX", "PDF"] as const;

/**
 * LX-06: raqamlangan ro'yxat-jadval. Desktopda `<table>` (№, nom, sana, amallar), < 768 px da raqamli `<ol>`.
 */
export default function DocList({ rows, caption, showActions = false, emptyText = "Hozircha ma'lumot yo'q", compact = false }: {
  rows: DocRow[]; caption: string; showActions?: boolean; emptyText?: string; /** Ixcham: yarim kenglikdagi ustun uchun (sarlavha qatori yo'q, zichroq qatorlar) */ compact?: boolean;
}) {
  if (rows.length === 0) return <p className="py-4 text-sm text-mg-muted">{emptyText}</p>;
  const cell = compact ? "py-2" : "py-2.5";
  const action = (r: DocRow, f: string) => r.actions?.find((a) => a.label === f);
  return (
    <>
      <table className="hidden w-full border-collapse text-[15px] leading-[22px] md:table" data-density="list">
        <caption className="sr-only">{caption}</caption>
        <thead className={compact ? "sr-only" : undefined}>
          <tr className="border-b border-mg-border text-left text-xs uppercase tracking-wide text-mg-muted">
            <th scope="col" className="w-12 py-2 pr-3 font-semibold">№</th>
            <th scope="col" className="py-2 pr-3 font-semibold">Nomi</th>
            <th scope="col" className={`${compact ? "w-24" : "w-32"} py-2 pr-3 font-semibold`}>Sana</th>
            {showActions && FORMATS.map((f) => <th key={f} scope="col" className="w-16 py-2 text-center font-semibold">{f}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={r.id} className="border-b border-mg-border align-top">
              <td className={`tnum ${cell} pr-3 text-mg-muted`}>{i + 1}</td>
              <td className={`${cell} pr-3`}>
                <Link to={r.to} className="font-medium text-mg-primary hover:underline">{r.title}</Link>{r.badge && <span className="ml-2">{r.badge}</span>}
                {r.meta && <div className="text-sm text-mg-muted">{r.meta}</div>}
              </td>
              <td className={`tnum whitespace-nowrap ${cell} pr-3 text-mg-text`}>{r.date ?? ""}</td>
              {showActions && FORMATS.map((f) => {
                const a = action(r, f);
                return (
                  <td key={f} className="py-2.5 text-center">
                    {a
                      ? <a href={a.href} className="text-sm font-semibold text-mg-primary hover:underline" aria-label={`${r.title}: ${f} yuklab olish`}>{f}</a>
                      : <span className="sr-only">{f} mavjud emas</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
      <ol className="divide-y divide-mg-border border-y border-mg-border md:hidden" aria-label={caption}>
        {rows.map((r, i) => (
          <li key={r.id} className="flex gap-3 py-3 text-[15px] leading-[22px]">
            <span className="tnum w-6 shrink-0 text-mg-muted">{i + 1}.</span>
            <div className="min-w-0">
              <Link to={r.to} className="font-medium text-mg-primary hover:underline">{r.title}</Link>
              {r.meta && <div className="text-sm text-mg-muted">{r.meta}</div>}
              {r.date && <div className="tnum text-sm text-mg-muted">{r.date}</div>}
              {showActions && r.actions && r.actions.length > 0 && (
                <div className="mt-1 flex gap-3 text-sm">{r.actions.map((a) => <a key={a.label} href={a.href} className="font-semibold text-mg-primary hover:underline">{a.label}</a>)}</div>
              )}
            </div>
          </li>
        ))}
      </ol>
    </>
  );
}
