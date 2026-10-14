import { useState } from "react";
import { RefreshCw } from "lucide-react";
import axiosT from "../../api/baseUrl";
import { fetchPrefill } from "../../hooks/usePrefill";
import useApi from "../../hooks/useApi";
import PrefillBadge from "../../components/forms/PrefillBadge";
import { Skeleton } from "../../components/ui";
import { PROFILE_FIELDS as FIELDS, profileCompleteness } from "../../utils/profile";

interface RegistryDiff {
  available: boolean;
  fetched_at: string | null;
  diff: { field: string; old: string | null; new: string }[];
}

const FIELD_LABEL: Record<string, string> = { org_name: "Korxona nomi", address: "Manzil" };

/** U-15: profil to'ldirilganligi; K-01: manba belgilari va "reyestrdan yangilash". */
export default function OrganizationInfo() {
  const { data, loading, reload } = useApi(fetchPrefill, []);
  const [diff, setDiff] = useState<RegistryDiff | null>(null);
  const [checking, setChecking] = useState(false);
  const [accept, setAccept] = useState<Set<string>>(new Set());
  const [message, setMessage] = useState<string | null>(null);

  if (loading && !data) return <Skeleton variant="card" />;
  if (!data) return null;
  const byField = new Map(data.fields.map((f) => [f.field, f]));
  const { percent, missing } = profileCompleteness(data.fields);

  const check = async () => {
    setChecking(true);
    setMessage(null);
    try {
      const res = (await axiosT.get<RegistryDiff>("/organizations/me/registry-diff/")).data;
      setDiff(res);
      setAccept(new Set(res.diff.map((d) => d.field)));
    } catch {
      setMessage("Reyestrni tekshirib bo'lmadi.");
    } finally {
      setChecking(false);
    }
  };

  const apply = async () => {
    const res = (await axiosT.post<{ updated: string[] }>("/organizations/me/registry-diff/", { fields: [...accept] })).data;
    setDiff(null);
    setMessage(res.updated.length ? "Ma'lumotlar yangilandi." : "O'zgarish qilinmadi.");
    reload();
  };

  return (
    <section className="mt-8 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Korxona va aloqa ma'lumotlari</h3>
        {data.has_organization && (
          <button type="button" onClick={check} disabled={checking}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50">
            <RefreshCw className={`w-4 h-4 ${checking ? "animate-spin" : ""}`} /> Reyestrdan yangilash
          </button>
        )}
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm">
          <span className="text-gray-600 dark:text-gray-300">Profil {percent}% to'ldirilgan</span>
          {missing.length > 0 && <span className="text-xs text-gray-500">Yetishmayapti: {missing.map((m) => m.label).join(", ")}</span>}
        </div>
        <div className="mt-1.5 h-2 rounded-full bg-gray-100 dark:bg-gray-700 overflow-hidden" role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100} aria-label="Profil to'ldirilganligi">
          <div className={`h-full rounded-full ${percent === 100 ? "bg-emerald-500" : "bg-blue-600"}`} style={{ width: `${percent}%` }} />
        </div>
        {missing.length > 0 && (
          <p className="mt-1 text-xs text-gray-500">Tarmoq, hudud va korxona ma'lumotlarini o'zgartirish uchun hududiy statistika boshqarmasiga murojaat qiling yoki "Reyestrdan yangilash" tugmasini bosing.</p>
        )}
      </div>

      <dl className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 text-sm">
        {FIELDS.map((f) => {
          const item = byField.get(f.key);
          return (
            <div key={f.key}>
              <dt className="text-gray-500 dark:text-gray-400">{f.label}<PrefillBadge field={item} /></dt>
              <dd className="text-gray-900 dark:text-white">{item ? String(item.value) : <span className="text-gray-400">—</span>}</dd>
            </div>
          );
        })}
      </dl>

      {message && <p role="status" className="mt-3 text-sm text-blue-700 dark:text-blue-300">{message}</p>}

      {diff && (
        <div className="mt-4 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-4 text-sm">
          {!diff.available ? (
            <p>Davlat reyestri hozir javob bermayapti. Keyinroq urinib ko'ring.</p>
          ) : diff.diff.length === 0 ? (
            <p>Reyestrdagi ma'lumotlar profilingiz bilan bir xil.</p>
          ) : (
            <>
              <p className="mb-2 font-medium">Reyestrda boshqacha qiymatlar topildi — qabul qilinadiganlarini belgilang:</p>
              {diff.diff.map((d) => (
                <label key={d.field} className="flex items-start gap-2 py-1">
                  <input type="checkbox" className="mt-1" checked={accept.has(d.field)}
                    onChange={(e) => setAccept((s) => { const n = new Set(s); if (e.target.checked) n.add(d.field); else n.delete(d.field); return n; })} />
                  <span>
                    <b>{FIELD_LABEL[d.field] ?? d.field}:</b> <s className="text-gray-500">{d.old || "—"}</s> → {d.new}
                  </span>
                </label>
              ))}
              <div className="mt-3 flex gap-2">
                <button type="button" onClick={apply} disabled={accept.size === 0} className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50">Qabul qilish</button>
                <button type="button" onClick={() => setDiff(null)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Bekor qilish</button>
              </div>
            </>
          )}
        </div>
      )}
    </section>
  );
}
