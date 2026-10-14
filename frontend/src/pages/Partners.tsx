import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Download, Search } from "lucide-react";
import { exportPartners, partnerFilterOptions, partnersMap, searchPartners, type PartnerFilters } from "../api/partners";
import { asApiError } from "../api/errors";
import { useAuth } from "../contexts/AuthContext";
import useApi from "../hooks/useApi";
import { EmptyState, ErrorState, PageHeader, Skeleton } from "../components/ui";
import RegionBubbleMap from "../components/maps/RegionBubbleMap";
import SavedQueries from "../components/SavedQueries";

type FilterKey = "q" | "region" | "district" | "category" | "legal_form" | "page";

/** K-04: korxonalarni hudud, tuman, faoliyat turi va tashkiliy shakl bo'yicha topish; Excel eksport. */
export default function Partners() {
  const [params, setParams] = useSearchParams();
  const { isAuthenticated } = useAuth();
  const filters: PartnerFilters = useMemo(() => ({
    q: params.get("q") ?? undefined,
    region: params.get("region") ? Number(params.get("region")) : undefined,
    district: params.get("district") ?? undefined,
    category: params.get("category") ? Number(params.get("category")) : undefined,
    legal_form: params.get("legal_form") ?? undefined,
    page: Number(params.get("page") ?? 1),
  }), [params]);
  const [q, setQ] = useState(filters.q ?? "");
  const [exportMsg, setExportMsg] = useState<string | null>(null);

  const options = useApi(() => partnerFilterOptions(filters.region), [filters.region]);
  const results = useApi(() => searchPartners(filters), [params.toString()]);
  const map = useApi(() => partnersMap(filters), [filters.q, filters.district, filters.category, filters.legal_form]);

  const update = (patch: Partial<Record<FilterKey, string | number | undefined>>) => {
    const next = new URLSearchParams(params);
    Object.entries(patch).forEach(([k, v]) => (v === undefined || v === "" ? next.delete(k) : next.set(k, String(v))));
    if (!("page" in patch)) next.delete("page");
    setParams(next);
  };

  const doExport = async () => {
    setExportMsg(null);
    try {
      await exportPartners(filters);
    } catch (e) {
      const res = asApiError(e).response;
      setExportMsg(res?.status === 403 ? "Eksport limiti tugagan — paketni kengaytiring." : "Eksport qilib bo'lmadi.");
    }
  };

  const regionCode = options.data?.regions.find((r) => r.id === filters.region)?.code ?? null;
  const roots = options.data?.categories.filter((c) => c.parent === null) ?? [];
  const select = "w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm";
  const totalPages = results.data ? Math.ceil(results.data.count / results.data.page_size) : 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <PageHeader
          title="Hamkor va raqobatchilarni qidirish"
          description="Sanoat korxonalari reyestri bo'yicha: hudud, tuman, faoliyat turi va tashkiliy-huquqiy shakl."
          breadcrumbs={[{ label: "Bosh sahifa", to: "/" }, { label: "Xizmatlar", to: "/services" }, { label: "Hamkorlar" }]}
          actions={
            isAuthenticated ? (
              <button type="button" onClick={doExport} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm hover:bg-blue-700">
                <Download className="w-4 h-4" /> Excel (1000 tagacha)
              </button>
            ) : (
              <Link to="/login" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Eksport uchun kiring</Link>
            )
          }
        />
        {exportMsg && <p role="alert" className="mb-4 text-sm text-red-600">{exportMsg} <Link to="/tariffs" className="underline">Tariflar</Link></p>}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <aside className="space-y-4">
            <form className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 space-y-3" onSubmit={(e) => { e.preventDefault(); update({ q: q.trim() }); }}>
              <label className="block text-sm">
                Nomi yoki STIR
                <span className="relative block mt-1">
                  <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input value={q} onChange={(e) => setQ(e.target.value)} className={`${select} pl-8`} placeholder="masalan: tekstil" />
                </span>
              </label>
              <label className="block text-sm">
                Viloyat
                <select className={`${select} mt-1`} value={filters.region ?? ""} onChange={(e) => update({ region: e.target.value, district: undefined })}>
                  <option value="">Barchasi</option>
                  {options.data?.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                Tuman / shahar
                <select className={`${select} mt-1`} value={filters.district ?? ""} disabled={!filters.region} onChange={(e) => update({ district: e.target.value })}>
                  <option value="">{filters.region ? "Barchasi" : "Avval viloyatni tanlang"}</option>
                  {options.data?.districts.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </label>
              <label className="block text-sm">
                Faoliyat turi
                <select className={`${select} mt-1`} value={filters.category ?? ""} onChange={(e) => update({ category: e.target.value })}>
                  <option value="">Barchasi</option>
                  {roots.map((root) => (
                    <optgroup key={root.id} label={root.name}>
                      <option value={root.id}>{root.name} (hammasi)</option>
                      {options.data?.categories.filter((c) => c.parent === root.id).map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </optgroup>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                Tashkiliy-huquqiy shakl
                <select className={`${select} mt-1`} value={filters.legal_form ?? ""} onChange={(e) => update({ legal_form: e.target.value })}>
                  <option value="">Barchasi</option>
                  {options.data?.legal_forms.map((f) => <option key={f.code} value={f.code}>{f.name}</option>)}
                </select>
              </label>
              <div className="flex gap-2">
                <button type="submit" className="flex-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Qidirish</button>
                <button type="button" onClick={() => { setQ(""); setParams(new URLSearchParams()); }} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Tozalash</button>
              </div>
            </form>
            <SavedQueries kind="partners" current={{ ...filters, page: undefined }} onApply={(p) => { setQ(String(p.q ?? "")); setParams(new URLSearchParams(Object.entries(p).map(([k, v]) => [k, String(v)]))); }} />
          </aside>

          <div className="lg:col-span-3 space-y-4">
            <RegionBubbleMap
              height={300}
              selected={regionCode}
              items={(map.data ?? []).map((r) => ({ code: r.region_code, value: r.count, label: `${r.count.toLocaleString("ru-RU")} korxona` }))}
              onSelect={(code) => {
                const region = options.data?.regions.find((r) => r.code === code);
                if (region) update({ region: region.id, district: undefined });
              }}
            />
            {results.loading && !results.data ? (
              <Skeleton variant="table" rows={8} />
            ) : results.error ? (
              <ErrorState onRetry={results.reload} />
            ) : results.data && results.data.count === 0 ? (
              <EmptyState title="Korxona topilmadi" description="Filtrlarni o'zgartirib ko'ring." />
            ) : results.data ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-x-auto">
                <p className="px-4 pt-3 text-sm text-gray-600 dark:text-gray-300">{results.data.count.toLocaleString("ru-RU")} ta korxona</p>
                <table className="min-w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs text-gray-500 border-b border-gray-100 dark:border-gray-700">
                      <th className="px-4 py-2">Nomi</th><th className="px-2">STIR</th><th className="px-2">Shakl</th><th className="px-2">Hudud</th><th className="px-2 text-right">Mahsulotlar</th>
                    </tr>
                  </thead>
                  <tbody>
                    {results.data.results.map((r) => (
                      <tr key={r.stir} className="border-b border-gray-50 dark:border-gray-700/50">
                        <td className="px-4 py-2 text-gray-900 dark:text-white">{r.name}</td>
                        <td className="px-2 tabular-nums">{r.stir}</td>
                        <td className="px-2 text-xs">{r.legal_form.name}</td>
                        <td className="px-2 text-xs">{r.region}{r.district ? `, ${r.district}` : ""}</td>
                        <td className="px-2 text-right tabular-nums">{r.products}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {totalPages > 1 && (
                  <div className="flex items-center justify-between px-4 py-3 text-sm">
                    <button type="button" disabled={(filters.page ?? 1) <= 1} onClick={() => update({ page: (filters.page ?? 1) - 1 })} className="px-3 py-1 rounded border disabled:opacity-40">← Oldingi</button>
                    <span>{filters.page} / {totalPages}</span>
                    <button type="button" disabled={(filters.page ?? 1) >= totalPages} onClick={() => update({ page: (filters.page ?? 1) + 1 })} className="px-3 py-1 rounded border disabled:opacity-40">Keyingi →</button>
                  </div>
                )}
              </div>
            ) : null}
            <p className="text-xs text-gray-500">
              Manba: sanoat mahsulotlari reyestri (ishlab chiqaruvchi korxonalar). Telefon va rahbar ma'lumotlari ko'rsatilmaydi. Xaritada korxonalar viloyat markazi bo'yicha guruhlangan.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
