import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, Star } from "lucide-react";
import {
  addSlots, cancelBooking, fetchMyBookings, fetchSchedule, rateBooking, updateScheduleBooking, type Booking,
} from "../../api/consultations";
import useApi from "../../hooks/useApi";
import { EmptyState, ErrorState, Skeleton } from "../../components/ui";
import { formatDateTime } from "../../utils/format";

function Rate({ b, onDone }: { b: Booking; onDone: () => void }) {
  const [value, setValue] = useState(0);
  if (b.status !== "done") return null;
  if (b.rating) return <p className="text-xs text-amber-600">Bahongiz: {"★".repeat(b.rating)}</p>;
  return (
    <div className="flex items-center gap-1" aria-label="Baholash">
      {[1, 2, 3, 4, 5].map((v) => (
        <button key={v} type="button" aria-label={`${v} baho`} onClick={async () => { setValue(v); await rateBooking(b.id, v, ""); onDone(); }}>
          <Star className={`w-5 h-5 ${v <= value ? "fill-amber-400 text-amber-400" : "text-gray-300"}`} />
        </button>
      ))}
    </div>
  );
}

function ClientView() {
  const { data, loading, error, reload } = useApi(fetchMyBookings, []);
  const [msg, setMsg] = useState<string | null>(null);
  if (loading && !data) return <Skeleton rows={4} />;
  if (error || !data) return <ErrorState onRetry={reload} />;
  if (!data.length) return <EmptyState icon={CalendarCheck} title="Konsultatsiyalar yo'q" action={<Link to="/consultation" className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Band qilish</Link>} />;
  return (
    <>
      {msg && <p role="status" className="text-sm text-blue-700">{msg}</p>}
      <ul className="space-y-3">
        {data.map((b) => (
          <li key={b.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div className="flex flex-wrap justify-between gap-2">
              <p className="font-medium">{b.topic} <span className="text-sm font-normal text-gray-500">· {b.consultant}</span></p>
              <span className="text-xs text-gray-500">{b.status_label}</span>
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">{formatDateTime(b.starts_at)} · {b.duration_min} daq. · {b.format === "online" ? "onlayn" : "ofisda"}</p>
            {b.meeting_url && b.status === "booked" && <a href={b.meeting_url} target="_blank" rel="noreferrer" className="text-sm text-blue-600 hover:underline">Uchrashuvga qo'shilish →</a>}
            {b.note && <p className="mt-1 text-xs text-gray-500">Izoh: {b.note}</p>}
            <div className="mt-2 flex items-center gap-3">
              {b.status === "booked" && (
                <button type="button" onClick={async () => { const r = await cancelBooking(b.id); setMsg(r.limit_refunded ? "Bekor qilindi, limit qaytarildi." : "Bekor qilindi (24 soatdan kam qolgani uchun limit qaytmaydi)."); reload(); }} className="text-xs text-red-600">Bekor qilish</button>
              )}
              <Rate b={b} onDone={reload} />
            </div>
          </li>
        ))}
      </ul>
    </>
  );
}

function ScheduleView() {
  const { data, loading, error, reload } = useApi(fetchSchedule, []);
  const [form, setForm] = useState({ weekdays: [0, 1, 2, 3, 4], start: "10:00", end: "17:00", duration_min: 45, weeks: 4, format: "online" });
  const [urls, setUrls] = useState<Record<number, string>>({});
  if (loading && !data) return <Skeleton rows={4} />;
  if (error || !data) return <ErrorState onRetry={reload} />;
  const upcoming = data.bookings.filter((b) => b.status === "booked");
  return (
    <div className="space-y-5">
      <section className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 space-y-2">
        <h3 className="font-semibold">Takrorlanuvchi slotlar qo'shish</h3>
        <div className="flex flex-wrap gap-2 text-sm">
          {["Du", "Se", "Ch", "Pa", "Ju", "Sh", "Ya"].map((d, i) => (
            <label key={d} className="inline-flex items-center gap-1"><input type="checkbox" checked={form.weekdays.includes(i)} onChange={(e) => setForm((f) => ({ ...f, weekdays: e.target.checked ? [...f.weekdays, i] : f.weekdays.filter((x) => x !== i) }))} />{d}</label>
          ))}
        </div>
        <div className="flex flex-wrap gap-2 text-sm items-center">
          <input type="time" aria-label="Boshlanish" value={form.start} onChange={(e) => setForm({ ...form, start: e.target.value })} className="px-2 py-1 rounded border" />—
          <input type="time" aria-label="Tugash" value={form.end} onChange={(e) => setForm({ ...form, end: e.target.value })} className="px-2 py-1 rounded border" />
          <label>Davomiylik <input type="number" min={15} max={180} value={form.duration_min} onChange={(e) => setForm({ ...form, duration_min: Number(e.target.value) })} className="w-16 px-2 py-1 rounded border" /></label>
          <label>Hafta <input type="number" min={1} max={12} value={form.weeks} onChange={(e) => setForm({ ...form, weeks: Number(e.target.value) })} className="w-14 px-2 py-1 rounded border" /></label>
          <button type="button" onClick={async () => { await addSlots(form); reload(); }} className="px-3 py-1.5 rounded bg-blue-600 text-white">Qo'shish</button>
        </div>
        <p className="text-xs text-gray-500">Jami {data.slots.length} ta slot (o'tgan haftadan boshlab), band: {data.slots.filter((s) => s.is_booked).length}.</p>
      </section>
      <section>
        <h3 className="font-semibold mb-2">Kelgusi uchrashuvlar ({upcoming.length})</h3>
        <ul className="space-y-3">
          {upcoming.map((b) => (
            <li key={b.id} className="rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-sm space-y-2">
              <p><b>{formatDateTime(b.starts_at)}</b> · {b.client} · {b.topic}</p>
              {b.question && <p className="text-gray-600 dark:text-gray-300">{b.question}</p>}
              <div className="flex flex-wrap gap-2">
                <input value={urls[b.id] ?? b.meeting_url} onChange={(e) => setUrls((u) => ({ ...u, [b.id]: e.target.value }))} placeholder="https://… uchrashuv havolasi" aria-label="Uchrashuv havolasi" className="flex-1 min-w-[200px] px-2 py-1 rounded border" />
                <button type="button" onClick={async () => { await updateScheduleBooking(b.id, { meeting_url: urls[b.id] ?? b.meeting_url }); reload(); }} className="px-3 py-1 rounded border">Saqlash</button>
                <button type="button" onClick={async () => { await updateScheduleBooking(b.id, { status: "done" }); reload(); }} className="px-3 py-1 rounded bg-emerald-600 text-white">O'tdi</button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

/** A-03: kabinetdagi "Konsultatsiyalarim" (mijoz) va "Mening jadvalim" (konsultant). */
export default function Consultations() {
  const schedule = useApi(() => fetchSchedule().then(() => true).catch(() => false), []);
  const [view, setView] = useState<"client" | "consultant">("client");
  return (
    <div className="p-6 space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-xl font-semibold flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-blue-600" /> Konsultatsiyalar</h2>
        <div className="flex gap-2">
          {schedule.data && (
            <button type="button" onClick={() => setView((v) => (v === "client" ? "consultant" : "client"))} className="px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 text-sm">
              {view === "client" ? "Mening jadvalim (konsultant)" : "Mening band qilishlarim"}
            </button>
          )}
          <Link to="/consultation" className="px-3 py-2 rounded-lg bg-blue-600 text-white text-sm">Yangi konsultatsiya</Link>
        </div>
      </div>
      {view === "consultant" && schedule.data ? <ScheduleView /> : <ClientView />}
    </div>
  );
}
