import { useNavigate, useSearchParams } from "react-router-dom";
import { MapPin } from "lucide-react";
import { fetchRegionMap } from "../api/regions";
import useApi from "../hooks/useApi";
import { ErrorState, PageHeader, SampleBanner, Skeleton, SourceBadge } from "../components/ui";
import RegionBubbleMap from "../components/maps/RegionBubbleMap";

const nf = (v: number | null) => (v === null ? "—" : new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 1 }).format(v));

/** FQ-02: hududlar xaritasi — ko'rsatkich tanlanadi, viloyat bosilsa profil ochiladi. */
export default function Regions() {
  const [params, setParams] = useSearchParams();
  const indicator = params.get("indicator") ?? "population";
  const navigate = useNavigate();
  const { data, loading, error, reload } = useApi(() => fetchRegionMap(indicator), [indicator]);
  const values = (data?.items ?? []).map((i) => i.value ?? 0);
  const max = Math.max(1, ...values);
  const sorted = [...(data?.items ?? [])].sort((a, b) => (b.value ?? -1) - (a.value ?? -1));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Mening hududim"
          description="Viloyatlar bo'yicha asosiy ko'rsatkichlar. Viloyatni tanlab, uning to'liq profilini oching."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Fuqarolar uchun", to: "/citizens" }, { label: "Hududlar" }]}
          badge={<SourceBadge source={data?.data_source} />}
        />
        <SampleBanner show={data?.data_source === "synthetic"} text="Hududiy ko'rsatkichlar (aholi, ish haqi, ishsizlik va boshqalar) hozircha namuna. Sanoat korxonalari soni va tashqi savdo — real ma'lumot." />
        <label className="block mb-4 text-sm max-w-sm">
          Ko'rsatkich
          <select value={indicator} onChange={(e) => setParams({ indicator: e.target.value })} className="mt-1 w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800">
            {(data?.indicators ?? [{ key: indicator, label: data?.label ?? "" }]).map((i) => <option key={i.key} value={i.key}>{i.label}</option>)}
          </select>
        </label>
        {loading && !data ? (
          <Skeleton variant="chart" />
        ) : error || !data ? (
          <ErrorState onRetry={reload} />
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <RegionBubbleMap
                height={420}
                items={data.items.filter((i) => i.value !== null).map((i) => ({ code: i.code, value: i.value as number, label: `${nf(i.value)} ${data.unit}` }))}
                colorFor={(i) => `hsl(${220 - (i.value / max) * 200}, 75%, 45%)`}
                onSelect={(code) => {
                  const r = data.items.find((i) => i.code === code);
                  if (r) navigate(`/regions/${r.region_id}`);
                }}
              />
              <p className="mt-2 text-xs text-gray-500">{data.label}{data.year ? `, ${data.year}-yil` : ""}. Rang: ko'k — past, qizil — yuqori.</p>
            </div>
            <ol className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 divide-y divide-gray-100 dark:divide-gray-700">
              {sorted.map((r, i) => (
                <li key={r.region_id}>
                  <button type="button" onClick={() => navigate(`/regions/${r.region_id}`)} className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <span className="w-6 text-xs text-gray-400 tabular-nums">{i + 1}</span>
                    <MapPin className="w-4 h-4 text-blue-600 shrink-0" aria-hidden="true" />
                    <span className="flex-1 text-sm">{r.name}</span>
                    <span className="text-sm tabular-nums font-medium">{nf(r.value)}</span>
                  </button>
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </div>
  );
}
