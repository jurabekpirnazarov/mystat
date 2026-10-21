import { useEffect, useMemo, useState } from "react";
import {
  Bar, BarChart, CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis,
} from "recharts";
import { Database, FileSpreadsheet, RotateCcw, Search, Sigma, Users } from "lucide-react";
import {
  downloadDemographicExcel,
  fetchDemographicData,
  fetchDemographicSchema,
  type DemographicFilter,
  type DemographicQuery,
  type DemographicSection,
  type FilterValue,
} from "../api/demographics";
import useApi from "../hooks/useApi";
import SubscribeButton from "../components/SubscribeButton";
import { DemoBadge, EmptyState, ErrorState, PageHeader, Skeleton, StatCard, SampleBanner } from "../components/ui";

// Kategorik palitra (seriyalar uchun), ikkala mavzuda o'qiladigan
const SERIES = ["#2563eb", "#16a34a", "#d97706", "#9333ea", "#dc2626", "#0891b2"];
const MAX_SERIES = 6;
const fmt = (n: number) => new Intl.NumberFormat("uz-UZ").format(Math.round(n)).replace(/,/g, " ");

function isYear(f: DemographicFilter) {
  return f.ui === "range_or_list";
}

function FilterControl({ filter, value, onChange }: { filter: DemographicFilter; value: FilterValue | undefined; onChange: (v: FilterValue | undefined) => void }) {
  const [q, setQ] = useState("");
  const selectCls = "rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-2 py-1.5 text-gray-800 dark:text-gray-100";

  if (isYear(filter)) {
    const range = (value && !Array.isArray(value) ? value : {}) as { min?: number; max?: number };
    return (
      <div className="flex items-center gap-2">
        <select aria-label={`${filter.label} dan`} className={selectCls} value={range.min ?? ""} onChange={(e) => onChange({ ...range, min: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">dan</option>
          {filter.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
        <span className="text-gray-400">—</span>
        <select aria-label={`${filter.label} gacha`} className={selectCls} value={range.max ?? ""} onChange={(e) => onChange({ ...range, max: e.target.value ? Number(e.target.value) : undefined })}>
          <option value="">gacha</option>
          {filter.options.map((o) => <option key={o} value={o}>{o}</option>)}
        </select>
      </div>
    );
  }

  const selected = new Set((Array.isArray(value) ? value : []).map(String));
  const toggle = (opt: string | number) => {
    const next = new Set(selected);
    if (next.has(String(opt))) next.delete(String(opt));
    else next.add(String(opt));
    const list = filter.options.filter((o) => next.has(String(o)));
    onChange(list.length ? list : undefined);
  };

  if (filter.ui === "radio" || filter.options.length <= 4) {
    const chip = (active: boolean) =>
      `px-3 py-1 rounded-full text-sm border ${active ? "bg-blue-600 border-blue-600 text-white" : "border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700"}`;
    return (
      <div className="flex flex-wrap gap-1.5">
        <button type="button" className={chip(selected.size === 0)} onClick={() => onChange(undefined)}>Hammasi</button>
        {filter.options.map((o) => (
          <button key={o} type="button" aria-pressed={selected.has(String(o))} className={chip(selected.has(String(o)))} onClick={() => toggle(o)}>{o}</button>
        ))}
      </div>
    );
  }

  const visible = filter.options.filter((o) => !q || String(o).toLowerCase().includes(q.toLowerCase()));
  return (
    <div>
      {filter.options.length > 15 && (
        <div className="relative mb-2">
          <Search className="w-4 h-4 absolute left-2 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input aria-label={`${filter.label} qidirish`} value={q} onChange={(e) => setQ(e.target.value)} placeholder="Qidirish…" className={`${selectCls} w-full pl-7`} />
        </div>
      )}
      <div className="max-h-44 overflow-y-auto pr-1 grid grid-cols-2 gap-x-2 gap-y-1">
        {visible.map((o) => (
          <label key={o} className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
            <input type="checkbox" className="rounded" checked={selected.has(String(o))} onChange={() => toggle(o)} />
            <span className="truncate">{o}</span>
          </label>
        ))}
      </div>
      {selected.size > 0 && (
        <button type="button" onClick={() => onChange(undefined)} className="mt-1 text-xs text-blue-600 hover:underline">
          Tanlovni tozalash ({selected.size})
        </button>
      )}
    </div>
  );
}

function SectionView({ section, synthetic }: { section: DemographicSection; synthetic: boolean }) {
  const filters = useMemo(() => [...section.filters].sort((a, b) => (a.order ?? 0) - (b.order ?? 0)), [section]);
  const yearCol = filters.find(isYear)?.column;
  const dims = filters.map((f) => f.column);
  const [values, setValues] = useState<Record<string, FilterValue>>({});
  const [xDim, setXDim] = useState<string>(yearCol ?? dims[0]);
  const [seriesDim, setSeriesDim] = useState<string>("");
  const [exporting, setExporting] = useState(false);
  const valueCol = section.value_column.name ?? "";
  const valueLabel = section.value_column.label ?? valueCol;

  useEffect(() => {
    setValues({});
    setXDim(yearCol ?? dims[0]);
    setSeriesDim("");
    // eslint-disable-next-line react-hooks/exhaustive-deps -- bo'lim almashganda boshlang'ich holat
  }, [section.slug]);

  const query: DemographicQuery = useMemo(
    () => ({ filters: values, group_by: [xDim, seriesDim].filter(Boolean) }),
    [values, xDim, seriesDim]
  );
  const { data, loading, error, reload } = useApi(() => fetchDemographicData(section.slug, query), [section.slug, query]);

  const { chartRows, seriesKeys } = useMemo(() => {
    const rows = data?.rows ?? [];
    if (!seriesDim) {
      const sorted = [...rows].sort((a, b) => (xDim === yearCol ? Number(a[xDim]) - Number(b[xDim]) : Number(b[valueCol]) - Number(a[valueCol])));
      return { chartRows: sorted.slice(0, 40).map((r) => ({ x: String(r[xDim]), [valueLabel]: Number(r[valueCol]) })), seriesKeys: [valueLabel] };
    }
    // Eng katta MAX_SERIES ta seriya, qolganlari tushirib qoldiriladi
    const totals = new Map<string, number>();
    rows.forEach((r) => totals.set(String(r[seriesDim]), (totals.get(String(r[seriesDim])) ?? 0) + Number(r[valueCol] ?? 0)));
    const keys = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, MAX_SERIES).map(([k]) => k);
    const byX = new Map<string, Record<string, number | string>>();
    rows.forEach((r) => {
      const s = String(r[seriesDim]);
      if (!keys.includes(s)) return;
      const x = String(r[xDim]);
      const entry = byX.get(x) ?? { x };
      entry[s] = Number(r[valueCol] ?? 0);
      byX.set(x, entry);
    });
    const list = [...byX.values()].sort((a, b) => (xDim === yearCol ? Number(a.x) - Number(b.x) : String(a.x).localeCompare(String(b.x))));
    return { chartRows: list.slice(0, 40), seriesKeys: keys };
  }, [data, xDim, seriesDim, valueCol, valueLabel, yearCol]);

  const exportExcel = async () => {
    setExporting(true);
    try {
      await downloadDemographicExcel(section.slug, query);
    } finally {
      setExporting(false);
    }
  };

  const isLine = xDim === yearCol;
  const selectCls = "rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm px-3 py-2 text-gray-800 dark:text-gray-100";

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[18rem_1fr] gap-6">
      <aside className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-5 h-fit">
        <div className="flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Filtrlar</h2>
          {Object.keys(values).length > 0 && (
            <button type="button" onClick={() => setValues({})} className="inline-flex items-center gap-1 text-xs text-blue-600 hover:underline">
              <RotateCcw className="w-3.5 h-3.5" /> Tozalash
            </button>
          )}
        </div>
        {filters.map((f) => (
          <fieldset key={f.column}>
            <legend className="text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">{f.label}</legend>
            <FilterControl
              filter={f}
              value={values[f.column]}
              onChange={(v) => setValues((prev) => {
                const next = { ...prev };
                if (v === undefined) delete next[f.column];
                else next[f.column] = v;
                return next;
              })}
            />
          </fieldset>
        ))}
      </aside>

      <div className="space-y-5 min-w-0">
        <div className="flex flex-wrap items-end gap-3">
          <label className="text-sm text-gray-600 dark:text-gray-300">
            <span className="block mb-1">Gorizontal o'q</span>
            <select className={selectCls} value={xDim} onChange={(e) => { setXDim(e.target.value); if (e.target.value === seriesDim) setSeriesDim(""); }}>
              {filters.map((f) => <option key={f.column} value={f.column}>{f.label}</option>)}
            </select>
          </label>
          <label className="text-sm text-gray-600 dark:text-gray-300">
            <span className="block mb-1">Ajratish</span>
            <select className={selectCls} value={seriesDim} onChange={(e) => setSeriesDim(e.target.value)}>
              <option value="">— yo'q —</option>
              {filters.filter((f) => f.column !== xDim).map((f) => <option key={f.column} value={f.column}>{f.label}</option>)}
            </select>
          </label>
          <button type="button" onClick={exportExcel} disabled={exporting || !data?.count} className="ml-auto inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            <FileSpreadsheet className="w-4 h-4" /> {exporting ? "Tayyorlanmoqda…" : "Excel"}
          </button>
        </div>

        {loading && !data ? (
          <Skeleton variant="chart" />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : !data?.data_available ? (
          <EmptyState icon={Database} title="Ma'lumot yuklanmagan" description="Demografiya fayli serverda topilmadi. Administrator ma'lumotni yuklashi kerak." />
        ) : data.count === 0 ? (
          <EmptyState title="Tanlangan filtrlar bo'yicha ma'lumot yo'q" />
        ) : (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <StatCard label={`${valueLabel}, jami`} value={fmt(data.total)} icon={Sigma} hint="tanlangan filtrlar bo'yicha" />
              <StatCard label="Kesimlar soni" value={fmt(data.count)} icon={Users} hint={`guruhlash: ${query.group_by.join(" × ")}`} />
            </div>

            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                {valueLabel} <DemoBadge show={synthetic} label="Namuna ma'lumot" />
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  {isLine ? (
                    <LineChart data={chartRows} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="x" tick={{ fontSize: 12, fill: "#6b7280" }} axisLine={false} tickLine={false} />
                      <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={72} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      {seriesKeys.length > 1 && <Legend />}
                      {seriesKeys.map((k, i) => (
                        <Line key={k} type="monotone" dataKey={k} stroke={SERIES[i % SERIES.length]} strokeWidth={2} dot={false} isAnimationActive={false} />
                      ))}
                    </LineChart>
                  ) : (
                    <BarChart data={chartRows} margin={{ top: 8, right: 12, left: 8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                      <XAxis dataKey="x" tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} interval={0} angle={chartRows.length > 8 ? -30 : 0} textAnchor={chartRows.length > 8 ? "end" : "middle"} height={chartRows.length > 8 ? 60 : 30} />
                      <YAxis tickFormatter={(v: number) => fmt(v)} tick={{ fontSize: 11, fill: "#6b7280" }} axisLine={false} tickLine={false} width={72} />
                      <Tooltip formatter={(v: number) => fmt(v)} />
                      {seriesKeys.length > 1 && <Legend />}
                      {seriesKeys.map((k, i) => (
                        <Bar key={k} dataKey={k} fill={SERIES[i % SERIES.length]} radius={[3, 3, 0, 0]} maxBarSize={40} />
                      ))}
                    </BarChart>
                  )}
                </ResponsiveContainer>
              </div>
              {seriesDim && <p className="mt-2 text-xs text-gray-500">Eng katta {MAX_SERIES} ta seriya ko'rsatilgan.</p>}
            </section>

            <section className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 sm:p-5">
              <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Jadval</h3>
              <div className="overflow-x-auto max-h-96">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white dark:bg-gray-800">
                    <tr className="text-left text-gray-500 dark:text-gray-400 border-b border-gray-200 dark:border-gray-700">
                      {query.group_by.map((g) => <th key={g} className="py-2 pr-4 font-medium">{filters.find((f) => f.column === g)?.label ?? g}</th>)}
                      <th className="py-2 font-medium text-right">{valueLabel}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.slice(0, 300).map((r, i) => (
                      <tr key={i} className="border-b border-gray-100 dark:border-gray-700/60">
                        {query.group_by.map((g) => <td key={g} className="py-1.5 pr-4 text-gray-800 dark:text-gray-100">{r[g]}</td>)}
                        <td className="py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{fmt(Number(r[valueCol] ?? 0))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {data.count > 300 && <p className="mt-2 text-xs text-gray-500">Birinchi 300 ta qator ko'rsatilgan — to'liq ma'lumot uchun Excel'ga eksport qiling.</p>}
            </section>
          </>
        )}
      </div>
    </div>
  );
}

/** Demografik ma'lumotlar: backend `demographics/*` API asosida (avval frontend sahifasi umuman yo'q edi). U-15. */
export default function Demographics() {
  const { data, loading, error, reload } = useApi(fetchDemographicSchema, []);
  const [slug, setSlug] = useState<string | null>(null);
  const sections = data?.sections ?? [];
  const current = sections.find((s) => s.slug === slug) ?? sections[0];

  const tab = (active: boolean) =>
    `shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition ${active ? "bg-blue-600 text-white shadow" : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"}`;

  return (
    <div className="py-2">
      <div className="w-full">
        <PageHeader
          title="Demografik ma'lumotlar"
          description="Aholi soni, tug'ilish, o'lim, nikoh, ajrim va migratsiya — hudud, yil va boshqa kesimlarda."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Xizmatlar", to: "/services" }, { label: "Demografiya" }]}
          badge={<DemoBadge show={!!data?.is_synthetic} label="Namuna ma'lumot" />}
          actions={<SubscribeButton indicator="demography" title="Demografiya" />}
        />
        <SampleBanner show={!!data?.is_synthetic} />
        {loading && !data ? (
          <Skeleton variant="chart" />
        ) : error ? (
          <ErrorState onRetry={reload} />
        ) : sections.length === 0 || !current ? (
          <EmptyState icon={Database} title="Bo'limlar hali e'lon qilinmagan" />
        ) : (
          <>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-6" role="tablist" aria-label="Bo'limlar">
              {sections.map((s) => (
                <button key={s.slug} type="button" role="tab" aria-selected={s.slug === current.slug} className={tab(s.slug === current.slug)} onClick={() => setSlug(s.slug)}>
                  {s.name}
                </button>
              ))}
            </div>
            <SectionView section={current} synthetic={!!data?.is_synthetic} />
          </>
        )}
      </div>
    </div>
  );
}
