import { useState } from "react";
import { Link } from "react-router-dom";
import { BellRing, Send, Trash2 } from "lucide-react";
import { fetchSubscriptions, subscribe, unsubscribe, type Subscription } from "../../api/openApi";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

/** A-02: obunalarim — kanal, bir bosishda obunadan chiqish, Telegram ulash, oxirgi yangilanishlar. */
export default function Subscriptions() {
  const { data, loading, error, reload } = useApi(fetchSubscriptions, []);
  const [form, setForm] = useState<{ indicator: string; channel: Subscription["channel"] }>({ indicator: "cpi", channel: "in_app" });

  if (loading && !data) return <div className="p-6"><Skeleton rows={6} /></div>;
  if (error || !data) return <ErrorState onRetry={reload} />;
  const add = async () => {
    await subscribe(form.indicator, form.channel, data.indicators.find((i) => i.code === form.indicator)?.name ?? "");
    reload();
  };
  const select = "px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm";

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-xl font-semibold flex items-center gap-2"><BellRing className="w-5 h-5 text-blue-600" /> Ko'rsatkichlarga obunalar</h2>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 flex flex-wrap items-end gap-3">
        <label className="text-sm">Ko'rsatkich
          <select className={`${select} block mt-1`} value={form.indicator} onChange={(e) => setForm({ ...form, indicator: e.target.value })}>
            {data.indicators.map((i) => <option key={i.code} value={i.code}>{i.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Kanal
          <select className={`${select} block mt-1`} value={form.channel} onChange={(e) => setForm({ ...form, channel: e.target.value as Subscription["channel"] })}>
            <option value="in_app">Saytda (xabarnoma)</option><option value="email">Email</option><option value="telegram">Telegram</option>
          </select>
        </label>
        <button type="button" onClick={add} className="px-4 py-2 rounded-lg bg-blue-600 text-white text-sm">Obuna bo'lish</button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
          <p className="font-medium flex items-center gap-1"><Send className="w-4 h-4" /> Telegram</p>
          {data.telegram.connected ? <p className="text-emerald-700">Ulangan</p> : data.telegram.link ? (
            <a href={data.telegram.link} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline">Botni ulash (bir martalik havola) →</a>
          ) : <p className="text-gray-500">Bot bu muhitda sozlanmagan — Telegram xabarlari yuborilmaydi.</p>}
        </div>
        <div className="rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3">
          <p className="font-medium">Email</p>
          <p className="text-gray-600 dark:text-gray-300">{data.email.address ?? "Profilda email yo'q — email kanali ishlamaydi."}</p>
        </div>
      </div>

      {data.subscriptions.length === 0 ? <EmptyState icon={BellRing} title="Obunalar yo'q" description="CPI, tashqi savdo, hudud sahifalaridagi «Obuna bo'lish» tugmasidan ham foydalanishingiz mumkin." /> : (
        <ul className="divide-y divide-gray-100 dark:divide-gray-700 rounded-xl border border-gray-200 dark:border-gray-700">
          {data.subscriptions.map((s) => (
            <li key={s.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
              <span>{s.title || s.indicator} <span className="text-xs text-gray-500">· {s.channel_label}</span></span>
              <button type="button" onClick={async () => { await unsubscribe(s.id); reload(); }} className="inline-flex items-center gap-1 text-red-600 text-xs"><Trash2 className="w-4 h-4" /> Obunadan chiqish</button>
            </li>
          ))}
        </ul>
      )}

      <section>
        <h3 className="font-semibold mb-2">Oxirgi yangilanishlar</h3>
        {data.events.length === 0 ? <p className="text-sm text-gray-500">Hozircha yo'q.</p> : (
          <ul className="space-y-1 text-sm">
            {data.events.map((e) => <li key={e.id} className="flex justify-between gap-2"><Link to={e.link || "/"} className="text-blue-700 dark:text-blue-300 hover:underline">{e.title}</Link><span className="text-xs text-gray-500 shrink-0">{formatDateTime(e.date, false)}</span></li>)}
          </ul>
        )}
      </section>
    </div>
  );
}
