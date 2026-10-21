import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Minus, Plus, ShoppingBasket, Trash2 } from "lucide-react";
import { fetchBasket, fetchPriceRegions, fetchPrices } from "../../api/citizens";
import useApi from "../../hooks/useApi";
import { ErrorState, PageHeader, SampleBanner, Skeleton } from "../../components/ui";
import Term from "../../components/Term";
import FavoriteButton from "../../components/FavoriteButton";

const nf = (v: number | null | undefined) => (v === null || v === undefined ? "—" : new Intl.NumberFormat("ru-RU").format(Math.round(v)));
const BASKET_KEY = "mystat:basket:v1";

function loadBasket(): Record<string, number> {
  try {
    const raw = localStorage.getItem(BASKET_KEY);
    return raw ? (JSON.parse(raw) as Record<string, number>) : {};
  } catch {
    return {};
  }
}

function saveBasket(b: Record<string, number>) {
  try {
    localStorage.setItem(BASKET_KEY, JSON.stringify(b));
  } catch {
    // brauzer xotirasi yopiq bo'lsa savat faqat shu sahifa davomida saqlanadi
  }
}

function Spark({ values }: { values: (number | null)[] }) {
  const nums = values.filter((v): v is number => v !== null);
  if (nums.length < 2) return null;
  const min = Math.min(...nums);
  const max = Math.max(...nums);
  const pts = values.map((v, i) => (v === null ? null : `${(i / (values.length - 1)) * 80},${20 - ((v - min) / (max - min || 1)) * 18}`)).filter(Boolean).join(" ");
  return <svg viewBox="0 0 80 22" className="w-20 h-6" aria-hidden="true"><polyline points={pts} fill="none" stroke="#2563eb" strokeWidth="1.5" /></svg>;
}

/** FQ-06: narxlar monitoringi, hududlar taqqoslash va "savat" kalkulyatori (savat brauzerda saqlanadi). */
export default function Prices() {
  const [params, setParams] = useSearchParams();
  const selected = params.get("product") ?? "bread";
  const { data, loading, error, reload } = useApi(() => fetchPrices(), []);
  const regions = useApi(() => fetchPriceRegions(selected), [selected]);
  const [basket, setBasket] = useState<Record<string, number>>(loadBasket);
  const items = useMemo(() => Object.entries(basket).filter(([, q]) => q > 0).map(([product, qty]) => ({ product, qty })), [basket]);
  const basketSeries = useApi(() => (items.length ? fetchBasket(items) : Promise.resolve(null)), [JSON.stringify(items)]);

  useEffect(() => saveBasket(basket), [basket]);
  const change = (product: string, delta: number) => setBasket((b) => ({ ...b, [product]: Math.max(0, Math.round(((b[product] ?? 0) + delta) * 10) / 10) }));
  const product = data?.products.find((p) => p.product === selected);
  const total = (basketSeries.data?.series ?? []).slice(-1)[0]?.total;
  const yearAgo = (basketSeries.data?.series ?? []).slice(-13)[0]?.total;

  return (
    <div className="py-2">
      <div className="w-full">
        <PageHeader title="Narxlar monitoringi" description="Asosiy iste'mol mahsulotlari narxi hududlar bo'yicha va oyma-oy. O'z savatingizni tuzing."
          breadcrumbs={[{ label: "Fuqarolar uchun", to: "/citizens" }, { label: "Narxlar" }]} />
        <SampleBanner show={data?.data_source !== "real"} text="Mahsulot narxlari hozircha namuna. Umumiy inflyatsiya uchun real ISN — inflyatsiya kalkulyatorida." />
        {loading && !data ? <Skeleton variant="chart" /> : error || !data ? <ErrorState onRetry={reload} /> : (
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {data.products.map((p) => (
                  <div key={p.product} className={`rounded-xl border p-3 bg-white dark:bg-gray-800 ${p.product === selected ? "border-blue-500" : "border-gray-200 dark:border-gray-700"}`}>
                    <button type="button" onClick={() => setParams({ product: p.product })} className="w-full text-left">
                      <div className="flex justify-between gap-2">
                        <span className="font-medium text-sm">{p.name} <span className="text-xs text-gray-500">/{p.unit}</span></span>
                        <Spark values={p.series} />
                      </div>
                      <p className="text-lg font-bold">{nf(p.price)} <span className="text-xs font-normal text-gray-500">so'm</span></p>
                      <p className="text-xs">
                        <span className={(p.change_month_pct ?? 0) > 0 ? "text-red-600" : "text-emerald-700"}>{p.change_month_pct !== null ? `${p.change_month_pct > 0 ? "+" : ""}${p.change_month_pct}% oy` : ""}</span>
                        <span className="text-gray-500"> · {p.change_year_pct !== null ? `${p.change_year_pct > 0 ? "+" : ""}${p.change_year_pct}% yil` : ""}</span>
                      </p>
                    </button>
                    <div className="mt-2 flex items-center gap-2">
                      <button type="button" aria-label={`${p.name} — kamaytirish`} onClick={() => change(p.product, -1)} className="p-1 rounded border"><Minus className="w-3 h-3" /></button>
                      <span className="text-xs tabular-nums w-10 text-center">{basket[p.product] ?? 0}</span>
                      <button type="button" aria-label={`${p.name} — savatga qo'shish`} onClick={() => change(p.product, 1)} className="p-1 rounded border"><Plus className="w-3 h-3" /></button>
                      <span className="text-[11px] text-gray-500">savatda</span>
                    </div>
                  </div>
                ))}
              </div>

              {product && (
                <section className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5">
                  <div className="flex flex-wrap justify-between gap-2 mb-2">
                    <h2 className="font-semibold">{product.name}: hududlar bo'yicha ({regions.data?.month?.slice(0, 7)})</h2>
                    <FavoriteButton kind="prices" title={`Narx: ${product.name}`} params={{ product: product.product }} />
                  </div>
                  <ul className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm">
                    {(regions.data?.regions ?? []).map((r) => (
                      <li key={r.region_id} className="flex justify-between border-b border-gray-50 dark:border-gray-700/50 py-0.5">
                        <span>{r.region}</span>
                        <span className="tabular-nums">{r.price === null ? <span className="text-gray-400">Ma'lumot yo'q</span> : `${nf(r.price)} so'm`}</span>
                      </li>
                    ))}
                  </ul>
                </section>
              )}
            </div>

            <aside className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 h-fit xl:sticky xl:top-24">
              <h2 className="font-semibold flex items-center gap-2"><ShoppingBasket className="w-5 h-5 text-blue-600" /> Mening savatim</h2>
              {items.length === 0 ? (
                <p className="mt-2 text-sm text-gray-500">Mahsulot kartochkasidagi "+" bilan savatga qo'shing (masalan: non 30 dona, go'sht 3 kg). Savat shu brauzerda saqlanadi.</p>
              ) : (
                <>
                  <ul className="mt-3 space-y-1 text-sm">
                    {items.map((i) => {
                      const p = data.products.find((x) => x.product === i.product);
                      return <li key={i.product} className="flex justify-between"><span>{p?.name} × {i.qty} {p?.unit}</span><span className="tabular-nums">{nf((p?.price ?? 0) * i.qty)}</span></li>;
                    })}
                  </ul>
                  <p className="mt-3 text-lg font-bold">Jami: {nf(total)} so'm</p>
                  {yearAgo && total && <p className="text-sm text-gray-600 dark:text-gray-300">Bir yil oldin: {nf(yearAgo)} so'm — savatingiz <b>{(((total / yearAgo) - 1) * 100).toFixed(1)}%</b> qimmatlashgan (<Term id="inflation">shaxsiy inflyatsiya</Term>).</p>}
                  <div className="h-40 mt-3">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={basketSeries.data?.series ?? []}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                        <XAxis dataKey="month" fontSize={10} tickFormatter={(m) => String(m).slice(2, 7)} minTickGap={20} />
                        <YAxis fontSize={10} width={45} tickFormatter={(v) => `${Math.round(v / 1000)}k`} />
                        <Tooltip formatter={(v) => `${nf(Number(v))} so'm`} />
                        <Line type="monotone" dataKey="total" stroke="#2563eb" dot={false} strokeWidth={2} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <button type="button" onClick={() => setBasket({})} className="mt-2 inline-flex items-center gap-1 text-xs text-red-600"><Trash2 className="w-3 h-3" /> Savatni tozalash</button>
                </>
              )}
            </aside>
          </div>
        )}
      </div>
    </div>
  );
}
