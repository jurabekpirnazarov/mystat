import { useEffect, useState } from "react";
import { Database, Download, Plus } from "lucide-react";
import {
  cancelCustomRequest, createCustomRequest, fetchCustomOptions, listCustomRequests, quoteCustomRequest,
  staffUpdateCustomRequest, type CustomRequest, type CustomRequestSpec,
} from "../../api/customRequests";
import { asApiError } from "../../api/errors";
import useApi from "../../hooks/useApi";
import { DemoBadge, EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { formatDateTime, formatMoney } from "../../utils/format";

const STATUS_CLS: Record<CustomRequest["status"], string> = {
  created: "bg-gray-100 text-gray-700",
  priced: "bg-blue-100 text-blue-700",
  in_progress: "bg-amber-100 text-amber-800",
  completed: "bg-emerald-100 text-emerald-700",
  cancelled: "bg-red-100 text-red-700",
};
const THIS_YEAR = new Date().getFullYear();

function NewRequestForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { data: options } = useApi(fetchCustomOptions, []);
  const [spec, setSpec] = useState<CustomRequestSpec>({
    data_type: "trade", indicators: [], year_from: THIS_YEAR - 5, year_to: THIS_YEAR - 1, regions: [], output_format: "xlsx", urgent: false, comment: "",
  });
  const [price, setPrice] = useState<{ price_bhm: string; price_sum: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const type = options?.data_types.find((t) => t.code === spec.data_type);

  // Narx har o'zgarishda backend'dan olinadi (formula frontend'da takrorlanmaydi)
  useEffect(() => {
    if (!spec.indicators.length) {
      setPrice(null);
      return;
    }
    const t = setTimeout(() => {
      quoteCustomRequest(spec).then((p) => { setPrice(p); setError(null); }).catch((e) => {
        setPrice(null);
        const data = asApiError(e).response?.data;
        setError(data ? Object.values(data).flat().join(" ") : "Narxni hisoblab bo'lmadi");
      });
    }, 300);
    return () => clearTimeout(t);
  }, [spec]);

  const toggle = <K extends "indicators" | "regions">(key: K, value: CustomRequestSpec[K][number]) =>
    setSpec((s) => {
      const list = s[key] as (string | number)[];
      return { ...s, [key]: list.includes(value) ? list.filter((v) => v !== value) : [...list, value] };
    });

  const submit = async () => {
    setSending(true);
    try {
      await createCustomRequest(spec);
      onCreated();
    } catch {
      setError("Buyurtmani yuborib bo'lmadi");
    } finally {
      setSending(false);
    }
  };

  if (!options) return <Skeleton rows={6} />;
  const field = "px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm";
  return (
    <div className="rounded-xl border border-blue-200 dark:border-blue-800 p-4 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="text-sm">Ma'lumot turi
          <select className={`${field} w-full mt-1`} value={spec.data_type} onChange={(e) => setSpec((s) => ({ ...s, data_type: e.target.value, indicators: [] }))}>
            {options.data_types.map((t) => <option key={t.code} value={t.code} disabled={!t.available}>{t.name}{t.available ? "" : " (tarif yo'q)"}</option>)}
          </select>
        </label>
        <div className="flex gap-2 items-end">
          <label className="text-sm flex-1">Yildan
            <input type="number" className={`${field} w-full mt-1`} value={spec.year_from} onChange={(e) => setSpec((s) => ({ ...s, year_from: Number(e.target.value) }))} />
          </label>
          <label className="text-sm flex-1">Yilgacha
            <input type="number" className={`${field} w-full mt-1`} value={spec.year_to} onChange={(e) => setSpec((s) => ({ ...s, year_to: Number(e.target.value) }))} />
          </label>
        </div>
      </div>
      <fieldset>
        <legend className="text-sm mb-1">Ko'rsatkichlar</legend>
        <div className="flex flex-wrap gap-2">
          {type?.indicators.map((i) => (
            <label key={i} className={`px-3 py-1.5 rounded-full border text-sm cursor-pointer ${spec.indicators.includes(i) ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
              <input type="checkbox" className="sr-only" checked={spec.indicators.includes(i)} onChange={() => toggle("indicators", i)} />{i}
            </label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="text-sm mb-1">Hududlar <span className="text-gray-500">(tanlanmasa — respublika bo'yicha)</span></legend>
        <div className="flex flex-wrap gap-2">
          {options.regions.map((r) => (
            <label key={r.id} className={`px-2.5 py-1 rounded-full border text-xs cursor-pointer ${spec.regions.includes(r.id) ? "bg-blue-600 text-white border-blue-600" : "border-gray-300 dark:border-gray-600"}`}>
              <input type="checkbox" className="sr-only" checked={spec.regions.includes(r.id)} onChange={() => toggle("regions", r.id)} />{r.name}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="flex flex-wrap gap-4 text-sm">
        <label className="flex items-center gap-2">Format
          <select className={field} value={spec.output_format} onChange={(e) => setSpec((s) => ({ ...s, output_format: e.target.value as "xlsx" | "pdf" }))}>
            <option value="xlsx">XLSX</option><option value="pdf">PDF</option>
          </select>
        </label>
        <label className="flex items-center gap-2"><input type="checkbox" checked={spec.urgent} onChange={(e) => setSpec((s) => ({ ...s, urgent: e.target.checked }))} /> Shoshilinch</label>
      </div>
      <textarea className={`${field} w-full`} rows={2} placeholder="Izoh (qo'shimcha talablar)" value={spec.comment} onChange={(e) => setSpec((s) => ({ ...s, comment: e.target.value }))} />
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-gray-50 dark:bg-gray-800 p-3">
        <div className="text-sm">
          {price ? (<>Taxminiy narx: <b>{formatMoney(price.price_sum)}</b> <span className="text-gray-500">({price.price_bhm} BHM)</span></>) : <span className="text-gray-500">Ko'rsatkichlarni tanlang</span>}
          {error && <p className="text-red-600 text-xs">{error}</p>}
          <p className="text-xs text-gray-500">Onlayn to'lov yo'q: narxni xodim tasdiqlaydi, to'lov bo'yicha menejer bog'lanadi.</p>
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onCancel} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Bekor</button>
          <button type="button" onClick={submit} disabled={!price || sending} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">Buyurtma berish</button>
        </div>
      </div>
    </div>
  );
}

function StaffActions({ req, onDone }: { req: CustomRequest; onDone: () => void }) {
  const [price, setPrice] = useState(req.approved_price_sum ?? req.price_sum);
  const [file, setFile] = useState<File | null>(null);
  const save = async (data: FormData | Record<string, unknown>) => {
    await staffUpdateCustomRequest(req.id, data);
    onDone();
  };
  if (req.status === "completed" || req.status === "cancelled") return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2 text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
      <input value={price} onChange={(e) => setPrice(e.target.value)} className="w-36 px-2 py-1 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700" aria-label="Tasdiqlangan narx" />
      <button type="button" onClick={() => save({ approved_price_sum: price })} className="px-2 py-1 rounded bg-blue-600 text-white">Narxni tasdiqlash</button>
      <button type="button" onClick={() => save({ status: "in_progress" })} className="px-2 py-1 rounded border">Bajarilmoqda</button>
      <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} aria-label="Natija fayli" className="text-xs" />
      <button type="button" disabled={!file} onClick={() => { const fd = new FormData(); if (file) fd.append("result_file", file); void save(fd); }} className="px-2 py-1 rounded bg-emerald-600 text-white disabled:opacity-50">Natijani yuklash</button>
    </div>
  );
}

/** K-06: individual statistik ma'lumot buyurtmasi (mijoz) va xodim navbati. */
export default function CustomRequests() {
  const { data: options } = useApi(fetchCustomOptions, []);
  const [staffView, setStaffView] = useState(false);
  const { data, loading, error, reload } = useApi(() => listCustomRequests(staffView), [staffView]);
  const [creating, setCreating] = useState(false);

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-xl font-semibold text-gray-900 dark:text-white flex items-center gap-2">
          <Database className="w-5 h-5 text-blue-600" /> Individual ma'lumot buyurtmasi
        </h2>
        <div className="flex gap-2">
          {options?.is_staff && (
            <button type="button" onClick={() => setStaffView((v) => !v)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
              {staffView ? "Mening buyurtmalarim" : "Xodim navbati"}
            </button>
          )}
          {!staffView && !creating && (
            <button type="button" onClick={() => setCreating(true)} className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">
              <Plus className="w-4 h-4" /> Yangi buyurtma
            </button>
          )}
        </div>
      </div>
      <p className="text-sm text-gray-600 dark:text-gray-300">Katalogda yo'q ma'lumot kerakmi (masalan, 2020–2025 yillarda Farg'ona vodiysi to'qimachilik korxonalari)? Parametrlarni tanlang — narx darhol hisoblanadi, natija fayli shu yerga keladi.</p>
      {creating && <NewRequestForm onCancel={() => setCreating(false)} onCreated={() => { setCreating(false); reload(); }} />}

      {loading && !data ? (
        <Skeleton variant="table" rows={4} />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : !data || data.length === 0 ? (
        <EmptyState icon={Database} title={staffView ? "Navbat bo'sh" : "Hali buyurtma yo'q"} />
      ) : (
        <ul className="space-y-3">
          {data.map((r) => (
            <li key={r.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-wrap items-start justify-between gap-2">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">#{r.id} · {r.data_type_label} · {r.year_from}–{r.year_to} <DemoBadge show={r.is_synthetic} /></p>
                  <p className="text-xs text-gray-500">{r.indicators.join(", ")} · {r.region_names.join(", ")} · {r.output_format.toUpperCase()}{r.urgent ? " · shoshilinch" : ""}</p>
                  {staffView && <p className="text-xs text-gray-500">Mijoz: {r.user_name}</p>}
                </div>
                <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${STATUS_CLS[r.status]}`}>{r.status_label}</span>
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                <span>Hisoblangan: {formatMoney(r.price_sum)}</span>
                {r.approved_price_sum && <span className="font-semibold">Tasdiqlangan: {formatMoney(r.approved_price_sum)}</span>}
                <span className="text-xs text-gray-500">{formatDateTime(r.created_at, false)}</span>
                {r.result_file && (
                  <a href={r.result_file} className="inline-flex items-center gap-1 text-blue-600 hover:underline" target="_blank" rel="noreferrer"><Download className="w-4 h-4" /> Natija</a>
                )}
                {!staffView && (r.status === "created" || r.status === "priced") && (
                  <button type="button" onClick={async () => { await cancelCustomRequest(r.id); reload(); }} className="text-xs text-red-600 hover:underline">Bekor qilish</button>
                )}
              </div>
              {r.status === "priced" && !staffView && <p className="mt-1 text-xs text-blue-700 dark:text-blue-300">Narx tasdiqlandi — to'lov bo'yicha menejer bog'lanadi.</p>}
              {r.staff_comment && <p className="mt-1 text-xs text-gray-600 dark:text-gray-300">Xodim izohi: {r.staff_comment}</p>}
              {staffView && <StaffActions req={r} onDone={reload} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
