import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CheckCircle2, Circle, Download, MessageSquarePlus, Paperclip, Search, XCircle } from "lucide-react";
import {
  createServiceRequest,
  fetchMyRole,
  fetchPackageServiceGroups,
  fetchServiceRequests,
  respondToServiceRequest,
  type ServiceRequest,
} from "../../api/cabinet";
import useApi from "../../hooks/useApi";
import { DemoBadge, EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { formatDateTime, stripHtml } from "../../utils/format";

const STATUS: Record<ServiceRequest["status"], { label: string; cls: string }> = {
  created: { label: "Yangi", cls: "bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300" },
  pending: { label: "Ko'rib chiqilmoqda", cls: "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300" },
  completed: { label: "Bajarildi", cls: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300" },
  cancelled: { label: "Rad etildi", cls: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300" },
};
const FLOW: ServiceRequest["status"][] = ["created", "pending", "completed"];

const inputCls =
  "w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-sm text-gray-900 dark:text-gray-100 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500";

function StatusBadge({ status }: { status: ServiceRequest["status"] }) {
  const s = STATUS[status] ?? { label: status, cls: "" };
  return <span className={`px-2 py-0.5 rounded-full text-xs font-medium whitespace-nowrap ${s.cls}`}>{s.label}</span>;
}

function Timeline({ request }: { request: ServiceRequest }) {
  if (request.status === "cancelled") {
    return (
      <p className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
        <XCircle className="w-4 h-4 text-gray-400" /> So'rov rad etildi · {formatDateTime(request.updated_at)}
      </p>
    );
  }
  const reached = FLOW.indexOf(request.status);
  return (
    <ol className="flex flex-col sm:flex-row gap-3 sm:gap-6">
      {FLOW.map((step, i) => {
        const done = i <= reached;
        const Icon = done ? CheckCircle2 : Circle;
        const when = i === 0 ? request.created_at : i === reached ? request.updated_at : null;
        return (
          <li key={step} className="flex items-center gap-2 text-sm">
            <Icon className={`w-5 h-5 ${done ? "text-blue-600" : "text-gray-300 dark:text-gray-600"}`} aria-hidden="true" />
            <span className={done ? "text-gray-900 dark:text-white" : "text-gray-400"}>{STATUS[step].label}</span>
            {when && <span className="text-xs text-gray-500 dark:text-gray-400">{formatDateTime(when)}</span>}
          </li>
        );
      })}
    </ol>
  );
}

function NewRequestForm({ onCreated, onCancel }: { onCreated: () => void; onCancel: () => void }) {
  const { data, loading } = useApi(fetchPackageServiceGroups, []);
  const [serviceId, setServiceId] = useState<number | "">("");
  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (loading) return <Skeleton rows={4} />;
  if (!data?.contractId || data.groups.length === 0) {
    return (
      <EmptyState
        title="So'rov yuborish uchun faol shartnoma kerak"
        description="Tarif paketi bo'yicha shartnoma imzolangandan keyin xizmat so'rovi yuborishingiz mumkin."
        action={<button type="button" onClick={onCancel} className="text-sm text-blue-600 hover:underline">Orqaga</button>}
      />
    );
  }

  const selected = data.groups.find((g) => g.package_service.id === serviceId);
  const limitInfo = selected?.items.filter((i) => i.limit > 0).map((i) => `${i.name_uz}: ${i.limit}`).join(", ");

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!serviceId || !text.trim()) return;
    setSaving(true);
    setError(null);
    try {
      await createServiceRequest({ contract: data.contractId!, package_item: serviceId, client_input_text: text.trim(), client_file: file });
      onCreated();
    } catch {
      setError("So'rovni yuborib bo'lmadi. Qayta urinib ko'ring.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-4 max-w-2xl">
      <div>
        <label htmlFor="sr-service" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">Xizmat</label>
        <select id="sr-service" required className={inputCls} value={serviceId} onChange={(e) => setServiceId(Number(e.target.value) || "")}>
          <option value="">Tanlang…</option>
          {data.groups.map((g) => (
            <option key={g.package_service.id} value={g.package_service.id}>{stripHtml(g.package_service.name_uz)}</option>
          ))}
        </select>
        {limitInfo && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Paket limiti — {limitInfo}</p>}
      </div>
      <div>
        <label htmlFor="sr-text" className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-1">So'rov tavsifi</label>
        <textarea id="sr-text" required rows={5} className={inputCls} value={text} onChange={(e) => setText(e.target.value)}
          placeholder="Qanday ma'lumot yoki tahlil kerakligini yozing" />
      </div>
      <div>
        <label htmlFor="sr-file" className="inline-flex items-center gap-2 text-sm text-gray-700 dark:text-gray-200 cursor-pointer">
          <Paperclip className="w-4 h-4" /> {file ? file.name : "Fayl biriktirish (ixtiyoriy)"}
        </label>
        <input id="sr-file" type="file" className="sr-only" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
      </div>
      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
      <div className="flex gap-2">
        <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
          {saving ? "Yuborilmoqda…" : "Yuborish"}
        </button>
        <button type="button" onClick={onCancel} className="px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-200">
          Bekor qilish
        </button>
      </div>
    </form>
  );
}

function ReplyForm({ request, onSaved }: { request: ServiceRequest; onSaved: () => void }) {
  const [status, setStatus] = useState<ServiceRequest["status"]>(request.status === "created" ? "pending" : request.status);
  const [text, setText] = useState(request.admin_input_text ?? "");
  const [file, setFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await respondToServiceRequest(request.id, { status, admin_input_text: text, admin_file: file });
      onSaved();
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={submit} className="space-y-3 rounded-lg border border-dashed border-gray-300 dark:border-gray-600 p-4">
      <p className="text-sm font-semibold text-gray-900 dark:text-white">Xodim javobi</p>
      <select aria-label="Holat" className={inputCls} value={status} onChange={(e) => setStatus(e.target.value as ServiceRequest["status"])}>
        {(Object.keys(STATUS) as ServiceRequest["status"][]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
      </select>
      <textarea aria-label="Javob matni" rows={4} className={inputCls} value={text} onChange={(e) => setText(e.target.value)} />
      <input aria-label="Natija fayli" type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} className="text-sm" />
      <button type="submit" disabled={saving} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60">
        {saving ? "Saqlanmoqda…" : "Javobni saqlash"}
      </button>
    </form>
  );
}

function RequestDetail({ request, isEmployee, onBack, onChanged }: { request: ServiceRequest; isEmployee: boolean; onBack: () => void; onChanged: () => void }) {
  return (
    <div className="space-y-5">
      <button type="button" onClick={onBack} className="inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
        <ArrowLeft className="w-4 h-4" /> Ro'yxatga qaytish
      </button>
      <div className="flex flex-wrap items-center gap-2">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">{stripHtml(request.package_item_name)}</h3>
        <StatusBadge status={request.status} />
        <DemoBadge show={request.is_synthetic} />
      </div>
      <p className="text-sm text-gray-500 dark:text-gray-400">So'rov #{request.id} · Shartnoma {request.contract_number}</p>
      <Timeline request={request} />

      <section className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4">
        <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1">So'rov</p>
        <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">{request.client_input_text || "—"}</p>
        {request.client_file && (
          <a href={request.client_file} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
            <Paperclip className="w-4 h-4" /> Biriktirilgan fayl
          </a>
        )}
      </section>

      {(request.admin_input_text || request.admin_file) && (
        <section className="rounded-lg border border-green-200 dark:border-green-900 bg-green-50/50 dark:bg-green-900/10 p-4">
          <p className="text-xs uppercase tracking-wide text-green-700 dark:text-green-300 mb-1">Javob</p>
          <p className="text-sm text-gray-800 dark:text-gray-100 whitespace-pre-line">{request.admin_input_text}</p>
          {request.admin_file && (
            <a href={request.admin_file} target="_blank" rel="noreferrer" className="mt-2 inline-flex items-center gap-1 text-sm text-blue-600 hover:underline">
              <Download className="w-4 h-4" /> Natija faylini yuklab olish
            </a>
          )}
        </section>
      )}

      {isEmployee && request.status !== "completed" && request.status !== "cancelled" && (
        <ReplyForm request={request} onSaved={onChanged} />
      )}
    </div>
  );
}

/** Kabinet: xizmat so'rovlari (mijoz) va javob berish (xodim). U-05. */
export default function Requests() {
  const { data, loading, error, reload } = useApi(fetchServiceRequests, []);
  const [role, setRole] = useState<string | null>(null);
  const [mode, setMode] = useState<"list" | "new" | number>("list");
  const [status, setStatus] = useState("");
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetchMyRole().then(setRole).catch(() => setRole(null));
  }, []);
  const isEmployee = role === "employee" || role === "admin";

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    return (data ?? [])
      .filter((r) => !status || r.status === status)
      .filter((r) => !q || `${r.client_input_text} ${stripHtml(r.package_item_name)} ${r.contract_number}`.toLowerCase().includes(q))
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }, [data, status, query]);

  if (mode === "new") {
    return (
      <div className="p-4 sm:p-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-5">Yangi xizmat so'rovi</h2>
        <NewRequestForm onCancel={() => setMode("list")} onCreated={() => { setMode("list"); reload(); }} />
      </div>
    );
  }

  const current = typeof mode === "number" ? data?.find((r) => r.id === mode) : undefined;
  if (current) {
    return (
      <div className="p-4 sm:p-6">
        <RequestDetail request={current} isEmployee={isEmployee} onBack={() => setMode("list")} onChanged={reload} />
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Xizmat so'rovlari</h2>
        {!isEmployee && (
          <button type="button" onClick={() => setMode("new")} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            <MessageSquarePlus className="w-4 h-4" /> Yangi so'rov
          </button>
        )}
      </div>

      <div className="flex flex-col sm:flex-row gap-2 mb-4">
        <div className="relative flex-1">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" aria-hidden="true" />
          <input type="search" aria-label="Qidirish" placeholder="Qidirish…" value={query} onChange={(e) => setQuery(e.target.value)} className={`${inputCls} pl-9`} />
        </div>
        <select aria-label="Holat" className={`${inputCls} sm:w-56`} value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="">Barcha holatlar</option>
          {(Object.keys(STATUS) as ServiceRequest["status"][]).map((s) => <option key={s} value={s}>{STATUS[s].label}</option>)}
        </select>
      </div>

      {loading && !data ? (
        <Skeleton variant="table" />
      ) : error ? (
        <ErrorState onRetry={reload} />
      ) : rows.length === 0 ? (
        <EmptyState icon={MessageSquarePlus} title="So'rovlar topilmadi" description={data?.length ? "Filtrni o'zgartirib ko'ring." : "Birinchi so'rovingizni yuboring."} />
      ) : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700 rounded-lg border border-gray-200 dark:border-gray-700">
          {rows.map((r) => (
            <li key={r.id}>
              <button type="button" onClick={() => setMode(r.id)} className="w-full text-left p-4 hover:bg-gray-50 dark:hover:bg-gray-700/40 focus:outline-none focus-visible:bg-gray-50">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-gray-900 dark:text-white">{stripHtml(r.package_item_name)}</span>
                  <StatusBadge status={r.status} />
                  <DemoBadge show={r.is_synthetic} />
                  <span className="ml-auto text-xs text-gray-500 dark:text-gray-400">{formatDateTime(r.created_at)}</span>
                </div>
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">{r.client_input_text}</p>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
