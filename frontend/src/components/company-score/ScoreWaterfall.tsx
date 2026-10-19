import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import type { Contribution, ProfileIndicator } from "../../api/companyProfile";
import { KLASS_STYLE } from "./klassStyle";
import type { Klass } from "../../api/companyScores";

interface Props {
  contribution: Contribution;
  klass: Klass;
  /** Ustun bosilganda ochiladigan ko'rsatkichlar (2-bo'limda faqat nomi va "guruhdan yuqori/past") */
  indicators: ProfileIndicator[];
  /** 3-bo'lim ochilgan bo'lsa ko'rsatkich bahosi (percentil) ham ko'rsatiladi */
  showScores?: boolean;
}

const fmt = (v: number) => `${v > 0 ? "+" : v < 0 ? "−" : "±"}${Math.abs(v).toFixed(1)}`;

/**
 * KORXONA_SCORING.md 13.3: gorizontal "sharshara" — 50 → har ustun hissasi → soliq qarzi cheklovi → yakuniy ball.
 * Hissalar backend'da hisoblangan (frontend qayta hisoblamaydi). Shkala hissalar ko'rinishi uchun 50 atrofida
 * qisqartirilgan; boshlang'ich va yakuniy qator shkala chetidan boshlanadi.
 */
export default function ScoreWaterfall({ contribution: c, klass, indicators, showScores = false }: Props) {
  const [open, setOpen] = useState<string | null>(null);
  type Row = { key: string; label: string; from: number; to: number; kind: "base" | "pillar" | "cap" | "total" | "na"; note?: string };
  const rows: Row[] = [{ key: "_base", label: "Boshlang'ich nuqta", from: c.base, to: c.base, kind: "base" }];
  let acc = c.base;
  for (const p of c.pillars) {
    if (!p.applicable) {
      rows.push({ key: p.key, label: p.name, from: acc, to: acc, kind: "na", note: "Tegishli emas, vazni qolganlarga taqsimlandi" });
      continue;
    }
    if (p.score === null) {
      rows.push({ key: p.key, label: p.name, from: acc, to: acc, kind: "na", note: "Ma'lumot yo'q, vazni qolganlarga taqsimlandi" });
      continue;
    }
    rows.push({ key: p.key, label: p.name, from: acc, to: acc + p.contribution, kind: "pillar" });
    acc += p.contribution;
  }
  if (c.cap) rows.push({ key: "_cap", label: "Soliq qarzi cheklovi", from: acc, to: acc + c.cap, kind: "cap" });
  rows.push({ key: "_total", label: "Yakuniy ball", from: c.total, to: c.total, kind: "total" });

  const values = rows.flatMap((r) => [r.from, r.to]);
  const lo = Math.max(0, Math.floor((Math.min(...values) - 5) / 5) * 5);
  const hi = Math.min(100, Math.ceil((Math.max(...values) + 5) / 5) * 5);
  const pos = (v: number) => ((v - lo) / (hi - lo)) * 100;
  const total = KLASS_STYLE[klass || "none"];

  return (
    <figure aria-label="Ball tarkibi" className="space-y-1">
      <div className="flex justify-between pl-[40%] text-[10px] text-gray-400 sm:pl-[34%]"><span>{lo}</span><span>50</span><span>{hi}</span></div>
      <ul className="space-y-1">
        {rows.map((r) => {
          const left = Math.min(r.from, r.to);
          const width = Math.abs(r.to - r.from);
          const isPillar = r.kind === "pillar" || r.kind === "na";
          const inds = indicators.filter((i) => i.pillar === r.key);
          const expanded = open === r.key;
          const label = (
            <span className="flex min-w-0 items-center gap-1">
              {isPillar && inds.length > 0 && (expanded ? <ChevronDown className="h-3 w-3 shrink-0" aria-hidden="true" /> : <ChevronRight className="h-3 w-3 shrink-0" aria-hidden="true" />)}
              <span className="truncate">{r.label}</span>
            </span>
          );
          let bar: JSX.Element | null = null;
          let value = "";
          if (r.kind === "base") {
            bar = <span className="absolute inset-y-1 left-0 rounded-sm bg-gray-300 dark:bg-gray-600" style={{ width: `${pos(r.to)}%` }} />;
            value = r.to.toFixed(0);
          } else if (r.kind === "total") {
            bar = <span className="absolute inset-y-1 left-0 rounded-sm" style={{ width: `${pos(r.to)}%`, background: total.hex }} />;
            value = r.to.toFixed(1);
          } else if (r.kind === "na") {
            value = "—";
          } else {
            const up = r.to >= r.from;
            bar = <span className={`absolute inset-y-1 rounded-sm ${r.kind === "cap" ? "bg-red-500" : up ? "bg-emerald-500" : "bg-orange-500"}`}
              style={{ left: `${pos(left)}%`, width: `${Math.max(0.6, (width / (hi - lo)) * 100)}%` }} />;
            value = fmt(r.to - r.from);
          }
          return (
            <li key={r.key}>
              <div className="grid grid-cols-[40%_1fr_3rem] items-center gap-2 text-xs sm:grid-cols-[34%_1fr_3rem]">
                {isPillar && inds.length > 0 ? (
                  <button type="button" onClick={() => setOpen(expanded ? null : r.key)} aria-expanded={expanded} className="min-w-0 text-left text-blue-700 hover:underline dark:text-blue-300">{label}</button>
                ) : <span className={`min-w-0 ${r.kind === "total" ? "font-semibold" : ""}`}>{label}</span>}
                <span className="relative h-5 rounded bg-gray-50 dark:bg-gray-800" title={r.note}>
                  <span className="absolute inset-y-0 w-px bg-gray-300 dark:bg-gray-600" style={{ left: `${pos(50)}%` }} />
                  {bar}
                  {r.note && <span className="absolute inset-0 flex items-center px-2 text-[10px] italic text-gray-500">{r.note}</span>}
                </span>
                <span className={`text-right tabular-nums ${r.kind === "total" ? "font-bold" : ""} ${r.kind === "cap" ? "text-red-600" : ""}`}>{value}</span>
              </div>
              {expanded && (
                <ul className="ml-4 mt-1 space-y-0.5 border-l border-gray-200 pl-3 dark:border-gray-700">
                  {inds.map((i) => (
                    <li key={i.code} className="flex items-center justify-between gap-2 text-xs">
                      <span className="truncate">{i.name}</span>
                      <span className={`shrink-0 ${i.position === "above" ? "text-emerald-700 dark:text-emerald-400" : i.position === "below" ? "text-orange-700 dark:text-orange-400" : "text-gray-400"}`}>
                        {i.position === "above" ? (i.kind === "absolute" ? "▲ normadan yuqori" : "▲ guruhdan yuqori") : i.position === "below" ? (i.kind === "absolute" ? "▼ normadan past" : "▼ guruhdan past") : "—"}
                        {showScores && typeof i.score === "number" && <span className="ml-1 tabular-nums text-gray-500">({Math.round(i.score)})</span>}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </li>
          );
        })}
      </ul>
      <figcaption className="text-xs text-gray-500">
        Har ustun ballni 50 dan qancha siljitgani: hissa = ustun vazni × (ustun bahosi − 50). Yig'indi + 50 = yakuniy ball{c.cap ? " (soliq qarzi cheklovidan keyin)" : ""}.
      </figcaption>
    </figure>
  );
}
