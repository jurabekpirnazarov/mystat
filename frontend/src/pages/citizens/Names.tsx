import { useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Download, Search } from "lucide-react";
import { fetchNameStats, fetchTopNames } from "../../api/citizens";
import { asApiError } from "../../api/errors";
import useApi from "../../hooks/useApi";
import { PageHeader, SampleBanner, Skeleton } from "../../components/ui";
import RegionBubbleMap from "../../components/maps/RegionBubbleMap";
import FavoriteButton from "../../components/FavoriteButton";
import { exportElementToPng } from "../../utils/exportPdf";

const nf = (v: number) => new Intl.NumberFormat("ru-RU").format(v);

/** FQ-09: "Ismingiz qanchalik ommabop?" — lotin/kirill qidiruv, yillar grafigi, hududlar, top-10. To'liq namuna. */
export default function Names() {
  const [params, setParams] = useSearchParams();
  const q = params.get("q") ?? "";
  const [input, setInput] = useState(q);
  const [gender, setGender] = useState<"M" | "F">("M");
  const stats = useApi(() => (q.length >= 3 ? fetchNameStats(q) : Promise.resolve(null)), [q]);
  const top = useApi(() => fetchTopNames({ gender }), [gender]);
  const card = useRef<HTMLDivElement>(null);
  const s = stats.data;

  return (
    <div className="py-2">
      <div className="w-full">
        <PageHeader title="Ismlar statistikasi" description="Ismingiz yangi tug'ilgan chaqaloqlarga qanchalik tez-tez qo'yiladi?"
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Ismlar" }]} />
        <SampleBanner text="Ismlar statistikasi to'liq namuna ma'lumot — real manba (FHDYo) hali ulanmagan." />
        <form className="flex gap-2 max-w-lg mb-6" onSubmit={(e) => { e.preventDefault(); setParams(input.trim() ? { q: input.trim() } : {}); }}>
          <label className="relative flex-1">
            <span className="sr-only">Ism</span>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ism (lotin yoki kirill): Muhammad, Мухаммад" className="w-full pl-9 pr-3 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800" />
          </label>
          <button type="submit" className="px-4 py-2 rounded-lg bg-blue-600 text-white">Qidirish</button>
        </form>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            {q.length > 0 && q.length < 3 && <p className="text-sm text-gray-600">Kamida 3 harf kiriting.</p>}
            {stats.loading && q.length >= 3 && !s ? <Skeleton variant="chart" /> : stats.error ? (
              <p className="text-sm text-red-600">{String(asApiError(stats.error).response?.data?.detail ?? "Xatolik")}</p>
            ) : s && !s.name ? (
              <p className="text-sm">"{q}" ismi topilmadi.{s.suggestions?.length ? <> O'xshashlari: {s.suggestions.map((n) => <button key={n} type="button" className="text-blue-600 underline mx-1" onClick={() => { setInput(n); setParams({ q: n }); }}>{n}</button>)}</> : null}</p>
            ) : s?.name ? (
              <>
                <div ref={card} className="rounded-2xl bg-mg-primary text-white p-6">
                  <p className="text-sm opacity-80">my.stat.uz · ismlar ({s.year}) · NAMUNA</p>
                  <h2 className="text-4xl font-bold mt-1">{s.name} <span className="text-2xl opacity-80">/ {s.name_cyr}</span></h2>
                  <p className="mt-2 text-lg">{s.year}-yilda <b>{nf(s.by_year?.slice(-1)[0]?.count ?? 0)}</b> chaqaloqqa qo'yilgan{s.rank ? <> · reytingda <b>{s.rank}-o'rin</b></> : null}</p>
                </div>
                <div className="flex gap-2">
                  <button type="button" onClick={() => card.current && exportElementToPng(card.current, `ism-${s.name}.png`, true)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 text-sm"><Download className="w-4 h-4" /> Ulashish kartochkasi (PNG)</button>
                  <FavoriteButton kind="names" title={`Ism: ${s.name}`} params={{ name: s.name }} />
                </div>
                <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                  <h3 className="font-semibold mb-2">Yillar bo'yicha</h3>
                  <div className="h-56">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={s.by_year}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="year" fontSize={12} />
                        <YAxis fontSize={12} width={50} />
                        <Tooltip formatter={(v) => nf(Number(v))} />
                        <Bar dataKey="count" name="Chaqaloqlar" fill="#4f46e5" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </section>
                <RegionBubbleMap height={300} unit="kishi" items={(s.by_region ?? []).map((r) => ({ code: r.code, value: r.count, label: `${nf(r.count)} ta` }))} />
              </>
            ) : null}
          </div>
          <aside className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 h-fit">
            <div className="flex items-center justify-between mb-2">
              <h2 className="font-semibold">Top-10 {top.data?.year}</h2>
              <div className="flex gap-1" role="group" aria-label="Jins">
                {(["M", "F"] as const).map((g) => <button key={g} type="button" aria-pressed={gender === g} onClick={() => setGender(g)} className={`px-2 py-1 rounded text-xs ${gender === g ? "bg-blue-600 text-white" : "border"}`}>{g === "M" ? "O'g'il" : "Qiz"}</button>)}
              </div>
            </div>
            <ol className="space-y-1">
              {top.data?.results.map((r, i) => (
                <li key={r.name}><button type="button" onClick={() => { setInput(r.name); setParams({ q: r.name }); }} className="w-full flex justify-between text-sm hover:text-blue-600"><span>{i + 1}. {r.name}</span><span className="tabular-nums text-gray-500">{nf(r.count)}</span></button></li>
              ))}
            </ol>
          </aside>
        </div>
      </div>
    </div>
  );
}
