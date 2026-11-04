import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Scale } from "lucide-react";
import { fetchComtradeOverview } from "../../api/tradeFlows";
import useApi from "../../hooks/useApi";

const nf = new Intl.NumberFormat("uz-UZ", { maximumFractionDigits: 1 });
const fmt = (n: number) => nf.format(n).replace(/,/g, " ");
/** AQSh dollari: 471 889 120 -> "471,9 mln $" */
const usd = (n: number | null | undefined) => {
  if (n == null) return "—";
  const a = Math.abs(n);
  return a >= 1e9 ? `${fmt(a / 1e9)} mlrd $` : a >= 1e6 ? `${fmt(a / 1e6)} mln $` : a >= 1e3 ? `${fmt(a / 1e3)} ming $` : `${fmt(a)} $`;
};

/**
 * UN Comtrade+ (O'zbekiston hisoboti) yuklangan mahsulotlar bo'yicha: yillik eksport/import, eng yirik hamkorlar va
 * bojxona ma'lumoti bilan farq. Comtrade yuklanmagan bo'lsa blok ko'rinmaydi.
 */
export default function ComtradePanel({ hs }: { hs?: string }) {
  const [code, setCode] = useState("");
  const [year, setYear] = useState<number | undefined>();
  const o = useApi(() => fetchComtradeOverview({ year, hs: code || hs || undefined }), [year, code, hs]);
  const d = o.data;
  if (!d || !d.years.length) return null;

  const empty = !d.partners.length && d.totals.export == null && d.totals.import == null;
  const gap = (k: "export" | "import") => d.compare?.rows[k];
  const chart = d.partners.map((p) => ({ name: p.country.length > 16 ? `${p.country.slice(0, 15)}…` : p.country, Eksport: p.export / 1e6, Import: p.import / 1e6 }));
  const hasExp = chart.some((c) => c.Eksport > 0);
  const hasImp = chart.some((c) => c.Import > 0);
  const label = d.hs_options.find((x) => x.code === d.hs)?.name;

  return (
    <section aria-labelledby="comtrade-h" className="rounded-[24px] border border-[var(--pp-line)] bg-[var(--pp-card)] p-5">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="comtrade-h" className="m-0 text-lg font-extrabold">Xalqaro manba: UN Comtrade+</h2>
          <p className="m-0 mt-1 text-sm text-[var(--pp-muted)]">O'zbekiston hisoboti (HS {d.hs || "jami"}{label ? `, ${label}` : ""}) · bojxona ma'lumoti bilan solishtirish</p>
        </div>
        <div className="flex flex-wrap gap-2">
          {(d.hs_options.length > 1 || empty) && (
            <select aria-label="Mahsulot" value={d.hs} onChange={(e) => setCode(e.target.value)} className="h-10 rounded-full border border-[var(--pp-line)] bg-[var(--pp-bg)] px-3 text-sm">
              {d.hs_options.map((x) => <option key={x.code} value={x.code}>HS {x.code}</option>)}
            </select>
          )}
          <select aria-label="Yil" value={d.year ?? ""} onChange={(e) => setYear(Number(e.target.value))} className="h-10 rounded-full border border-[var(--pp-line)] bg-[var(--pp-bg)] px-3 text-sm">
            {d.years.map((y) => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {empty && <p role="note" className="m-0 mt-4 rounded-2xl bg-[var(--pp-soft)] px-4 py-3 text-sm text-[var(--pp-muted)]">Tanlangan mahsulot (HS {d.hs}) uchun Comtrade ma'lumoti yuklanmagan. Yuqoridan yuklangan mahsulotni tanlang.</p>}
      {!empty && <div className="mt-4 grid gap-3 sm:grid-cols-2">
        {(["export", "import"] as const).map((k) => {
          const g = gap(k);
          return (
            <div key={k} className="rounded-2xl bg-[var(--pp-soft)] p-4">
              <span className="text-xs font-bold tracking-[0.1em] text-[var(--pp-muted)]">{k === "export" ? "EKSPORT" : "IMPORT"} · COMTRADE</span>
              <p className="mono m-0 mt-1 text-[28px] font-extrabold leading-none">{usd(d.totals[k])}</p>
              {g && (
                <p className="m-0 mt-2 flex items-start gap-1.5 text-xs text-[var(--pp-muted)]">
                  <Scale className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                  <span>Bazadagi bojxona ma'lumoti: <b>{usd(g.customs_usd)}</b>{g.diff_pct != null && <> · Comtrade {g.diff_pct > 0 ? "yuqori" : "past"}: <b>{Math.abs(g.diff_pct) > 1000 ? "10 baravardan ko'p" : `${fmt(Math.abs(g.diff_pct))}%`}</b></>}</span>
                </p>
              )}
            </div>
          );
        })}
      </div>}

      {chart.length > 0 && (
        <div className="mt-4">
          <p className="m-0 mb-1 text-xs font-semibold text-[var(--pp-muted)]">Eng yirik hamkorlar, mln AQSh $</p>
          <div className="h-64" role="img" aria-label="Hamkor davlatlar bo'yicha Comtrade qiymati">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chart} layout="vertical" margin={{ left: 8, right: 16, top: 4, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="var(--pp-line)" />
                <XAxis type="number" tick={{ fontSize: 12 }} />
                <YAxis type="category" dataKey="name" width={130} interval={0} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(v: number) => `${fmt(v)} mln $`} />
                {hasExp && hasImp && <Legend />}
                {hasExp && <Bar dataKey="Eksport" fill="var(--btn)" radius={[0, 6, 6, 0]} />}
                {hasImp && <Bar dataKey="Import" fill="var(--p800)" radius={[0, 6, 6, 0]} />}
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <p className="m-0 mt-3 text-xs text-[var(--pp-muted)]">
        Manba: UN Comtrade+ (O'zbekiston hisoboti, yillik).{d.compare ? ` ${d.compare.note}` : ""}
        {d.last_sync?.finished_at ? ` Oxirgi yangilanish: ${new Date(d.last_sync.finished_at).toLocaleDateString("uz-UZ")}.` : ""}
      </p>
    </section>
  );
}
