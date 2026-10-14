import { useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Copy, KeyRound, Plus, Trash2 } from "lucide-react";
import { createKey, keyUsage, listKeys, revokeKey } from "../../api/openApi";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

function Usage({ id }: { id: number }) {
  const { data } = useApi(() => keyUsage(id), [id]);
  if (!data) return <Skeleton variant="line" rows={2} />;
  return (
    <div className="mt-3">
      <div className="h-36">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data.usage}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
            <XAxis dataKey="date" fontSize={10} tickFormatter={(d) => String(d).slice(5)} minTickGap={20} />
            <YAxis fontSize={10} width={35} allowDecimals={false} />
            <Tooltip />
            <Bar dataKey="requests" name="So'rovlar" fill="#2563eb" />
          </BarChart>
        </ResponsiveContainer>
      </div>
      <p className="text-xs text-gray-500">{data.endpoints.map((e) => `${e.endpoint}: ${e.n}`).join(" · ")}</p>
    </div>
  );
}

/** FQ-01: kabinetdagi "API kalitlarim" — yaratish (kalit bir marta ko'rsatiladi), bekor qilish, 30 kunlik grafik. */
export default function ApiKeys() {
  const { data, loading, error, reload } = useApi(listKeys, []);
  const [name, setName] = useState("");
  const [fresh, setFresh] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const create = async () => {
    setMessage(null);
    try {
      const k = await createKey(name.trim() || "Mening kalitim");
      setFresh(k.key);
      setName("");
      reload();
    } catch {
      setMessage("Kalit yaratib bo'lmadi (faol kalitlar soni chegaralangan).");
    }
  };

  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2"><KeyRound className="w-5 h-5 text-blue-600" /> API kalitlarim</h2>
        <Link to="/developers" className="text-sm text-blue-600 hover:underline">API hujjati →</Link>
      </div>
      <div className="flex gap-2 max-w-lg">
        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Kalit nomi (masalan: tadqiqot)" aria-label="Kalit nomi"
          className="flex-1 px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
        <button type="button" onClick={create} className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-blue-600 text-white text-sm"><Plus className="w-4 h-4" /> Yaratish</button>
      </div>
      {message && <p className="text-sm text-red-600">{message}</p>}
      {fresh && (
        <div role="alert" className="rounded-lg border border-amber-300 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm">
          <p className="font-semibold">Kalitni hozir saqlab qo'ying — u boshqa ko'rsatilmaydi:</p>
          <div className="mt-2 flex items-center gap-2">
            <code className="flex-1 break-all rounded bg-white dark:bg-gray-800 px-2 py-1">{fresh}</code>
            <button type="button" aria-label="Nusxalash" onClick={() => navigator.clipboard?.writeText(fresh)} className="p-2 rounded border"><Copy className="w-4 h-4" /></button>
          </div>
          <button type="button" onClick={() => setFresh(null)} className="mt-2 text-xs underline">Saqladim, yopish</button>
        </div>
      )}
      {loading && !data ? <Skeleton rows={4} /> : error ? <ErrorState onRetry={reload} /> : !data?.length ? (
        <EmptyState icon={KeyRound} title="Hali kalit yo'q" description="Ochiq ma'lumotlarni dasturiy olish uchun kalit yarating." />
      ) : (
        <ul className="space-y-3">
          {data.map((k) => (
            <li key={k.id} className={`rounded-xl border p-4 ${k.is_active ? "border-gray-200 dark:border-gray-700" : "border-gray-100 dark:border-gray-800 opacity-60"}`}>
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="font-medium">{k.name} <code className="text-xs text-gray-500">{k.prefix}…</code></p>
                  <p className="text-xs text-gray-500">Yaratilgan {formatDateTime(k.created_at, false)} · oxirgi foydalanish {k.last_used_at ? formatDateTime(k.last_used_at) : "—"} · bugun {k.used_today}/{k.daily_limit}</p>
                </div>
                {k.is_active ? (
                  <button type="button" onClick={async () => { await revokeKey(k.id); reload(); }} className="inline-flex items-center gap-1 text-sm text-red-600"><Trash2 className="w-4 h-4" /> Bekor qilish</button>
                ) : <span className="text-xs text-gray-500">Bekor qilingan</span>}
              </div>
              {k.is_active && <Usage id={k.id} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
