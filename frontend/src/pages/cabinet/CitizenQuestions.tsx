import { useState } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Send } from "lucide-react";
import { answerQuestion, askQuestion, fetchMyQuestions, type CitizenQuestion } from "../../api/citizens";
import { fetchCustomOptions } from "../../api/customRequests";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

const CATEGORIES = [
  ["population", "Aholi"], ["economy", "Iqtisodiyot"], ["prices", "Narxlar"], ["social", "Ijtimoiy soha"], ["other", "Boshqa"],
] as const;

function StaffAnswer({ q, onDone }: { q: CitizenQuestion; onDone: () => void }) {
  const [text, setText] = useState(q.answer);
  if (q.status !== "new") return null;
  return (
    <div className="mt-2 flex flex-col sm:flex-row gap-2">
      <textarea value={text} onChange={(e) => setText(e.target.value)} rows={2} placeholder="Javob matni" aria-label="Javob"
        className="flex-1 px-2 py-1.5 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm" />
      <div className="flex sm:flex-col gap-2">
        <button type="button" disabled={!text.trim()} onClick={async () => { await answerQuestion(q.id, { answer: text, status: "answered" }); onDone(); }} className="px-3 py-1.5 rounded bg-blue-600 text-white text-sm disabled:opacity-50">Javob berish</button>
        <button type="button" onClick={async () => { await answerQuestion(q.id, { answer: text, status: "rejected" }); onDone(); }} className="px-3 py-1.5 rounded border text-sm">Rad etish</button>
      </div>
    </div>
  );
}

/** FQ-10: fuqaro savoli — forma, holat, javob; xodim uchun javob berish navbati. */
export default function CitizenQuestions() {
  const { data: options } = useApi(fetchCustomOptions, []);
  const [staff, setStaff] = useState(false);
  const { data, loading, error, reload } = useApi(() => fetchMyQuestions(staff), [staff]);
  const [form, setForm] = useState({ category: "population", region: "", question: "", allow_publish: true });
  const [sent, setSent] = useState(false);

  const submit = async () => {
    await askQuestion({ category: form.category, region: form.region ? Number(form.region) : null, question: form.question.trim(), allow_publish: form.allow_publish });
    setForm((f) => ({ ...f, question: "" }));
    setSent(true);
    reload();
  };
  const field = "px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-sm";

  return (
    <div className="p-6 space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2"><HelpCircle className="w-5 h-5 text-blue-600" /> Statistik savol bering</h2>
        <div className="flex gap-2">
          {options?.is_staff && (
            <button type="button" onClick={() => setStaff((v) => !v)} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">{staff ? "Mening savollarim" : "Xodim navbati"}</button>
          )}
          <Link to="/answers" className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">Ochiq savol-javoblar →</Link>
        </div>
      </div>
      {!staff && (
        <div className="rounded-xl border border-blue-200 dark:border-blue-800 p-4 space-y-3">
          <p className="text-sm text-gray-600 dark:text-gray-300">Bepul. Masalan: "Tumanimizda nechta maktab bor?" Xodim javob beradi, javob shu yerga va xabarnomaga keladi.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select aria-label="Toifa" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} className={field}>
              {CATEGORIES.map(([c, n]) => <option key={c} value={c}>{n}</option>)}
            </select>
            <select aria-label="Hudud" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} className={field}>
              <option value="">Hudud (ixtiyoriy)</option>
              {options?.regions.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
            </select>
          </div>
          <textarea value={form.question} onChange={(e) => { setForm({ ...form, question: e.target.value }); setSent(false); }} rows={3} maxLength={2000} placeholder="Savolingiz" aria-label="Savol" className={`${field} w-full`} />
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={form.allow_publish} onChange={(e) => setForm({ ...form, allow_publish: e.target.checked })} />
            Javob berilgach, savol-javobni ochiq bazaga qo'shishga roziman (ismim ko'rsatilmaydi)
          </label>
          <div className="flex items-center gap-3">
            <button type="button" disabled={form.question.trim().length < 10} onClick={submit} className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm disabled:opacity-50"><Send className="w-4 h-4" /> Yuborish</button>
            {sent && <span role="status" className="text-sm text-emerald-700">Savolingiz yuborildi.</span>}
          </div>
        </div>
      )}
      {loading && !data ? <Skeleton rows={4} /> : error ? <ErrorState onRetry={reload} /> : !data?.length ? (
        <EmptyState title={staff ? "Navbat bo'sh" : "Hali savol yubormagansiz"} />
      ) : (
        <ul className="space-y-3">
          {data.map((q) => (
            <li key={q.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
              <div className="flex flex-wrap justify-between gap-2 text-xs text-gray-500">
                <span>{q.category_label}{q.region_name ? ` · ${q.region_name}` : ""} · {formatDateTime(q.created_at, false)}</span>
                <span className={q.status === "answered" ? "text-emerald-700" : q.status === "rejected" ? "text-red-600" : ""}>{q.status_label}</span>
              </div>
              <p className="mt-1 text-gray-900 dark:text-white">{q.question}</p>
              {q.answer && <p className="mt-2 rounded-lg bg-gray-50 dark:bg-gray-900/40 p-3 text-sm text-gray-700 dark:text-gray-200">{q.answer}</p>}
              {staff && <StaffAnswer q={q} onDone={reload} />}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
